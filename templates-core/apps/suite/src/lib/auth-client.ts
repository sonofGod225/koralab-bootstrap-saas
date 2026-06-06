/**
 * Client Better-Auth — apps/suite (Stories 3.13, 3.14).
 *
 * Pointe sur l'API __PROJECT_NAME__ (`apps/api`, routes `/api/auth/*`). Embarque les
 * clients des plugins serveur : organisation, téléphone (OTP), 2FA.
 *
 * `VITE_API_URL` est injectée au build (défaut dev : port wrangler 9187).
 *
 * Le type d'instance inféré par Better-Auth + plugins n'est pas nommable de
 * façon portable (`TS2883`/`TS7056`). On expose donc une façade `AuthClient`
 * limitée à la surface réellement consommée par l'app.
 */
import { createAuthClient } from 'better-auth/react';
import {
  organizationClient,
  phoneNumberClient,
  twoFactorClient,
  emailOTPClient,
} from 'better-auth/client/plugins';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:9187';

/** Résultat standard d'un appel Better-Auth client : `error` non nul en cas d'échec. */
export interface AuthResult {
  error: { message?: string } | null;
}

/**
 * Résultat d'un `signIn.email` : si le compte a la 2FA active, `data` porte
 * `twoFactorRedirect` — l'utilisateur n'est pas encore connecté, un challenge
 * TOTP est requis.
 */
export interface SignInResult extends AuthResult {
  data: { twoFactorRedirect?: boolean } | null;
}

