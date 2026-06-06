/**
 * Example vertical — minimal tenant-scoped table for the boilerplate.
 * Every business table carries organization_id (multi-tenant scoping).
 * Replace/duplicate this for your own domain.
 */
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const exampleItems = pgTable('example_items', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
