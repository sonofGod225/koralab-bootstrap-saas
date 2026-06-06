/**
 * Example REST endpoint — complement to tRPC (webhooks, health per vertical…).
 * Replace with your own routes.
 */
import { Hono } from 'hono';
import type { Bindings } from '../env';

const exampleRoute = new Hono<{ Bindings: Bindings }>();

exampleRoute.get('/health', (c) => c.json({ status: 'ok', service: 'example' }));

export { exampleRoute };
