/**
 * Better-Auth — configuration __PROJECT_NAME__ (Epic 3, ADR 0003).
 *
 * Better-Auth tourne sur Cloudflare Workers : la connexion DB (Neon HTTP) et
 * le namespace KV viennent de l'env de la requête. `createAuth(env)` est donc
 * une **factory appelée par requête**, pas un singleton module.
 *
 * - Adapter Drizzle (Postgres) — tables user/session/account/verification
 *   + organizations/member/invitation (plugin `organization`).
 * - Secondary storage Cloudflare KV (cache sessions, TTL 600s) — read < 10 ms ;
 *   une session supprimée en DB est instantanément invalidée en KV.
 * - Mots de passe hashés en **Argon2id** (`@noble/hashes`, pur JS — OWASP 2024,
 *   NFR17 ; pur JS car Cloudflare Workers interdit `WebAssembly.compile()` au
 *   runtime). Paramètres : 19 MiB, 2 itérations, parallélisme 1.
 * - Sessions 7 jours, refresh glissant à 50 % d'âge.
 * - Cookies `SameSite=Lax`, `Secure`, `HttpOnly`, domaine `.__PROJECT_SLUG__.com`.
 *
 * Emails (vérification, reset…) transitent par `@__SCOPE__/notifications`
 * (canal `EmailResend`).
 *
 * MVP : le canal SMS et l'inscription/connexion par téléphone sont désactivés
 * (flags `CHANNELS_ENABLED.sms` / `PHONE_AUTH_ENABLED` dans `@__SCOPE__/config`).
 * Le code est conservé pour réactivation post-MVP. MVP = email + OAuth.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { BetterAuthPlugin } from 'better-auth';
import {
  organization,
  haveIBeenPwned,
  phoneNumber,
  twoFactor,
  emailOTP,
  admin,
} from 'better-auth/plugins';
import { CHANNELS_ENABLED, PHONE_AUTH_ENABLED } from '@__SCOPE__/config/flags';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { argon2id } from '@noble/hashes/argon2.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';
import {
  createDb,
  eq,
  and,
  isNull,
  asc,
  user,
  session,
  account,
  verification,
  organizations,
  member,
  invitation,
  establishments,
  userEstablishmentAssignments,
  twoFactor as twoFactorTable,
  auditLog,
} from '@__SCOPE__/db';
import {
  createNotificationService,
  EmailResend,
  SmsTwilio,
  SmsStub,
  WhatsAppStub,
  PushStub,
} from '@__SCOPE__/notifications';
import type { NotificationPayload, NotificationTemplate } from '@__SCOPE__/notifications';
import type { Logger } from '@__SCOPE__/types';

const SEVEN_DAYS_S = 60 * 60 * 24 * 7;
const ONE_DAY_S = 60 * 60 * 24;
const ONE_HOUR_S = 60 * 60;
const KV_SESSION_TTL_S = 600;
/** Story 3.7 — nombre maximum de sessions actives simultanées par utilisateur. */
const MAX_ACTIVE_SESSIONS = 5;

/** Sous-ensemble de l'env Worker requis par Better-Auth + les notifications. */
export interface AuthEnv {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  /** URL publique de l'app suite — base des liens d'invitation (Story 3.9). */
  APP_URL: string;
  /** URL publique du back-office admin (Epic 24) — origine de confiance CSRF. */
  ADMIN_APP_URL?: string;
  SESSIONS_KV: KVNamespace;
  // Story 3.2/3.3 — providers de notification (optionnels : no-op si absents).
  RESEND_API_KEY?: string;
  /**
   * Expéditeur Resend (défaut `__PROJECT_NAME__ <noreply@__PROJECT_SLUG__.com>`). Surchargeable
   * via env — en dev, tant que `__PROJECT_SLUG__.com` n'est pas vérifié dans Resend,
   * mettre `RESEND_FROM_EMAIL=onboarding@resend.dev` (sender bac-à-sable Resend
   * accepté pour tout compte).
   */
  RESEND_FROM_EMAIL?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_SENDER_ID?: string;
  // Story 3.4 — OAuth social (optionnels : provider activé si le couple existe).
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
}

