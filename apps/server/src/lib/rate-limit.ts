import type { Context } from 'hono';
import type { AppEnv } from '../types.js';

interface RateLimitOptions {
  namespace: string;
  limit: number;
  windowSeconds: number;
  identifier?: string;
}

interface RateLimitRow {
  count: number;
  reset_at: number;
}

function clientIdentifier(c: Context<AppEnv>): string {
  const forwarded = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

export async function enforceRateLimit(c: Context<AppEnv>, options: RateLimitOptions): Promise<Response | null> {
  const identifier = options.identifier ?? clientIdentifier(c);
  const key = `${options.namespace}:${identifier}`;
  const now = Date.now();
  const resetAt = now + options.windowSeconds * 1000;

  await c.env.DB.prepare(
    `INSERT INTO request_rate_limits (key, count, reset_at)
     VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN reset_at <= ? THEN 1 ELSE count + 1 END,
       reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END`,
  )
    .bind(key, resetAt, now, now, resetAt)
    .run();

  const row = await c.env.DB.prepare('SELECT count, reset_at FROM request_rate_limits WHERE key = ?')
    .bind(key)
    .first<RateLimitRow>();

  if (!row || row.count <= options.limit) return null;

  const retryAfterSeconds = Math.max(1, Math.ceil((row.reset_at - now) / 1000));
  c.header('Retry-After', String(retryAfterSeconds));
  return c.json({ error: 'Too many requests' }, 429);
}
