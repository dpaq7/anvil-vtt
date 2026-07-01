import type { Context, Next } from 'hono';
import type { AppEnv } from '../types.js';

const API_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ');

export async function securityHeadersMiddleware(c: Context<AppEnv>, next: Next) {
  await next();

  c.header('Content-Security-Policy', API_CSP);
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');

  try {
    if (new URL(c.req.url).protocol === 'https:') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
  } catch {
    // Ignore malformed URLs; request parsing will fail elsewhere if needed.
  }
}
