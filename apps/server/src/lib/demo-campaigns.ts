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
    return existing.id;
  }

  const result = await createImportedCampaign(db, userId, seededDocument(), campaignId);
  return result.campaignId;
}
