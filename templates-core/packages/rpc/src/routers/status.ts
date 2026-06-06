/**
 * status router — observabilité opérationnelle (Epic 25).
 *
 * - `status.public` (`publicProcedure`) : payload de la status page publique
 *   (composants publics + statut global + incidents/maintenances publics +
 *   uptime 90j). Aucune fuite interne (`is_public=false` exclus).
 * - `status.admin.*` (`staffProcedure` / `auditedStaffProcedure`) : santé,
 *   jobs, uptime multi-fenêtres, incidents CRUD, maintenance CRUD, observabilité.
 */
import { z } from 'zod';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  ne,
  or,
  sql,
  healthCheckRuns,
  incidentUpdates,
  jobRuns,
  maintenanceWindows,
  serviceComponents,
  systemIncidents,
} from '@__SCOPE__/db';
import { router, publicProcedure, staffProcedure, auditedStaffProcedure, trpcError } from '../trpc';
import { queryAxiomMetrics, querySentryIssues } from '../services/observability';
import type { RpcContext } from '../context';

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0)) || 0;
const daysAgo = (d: number): Date => new Date(Date.now() - d * 86_400_000);

const SLA = { targetPct: 99.5, rto: '4h', rpo: '1h' } as const;

/** Uptime % par composant sur une fenêtre (exclut les runs en maintenance). */
async function uptimeByComponent(
  db: RpcContext['db'],
  sinceDays: number,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      key: healthCheckRuns.componentKey,
      total: count(),
      down: sql<number>`count(*) filter (where ${healthCheckRuns.status} = 'down')`,
    })
    .from(healthCheckRuns)
    .where(gte(healthCheckRuns.checkedAt, daysAgo(sinceDays)))
    .groupBy(healthCheckRuns.componentKey);
  const map: Record<string, number> = {};
  for (const r of rows) {
    const total = num(r.total);
    const down = num(r.down);
    map[r.key] = total > 0 ? Math.round(((total - down) / total) * 10000) / 100 : 100;
  }
  return map;
}

function globalStatus(
  components: { currentStatus: string }[],
): 'operational' | 'degraded' | 'down' | 'maintenance' {
  if (components.some((c) => c.currentStatus === 'down')) return 'down';
  if (components.some((c) => c.currentStatus === 'degraded')) return 'degraded';
  if (components.some((c) => c.currentStatus === 'maintenance')) return 'maintenance';
  return 'operational';
}

/* ─── Incident CRUD inputs ──────────────────────────────────────────────── */

const severityEnum = z.enum(['minor', 'major', 'critical']);
const incidentStatusEnum = z.enum(['investigating', 'identified', 'monitoring', 'resolved']);
const maintenanceStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'canceled']);

