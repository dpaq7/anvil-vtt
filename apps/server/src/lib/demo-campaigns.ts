import { MCDM_DRAW_STEEL_DEMO_CAMPAIGN } from '@anvil/data';
import type { SceneImportDocument } from '@anvil/types';
import { createImportedCampaign } from './scene-import.js';

const DEMO_CAMPAIGN_NAME = MCDM_DRAW_STEEL_DEMO_CAMPAIGN.campaign.name;
const DEMO_CAMPAIGN_SOURCE = 'docs/MCDM Draw Steel Scenes';
const DEMO_CAMPAIGN_SEED = 'mcdm-draw-steel-demo-scenes';

interface CampaignSeedRow {
  id: string;
  deleted_at: string | null;
}

interface DemoSceneRow {
  id: string;
  title: string;
  data: string | null;
}

async function demoCampaignId(userId: string): Promise<string> {
  const encoded = new TextEncoder().encode(`${DEMO_CAMPAIGN_SEED}:${userId}`);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `demo_mcdm_${hex}`;
}

function seededDocument(): SceneImportDocument {
  return {
    ...MCDM_DRAW_STEEL_DEMO_CAMPAIGN,
    campaign: {
      ...MCDM_DRAW_STEEL_DEMO_CAMPAIGN.campaign,
      settings: {
        ...MCDM_DRAW_STEEL_DEMO_CAMPAIGN.campaign.settings,
        seed: DEMO_CAMPAIGN_SEED,
        seedVersion: 1,
      },
    },
  };
}

function demoBattleMapUrls(): Map<string, string> {
  const urls = new Map<string, string>();
  for (const module of MCDM_DRAW_STEEL_DEMO_CAMPAIGN.modules ?? []) {
    for (const session of module.sessions ?? []) {
      for (const scene of session.scenes ?? []) {
        if (scene.type !== 'battle' || !scene.data || typeof scene.data !== 'object') continue;
        const mapUrl = (scene.data as Record<string, unknown>)['mapUrl'];
        if (typeof mapUrl === 'string' && mapUrl.trim()) {
          urls.set(scene.title.trim(), mapUrl);
        }
      }
    }
  }
  return urls;
}

async function repairDemoBattleMapUrls(db: D1Database, campaignId: string): Promise<void> {
  const mapUrls = demoBattleMapUrls();
  if (mapUrls.size === 0) return;

  const rows = await db.prepare(
    `SELECT s.id, s.title, s.data
     FROM scenes s
     JOIN game_sessions gs ON gs.id = s.game_session_id
     WHERE gs.campaign_id = ?
       AND s.deleted_at IS NULL
       AND s.type = 'battle'`,
  )
    .bind(campaignId)
    .all<DemoSceneRow>();

  const updates: D1PreparedStatement[] = [];
  for (const row of rows.results) {
    const mapUrl = mapUrls.get(row.title.trim());
    if (!mapUrl) continue;

    let data: Record<string, unknown> = {};
    if (row.data) {
      try {
        const parsed = JSON.parse(row.data) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          data = parsed as Record<string, unknown>;
        }
      } catch { /* ignore malformed scene data */ }
    }

    if (typeof data['mapUrl'] === 'string' && data['mapUrl'].trim()) continue;
    updates.push(
      db.prepare('UPDATE scenes SET data = ? WHERE id = ?')
        .bind(JSON.stringify({ ...data, mapUrl }), row.id),
    );
  }

  if (updates.length > 0) await db.batch(updates);
}

export async function ensureMcdmDemoCampaignForUser(db: D1Database, userId: string): Promise<string | null> {
  const campaignId = await demoCampaignId(userId);
  const existing = await db.prepare(
    `SELECT id, deleted_at
     FROM campaigns
     WHERE director_id = ?
       AND name = ?
       AND (
         id = ?
         OR settings LIKE ?
         OR settings LIKE ?
       )
     ORDER BY deleted_at IS NULL DESC, updated_at DESC
     LIMIT 1`,
  )
    .bind(
      userId,
      DEMO_CAMPAIGN_NAME,
      campaignId,
      `%${DEMO_CAMPAIGN_SEED}%`,
      `%${DEMO_CAMPAIGN_SOURCE}%`,
    )
    .first<CampaignSeedRow>();

  if (existing) {
    if (existing.deleted_at) return null;

    await db.prepare(
      'INSERT OR IGNORE INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)',
    )
      .bind(existing.id, userId, 'director')
      .run();
    await repairDemoBattleMapUrls(db, existing.id);
    return existing.id;
  }

  const result = await createImportedCampaign(db, userId, seededDocument(), campaignId);
  return result.campaignId;
}
