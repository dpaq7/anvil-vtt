import { Hono, type Context } from 'hono';
import type { AppEnv, AuthUser, UserRole } from '../types.js';
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
import { ensureMcdmDemoCampaignForUser } from '../lib/demo-campaigns.js';
import { authRateLimits } from '../security/rate-limits.js';

export const authRoutes = new Hono<AppEnv>();

const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

type OAuthProvider = 'discord' | 'google';

interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  username: string;
  avatarUrl: string | null;
  email: string | null;
}

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
  discord: 'Discord',
  google: 'Google',
};

function missingConfig(required: Record<string, string | undefined>) {
  return Object.entries(required)
    .filter(([, value]) => !value || value === 'undefined')
    .map(([key]) => key);
}

function missingOAuthConfig(env: AppEnv['Bindings'], provider: OAuthProvider) {
  if (provider === 'discord') {
    return missingConfig({
      DISCORD_CLIENT_ID: env.DISCORD_CLIENT_ID,
      DISCORD_CLIENT_SECRET: env.DISCORD_CLIENT_SECRET,
      DISCORD_REDIRECT_URI: env.DISCORD_REDIRECT_URI,
    });
  }

  return missingConfig({
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: env.GOOGLE_REDIRECT_URI,
  });
}

function oauthConfigError(c: Context<AppEnv>, provider: OAuthProvider, missing: string[]) {
  const label = PROVIDER_LABELS[provider];
  return c.json(
    {
      error: `${label} OAuth is not configured`,
      missing,
      hint: 'Copy apps/server/.dev.vars.example to apps/server/.dev.vars and fill in real OAuth values.',
    },
    500,
  );
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function setOAuthStateCookie(c: Context<AppEnv>, state: string) {
  c.header('Set-Cookie', `anvil_oauth_state=${state}; ${getCookieAttributes(c, 5 * 60)}`);
}

function validateOAuthCallback(c: Context<AppEnv>) {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const stateCookie = getCookieValue(c, 'anvil_oauth_state');
  if (!state || !stateCookie || !constantTimeEqual(state, stateCookie)) {
    return { ok: false as const, response: c.json({ error: 'Invalid OAuth state' }, 400) };
  }

  if (!code) {
    return { ok: false as const, response: c.json({ error: 'Missing code parameter' }, 400) };
  }

  return { ok: true as const, code };
}

async function upsertOAuthUser(c: Context<AppEnv>, profile: OAuthProfile): Promise<string> {
  const existing = await c.env.DB.prepare(
    `SELECT u.id
     FROM user_identities ui
     JOIN users u ON ui.user_id = u.id
     WHERE ui.provider = ? AND ui.provider_user_id = ?`,
  )
    .bind(profile.provider, profile.providerUserId)
    .first<{ id: string }>();

  if (existing) {
    await c.env.DB.prepare(
      `UPDATE users
       SET username = ?, avatar_url = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(profile.username, profile.avatarUrl, existing.id)
      .run();

    await c.env.DB.prepare(
      `UPDATE user_identities
       SET email = ?, updated_at = datetime('now')
       WHERE provider = ? AND provider_user_id = ?`,
    )
      .bind(profile.email, profile.provider, profile.providerUserId)
      .run();

    return existing.id;
  }

  const userId = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO users (id, username, avatar_url) VALUES (?, ?, ?)')
    .bind(userId, profile.username, profile.avatarUrl)
    .run();

  try {
    await c.env.DB.prepare(
      `INSERT INTO user_identities (user_id, provider, provider_user_id, email)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(userId, profile.provider, profile.providerUserId, profile.email)
      .run();
  } catch (error) {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    const concurrent = await c.env.DB.prepare(
      `SELECT user_id
       FROM user_identities
       WHERE provider = ? AND provider_user_id = ?`,
    )
      .bind(profile.provider, profile.providerUserId)
      .first<{ user_id: string }>();
    if (concurrent) return concurrent.user_id;
    throw error;
  }

  return userId;
}

async function createSession(c: Context<AppEnv>, userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();

  await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(sessionId, userId, expiresAt)
    .run();

  setSessionCookie(c, sessionId, SESSION_MAX_AGE);
  return sessionId;
}

async function createSessionAndRedirect(c: Context<AppEnv>, userId: string, redirectPath = '/app') {
  await createSession(c, userId);

  const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
  return c.redirect(`${frontendUrl}${redirectPath}`);
}

async function tableExists(c: Context<AppEnv>, tableName: string) {
  const row = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(tableName)
    .first<{ name: string }>();
  return Boolean(row);
}

async function tableHasColumn(c: Context<AppEnv>, tableName: string, columnName: string) {
  const columns = await c.env.DB.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>();
  return columns.results.some((column) => column.name === columnName);
}

function devUserForRole(role: UserRole) {
  return role === 'director'
    ? { userId: 'dev-director', username: 'Dev Director' }
    : { userId: 'dev-player', username: 'Dev Player' };
}

async function upsertDevUser(c: Context<AppEnv>, role: UserRole) {
  const { userId, username } = devUserForRole(role);
  const hasLegacyDiscordId = await tableHasColumn(c, 'users', 'discord_id');

  if (hasLegacyDiscordId) {
    await c.env.DB.prepare(
      `INSERT INTO users (id, discord_id, username, avatar_url, role)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         discord_id = excluded.discord_id,
         username = excluded.username,
         avatar_url = excluded.avatar_url,
         role = excluded.role,
         updated_at = datetime('now')`,
    )
      .bind(userId, userId, username, null, role)
      .run();
  } else {
    await c.env.DB.prepare(
      `INSERT INTO users (id, username, avatar_url, role)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         username = excluded.username,
         avatar_url = excluded.avatar_url,
         role = excluded.role,
         updated_at = datetime('now')`,
    )
      .bind(userId, username, null, role)
      .run();
  }

  if (await tableExists(c, 'user_identities')) {
    await c.env.DB.prepare(
      `INSERT INTO user_identities (user_id, provider, provider_user_id, email)
       VALUES (?, 'dev', ?, NULL)
       ON CONFLICT(provider, provider_user_id) DO UPDATE SET
         user_id = excluded.user_id,
         updated_at = datetime('now')`,
    )
      .bind(userId, role)
      .run();
  }

  return userId;
}

async function ensureDevPlayerAccess(c: Context<AppEnv>, playerUserId: string) {
  const directorUserId = await upsertDevUser(c, 'director');
  const demoCampaignId = await ensureMcdmDemoCampaignForUser(c.env.DB, directorUserId);
  if (!demoCampaignId) return;

  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)',
  )
    .bind(demoCampaignId, playerUserId, 'player')
    .run();
}

