/**
 * require-mfa-for-owners middleware (Story 3.5 — MFA TOTP)
 *
 * Garde les procédures sensibles : si l'utilisateur courant est `owner` d'une
 * organisation et n'a pas activé la 2FA TOTP, l'appel est rejeté en `FORBIDDEN`.
 * Les non-owners passent sans contrainte.
 *
 * À appliquer explicitement aux procédures à risque (création de facture
 * > 5M FCFA, changement de RIB, suppression de compte…) au fil des epics
 * métier — il n'est pas câblé au stack par défaut.
 *
 * @example
 *   import { requireMfaForOwners } from '@__SCOPE__/rpc';
 *   export const ribRouter = router({
 *     update: protectedProcedure.use(requireMfaForOwners).mutation(...),
 *   });
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { and, eq, member, user } from '@__SCOPE__/db';
import type { RpcContext } from '../context';

const t = initTRPC.context<RpcContext>().create();

export const requireMfaForOwners = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentification requise.' });
  }

  // Rôle de l'utilisateur — dans l'organisation active si elle est connue
  // (Story 3.6), sinon sur l'ensemble de ses organisations.
  const roles = await ctx.db
    .select({ role: member.role })
    .from(member)
    .where(
      ctx.org
        ? and(eq(member.userId, ctx.user.id), eq(member.organizationId, ctx.org.id))
        : eq(member.userId, ctx.user.id),
    );

  const isOwner = roles.some((r) => r.role === 'owner');
  if (!isOwner) return next();

  // Owner : la double authentification doit être active.
  const [u] = await ctx.db
    .select({ twoFactorEnabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, ctx.user.id))
    .limit(1);

  if (!u?.twoFactorEnabled) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message:
        'Cette action requiert la double authentification (2FA). ' +
        'Activez-la dans Paramètres → Sécurité.',
    });
  }

  return next();
});
