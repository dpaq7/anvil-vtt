import type { Hono } from 'hono';
import type { AppEnv } from '../types.js';
import { csrfMiddleware } from '../middleware/auth.js';
import { securityHeadersMiddleware } from '../middleware/security.js';

export function applyGlobalSecurity(app: Hono<AppEnv>): void {
  app.use('*', securityHeadersMiddleware);
  app.use('/api/*', csrfMiddleware);
}

export * from './assets.js';
export * from './audit.js';
export * from './authorization.js';
export * from './rate-limits.js';
export * from './request.js';
export * from './validation.js';