/**
 * Surface Better-Auth consommée par __PROJECT_NAME__ — annotation de retour explicite
 * de `createAuth`.
 *
 * Better-Auth dérive ses types des plugins (zod) ; le type d'instance inféré
 * ne peut pas être nommé de façon portable hors du package (`TS2742`). On
 * expose donc seulement ce dont `apps/api` a besoin : le handler HTTP et la
 * résolution de session. Les endpoints de plugin (createOrganization…) ne sont
 * pas appelés depuis du code typé — les organisations sont créées via Drizzle.
 */
export interface BudiAuth {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (input: { headers: Headers }) => Promise<{
      user: {
        id: string;
        email: string;
        /** Rôle plateforme — plugin `admin` (Epic 24). `'admin'` = staff back-office. */
        role?: string | null;
        /** Compte banni — plugin `admin`. */
        banned?: boolean | null;
      };
      session: { id: string; activeOrganizationId?: string | null };
    } | null>;
  };
}

/** Numéro E.164 valide pour le Sénégal (`+221` + 9) ou la Côte d'Ivoire (`+225` + 10). */
function isValidSnCiPhone(phone: string): boolean {
  return /^\+(221\d{9}|225\d{10})$/.test(phone.trim());
}

/** Libellé français d'un rôle d'organisation (Story 3.9 — emails d'invitation). */
function roleLabel(role: string | undefined): string {
  switch (role) {
    case 'owner':
      return 'Propriétaire';
    case 'admin':
      return 'Administrateur';
    default:
      return 'Membre';
  }
}

/** Paramètres Argon2id — OWASP 2024 : m=19 MiB, t=2 itérations, p=1, sortie 32 o. */
const ARGON2 = { t: 2, m: 19456, p: 1, dkLen: 32 } as const;

