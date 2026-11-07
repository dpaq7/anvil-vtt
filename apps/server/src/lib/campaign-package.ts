import type {
  CampaignPackageAsset,
  CampaignPackageImportResult,
  CampaignPackageManifest,
  SceneImportDocument,
} from '@anvil/types';
import { CAMPAIGN_ASSET_SCHEME } from '@anvil/types';
import { createImportedCampaign } from './scene-import.js';

/** An expected import failure whose message is safe to show the client. */
export class CampaignPackageImportError extends Error {
  override name = 'CampaignPackageImportError';
}

interface UploadedAssetRow {
  id: string;
  type: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_at: string | null;
}

function replaceAssetRefs(value: unknown, uploaded: Record<string, string>): unknown {
  if (typeof value === 'string' && value.startsWith(CAMPAIGN_ASSET_SCHEME)) {
    const ref = value.slice(CAMPAIGN_ASSET_SCHEME.length);
    const assetId = uploaded[ref];
    if (!assetId) throw new CampaignPackageImportError(`Unresolved campaign asset reference: ${ref}`);
    return `/api/assets/${assetId}/data`;
  }
  if (Array.isArray(value)) return value.map((item) => replaceAssetRefs(item, uploaded));
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceAssetRefs(item, uploaded)]));
  }
  return value;
}

async function validateUploadedAssets(
  db: D1Database,
  userId: string,
  assets: CampaignPackageAsset[],
  uploaded: Record<string, string>,
): Promise<void> {
  for (const descriptor of assets) {
    const row = await db.prepare(
      'SELECT id, type, content_type, file_size, uploaded_at FROM assets WHERE id = ? AND user_id = ?',
    ).bind(uploaded[descriptor.ref], userId).first<UploadedAssetRow>();
    if (!row || !row.uploaded_at) throw new CampaignPackageImportError(`Asset ${descriptor.ref} was not uploaded by this account`);
    if (row.type !== descriptor.type || row.content_type !== descriptor.contentType || row.file_size !== descriptor.size) {
      throw new CampaignPackageImportError(`Uploaded asset metadata does not match manifest: ${descriptor.ref}`);
    }
  }
}

