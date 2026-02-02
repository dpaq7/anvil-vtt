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
    `SELECT u.id, u.discord_id, u.username, u.avatar_url
     FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > datetime('now')`,
  )
    .bind(sessionId)
    .first<{ id: string; discord_id: string; username: string; avatar_url: string | null }>();

  if (!row) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', {
    id: row.id,
    discordId: row.discord_id,
    username: row.username,
    avatarUrl: row.avatar_url,
  } satisfies AuthUser);

  await next();
}

export function getSessionCookie(c: Context): string | undefined {
  const cookie = c.req.header('Cookie');
  if (!cookie) return undefined;
  const match = cookie.match(/anvil_session=([^;]+)/);
  return match?.[1];
}

export function setSessionCookie(c: Context, sessionId: string, maxAge: number) {
  c.header(
    'Set-Cookie',
    `anvil_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  );
}

export function clearSessionCookie(c: Context) {
  c.header(
    'Set-Cookie',
    'anvil_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  );
}
