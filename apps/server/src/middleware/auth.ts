import type { Context, Next } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Auth middleware: validates session cookie and attaches user to context.
 */
export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const sessionId = getSessionCookie(c);
  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const row = await c.env.DB.prepare(
    `SELECT u.id, u.discord_id, u.username, u.avatar_url, u.role
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<{ id: string; discord_id: string; username: string; avatar_url: string | null; role: string | null }>();

  if (!row) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', {
    id: row.id,
    discordId: row.discord_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    role: (row.role as 'director' | 'player') ?? 'director',
  } satisfies AuthUser);

  await next();
}

export async function csrfMiddleware(c: Context<AppEnv>, next: Next) {
  if (SAFE_METHODS.has(c.req.method.toUpperCase())) {
    await next();
    return;
  }

  const sessionId = getSessionCookie(c);
  if (!sessionId) {
    await next();
    return;
  }

  const originError = validateOrigin(c);
  if (originError) return originError;

  const token = c.req.header(CSRF_HEADER);
  const expected = await createCsrfToken(sessionId, c.env);
  if (!token || !expected || !constantTimeEqual(token, expected)) {
    return c.json({ error: 'Invalid CSRF token' }, 403);
  }

  await next();
}

export async function createCsrfToken(sessionId: string, env: AppEnv['Bindings']): Promise<string> {
  const secret = env.SESSION_SECRET;
  if (!secret || secret === 'undefined') return '';

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`csrf:${sessionId}`));
  return bufferToHex(signature);
}

export function constantTimeEqual(a: string, b: string): boolean {
  let mismatch = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return mismatch === 0;
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function validateOrigin(c: Context<AppEnv>): Response | null {
  const origin = c.req.header('Origin');
  if (!origin) return null;

  try {
    const requestOrigin = new URL(c.req.url).origin;
    const frontendOrigin = c.env.FRONTEND_URL ? new URL(c.env.FRONTEND_URL).origin : requestOrigin;
    if (origin === requestOrigin || origin === frontendOrigin) return null;
  } catch {
    return c.json({ error: 'Invalid request origin' }, 403);
  }

  return c.json({ error: 'Invalid request origin' }, 403);
}

export function getCookieValue(c: Context, name: string): string | undefined {
  const cookie = c.req.header('Cookie');
  if (!cookie) return undefined;
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${escapedName}=([^;]+)`));
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1] ?? '');
  } catch {
    return match[1];
  }
}

export function getSessionCookie(c: Context): string | undefined {
  return getCookieValue(c, 'anvil_session');
}

export function getCookieAttributes(c: Context<AppEnv>, maxAge: number): string {
  const attrs = ['Path=/', 'HttpOnly', `Max-Age=${maxAge}`];
  const frontendUrl = c.env.FRONTEND_URL;

  let sameSite = 'Lax';
  let secure = false;

  try {
    const requestUrl = new URL(c.req.url);
    const requestOrigin = requestUrl.origin;
    const isLocalhost = ['localhost', '127.0.0.1'].includes(requestUrl.hostname);

    if ((c.env.ENVIRONMENT === 'production' || requestUrl.protocol === 'https:') && !isLocalhost) {
      secure = true;
    }

    if (frontendUrl) {
      const frontendOrigin = new URL(frontendUrl).origin;
      if (frontendOrigin !== requestOrigin && !isLocalhost) {
        sameSite = 'None';
        secure = true;
      }
    }
  } catch {
    if (c.env.ENVIRONMENT === 'production') {
      secure = true;
    }
  }

  attrs.push(`SameSite=${sameSite}`);
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function setSessionCookie(c: Context<AppEnv>, sessionId: string, maxAge: number) {
  c.header('Set-Cookie', `anvil_session=${sessionId}; ${getCookieAttributes(c, maxAge)}`);
}

export function clearSessionCookie(c: Context<AppEnv>) {
  c.header('Set-Cookie', `anvil_session=; ${getCookieAttributes(c, 0)}`);
}
