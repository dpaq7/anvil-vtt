import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureMcdmDemoCampaignForUser } from '../lib/demo-campaigns.js';

export const gameSessionRoutes = new Hono<AppEnv>();

gameSessionRoutes.use('/*', authMiddleware);

interface CampaignRow {
  id: string;
  name: string;
  description: string;
  cover_image_url: string | null;
  director_id: string;
  created_at: string;
  updated_at: string;
  member_role: string;
}

interface DirectorRow {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface MemberRow {
  campaign_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  hero_id: string | null;
  role: string;
  hero_name: string | null;
  hero_class: string | null;
  hero_level: number | null;
}

interface SessionRow {
  id: string;
  campaign_id: string;
  module_id: string | null;
  name: string;
  description: string;
  status: string;
  room_code: string | null;
  order_index: number;
  started_at: string | null;
  ended_at: string | null;
}

interface ModuleRow {
  id: string;
  campaign_id: string;
  name: string;
  description: string;
  order_index: number;
}

interface SceneRow {
  id: string;
  game_session_id: string;
  title: string;
  type: string;
  order_index: number;
}

/**
 * GET /api/game-sessions
 *
 * Returns all campaigns the authenticated user belongs to, enriched with
 * members, sessions, modules, and scenes. Used by the "Live" page for both
 * Director and Player roles.
 */
gameSessionRoutes.get('/game-sessions', async (c) => {
  const user = c.get('user') as AuthUser;

  if (user.role === 'director') {
    await ensureMcdmDemoCampaignForUser(c.env.DB, user.id);
  }

  // 1. Get the campaigns for the active app role. The local dev player can
  // have stale director memberships from earlier iterations, so keep this
  // endpoint aligned with the selected flow instead of every membership row.
  const roleFilter = user.role === 'player' ? " AND cm.role = 'player'" : '';
  const campaignResults = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.description, c.cover_image_url, c.director_id,
            c.created_at, c.updated_at, cm.role as member_role
     FROM campaign_members cm
     JOIN campaigns c ON cm.campaign_id = c.id
     WHERE cm.user_id = ? AND c.deleted_at IS NULL
       ${roleFilter}
     ORDER BY c.updated_at DESC`,
  )
    .bind(user.id)
    .all<CampaignRow>();

  const campaigns = campaignResults.results;
  if (campaigns.length === 0) {
    return c.json({ campaigns: [] });
  }

  const campaignIds = campaigns.map((c) => c.id);
  const placeholders = campaignIds.map(() => '?').join(',');

  // 2. Get directors for all campaigns
  const directorIds = [...new Set(campaigns.map((c) => c.director_id))];
  const dirPlaceholders = directorIds.map(() => '?').join(',');
  const directorResults = await c.env.DB.prepare(
    `SELECT id, username, avatar_url FROM users WHERE id IN (${dirPlaceholders})`,
  )
    .bind(...directorIds)
    .all<DirectorRow>();
  const directorsMap = new Map(directorResults.results.map((d) => [d.id, d]));

  // 3. Get all members for those campaigns (with hero info)
  const memberResults = await c.env.DB.prepare(
    `SELECT cm.campaign_id, cm.user_id, u.username, u.avatar_url,
            cm.hero_id, cm.role,
            h.name as hero_name, h.hero_class, h.level as hero_level
     FROM campaign_members cm
     JOIN users u ON cm.user_id = u.id
     LEFT JOIN heroes h ON cm.hero_id = h.id
     WHERE cm.campaign_id IN (${placeholders})`,
  )
    .bind(...campaignIds)
    .all<MemberRow>();

  // 4. Get all sessions for those campaigns
  const sessionResults = await c.env.DB.prepare(
    `SELECT id, campaign_id, module_id, name, description, status,
            room_code, order_index, started_at, ended_at
     FROM game_sessions
     WHERE campaign_id IN (${placeholders})
     ORDER BY order_index`,
  )
    .bind(...campaignIds)
    .all<SessionRow>();

  // 5. Get all modules for those campaigns
  const moduleResults = await c.env.DB.prepare(
    `SELECT id, campaign_id, name, description, order_index
     FROM modules
     WHERE campaign_id IN (${placeholders})
     ORDER BY order_index`,
  )
    .bind(...campaignIds)
    .all<ModuleRow>();

  // 6. Get scenes for all sessions (director needs them for the scene picker)
  const sessionIds = sessionResults.results.map((s) => s.id);
  const scenesMap = new Map<string, SceneRow[]>();
  if (sessionIds.length > 0) {
    const scenePlaceholders = sessionIds.map(() => '?').join(',');
    const sceneResults = await c.env.DB.prepare(
      `SELECT id, game_session_id, title, type, order_index
       FROM scenes
       WHERE game_session_id IN (${scenePlaceholders}) AND deleted_at IS NULL
       ORDER BY order_index`,
    )
      .bind(...sessionIds)
      .all<SceneRow>();
    for (const scene of sceneResults.results) {
      const existing = scenesMap.get(scene.game_session_id) ?? [];
      existing.push(scene);
      scenesMap.set(scene.game_session_id, existing);
    }
  }

  // 7. Assemble per-campaign response
  const result = campaigns.map((campaign) => {
    const isDirector = campaign.member_role === 'director';
    const director = directorsMap.get(campaign.director_id);

    const members = memberResults.results
      .filter((m) => m.campaign_id === campaign.id)
      .map((m) => ({
        user_id: m.user_id,
        username: m.username,
        avatar_url: m.avatar_url,
        hero_id: m.hero_id,
        hero_name: m.hero_name,
        hero_class: m.hero_class,
        hero_level: m.hero_level,
        role: m.role,
      }));

    const sessions = sessionResults.results
      .filter((s) => s.campaign_id === campaign.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        module_id: s.module_id,
        status: s.status,
        room_code: s.room_code,
        started_at: s.started_at,
        ended_at: s.ended_at,
        order_index: s.order_index,
      }));

    const modules = moduleResults.results
      .filter((m) => m.campaign_id === campaign.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        order_index: m.order_index,
      }));

    // Scenes: flatten all scenes for sessions in this campaign
    const scenes = isDirector
      ? sessions.flatMap((s) =>
          (scenesMap.get(s.id) ?? []).map((sc) => ({
            id: sc.id,
            title: sc.title,
            type: sc.type,
            game_session_id: sc.game_session_id,
            order_index: sc.order_index,
          })),
        )
      : [];

    // Player's own hero for this campaign
    const myMembership = members.find((m) => m.user_id === user.id);
    const myHero =
      !isDirector && myMembership?.hero_id
        ? {
            id: myMembership.hero_id,
            name: myMembership.hero_name,
            heroClass: myMembership.hero_class,
            level: myMembership.hero_level,
          }
        : null;

    // Last played: most recent started_at among non-draft sessions
    const playedDates = sessions
      .filter((s) => s.started_at)
      .map((s) => s.started_at!)
      .sort()
      .reverse();
    const lastPlayed = playedDates[0] ?? null;

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      cover_image_url: campaign.cover_image_url,
      role: campaign.member_role,
      director: director
        ? { id: director.id, username: director.username, avatar_url: director.avatar_url }
        : null,
      members,
      modules,
      sessions,
      scenes,
      my_hero: myHero,
      last_played: lastPlayed,
    };
  });

  return c.json({ campaigns: result });
});