/**
 * Hash Argon2id — implémentation pur JS (`@noble/hashes`), compatible Workers.
 * Format stocké : `<saltHex>:<digestHex>` (sel 16 o aléatoire par mot de passe).
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const digest = argon2id(password, salt, ARGON2);
  return `${bytesToHex(salt)}:${bytesToHex(digest)}`;
}

/** Vérifie un mot de passe contre un hash `<saltHex>:<digestHex>` (comparaison à temps constant). */
async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [saltHex, digestHex] = hash.split(':');
  if (!saltHex || !digestHex) return false;
  const expected = hexToBytes(digestHex);
  const actual = argon2id(password, hexToBytes(saltHex), ARGON2);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= (actual[i] ?? 0) ^ (expected[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Construit l'instance Better-Auth pour la requête courante.
 *
 * `log` (optionnel) — logger Axiom de la requête, utilisé pour journaliser les
 * échecs d'envoi de notifications. Absent côté résolution de session tRPC.
 */
export function createAuth(env: AuthEnv, log?: Logger): BudiAuth {
  const db = createDb(env.DATABASE_URL);

  // Service de notifications — Email réel (Resend, no-op tracé si credentials
  // absents). MVP : SMS désactivé (`SmsStub`, no-op tracé) tant que
  // `CHANNELS_ENABLED.sms === false` ; WhatsApp / Push restent stubs.
  const notifications = createNotificationService([
    new EmailResend({ apiKey: env.RESEND_API_KEY, from: env.RESEND_FROM_EMAIL }),
    CHANNELS_ENABLED.sms
      ? new SmsTwilio({
          accountSid: env.TWILIO_ACCOUNT_SID,
          authToken: env.TWILIO_AUTH_TOKEN,
          senderId: env.TWILIO_SENDER_ID,
          log,
        })
      : new SmsStub(),
    new WhatsAppStub(),
    new PushStub(),
  ]);

  /**
   * Envoi de notification — log structuré sur échec, puis levée d'erreur.
   * Utiliser pour les envois où l'utilisateur a explicitement déclenché
   * l'action (OTP, invitation) : Better-Auth renverra alors un 5xx au front,
   * qui affichera la raison (sinon redirection silencieuse vers un écran qui
   * attend un email qui n'arrivera jamais).
   */
  async function deliverOrThrow(
    channel: 'email' | 'sms' | 'whatsapp' | 'push',
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: { email?: string; phone?: string; userId?: string },
  ): Promise<void> {
    const result = await notifications.sendVia(channel, template, payload, recipient);
    if (!result.delivered) {
      log?.error('notification.failed', {
        template,
        channel,
        recipient: recipient.email ?? recipient.phone ?? recipient.userId ?? null,
        error: result.error ?? null,
        stubbed: result.stubbed ?? false,
      });
      throw new Error(
        `Envoi de la notification '${template}' échoué : ${result.error ?? 'raison inconnue'}`,
      );
    }
  }

  /**
   * Variante « best-effort » : log uniquement, n'interrompt pas le flux. Pour
   * les envois post-action (mot de passe changé) ou anti-énumération (reset).
   */
  async function deliverBestEffort(
    channel: 'email' | 'sms' | 'whatsapp' | 'push',
    template: NotificationTemplate,
    payload: NotificationPayload,
    recipient: { email?: string; phone?: string; userId?: string },
  ): Promise<void> {
    const result = await notifications.sendVia(channel, template, payload, recipient);
    if (!result.delivered) {
      log?.error('notification.failed', {
        template,
        channel,
        recipient: recipient.email ?? recipient.phone ?? recipient.userId ?? null,
        error: result.error ?? null,
        stubbed: result.stubbed ?? false,
      });
    }
  }

  // Story 3.4 — un provider OAuth n'est activé que si son couple
  // client_id + client_secret est présent (sinon ignoré silencieusement).
  const socialProviders = {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
      : {}),
    ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
          },
        }
      : {}),
  };

  // Front et API sont sur des origines distinctes (suite `:9100` ↔ api `:9187`
  // en dev, `app.__PROJECT_SLUG__.com` ↔ `api.__PROJECT_SLUG__.com` en prod). Better-Auth
  // rejette toute requête dont l'`Origin` n'est pas dans `trustedOrigins`
  // (protection CSRF native, 403 « Invalid origin »). On y inclut donc
  // `APP_URL`, et en dev on accepte tout `localhost`/`127.0.0.1` quel que soit
  // le port (cohérent avec le middleware CORS d'`apps/api`).
  const isDev = env.BETTER_AUTH_URL.startsWith('http://localhost');

  return betterAuth({
    appName: '__PROJECT_NAME__',
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    basePath: '/api/auth',
    trustedOrigins: (request?: Request) => {
      const origins = [env.APP_URL];
      // Back-office admin (Epic 24) — origine distincte (`admin.*`).
      if (env.ADMIN_APP_URL) origins.push(env.ADMIN_APP_URL);
      // Better-Auth appelle `trustedOrigins` une 1re fois à l'init du contexte
      // **sans `request`** (pour la liste statique de base) puis une fois par
      // requête avec `request`. La garde optionnelle évite un crash au boot.
      if (isDev && request) {
        const origin = request.headers.get('origin');
        if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          origins.push(origin);
        }
      }
      return origins;
    },

    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user,
        session,
        account,
        verification,
        organizations,
        member,
        invitation,
        twoFactor: twoFactorTable,
      },
    }),

    // Cache sessions en KV (latence < 10 ms) — fallback DB ; révocation DB
    // instantanément répercutée car la clé KV est supprimée en parallèle.
    secondaryStorage: {
      get: (key) => env.SESSIONS_KV.get(key),
      set: (key, value, ttl) =>
        env.SESSIONS_KV.put(key, value, { expirationTtl: ttl ?? KV_SESSION_TTL_S }),
      delete: (key) => env.SESSIONS_KV.delete(key),
    },

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      // L'accès reste bloqué tant que l'email n'est pas vérifié (Story 3.2).
      requireEmailVerification: true,
      password: { hash: hashPassword, verify: verifyPassword },

      // Reset mot de passe (Story 3.8) — lien TTL 1 h, envoi via Resend.
      // `requestPasswordReset` répond un succès uniforme même si l'email
      // n'existe pas (protection contre l'énumération de comptes — natif).
      resetPasswordTokenExpiresIn: ONE_HOUR_S,
      // Toutes les sessions actives sont révoquées après un reset.
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user: u, url }) => {
        // « Best-effort » : la réponse côté API reste uniforme (anti-énumération)
        // — on log juste l'échec d'envoi, on ne propage pas l'erreur.
        await deliverBestEffort(
          'email',
          'auth.passwordReset',
          { url, name: u.name },
          { email: u.email },
        );
      },
      // Après reset réussi : email de confirmation + événement d'audit.
      onPasswordReset: async ({ user: u }, request) => {
        // Post-action : le reset est déjà appliqué — best-effort sur la notif.
        await deliverBestEffort(
          'email',
          'auth.passwordChanged',
          { name: u.name },
          { email: u.email },
        );
        const [m] = await db
          .select({ organizationId: member.organizationId })
          .from(member)
          .where(eq(member.userId, u.id))
          .limit(1);
        await db.insert(auditLog).values({
          id: crypto.randomUUID(),
          organizationId: m?.organizationId ?? '__system__',
          userId: u.id,
          action: 'user.password_reset',
          resourceType: 'user',
          resourceId: u.id,
          ipAddress: request?.headers.get('cf-connecting-ip') ?? null,
          userAgent: request?.headers.get('user-agent') ?? null,
        });
      },
    },

    // OAuth social Google + Microsoft (Story 3.4). La session OAuth est une
    // session standard (TTL 7 j, refresh glissant — cf. `session` ci-dessous).
    socialProviders,

    // Liaison de comptes : un signin Google/Microsoft dont l'email correspond
    // à un compte existant (email vérifié) est rattaché à ce compte plutôt que
    // d'en créer un doublon. Google et Microsoft sont des providers de
    // confiance (emails vérifiés à la source). L'écran de confirmation explicite
    // « lier mes comptes » est livré côté UI (Story 3.14).
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'microsoft'],
      },
    },

    // Vérification d'email — la confirmation se fait par **code OTP** (plugin
    // `emailOTP` ci-dessous), conformément au design `__PROJECT_NAME__-Auth.html`.
    // `sendOnSignUp`/`sendOnSignIn` sont désactivés : pas d'email à lien — le
    // code OTP est déclenché par l'UI après l'inscription. `sendVerificationEmail`
    // (lien) reste défini comme repli mais n'est plus envoyé automatiquement.
    emailVerification: {
      sendOnSignUp: false,
      sendOnSignIn: false,
      autoSignInAfterVerification: true,
      expiresIn: ONE_DAY_S,
      sendVerificationEmail: async ({ user: u, url }) => {
        // Fallback historique (lien) — le flux normal passe par `emailOTP`.
        await deliverBestEffort(
          'email',
          'auth.signup.confirm',
          { url, name: u.name },
          { email: u.email },
        );
      },
    },

    // Pays collecté au signup (réutilisé comme défaut pays de l'organisation) +
    // langue préférée (Story 3.24). `changeEmail` activé : le changement n'est
    // appliqué qu'après confirmation via le lien envoyé à l'adresse actuelle
    // (sécurité : le propriétaire de la boîte valide depuis son inbox courant).
    user: {
      additionalFields: {
        country: { type: 'string', input: true, required: false },
        language: { type: 'string', input: true, required: false },
      },
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({
          user: u,
          newEmail,
          url,
        }: {
          user: { name: string; email: string };
          newEmail: string;
          url: string;
        }) => {
          // Best-effort : lien de confirmation envoyé à l'adresse ACTUELLE.
          await deliverBestEffort(
            'email',
            'auth.signup.confirm',
            { url, name: `${u.name} → ${newEmail}` },
            { email: u.email },
          );
        },
      },
    },

    session: {
      expiresIn: SEVEN_DAYS_S,
      updateAge: SEVEN_DAYS_S / 2, // refresh glissant à 50 % d'âge
    },

    // En staging/prod, `crossSubDomainCookies` partage la session entre
    // `app.__PROJECT_SLUG__.com`, `api.__PROJECT_SLUG__.com`, `staging.__PROJECT_SLUG__.com`…
    // En dev (`localhost`), ce `domain: '.__PROJECT_SLUG__.com'` ferait rejeter le
    // cookie par le navigateur (mismatch), donc on désactive le partage. Idem
    // pour `secure: true` qui requiert HTTPS — http://localhost en dev.
    advanced: {
      ...(isDev ? {} : { crossSubDomainCookies: { enabled: true, domain: '.__PROJECT_SLUG__.com' } }),
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: !isDev,
        httpOnly: true,
      },
    },

    plugins: [
      // Le modèle `organization` du plugin est mappé sur la table tenant
      // __PROJECT_NAME__ `organizations` ; `country`/`currency` sont des champs __PROJECT_NAME__.
      organization({
        // Story 3.6 — un utilisateur peut créer jusqu'à 5 organisations.
        organizationLimit: 5,
        // Story 3.9 — invitation d'équipe : lien d'activation TTL 7 jours.
        // Le « token » est l'id d'invitation (stocké en DB, donc révocable —
        // un owner annule une invitation pending via `cancelInvitation`).
        invitationExpiresIn: SEVEN_DAYS_S,
        sendInvitationEmail: async (data) => {
          const d = data as {
            id: string;
            email: string;
            role?: string;
            organization?: { name?: string };
            inviter?: { user?: { name?: string } };
          };
          // L'owner a explicitement invité — il doit voir l'erreur si l'envoi
          // échoue (sinon il croit le message parti alors qu'il ne l'est pas).
          await deliverOrThrow(
            'email',
            'auth.teamInvitation',
            {
              inviterName: d.inviter?.user?.name ?? 'Un collègue',
              organizationName: d.organization?.name ?? 'une organisation',
              roleLabel: roleLabel(d.role),
              // Email inclus pour pré-remplir le formulaire d'inscription si
              // l'invité n'a pas encore de compte __PROJECT_NAME__ (Better-Auth exige
              // que la session corresponde à l'email de l'invitation).
              url: `${env.APP_URL}/invite/accept?token=${d.id}&email=${encodeURIComponent(d.email)}`,
            },
            { email: d.email },
          );
        },
        schema: {
          organization: {
            modelName: 'organizations',
            additionalFields: {
              country: { type: 'string', input: true, required: false },
              currency: { type: 'string', input: true, required: false },
            },
          },
        },
      }),
      // Rejette les mots de passe figurant dans les fuites HIBP (NFR17).
      haveIBeenPwned({
        customPasswordCompromisedMessage:
          'Ce mot de passe figure dans une fuite de données connue. Choisissez-en un autre.',
      }),
      // Vérification d'email par code OTP 6 chiffres, TTL 10 min (Story 3.17).
      // L'UI déclenche l'envoi après l'inscription via `emailOtp.sendVerificationOtp`.
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        sendVerificationOTP: async ({ email, otp }) => {
          // L'OTP est l'unique moyen pour l'utilisateur de finaliser son
          // inscription : si l'envoi échoue, on remonte l'erreur (sinon l'UI
          // redirige vers un écran qui attend un email qui n'arrivera jamais).
          await deliverOrThrow('email', 'auth.emailOtp', { code: otp }, { email });
        },
      }),
      // Inscription / connexion par téléphone + OTP SMS (Story 3.3).
      // MVP : DÉSACTIVÉ via `PHONE_AUTH_ENABLED` (dépend du canal SMS, off au
      // MVP). Le plugin n'est monté que si le flag repasse à `true`. OTP 6
      // chiffres, TTL 5 min ; après 3 codes erronés l'OTP est invalidé.
      ...(PHONE_AUTH_ENABLED
        ? ([
            phoneNumber({
              otpLength: 6,
              expiresIn: 300,
              allowedAttempts: 3,
              // Bloque la connexion tant que le numéro n'est pas vérifié.
              requireVerification: true,
              // N'accepte que les numéros E.164 sénégalais / ivoiriens (AC 3.3).
              phoneNumberValidator: isValidSnCiPhone,
              sendOTP: async ({ phoneNumber: phone, code }) => {
                // Comme l'OTP email : si Twilio rejette, l'utilisateur n'a aucun
                // moyen de se vérifier — on remonte l'erreur au lieu de la jeter.
                await deliverOrThrow('sms', 'auth.phoneOtp', { code }, { phone });
              },
              // À la 1re vérification réussie, le compte est créé : email
              // temporaire dérivé du numéro (vrai email ajouté à l'onboarding).
              signUpOnVerification: {
                getTempEmail: (phone) => `${phone.replace(/\D/g, '')}@phone.__PROJECT_SLUG__.app`,
                getTempName: (phone) => phone,
              },
            }),
          ] as BetterAuthPlugin[])
        : []),
      // MFA TOTP (Story 3.5) — QR code issuer "__PROJECT_NAME__", 10 codes de
      // récupération à usage unique. Au login, un compte avec 2FA active
      // exige un code TOTP après email + mot de passe.
      twoFactor({
        issuer: '__PROJECT_NAME__',
        backupCodeOptions: { amount: 10 },
      }),
      // Plugin `admin` (Epic 24) — rôle plateforme `admin` = staff __PROJECT_NAME__
      // habilité au back-office cross-tenant (`apps/admin`). Fournit nativement
      // listUsers / setRole / ban / impersonate / revokeSessions / setUserPassword.
      // Les colonnes (`role`/`banned`/`ban_reason`/`ban_expires` sur `user`,
      // `impersonated_by` sur `session`) sont déclarées dans le schéma Drizzle
      // (`@__SCOPE__/db`, migration 0011). Le rôle est totalement distinct du
      // RBAC organisationnel (`member.role`).
      admin({
        defaultRole: 'user',
        adminRoles: ['admin'],
      }),
    ],

    // Garde-fou anti-abus OTP : compteur persisté en KV (secondary storage) —
    // indispensable sur Workers stateless. Les règles `/phone-number/*` (AC 3.3)
    // ne sont montées qu'avec l'auth téléphone — désactivée au MVP.
    rateLimit: {
      enabled: true,
      storage: 'secondary-storage',
      customRules: PHONE_AUTH_ENABLED
        ? {
            '/phone-number/verify': { window: 1800, max: 3 },
            '/phone-number/send-otp': { window: 1800, max: 5 },
          }
        : {},
    },

    hooks: {
      // Refuse un mot de passe identique à l'email (Story 3.2).
      before: createAuthMiddleware(async (ctx) => {
        // Story 3.20 — purge les affectations établissement quand un membre est
        // retiré de l'org. Fait en `before` (le membre existe encore → userId
        // fiable). Hygiène de données : l'accès est déjà coupé par require-org
        // (revérif d'appartenance à chaque requête) ; ceci évite les lignes
        // d'affectation orphelines.
        if (ctx.path === '/organization/remove-member') {
          const body = ctx.body as
            | { memberIdOrEmail?: string; organizationId?: string }
            | undefined;
          const ref = body?.memberIdOrEmail;
          const sess = ctx.context.session as
            | { session?: { activeOrganizationId?: string | null } }
            | null
            | undefined;
          const orgId = body?.organizationId ?? sess?.session?.activeOrganizationId ?? null;
          if (ref && orgId) {
            let targetUserId: string | undefined;
            if (ref.includes('@')) {
              const [u] = await db
                .select({ id: user.id })
                .from(user)
                .where(eq(user.email, ref.toLowerCase()))
                .limit(1);
              targetUserId = u?.id;
            } else {
              const [m] = await db
                .select({ userId: member.userId })
                .from(member)
                .where(and(eq(member.id, ref), eq(member.organizationId, orgId)))
                .limit(1);
              targetUserId = m?.userId;
            }
            if (targetUserId) {
              await db
                .delete(userEstablishmentAssignments)
                .where(
                  and(
                    eq(userEstablishmentAssignments.userId, targetUserId),
                    eq(userEstablishmentAssignments.organizationId, orgId),
                  ),
                );
            }
          }
          return;
        }

        // Refuse un mot de passe identique à l'email (Story 3.2).
        if (ctx.path !== '/sign-up/email') return;
        const body = ctx.body as { email?: string; password?: string } | undefined;
        const email = (body?.email ?? '').trim().toLowerCase();
        const password = (body?.password ?? '').trim().toLowerCase();
        if (email && password && email === password) {
          throw new APIError('BAD_REQUEST', {
            message: 'Le mot de passe ne peut pas être identique à votre adresse email.',
          });
        }
      }),
      // Story 3.6 — au changement d'organisation active, expose son id dans un
      // cookie `current_org_id` lisible par le front (affichage instantané du
      // contexte). L'autorité serveur reste `session.activeOrganizationId` : ce
      // cookie n'est jamais utilisé pour décider de l'accès (cf. require-org).
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/organization/set-active') {
          const orgId = (ctx.body as { organizationId?: string } | undefined)?.organizationId;
          if (orgId) {
            ctx.setCookie('current_org_id', orgId, {
              path: '/',
              sameSite: 'lax',
              // Aligné sur le cookie de session (`secure: !isDev`) : en dev sur
              // http://localhost, un cookie `secure` serait silencieusement
              // rejeté par le navigateur.
              secure: !isDev,
              httpOnly: false,
              maxAge: SEVEN_DAYS_S,
            });
          }
          return;
        }

        // Story 3.20 (ADR 0012 — garde-fou invitation) : à l'acceptation d'une
        // invitation, auto-affecte le nouveau membre au **siège** de l'org → il
        // accède aux écrans establishment-scopés sans action de l'owner.
        // Idempotent + résilient (no-op si pas de siège — ex. org legacy).
        if (ctx.path === '/organization/accept-invitation') {
          const invitationId = (ctx.body as { invitationId?: string } | undefined)?.invitationId;
          const sess = (ctx.context.newSession ?? ctx.context.session) as
            | { user?: { id?: string } }
            | null
            | undefined;
          const userId = sess?.user?.id;
          if (invitationId && userId) {
            const [inv] = await db
              .select({ organizationId: invitation.organizationId })
              .from(invitation)
              .where(eq(invitation.id, invitationId))
              .limit(1);
            // Vérifie que l'utilisateur est bien devenu **membre** de l'org avant
            // d'affecter (évite une affectation orpheline si l'acceptation a
            // échoué ou si le path est rejoué avec un invitationId d'autrui).
            const [mem] = inv?.organizationId
              ? await db
                  .select({ id: member.id })
                  .from(member)
                  .where(
                    and(eq(member.userId, userId), eq(member.organizationId, inv.organizationId)),
                  )
                  .limit(1)
              : [];
            if (inv?.organizationId && mem) {
              const [hq] = await db
                .select({ id: establishments.id })
                .from(establishments)
                .where(
                  and(
                    eq(establishments.organizationId, inv.organizationId),
                    eq(establishments.isPrimary, true),
                    isNull(establishments.deletedAt),
                  ),
                )
                .limit(1);
              if (hq?.id) {
                const [existing] = await db
                  .select({ id: userEstablishmentAssignments.id })
                  .from(userEstablishmentAssignments)
                  .where(
                    and(
                      eq(userEstablishmentAssignments.userId, userId),
                      eq(userEstablishmentAssignments.establishmentId, hq.id),
                    ),
                  )
                  .limit(1);
                if (!existing) {
                  await db.insert(userEstablishmentAssignments).values({
                    id: crypto.randomUUID(),
                    userId,
                    establishmentId: hq.id,
                    organizationId: inv.organizationId,
                  });
                }
              }
            }
          }
          return;
        }

        // Story 3.7 — journalise la révocation de session dans l'audit log.
        if (
          ctx.path === '/revoke-session' ||
          ctx.path === '/revoke-sessions' ||
          ctx.path === '/revoke-other-sessions'
        ) {
          const sess = ctx.context.session as
            | {
                session: { id: string; activeOrganizationId?: string | null };
                user: { id: string };
              }
            | null
            | undefined;
          if (sess) {
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              organizationId: sess.session.activeOrganizationId ?? '__system__',
              userId: sess.user.id,
              sessionId: sess.session.id,
              action: 'user.session_revoked',
              resourceType: 'session',
              details: { endpoint: ctx.path },
              ipAddress: ctx.headers?.get('cf-connecting-ip') ?? null,
              userAgent: ctx.headers?.get('user-agent') ?? null,
            });
          }
        }

        // Patche les sessions créées par auto-signin (emailOTP.verify-email,
        // sign-up/email) qui ne déclenchent pas
        // `databaseHooks.session.create.before` du plugin organization. On y
        // positionne `active_organization_id` sur le 1er membership existant
        // (utile pour un invité qui vient d'accepter). Un compte neuf sans
        // membership reste `null` : la route `/onboarding` créera l'org.
        // (`/phone-number/verify` retiré : auth téléphone désactivée au MVP.)
        if (ctx.path === '/email-otp/verify-email' || ctx.path === '/sign-up/email') {
          const sess = (ctx.context.newSession ?? ctx.context.session) as
            | {
                session?: { id?: string; activeOrganizationId?: string | null };
                user?: { id?: string };
              }
            | null
            | undefined;
          const sessionId = sess?.session?.id;
          const userId = sess?.user?.id;
          if (sessionId && userId && !sess?.session?.activeOrganizationId) {
            const [m] = await db
              .select({ organizationId: member.organizationId })
              .from(member)
              .where(eq(member.userId, userId))
              .limit(1);
            if (m?.organizationId) {
              await db
                .update(session)
                .set({ activeOrganizationId: m.organizationId })
                .where(eq(session.id, sessionId));
            }
          }
        }
      }),
    },

    databaseHooks: {
      user: {
        // NB : l'organisation n'est PLUS créée à l'inscription. Un compte neuf
        // arrive sans organisation et sans membership ; la création se fait
        // pendant l'onboarding (route `/onboarding` → `organization.create`).
        // Ainsi un invité qui s'inscrit via `/invite/accept` rejoint l'org de
        // l'inviteur sans hériter d'une organisation parasite.
        //
        // Story 3.5 + 3.12 — journalise l'activation/désactivation de la 2FA
        // dans l'audit log. Better-Auth ne déclenche pas d'événement custom
        // sur le plugin twoFactor — on observe le delta du champ
        // `twoFactorEnabled` côté table `user` via les hooks before/after.
        //
        // Le `before` capture l'état précédent dans `ctx` (Better-Auth partage
        // ce contexte entre before et after du même update). Le `after`
        // compare et insère l'événement uniquement si la valeur a basculé.
        update: {
          before: async (newData, ctx) => {
            // Seules les updates qui touchent twoFactorEnabled nous intéressent.
            const delta = newData as { twoFactorEnabled?: boolean | null };
            if (delta.twoFactorEnabled === undefined) return;
            const userId = ctx?.context?.session?.user?.id;
            if (!userId) return;
            const [prev] = await db
              .select({ twoFactorEnabled: user.twoFactorEnabled })
              .from(user)
              .where(eq(user.id, userId))
              .limit(1);
            // Mémorise l'état antérieur dans le ctx pour le `after`.
            (ctx as unknown as { _prev2fa?: boolean | null })._prev2fa =
              prev?.twoFactorEnabled ?? null;
          },
          after: async (updatedUser, ctx) => {
            const u = updatedUser as { id: string; twoFactorEnabled?: boolean | null };
            if (u.twoFactorEnabled === undefined) return;
            const prev = (ctx as unknown as { _prev2fa?: boolean | null })._prev2fa;
            // Pas de capture du `before` (update qui ne touchait pas le champ),
            // ou pas de transition réelle → on s'abstient.
            if (prev === undefined || prev === u.twoFactorEnabled) return;
            const action = u.twoFactorEnabled
              ? 'user.twoFactor_enabled'
              : 'user.twoFactor_disabled';
            const [m] = await db
              .select({ organizationId: member.organizationId })
              .from(member)
              .where(eq(member.userId, u.id))
              .limit(1);
            const req = ctx?.context?.request as Request | undefined;
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              organizationId: m?.organizationId ?? '__system__',
              userId: u.id,
              action,
              resourceType: 'user',
              resourceId: u.id,
              details: { method: 'totp' },
              ipAddress: req?.headers?.get('cf-connecting-ip') ?? null,
              userAgent: req?.headers?.get('user-agent') ?? null,
            });
          },
        },
      },
      session: {
        create: {
          // Positionne l'organisation active de la session sur la première
          // organisation de l'utilisateur (bascule ultérieure via OrgSwitcher).
          before: async (newSession) => {
            const rows = await db
              .select({ organizationId: member.organizationId })
              .from(member)
              .where(eq(member.userId, newSession.userId))
              .limit(1);
            return { data: { ...newSession, activeOrganizationId: rows[0]?.organizationId } };
          },
          // Story 3.7 — limite à 5 sessions actives : à l'ouverture d'une 6e,
          // les plus anciennes sont révoquées (DB + entrée KV best-effort).
          after: async (newSession) => {
            const sessions = await db
              .select({ id: session.id, token: session.token })
              .from(session)
              .where(eq(session.userId, newSession.userId))
              .orderBy(asc(session.createdAt));
            const stale = sessions.slice(0, Math.max(0, sessions.length - MAX_ACTIVE_SESSIONS));
            for (const s of stale) {
              await db.delete(session).where(eq(session.id, s.id));
              await env.SESSIONS_KV.delete(s.token);
            }
          },
        },
      },
    },
  });
}

export type Auth = BudiAuth;