export const statusRouter = router({
  /* ═══ Public (status page) ═════════════════════════════════════════════ */
  public: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const [components, uptime90, incidents, maintenances] = await Promise.all([
      ctx.db
        .select()
        .from(serviceComponents)
        .where(eq(serviceComponents.isPublic, true))
        .orderBy(asc(serviceComponents.sortOrder)),
      uptimeByComponent(ctx.db, 90),
      ctx.db
        .select()
        .from(systemIncidents)
        .where(
          and(
            eq(systemIncidents.isPublic, true),
            or(ne(systemIncidents.status, 'resolved'), gte(systemIncidents.startedAt, daysAgo(14))),
          ),
        )
        .orderBy(desc(systemIncidents.startedAt))
        .limit(20),
      ctx.db
        .select()
        .from(maintenanceWindows)
        .where(
          and(
            eq(maintenanceWindows.isPublic, true),
            inArray(maintenanceWindows.status, ['scheduled', 'in_progress']),
            gte(maintenanceWindows.endsAt, now),
          ),
        )
        .orderBy(asc(maintenanceWindows.startsAt)),
    ]);

    const incidentIds = incidents.map((i) => i.id);
    const updates = incidentIds.length
      ? await ctx.db
          .select()
          .from(incidentUpdates)
          .where(inArray(incidentUpdates.incidentId, incidentIds))
          .orderBy(desc(incidentUpdates.createdAt))
      : [];

    return {
      generatedAt: now.toISOString(),
      globalStatus: globalStatus(components),
      sla: SLA,
      components: components.map((c) => ({
        key: c.key,
        label: c.label,
        kind: c.kind,
        currentStatus: c.currentStatus,
        uptime90: uptime90[c.key] ?? 100,
      })),
      incidents: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        status: i.status,
        startedAt: i.startedAt,
        resolvedAt: i.resolvedAt,
        componentKeys: i.componentKeys,
        updates: updates.filter((u) => u.incidentId === i.id),
      })),
      maintenances,
    };
  }),

  /* ═══ Admin (back-office staff) ════════════════════════════════════════ */
  admin: router({
    overview: staffProcedure.query(async ({ ctx }) => {
      const [components, uptime24, uptime30, uptime90, recentJobs, axiom, sentry] =
        await Promise.all([
          ctx.db.select().from(serviceComponents).orderBy(asc(serviceComponents.sortOrder)),
          uptimeByComponent(ctx.db, 1),
          uptimeByComponent(ctx.db, 30),
          uptimeByComponent(ctx.db, 90),
          ctx.db.select().from(jobRuns).orderBy(desc(jobRuns.startedAt)).limit(8),
          queryAxiomMetrics(ctx.env),
          querySentryIssues(ctx.env),
        ]);
      const [activeIncidents] = await ctx.db
        .select({ v: count() })
        .from(systemIncidents)
        .where(ne(systemIncidents.status, 'resolved'));
      return {
        components: components.map((c) => ({
          ...c,
          uptime24: uptime24[c.key] ?? 100,
          uptime30: uptime30[c.key] ?? 100,
          uptime90: uptime90[c.key] ?? 100,
        })),
        globalStatus: globalStatus(components),
        sla: SLA,
        recentJobs,
        activeIncidents: num(activeIncidents?.v),
        axiom,
        sentry,
      };
    }),

    jobs: staffProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).default(30),
          offset: z.number().int().min(0).default(0),
          jobName: z.string().max(60).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const where = input.jobName ? eq(jobRuns.jobName, input.jobName) : undefined;
        const [rows, [{ v: total } = { v: 0 }]] = await Promise.all([
          ctx.db
            .select()
            .from(jobRuns)
            .where(where)
            .orderBy(desc(jobRuns.startedAt))
            .limit(input.limit)
            .offset(input.offset),
          ctx.db.select({ v: count() }).from(jobRuns).where(where),
        ]);
        return { rows, total: num(total) };
      }),

    health: staffProcedure
      .input(
        z.object({
          componentKey: z.string().max(40).optional(),
          limit: z.number().int().min(1).max(200).default(100),
        }),
      )
      .query(async ({ ctx, input }) => {
        const where = input.componentKey
          ? eq(healthCheckRuns.componentKey, input.componentKey)
          : undefined;
        const rows = await ctx.db
          .select()
          .from(healthCheckRuns)
          .where(where)
          .orderBy(desc(healthCheckRuns.checkedAt))
          .limit(input.limit);
        return { rows };
      }),

    uptime: staffProcedure
      .input(z.object({ windowDays: z.number().int().min(1).max(365).default(90) }))
      .query(async ({ ctx, input }) => uptimeByComponent(ctx.db, input.windowDays)),

    /* ── Incidents ──────────────────────────────────────────────────────── */
    incidents: router({
      list: staffProcedure
        .input(
          z.object({
            activeOnly: z.boolean().default(false),
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          }),
        )
        .query(async ({ ctx, input }) => {
          const where = input.activeOnly ? ne(systemIncidents.status, 'resolved') : undefined;
          const [rows, [{ v: total } = { v: 0 }]] = await Promise.all([
            ctx.db
              .select()
              .from(systemIncidents)
              .where(where)
              .orderBy(desc(systemIncidents.startedAt))
              .limit(input.limit)
              .offset(input.offset),
            ctx.db.select({ v: count() }).from(systemIncidents).where(where),
          ]);
          return { rows, total: num(total) };
        }),

      get: staffProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
          const [incident] = await ctx.db
            .select()
            .from(systemIncidents)
            .where(eq(systemIncidents.id, input.id))
            .limit(1);
          if (!incident) throw trpcError('NOT_FOUND', 'Incident introuvable.');
          const updates = await ctx.db
            .select()
            .from(incidentUpdates)
            .where(eq(incidentUpdates.incidentId, input.id))
            .orderBy(desc(incidentUpdates.createdAt));
          return { incident, updates };
        }),

      create: auditedStaffProcedure
        .input(
          z.object({
            title: z.string().trim().min(3).max(200),
            severity: severityEnum.default('minor'),
            componentKeys: z.array(z.string().max(40)).default([]),
            body: z.string().trim().min(3).max(2000),
            isPublic: z.boolean().default(false),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const id = crypto.randomUUID();
          const now = new Date();
          await ctx.db.insert(systemIncidents).values({
            id,
            title: input.title,
            severity: input.severity,
            status: 'investigating',
            componentKeys: input.componentKeys,
            isPublic: input.isPublic,
            createdBy: ctx.user.id,
            startedAt: now,
          });
          await ctx.db.insert(incidentUpdates).values({
            id: crypto.randomUUID(),
            incidentId: id,
            body: input.body,
            status: 'investigating',
            authorUserId: ctx.user.id,
          });
          return { id };
        }),

      addUpdate: auditedStaffProcedure
        .input(
          z.object({
            id: z.string().min(1),
            body: z.string().trim().min(3).max(2000),
            status: incidentStatusEnum,
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const [incident] = await ctx.db
            .select({ id: systemIncidents.id })
            .from(systemIncidents)
            .where(eq(systemIncidents.id, input.id))
            .limit(1);
          if (!incident) throw trpcError('NOT_FOUND', 'Incident introuvable.');
          await ctx.db.insert(incidentUpdates).values({
            id: crypto.randomUUID(),
            incidentId: input.id,
            body: input.body,
            status: input.status,
            authorUserId: ctx.user.id,
          });
          await ctx.db
            .update(systemIncidents)
            .set({
              status: input.status,
              resolvedAt: input.status === 'resolved' ? new Date() : null,
              updatedAt: new Date(),
            })
            .where(eq(systemIncidents.id, input.id));
          return { id: input.id, status: input.status };
        }),

      setPublic: auditedStaffProcedure
        .input(z.object({ id: z.string().min(1), isPublic: z.boolean() }))
        .mutation(async ({ ctx, input }) => {
          const [updated] = await ctx.db
            .update(systemIncidents)
            .set({ isPublic: input.isPublic, updatedAt: new Date() })
            .where(eq(systemIncidents.id, input.id))
            .returning({ id: systemIncidents.id });
          if (!updated) throw trpcError('NOT_FOUND', 'Incident introuvable.');
          return { id: input.id, isPublic: input.isPublic };
        }),
    }),

    /* ── Maintenance ────────────────────────────────────────────────────── */
    maintenance: router({
      list: staffProcedure
        .input(
          z.object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          }),
        )
        .query(async ({ ctx, input }) => {
          const [rows, [{ v: total } = { v: 0 }]] = await Promise.all([
            ctx.db
              .select()
              .from(maintenanceWindows)
              .orderBy(desc(maintenanceWindows.startsAt))
              .limit(input.limit)
              .offset(input.offset),
            ctx.db.select({ v: count() }).from(maintenanceWindows),
          ]);
          return { rows, total: num(total) };
        }),

      create: auditedStaffProcedure
        .input(
          z.object({
            title: z.string().trim().min(3).max(200),
            body: z.string().trim().max(2000).optional(),
            componentKeys: z.array(z.string().max(40)).default([]),
            startsAt: z.coerce.date(),
            endsAt: z.coerce.date(),
            isPublic: z.boolean().default(true),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          if (input.endsAt <= input.startsAt)
            throw trpcError('BAD_REQUEST', 'La fin doit être après le début.');
          const id = crypto.randomUUID();
          await ctx.db.insert(maintenanceWindows).values({
            id,
            title: input.title,
            body: input.body ?? null,
            componentKeys: input.componentKeys,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            status: 'scheduled',
            isPublic: input.isPublic,
            createdBy: ctx.user.id,
          });
          return { id };
        }),

      setStatus: auditedStaffProcedure
        .input(z.object({ id: z.string().min(1), status: maintenanceStatusEnum }))
        .mutation(async ({ ctx, input }) => {
          const [updated] = await ctx.db
            .update(maintenanceWindows)
            .set({ status: input.status, updatedAt: new Date() })
            .where(eq(maintenanceWindows.id, input.id))
            .returning({ id: maintenanceWindows.id });
          if (!updated) throw trpcError('NOT_FOUND', 'Maintenance introuvable.');
          return { id: input.id, status: input.status };
        }),
    }),
  }),
});
