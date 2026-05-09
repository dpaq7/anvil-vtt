import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import {
  authMiddleware,
  constantTimeEqual,
  createCsrfToken,
  getCookieAttributes,
  getCookieValue,
  getSessionCookie,
  setSessionCookie,
  clearSessionCookie,
} from '../middleware/auth.js';

export const authRoutes = new Hono<AppEnv>();

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function missingOAuthConfig(env: AppEnv['Bindings']) {
  const required = {
    DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI: env.DISCORD_REDIRECT_URI,
  };

  return Object.entries(required)
    .filter(([, value]) => !value || value === 'undefined')
    .map(([key]) => key);
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Redirect to Discord OAuth
authRoutes.get('/discord', (c) => {
  const missingConfig = missingOAuthConfig(c.env);
  if (missingConfig.length > 0) {
    return c.json(
      {
        error: 'Discord OAuth is not configured',
        missing: missingConfig,
        hint: 'Copy apps/server/.dev.vars.example to apps/server/.dev.vars and fill in real Discord OAuth values.',
      },
      500,
    );
  }

  const state = randomHex(32);
  const params = new URLSearchParams({
    client_id: c.env.DISCORD_CLIENT_ID,
    redirect_uri: c.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state,
  });
  c.header('Set-Cookie', `anvil_oauth_state=${state}; ${getCookieAttributes(c, 5 * 60)}`);
  return c.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// Discord OAuth callback
authRoutes.get('/callback', async (c) => {
  const missingConfig = missingOAuthConfig(c.env);
  if (missingConfig.length > 0) {
    return c.json(
      {
        error: 'Discord OAuth is not configured',
        missing: missingConfig,
        hint: 'Copy apps/server/.dev.vars.example to apps/server/.dev.vars and fill in real Discord OAuth values.',
      },
      500,
    );
  }

  const code = c.req.query('code');
  const state = c.req.query('state');
  const stateCookie = getCookieValue(c, 'anvil_oauth_state');
  if (!state || !stateCookie || !constantTimeEqual(state, stateCookie)) {
    return c.json({ error: 'Invalid OAuth state' }, 400);
  }

  if (!code) {
    return c.json({ error: 'Missing code parameter' }, 400);
  }

  // Exchange code for token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: c.env.DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    return c.json({ error: 'Failed to exchange code' }, 400);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  // Fetch Discord user
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    return c.json({ error: 'Failed to fetch Discord user' }, 400);
  }

  const discordUser = (await userRes.json()) as {
    id: string;
    username: string;
    avatar: string | null;
  };

  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  // Upsert user
  const userId = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO users (id, discord_id, username, avatar_url)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(discord_id) DO UPDATE SET
       username = excluded.username,
       avatar_url = excluded.avatar_url,
       updated_at = datetime('now')`,
  )
    .bind(userId, discordUser.id, discordUser.username, avatarUrl)
    .run();

  // Get actual user id (might be existing)
  const user = await c.env.DB.prepare('SELECT id FROM users WHERE discord_id = ?')
    .bind(discordUser.id)
    .first<{ id: string }>();

  if (!user) {
    return c.json({ error: 'Failed to create user' }, 500);
  }

  // Create session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, user.id, expiresAt)
    .run();

  setSessionCookie(c, sessionId, SESSION_MAX_AGE);

  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
  return c.redirect(`${frontendUrl}/app`);
});


// Development-only local login for iteration without Discord OAuth.
authRoutes.get('/dev-login', async (c) => {
  if (c.env.ENVIRONMENT !== 'development') {
    return c.json({ error: 'Not found' }, 404);
  }

  const role = c.req.query('role') === 'player' ? 'player' : 'director';
  const userId = `${role === 'director' ? 'dev-director' : 'dev-player'}`;
  const discordId = `${userId}-discord`;
  const username = role === 'director' ? 'Dev Director' : 'Dev Player';

  await c.env.DB.prepare(
    `INSERT INTO users (id, discord_id, username, avatar_url, role)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(discord_id) DO UPDATE SET
       username = excluded.username,
       avatar_url = excluded.avatar_url,
       role = excluded.role,
       updated_at = datetime('now')`,
  )
    .bind(userId, discordId, username, null, role)
    .run();

  const user = await c.env.DB.prepare('SELECT id FROM users WHERE discord_id = ?')
    .bind(discordId)
    .first<{ id: string }>();

  if (!user) {
    return c.json({ error: 'Failed to create dev user' }, 500);
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, user.id, expiresAt)
    .run();

  setSessionCookie(c, sessionId, SESSION_MAX_AGE);

  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
  const next = c.req.query('next');
  const redirectPath = next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
  return c.redirect(`${frontendUrl}${redirectPath}`);
});

// Logout
authRoutes.post('/logout', async (c) => {
  const sessionId = getSessionCookie(c);
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  clearSessionCookie(c);
  return c.json({ ok: true });
});

// Get current user
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const sessionId = getSessionCookie(c);
  return c.json({
    user,
    csrfToken: sessionId ? await createCsrfToken(sessionId, c.env) : '',
  });
});

// Update user role
authRoutes.patch('/role', authMiddleware, async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json<{ role: string }>();

  if (body.role !== 'director' && body.role !== 'player') {
    return c.json({ error: 'Invalid role' }, 400);
  }

  await c.env.DB.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .bind(body.role, user.id)
    .run();

  return c.json({ success: true, role: body.role });
});