// Redirect to Discord OAuth.
authRoutes.get('/discord', async (c) => {
  const rateLimitError = await authRateLimits.start(c);
  if (rateLimitError) return rateLimitError;

  const missing = missingOAuthConfig(c.env, 'discord');
  if (missing.length > 0) return oauthConfigError(c, 'discord', missing);

  const state = randomHex(32);
  const params = new URLSearchParams({
    client_id: c.env.DISCORD_CLIENT_ID,
    redirect_uri: c.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state,
  });
  setOAuthStateCookie(c, state);
  return c.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// Discord OAuth callback. Keep /callback for existing Discord app redirect settings.
authRoutes.get('/callback', async (c) => {
  const rateLimitError = await authRateLimits.callback(c);
  if (rateLimitError) return rateLimitError;

  const missing = missingOAuthConfig(c.env, 'discord');
  if (missing.length > 0) return oauthConfigError(c, 'discord', missing);

  const callback = validateOAuthCallback(c);
  if (!callback.ok) return callback.response;

  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.DISCORD_CLIENT_ID,
      client_secret: c.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: callback.code,
      redirect_uri: c.env.DISCORD_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    return c.json({ error: 'Failed to exchange code' }, 400);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return c.json({ error: 'Missing access token' }, 400);
  }

  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    return c.json({ error: 'Failed to fetch Discord user' }, 400);
  }

  const discordUser = (await userRes.json()) as {
    id?: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
  };

  if (!discordUser.id || !discordUser.username) {
    return c.json({ error: 'Invalid Discord user profile' }, 400);
  }

  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  const userId = await upsertOAuthUser(c, {
    provider: 'discord',
    providerUserId: discordUser.id,
    username: discordUser.global_name ?? discordUser.username,
    avatarUrl,
    email: null,
  });

  return createSessionAndRedirect(c, userId);
});

// Redirect to Google OAuth.
authRoutes.get('/google', async (c) => {
  const rateLimitError = await authRateLimits.start(c);
  if (rateLimitError) return rateLimitError;

  const missing = missingOAuthConfig(c.env, 'google');
  if (missing.length > 0) return oauthConfigError(c, 'google', missing);

  const state = randomHex(32);
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  setOAuthStateCookie(c, state);
  return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// Google OAuth callback.
authRoutes.get('/google/callback', async (c) => {
  const rateLimitError = await authRateLimits.callback(c);
  if (rateLimitError) return rateLimitError;

  const missing = missingOAuthConfig(c.env, 'google');
  if (missing.length > 0) return oauthConfigError(c, 'google', missing);

  const callback = validateOAuthCallback(c);
  if (!callback.ok) return callback.response;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: callback.code,
      redirect_uri: c.env.GOOGLE_REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    return c.json({ error: 'Failed to exchange code' }, 400);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return c.json({ error: 'Missing access token' }, 400);
  }

  const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    return c.json({ error: 'Failed to fetch Google user' }, 400);
  }

  const googleUser = (await userRes.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };

  if (!googleUser.sub) {
    return c.json({ error: 'Invalid Google user profile' }, 400);
  }

  const userId = await upsertOAuthUser(c, {
    provider: 'google',
    providerUserId: googleUser.sub,
    username: googleUser.name ?? googleUser.email ?? 'Google User',
    avatarUrl: googleUser.picture ?? null,
    email: googleUser.email ?? null,
  });

  return createSessionAndRedirect(c, userId);
});

// Development-only local login for iteration without OAuth.
authRoutes.get('/dev-login', async (c) => {
  if (c.env.ENVIRONMENT !== 'development') {
    return c.json({ error: 'Not found' }, 404);
  }

  const rateLimitError = await authRateLimits.devLogin(c);
  if (rateLimitError) return rateLimitError;

  const role: UserRole = c.req.query('role') === 'player' ? 'player' : 'director';
  const userId = await upsertDevUser(c, role);
  if (role === 'player') {
    await ensureDevPlayerAccess(c, userId);
  }

  const next = c.req.query('next');
  const redirectPath = next && next.startsWith('/') && !next.startsWith('//') ? next : '/app';
  if (c.req.query('format') === 'json') {
    await createSession(c, userId);
    return c.json({ ok: true, role, redirectPath });
  }

  return createSessionAndRedirect(c, userId, redirectPath);
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

  await c.env.DB.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(body.role, user.id)
    .run();

  return c.json({ success: true, role: body.role });
});
