/**
 * example router — minimal product vertical for the boilerplate.
 *
 * Demonstrates the canonical pattern: appProcedure (auth + org + onboarding),
 * RBAC gating via requirePermission, tenant scoping on organization_id, and an
 * audit-log write on mutation. Duplicate this for your own domains.
 */
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auditLog, exampleItems } from '@__SCOPE__/db';
import { appProcedure, router } from '../trpc';
import { requirePermission } from '../middleware/require-permission';

export const exampleRouter = router({
  list: appProcedure
    .use(requirePermission('example:item:read'))
    .query(({ ctx }) =>
      ctx.db
        .select()
        .from(exampleItems)
        .where(eq(exampleItems.organizationId, ctx.org.id)),
    ),

  create: appProcedure
    .use(requirePermission('example:item:create'))
    .input(z.object({ name: z.string().min(1).max(120), description: z.string().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(exampleItems).values({
        id,
        organizationId: ctx.org.id,
        name: input.name,
        description: input.description ?? null,
      });
      await ctx.db.insert(auditLog).values({
        id: crypto.randomUUID(),
        organizationId: ctx.org.id,
        userId: ctx.user.id,
        sessionId: ctx.sessionId,
        action: 'example.item.created',
        resourceType: 'example_item',
        resourceId: id,
        details: { after: { id, name: input.name } },
        ipAddress: ctx.ip,
      });
      return { id, name: input.name };
    }),

  remove: appProcedure
    .use(requirePermission('example:item:delete'))
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(exampleItems)
        .where(and(eq(exampleItems.id, input.id), eq(exampleItems.organizationId, ctx.org.id)));
      return { ok: true };
    }),
});