/** Session active telle que retournée par `listSessions` (Story 3.15). */
export interface SessionInfo {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

/** Surface du client Better-Auth consommée par __PROJECT_NAME__ (façade typée). */
export interface AuthClient {
  signUp: {
    email: (input: {
      name: string;
      email: string;
      password: string;
      callbackURL?: string;
    }) => Promise<AuthResult>;
  };
  signIn: {
    email: (input: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => Promise<SignInResult>;
    social: (input: { provider: 'google' | 'microsoft'; callbackURL?: string }) => Promise<unknown>;
  };
  twoFactor: {
    verifyTotp: (input: { code: string }) => Promise<AuthResult>;
    verifyBackupCode: (input: { code: string }) => Promise<AuthResult>;
    /** Initie l'enrôlement 2FA — renvoie l'URI TOTP + les codes de récupération. */
    enable: (input: { password: string }) => Promise<{
      data: { totpURI: string; backupCodes: string[] } | null;
      error: { message?: string } | null;
    }>;
    /** Désactive la 2FA du compte. */
    disable: (input: { password: string }) => Promise<AuthResult>;
  };
  /** Vérification d'email par code OTP (Story 3.17). */
  emailOtp: {
    sendVerificationOtp: (input: {
      email: string;
      type: 'email-verification';
    }) => Promise<AuthResult>;
    verifyEmail: (input: { email: string; otp: string }) => Promise<AuthResult>;
  };
  /** Session courante (Stories 3.15–3.17) — `data` nul si non authentifié. */
  getSession: () => Promise<{
    data: {
      user: {
        email: string;
        name: string;
        emailVerified?: boolean | null;
        twoFactorEnabled?: boolean | null;
        /** Avatar (URL R2) — `user.image` (Story 3.24). */
        image?: string | null;
        /** Langue préférée — `additionalField` (Story 3.24). */
        language?: string | null;
        /** E.164 (`+221…`/`+225…`) — plugin `phoneNumber` (Story 3.3). */
        phoneNumber?: string | null;
        phoneNumberVerified?: boolean | null;
      };
      session: { token: string; activeOrganizationId?: string | null };
    } | null;
  }>;
  /** Met à jour le profil de l'utilisateur courant (nom, avatar, langue) — Story 3.24. */
  updateUser: (input: {
    name?: string;
    image?: string | null;
    language?: string;
  }) => Promise<AuthResult>;
  /**
   * Change l'email de connexion (Story 3.24) — un lien de vérification est envoyé
   * à la nouvelle adresse ; le changement n'est effectif qu'après vérification.
   */
  changeEmail: (input: { newEmail: string; callbackURL?: string }) => Promise<AuthResult>;
  /** Change le mot de passe (Story 3.24) — `revokeOtherSessions` déconnecte les autres appareils. */
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  }) => Promise<AuthResult>;
  /** Déconnexion (Story 3.17). */
  signOut: () => Promise<unknown>;
  /** Demande de réinitialisation du mot de passe (Story 3.8 — écran 3.17). */
  requestPasswordReset: (input: { email: string; redirectTo: string }) => Promise<AuthResult>;
  /** Réinitialisation effective via le token reçu par email (Story 3.8). */
  resetPassword: (input: { newPassword: string; token: string }) => Promise<AuthResult>;
  /** Plugin organisation (Stories 3.16, 3.17). */
  organization: {
    list: () => Promise<{
      data: Array<{ id: string; name: string }> | null;
      error: { message?: string } | null;
    }>;
    setActive: (input: { organizationId: string }) => Promise<AuthResult>;
    getActiveMember: () => Promise<{ data: { role?: string } | null }>;
    /** Organisation active complète — membres + invitations (Story 3.17). */
    getFullOrganization: () => Promise<{
      data: {
        members: Array<{
          id: string;
          role: string;
          createdAt?: string;
          user: { name: string; email: string };
        }>;
        invitations: Array<{
          id: string;
          email: string;
          role: string | null;
          status: string;
          expiresAt: string;
        }>;
      } | null;
      error: { message?: string } | null;
    }>;
    inviteMember: (input: {
      email: string;
      role: string;
    }) => Promise<{ data: { id: string } | null; error: { message?: string } | null }>;
    cancelInvitation: (input: { invitationId: string }) => Promise<AuthResult>;
    removeMember: (input: { memberIdOrEmail: string }) => Promise<AuthResult>;
    /**
     * Détails d'une invitation par son id (Story 3.9 — écran `/invite/accept`).
     * Better-Auth exige une session dont l'email correspond à l'invitation et
     * dont l'email est vérifié (sinon `error` non nul).
     *
     * Endpoint Better-Auth `GET /organization/get-invitation` : l'id est lu
     * depuis la query string. Le proxy client choisit la méthode HTTP en
     * fonction du body (POST si non vide) — on passe donc l'id via `query`
     * pour rester en GET, sinon le serveur répond 404 « method mismatch ».
     */
    getInvitation: (input: { query: { id: string } }) => Promise<{
      data: {
        id: string;
        email: string;
        role: string;
        status: string;
        expiresAt: string;
        organizationId: string;
        organizationName: string;
        organizationSlug: string;
        inviterEmail: string;
      } | null;
      error: { message?: string; status?: number } | null;
    }>;
    /** Accepte l'invitation : crée le membre et bascule l'organisation active. */
    acceptInvitation: (input: { invitationId: string }) => Promise<AuthResult>;
    /** Refuse l'invitation (statut `rejected`). */
    rejectInvitation: (input: { invitationId: string }) => Promise<AuthResult>;
  };
  /** Liste les comptes liés (providers) — `providerId: 'credential'` = mot de passe (Story 3.24). */
  listAccounts: () => Promise<{
    data: Array<{ providerId: string }> | null;
    error: { message?: string } | null;
  }>;
  /** Liste les sessions actives de l'utilisateur (Story 3.15). */
  listSessions: () => Promise<{ data: SessionInfo[] | null; error: { message?: string } | null }>;
  /** Révoque une session précise par son token (Story 3.15). */
  revokeSession: (input: { token: string }) => Promise<AuthResult>;
  /** Révoque toutes les sessions sauf la session courante (Story 3.15). */
  revokeOtherSessions: () => Promise<AuthResult>;
  phoneNumber: {
    sendOtp: (input: { phoneNumber: string }) => Promise<AuthResult>;
    verify: (input: { phoneNumber: string; code: string }) => Promise<AuthResult>;
  };
}

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [organizationClient(), phoneNumberClient(), twoFactorClient(), emailOTPClient()],
}) as unknown as AuthClient;
