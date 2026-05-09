import type {
  SceneImportDocument,
  SceneImportModule,
  SceneImportResult,
  SceneImportScene,
  SceneImportSession,
} from '@anvil/types';

export interface ImportIds {
  moduleIds: string[];
  sessionIds: string[];
  sceneIds: string[];
}

function ordered<T extends { orderIndex?: number }>(items: T[] | undefined): T[] {
  return (items ?? [])
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.orderIndex ?? a.index) - (b.item.orderIndex ?? b.index))
    .map(({ item }) => item);
}

async function nextOrder(db: D1Database, table: 'modules' | 'game_sessions', whereColumn: string, whereValue: string): Promise<number> {
  const row = await db.prepare(
    `SELECT MAX(order_index) as max_idx FROM ${table} WHERE ${whereColumn} = ?`,
  )
    .bind(whereValue)
    .first<{ max_idx: number | null }>();
  return (row?.max_idx ?? -1) + 1;
}

async function insertImportedScene(db: D1Database, sessionId: string, scene: SceneImportScene, orderIndex: number): Promise<string> {
  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO scenes (id, game_session_id, title, type, data, order_index) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, sessionId, scene.title.trim(), scene.type, JSON.stringify(scene.data ?? {}), orderIndex)
    .run();
  return id;
}

async function insertImportedSession(
  db: D1Database,
  campaignId: string,
  moduleId: string | null,
  session: SceneImportSession,
  orderIndex: number,
  ids: ImportIds,
): Promise<void> {
  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO game_sessions (id, campaign_id, module_id, name, description, order_index) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, moduleId, session.name.trim(), session.description?.trim() ?? '', orderIndex)
    .run();
  ids.sessionIds.push(id);

  for (const [index, scene] of ordered(session.scenes).entries()) {
    ids.sceneIds.push(await insertImportedScene(db, id, scene, index));
  }
}

async function insertImportedModule(
  db: D1Database,
  campaignId: string,
  module: SceneImportModule,
  moduleOrderIndex: number,
  sessionOrderStart: number,
  ids: ImportIds,
): Promise<number> {
  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO modules (id, campaign_id, name, description, order_index) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, campaignId, module.name.trim(), module.description?.trim() ?? '', moduleOrderIndex)
    .run();
  ids.moduleIds.push(id);

  let nextSessionOrder = sessionOrderStart;
  for (const session of ordered(module.sessions)) {
    await insertImportedSession(db, campaignId, id, session, nextSessionOrder, ids);
    nextSessionOrder += 1;
  }
  return nextSessionOrder;
}

export async function importIntoCampaign(db: D1Database, campaignId: string, document: SceneImportDocument): Promise<ImportIds> {
  const ids: ImportIds = { moduleIds: [], sessionIds: [], sceneIds: [] };
  let moduleOrder = await nextOrder(db, 'modules', 'campaign_id', campaignId);
  let sessionOrder = await nextOrder(db, 'game_sessions', 'campaign_id', campaignId);

  for (const module of ordered(document.modules)) {
    sessionOrder = await insertImportedModule(db, campaignId, module, moduleOrder, sessionOrder, ids);
    moduleOrder += 1;
  }

  for (const session of ordered(document.sessions)) {
    await insertImportedSession(db, campaignId, null, session, sessionOrder, ids);
    sessionOrder += 1;
  }

  return ids;
}

export async function createImportedCampaign(
  db: D1Database,
  directorId: string,
  document: SceneImportDocument,
  campaignId = crypto.randomUUID(),
): Promise<SceneImportResult> {
  await db.prepare(
    'INSERT INTO campaigns (id, director_id, name, description, settings) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(
      campaignId,
      directorId,
      document.campaign.name.trim(),
      document.campaign.description?.trim() ?? '',
      JSON.stringify(document.campaign.settings ?? {}),
    )
    .run();

  await db.prepare(
    'INSERT INTO campaign_members (campaign_id, user_id, role) VALUES (?, ?, ?)',
  )
    .bind(campaignId, directorId, 'director')
    .run();

  const ids = await importIntoCampaign(db, campaignId, document);
  return sceneImportResult(campaignId, ids);
}

export function sceneImportResult(campaignId: string, ids: ImportIds): SceneImportResult {
  return {
    campaignId,
    moduleIds: ids.moduleIds,
    sessionIds: ids.sessionIds,
    sceneIds: ids.sceneIds,
    imported: {
      modules: ids.moduleIds.length,
      sessions: ids.sessionIds.length,
      scenes: ids.sceneIds.length,
    },
  };
}