async function registerAssets(
  db: D1Database,
  campaignId: string,
  manifest: CampaignPackageManifest,
  uploaded: Record<string, string>,
): Promise<Omit<CampaignPackageImportResult['imported'], 'modules' | 'sessions' | 'scenes' | 'assets'>> {
  const counts = { maps: 0, terrain: 0, npcs: 0, audio: 0, monsterPortraits: 0 };
  for (const asset of manifest.assets) {
    const assetId = uploaded[asset.ref];
    for (const registration of asset.registrations ?? []) {
      const id = crypto.randomUUID();
      if (registration.kind === 'map') {
        await db.prepare(`INSERT INTO maps (id, campaign_id, name, asset_id, scene_type, grid_type, size, width, height)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          id, campaignId, registration.name ?? asset.name, assetId, registration.sceneType ?? null,
          registration.gridType ?? 'gridded', registration.size ?? 'medium', registration.width ?? null, registration.height ?? null,
        ).run();
        const joins: D1PreparedStatement[] = [];
        for (const item of registration.terrains ?? []) joins.push(db.prepare('INSERT INTO map_terrains (map_id, terrain) VALUES (?, ?)').bind(id, item));
        for (const item of registration.biomes ?? []) joins.push(db.prepare('INSERT INTO map_biomes (map_id, biome) VALUES (?, ?)').bind(id, item));
        for (const item of registration.tags ?? []) joins.push(db.prepare('INSERT INTO map_tags (map_id, tag) VALUES (?, ?)').bind(id, item));
        if (joins.length) await db.batch(joins);
        counts.maps += 1;
      } else if (registration.kind === 'terrain') {
        await db.prepare(`INSERT INTO custom_terrain (id, campaign_id, name, asset_id, category, grid_width, grid_height, material)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
          id, campaignId, registration.name ?? asset.name, assetId, registration.category,
          registration.gridWidth ?? 1, registration.gridHeight ?? 1, registration.material ?? null,
        ).run();
        counts.terrain += 1;
      } else if (registration.kind === 'npc') {
        await db.prepare('INSERT INTO npcs (id, campaign_id, name, portrait_asset_id, location, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(id, campaignId, registration.name, assetId, registration.location ?? null, registration.notes ?? null).run();
        counts.npcs += 1;
      } else if (registration.kind === 'audio') {
        await db.prepare(`INSERT INTO audio_assets (id, campaign_id, name, asset_id, duration_seconds, audio_type, mood)
          VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(
          id, campaignId, registration.name ?? asset.name, assetId, registration.durationSeconds ?? null,
          registration.audioType ?? null, registration.mood ?? null,
        ).run();
        const joins: D1PreparedStatement[] = [];
        for (const item of registration.sceneTypes ?? []) joins.push(db.prepare('INSERT INTO audio_scene_types (audio_id, scene_type) VALUES (?, ?)').bind(id, item));
        for (const item of registration.tags ?? []) joins.push(db.prepare('INSERT INTO audio_tags (audio_id, tag) VALUES (?, ?)').bind(id, item));
        if (joins.length) await db.batch(joins);
        counts.audio += 1;
      } else {
        await db.prepare('INSERT INTO monster_portraits (id, campaign_id, monster_name, asset_id) VALUES (?, ?, ?, ?)')
          .bind(id, campaignId, registration.monsterName, assetId).run();
        counts.monsterPortraits += 1;
      }
    }
  }
  for (const terrain of manifest.content?.terrain ?? []) {
    const assetId = terrain.assetRef ? uploaded[terrain.assetRef] : null;
    if (terrain.assetRef && !assetId) throw new CampaignPackageImportError(`Unresolved terrain asset reference: ${terrain.assetRef}`);
    await db.prepare(`INSERT INTO custom_terrain (id, campaign_id, name, asset_id, category, grid_width, grid_height, material)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(
      crypto.randomUUID(), campaignId, terrain.name, assetId, terrain.category,
      terrain.gridWidth ?? 1, terrain.gridHeight ?? 1, terrain.material ?? null,
    ).run();
    counts.terrain += 1;
  }
  for (const npc of manifest.content?.npcs ?? []) {
    const portraitId = npc.portraitRef ? uploaded[npc.portraitRef] : null;
    if (npc.portraitRef && !portraitId) throw new CampaignPackageImportError(`Unresolved NPC portrait reference: ${npc.portraitRef}`);
    await db.prepare('INSERT INTO npcs (id, campaign_id, name, portrait_asset_id, location, notes) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), campaignId, npc.name, portraitId, npc.location ?? null, npc.notes ?? null).run();
    counts.npcs += 1;
  }
  return counts;
}

export async function importCampaignPackage(
  db: D1Database,
  userId: string,
  manifest: CampaignPackageManifest,
  uploaded: Record<string, string>,
): Promise<CampaignPackageImportResult> {
  await validateUploadedAssets(db, userId, manifest.assets, uploaded);
  const document = replaceAssetRefs(manifest.document, uploaded) as SceneImportDocument;
  if (manifest.content) {
    document.campaign.settings = { ...(document.campaign.settings ?? {}), campaignPackageContent: manifest.content };
  }
  const campaignId = crypto.randomUUID();
  try {
    const sceneResult = await createImportedCampaign(db, userId, document, campaignId);
    const registrations = await registerAssets(db, campaignId, manifest, uploaded);
    return {
      ...sceneResult,
      imported: { ...sceneResult.imported, assets: manifest.assets.length, ...registrations },
    };
  } catch (error) {
    // D1 does not expose an interactive transaction here. Compensate in FK-safe
    // order so a failed registration cannot leave a partial campaign behind.
    await db.batch([
      db.prepare('DELETE FROM scenes WHERE game_session_id IN (SELECT id FROM game_sessions WHERE campaign_id = ?)').bind(campaignId),
      db.prepare('DELETE FROM game_sessions WHERE campaign_id = ?').bind(campaignId),
      db.prepare('DELETE FROM modules WHERE campaign_id = ?').bind(campaignId),
      db.prepare('DELETE FROM campaign_members WHERE campaign_id = ?').bind(campaignId),
      db.prepare('DELETE FROM campaigns WHERE id = ?').bind(campaignId),
    ]).catch(() => undefined);
    throw error;
  }
}
