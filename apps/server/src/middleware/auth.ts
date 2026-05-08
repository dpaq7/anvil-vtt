import type { Context, Next } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';

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

export function getSessionCookie(c: Context): string | undefined {
  const cookie = c.req.header('Cookie');
  if (!cookie) return undefined;
  const match = cookie.match(/anvil_session=([^;]+)/);
  return match?.[1];
}

function getCookieAttributes(c: Context<AppEnv>, maxAge: number): string {
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
