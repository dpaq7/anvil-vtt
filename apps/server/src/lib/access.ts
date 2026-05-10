import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';

type CampaignRole = 'director' | 'player';

interface AccessRow {
  campaign_id: string;
  director_id: string;
}

export async function getCampaignRole(
  c: Context<AppEnv>,
  campaignId: string,
  userId: string,
): Promise<CampaignRole | null> {
  const row = await c.env.DB.prepare(
    `SELECT cm.role
     FROM campaign_members cm
     JOIN campaigns c ON c.id = cm.campaign_id
     WHERE cm.campaign_id = ? AND cm.user_id = ? AND c.deleted_at IS NULL`,
  )
    .bind(campaignId, userId)
    .first<{ role: CampaignRole }>();
  return row?.role ?? null;
}

export async function requireCampaignMember(
  c: Context<AppEnv>,
  campaignId: string,
  user: AuthUser,
): Promise<Response | null> {
  return (await getCampaignRole(c, campaignId, user.id)) ? null : c.json({ error: 'Forbidden' }, 403);
}

export async function requireCampaignDirector(
  c: Context<AppEnv>,
  campaignId: string,
  user: AuthUser,
): Promise<Response | null> {
  return (await getCampaignRole(c, campaignId, user.id)) === 'director' ? null : c.json({ error: 'Forbidden' }, 403);
}

async function getSessionAccess(c: Context<AppEnv>, sessionId: string): Promise<AccessRow | null> {
  return c.env.DB.prepare(
    `SELECT gs.campaign_id, c.director_id
     FROM game_sessions gs
     JOIN campaigns c ON c.id = gs.campaign_id
     WHERE gs.id = ? AND c.deleted_at IS NULL`,
  )
    .bind(sessionId)
    .first<AccessRow>();
}

export async function requireSessionMember(
  c: Context<AppEnv>,
  sessionId: string,
  user: AuthUser,
): Promise<Response | null> {
  const access = await getSessionAccess(c, sessionId);
  if (!access) return c.json({ error: 'Not found' }, 404);
  if (access.director_id === user.id) return null;
  return (await getCampaignRole(c, access.campaign_id, user.id)) ? null : c.json({ error: 'Forbidden' }, 403);
}

export async function requireSessionDirector(
  c: Context<AppEnv>,
  sessionId: string,
  user: AuthUser,
): Promise<Response | null> {
  const access = await getSessionAccess(c, sessionId);
  if (!access) return c.json({ error: 'Not found' }, 404);
  return access.director_id === user.id ? null : c.json({ error: 'Forbidden' }, 403);
}

async function getSceneAccess(c: Context<AppEnv>, sceneId: string): Promise<AccessRow | null> {
  return c.env.DB.prepare(
    `SELECT gs.campaign_id, c.director_id
     FROM scenes s
     JOIN game_sessions gs ON gs.id = s.game_session_id
     JOIN campaigns c ON c.id = gs.campaign_id
     WHERE s.id = ? AND s.deleted_at IS NULL AND c.deleted_at IS NULL`,
  )
    .bind(sceneId)
    .first<AccessRow>();
}

export async function requireSceneMember(
  c: Context<AppEnv>,
  sceneId: string,
  user: AuthUser,
): Promise<Response | null> {
  const access = await getSceneAccess(c, sceneId);
  if (!access) return c.json({ error: 'Not found' }, 404);
  if (access.director_id === user.id) return null;
  return (await getCampaignRole(c, access.campaign_id, user.id)) ? null : c.json({ error: 'Forbidden' }, 403);
}

export async function requireSceneDirector(
  c: Context<AppEnv>,
  sceneId: string,
  user: AuthUser,
): Promise<Response | null> {
  const access = await getSceneAccess(c, sceneId);
  if (!access) return c.json({ error: 'Not found' }, 404);
  return access.director_id === user.id ? null : c.json({ error: 'Forbidden' }, 403);
}
