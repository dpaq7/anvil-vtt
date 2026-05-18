import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware, clearSessionCookie } from '../middleware/auth.js';
import {
  extensionForContentType,
  isAllowedAssetContentType,
  isAllowedAssetType,
  MAX_ASSET_FILE_SIZE,
} from '../lib/assets.js';

export const accountRoutes = new Hono<AppEnv>();

accountRoutes.use('/*', authMiddleware);

const BACKUP_FORMAT = 'anvil.account-backup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_SIZE = 100 * 1024 * 1024;

type DbValue = string | number | null;
type DbRow = Record<string, DbValue>;

const TABLE_COLUMNS = {
  assets: ['id', 'user_id', 'name', 'type', 'storage_key', 'thumbnail_key', 'width', 'height', 'tags', 'created_at', 'content_type', 'file_size', 'uploaded_at'],
  heroes: ['id', 'user_id', 'name', 'ancestry', 'culture', 'career', 'hero_class', 'subclass', 'level', 'characteristics', 'kit', 'skills', 'abilities', 'portrait_asset_id', 'portrait_url', 'data', 'version', 'created_at', 'updated_at', 'deleted_at'],
  campaigns: ['id', 'director_id', 'name', 'description', 'cover_image_url', 'settings', 'created_at', 'updated_at', 'deleted_at'],
  modules: ['id', 'campaign_id', 'name', 'description', 'order_index'],
  game_sessions: ['id', 'campaign_id', 'module_id', 'name', 'description', 'status', 'order_index', 'room_code', 'started_at', 'ended_at', 'active_scene_id'],
  scenes: ['id', 'game_session_id', 'title', 'type', 'data', 'order_index', 'deleted_at', 'snapshot'],
  campaign_members: ['campaign_id', 'user_id', 'hero_id', 'role', 'joined_at'],
  session_participants: ['game_session_id', 'user_id', 'hero_id', 'status', 'joined_at', 'ready_at'],
  maps: ['id', 'campaign_id', 'name', 'asset_id', 'scene_type', 'grid_type', 'size', 'width', 'height', 'created_at', 'updated_at'],
  map_terrains: ['map_id', 'terrain'],
  map_biomes: ['map_id', 'biome'],
  map_tags: ['map_id', 'tag'],
  npcs: ['id', 'campaign_id', 'name', 'portrait_asset_id', 'location', 'notes', 'created_at', 'updated_at'],
  scene_monsters: ['id', 'scene_id', 'monster_name', 'quantity', 'created_at'],
  custom_terrain: ['id', 'campaign_id', 'name', 'asset_id', 'category', 'grid_width', 'grid_height', 'material', 'created_at'],
  audio_assets: ['id', 'campaign_id', 'name', 'asset_id', 'duration_seconds', 'audio_type', 'mood', 'created_at'],
  audio_scene_types: ['audio_id', 'scene_type'],
  audio_tags: ['audio_id', 'tag'],
  activity_cards: ['id', 'campaign_id', 'activity_name', 'activity_type', 'activity_data', 'points_spent', 'points_total', 'notes', 'is_active', 'created_at', 'updated_at'],
  montage_tests: ['id', 'scene_id', 'test_name', 'test_data', 'successes', 'failures', 'target_successes', 'max_failures', 'status', 'created_at'],
  monster_portraits: ['id', 'campaign_id', 'monster_name', 'asset_id', 'created_at', 'updated_at'],
  note_folders: ['id', 'campaign_id', 'user_id', 'parent_folder_id', 'name', 'is_auto_generated', 'sort_order', 'created_at', 'updated_at'],
  notes: ['id', 'campaign_id', 'user_id', 'folder_id', 'title', 'content', 'sort_order', 'created_at', 'updated_at'],
} as const;

type BackupTableName = keyof typeof TABLE_COLUMNS;
type BackupTables = Partial<Record<BackupTableName, DbRow[]>>;

interface BackupFile {
  assetId: string;
  storageKey: string;
  contentType: string;
  size: number;
  dataBase64: string;
}

interface AccountBackupArchive {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  account: {
    id: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
  tables: BackupTables;
  files: BackupFile[];
  counts: Record<string, number>;
}

class RestoreValidationError extends Error {}

const RESTORE_ORDER: BackupTableName[] = [
  'assets',
  'heroes',
  'campaigns',
  'modules',
  'game_sessions',
  'scenes',
  'campaign_members',
  'session_participants',
  'maps',
  'map_terrains',
  'map_biomes',
  'map_tags',
  'npcs',
  'scene_monsters',
  'custom_terrain',
  'audio_assets',
  'audio_scene_types',
  'audio_tags',
  'activity_cards',
  'montage_tests',
  'monster_portraits',
  'note_folders',
  'notes',
];

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'anvil';
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

async function allRows(db: D1Database, sql: string, binds: DbValue[] = []): Promise<DbRow[]> {
  const result = await db.prepare(sql).bind(...binds).all<DbRow>();
  return result.results;
}

async function rowsWhereIn(db: D1Database, table: BackupTableName, column: string, ids: string[]): Promise<DbRow[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  return allRows(db, `SELECT * FROM ${table} WHERE ${column} IN (${placeholders})`, ids);
}

async function deleteWhereIn(db: D1Database, table: string, column: string, ids: string[]) {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(', ');
  await db.prepare(`DELETE FROM ${table} WHERE ${column} IN (${placeholders})`).bind(...ids).run();
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.length > 0)));
}

function stringIds(rows: DbRow[], column: string): string[] {
  return rows
    .map((row) => row[column])
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToArrayBuffer(value: string): ArrayBuffer {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function storageKeyFor(userId: string, assetId: string, contentType: string) {
  return `${userId}/${assetId}.${extensionForContentType(contentType)}`;
}

function tableCounts(tables: BackupTables) {
  return Object.fromEntries(
    (Object.keys(TABLE_COLUMNS) as BackupTableName[]).map((table) => [table, tables[table]?.length ?? 0]),
  );
}

async function buildArchive(c: Context<AppEnv>, user: AuthUser): Promise<AccountBackupArchive> {
  const db = c.env.DB;
  const tables: BackupTables = {};

  tables.assets = await allRows(db, 'SELECT * FROM assets WHERE user_id = ? ORDER BY created_at', [user.id]);
  tables.heroes = await allRows(db, 'SELECT * FROM heroes WHERE user_id = ? ORDER BY updated_at', [user.id]);
  tables.campaigns = await allRows(db, 'SELECT * FROM campaigns WHERE director_id = ? ORDER BY updated_at', [user.id]);

  const campaignIds = stringIds(tables.campaigns, 'id');
  tables.modules = await rowsWhereIn(db, 'modules', 'campaign_id', campaignIds);
  tables.game_sessions = await rowsWhereIn(db, 'game_sessions', 'campaign_id', campaignIds);
  tables.campaign_members = (await rowsWhereIn(db, 'campaign_members', 'campaign_id', campaignIds))
    .filter((row) => row['user_id'] === user.id);
  tables.maps = await rowsWhereIn(db, 'maps', 'campaign_id', campaignIds);
  tables.npcs = await rowsWhereIn(db, 'npcs', 'campaign_id', campaignIds);
  tables.custom_terrain = await rowsWhereIn(db, 'custom_terrain', 'campaign_id', campaignIds);
  tables.audio_assets = await rowsWhereIn(db, 'audio_assets', 'campaign_id', campaignIds);
  tables.activity_cards = await rowsWhereIn(db, 'activity_cards', 'campaign_id', campaignIds);
  tables.monster_portraits = await rowsWhereIn(db, 'monster_portraits', 'campaign_id', campaignIds);
  tables.note_folders = (await rowsWhereIn(db, 'note_folders', 'campaign_id', campaignIds))
    .filter((row) => row['user_id'] === user.id);
  tables.notes = (await rowsWhereIn(db, 'notes', 'campaign_id', campaignIds))
    .filter((row) => row['user_id'] === user.id);

  const sessionIds = stringIds(tables.game_sessions, 'id');
  tables.scenes = await rowsWhereIn(db, 'scenes', 'game_session_id', sessionIds);
  tables.session_participants = (await rowsWhereIn(db, 'session_participants', 'game_session_id', sessionIds))
    .filter((row) => row['user_id'] === user.id);

  const mapIds = stringIds(tables.maps, 'id');
  tables.map_terrains = await rowsWhereIn(db, 'map_terrains', 'map_id', mapIds);
  tables.map_biomes = await rowsWhereIn(db, 'map_biomes', 'map_id', mapIds);
  tables.map_tags = await rowsWhereIn(db, 'map_tags', 'map_id', mapIds);

  const sceneIds = stringIds(tables.scenes, 'id');
  tables.scene_monsters = await rowsWhereIn(db, 'scene_monsters', 'scene_id', sceneIds);
  tables.montage_tests = await rowsWhereIn(db, 'montage_tests', 'scene_id', sceneIds);

  const audioIds = stringIds(tables.audio_assets, 'id');
  tables.audio_scene_types = await rowsWhereIn(db, 'audio_scene_types', 'audio_id', audioIds);
  tables.audio_tags = await rowsWhereIn(db, 'audio_tags', 'audio_id', audioIds);

  const files: BackupFile[] = [];
  for (const asset of tables.assets ?? []) {
    const storageKey = asset['storage_key'];
    const assetId = asset['id'];
    if (typeof storageKey !== 'string' || typeof assetId !== 'string') continue;
    const object = await c.env.ASSETS.get(storageKey);
    if (!object) continue;
    const buffer = await object.arrayBuffer();
    files.push({
      assetId,
      storageKey,
      contentType: object.httpMetadata?.contentType ?? (typeof asset['content_type'] === 'string' ? asset['content_type'] : 'application/octet-stream'),
      size: buffer.byteLength,
      dataBase64: arrayBufferToBase64(buffer),
    });
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    tables,
    files,
    counts: { ...tableCounts(tables), files: files.length },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRow(value: unknown): DbRow | null {
  if (!isRecord(value)) return null;
  const row: DbRow = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string' || typeof raw === 'number' || raw === null) row[key] = raw;
  }
  return row;
}

function parseArchive(raw: unknown): AccountBackupArchive | null {
  if (!isRecord(raw) || raw['format'] !== BACKUP_FORMAT || raw['version'] !== BACKUP_VERSION) return null;
  if (!isRecord(raw['account']) || !isRecord(raw['tables']) || !Array.isArray(raw['files'])) return null;

  const account = raw['account'];
  if (typeof account['id'] !== 'string') return null;

  const tables: BackupTables = {};
  for (const table of Object.keys(TABLE_COLUMNS) as BackupTableName[]) {
    const rows = raw['tables'][table];
    if (rows === undefined) continue;
    if (!Array.isArray(rows)) return null;
    tables[table] = rows.map(normalizeRow).filter((row): row is DbRow => row !== null);
  }

  const files = raw['files']
    .filter(isRecord)
    .filter((file) => typeof file['assetId'] === 'string' && typeof file['dataBase64'] === 'string')
    .map((file) => ({
      assetId: file['assetId'] as string,
      storageKey: typeof file['storageKey'] === 'string' ? file['storageKey'] : '',
      contentType: typeof file['contentType'] === 'string' ? file['contentType'] : 'application/octet-stream',
      size: typeof file['size'] === 'number' ? file['size'] : 0,
      dataBase64: file['dataBase64'] as string,
    }));

  return {
    format: BACKUP_FORMAT,
    version: raw['version'],
    exportedAt: typeof raw['exportedAt'] === 'string' ? raw['exportedAt'] : '',
    account: {
      id: account['id'],
      username: typeof account['username'] === 'string' ? account['username'] : 'Imported Account',
      avatarUrl: typeof account['avatarUrl'] === 'string' ? account['avatarUrl'] : null,
      role: typeof account['role'] === 'string' ? account['role'] : 'director',
    },
    tables,
    files,
    counts: {},
  };
}

function pickRow(table: BackupTableName, row: DbRow, overrides: DbRow = {}): DbRow {
  const picked: DbRow = {};
  for (const column of TABLE_COLUMNS[table]) {
    const value = overrides[column] !== undefined ? overrides[column] : row[column];
    if (value !== undefined) picked[column] = value;
  }
  return picked;
}

function sourceId(row: DbRow): string | null {
  return typeof row['id'] === 'string' && row['id'].length > 0 ? row['id'] : null;
}

function rowsWithSourceIds(rows: DbRow[]): DbRow[] {
  const seen = new Set<string>();
  const unique: DbRow[] = [];
  for (const row of rows) {
    const id = sourceId(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(row);
  }
  return unique;
}

function createIdMap(rows: DbRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const id = sourceId(row);
    if (id) map.set(id, crypto.randomUUID());
  }
  return map;
}

function mappedId(map: Map<string, string>, value: DbValue | undefined): string | null {
  return typeof value === 'string' ? map.get(value) ?? null : null;
}

async function insertRows(db: D1Database, table: BackupTableName, rows: DbRow[]) {
  for (const row of rows) {
    const columns = TABLE_COLUMNS[table].filter((column) => row[column] !== undefined);
    if (columns.length === 0) continue;
    const placeholders = columns.map(() => '?').join(', ');
    await db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`)
      .bind(...columns.map((column) => row[column] ?? null))
      .run();
  }
}

async function restoreArchive(c: Context<AppEnv>, archive: AccountBackupArchive, user: AuthUser) {
  const sourceUserId = archive.account.id;
  const rawTables = archive.tables;

  const sourceFiles = new Map<string, BackupFile>();
  for (const file of archive.files) {
    if (!sourceFiles.has(file.assetId)) sourceFiles.set(file.assetId, file);
  }

  const sourceAssets = rowsWithSourceIds(rawTables.assets ?? []);
  const sourceHeroes = rowsWithSourceIds(rawTables.heroes ?? []);
  const sourceCampaigns = rowsWithSourceIds(rawTables.campaigns ?? []);
  const sourceModules = rowsWithSourceIds(rawTables.modules ?? []);
  const sourceGameSessions = rowsWithSourceIds(rawTables.game_sessions ?? []);
  const sourceScenes = rowsWithSourceIds(rawTables.scenes ?? []);
  const sourceMaps = rowsWithSourceIds(rawTables.maps ?? []);
  const sourceNpcs = rowsWithSourceIds(rawTables.npcs ?? []);
  const sourceSceneMonsters = rowsWithSourceIds(rawTables.scene_monsters ?? []);
  const sourceCustomTerrain = rowsWithSourceIds(rawTables.custom_terrain ?? []);
  const sourceAudioAssets = rowsWithSourceIds(rawTables.audio_assets ?? []);
  const sourceActivityCards = rowsWithSourceIds(rawTables.activity_cards ?? []);
  const sourceMontageTests = rowsWithSourceIds(rawTables.montage_tests ?? []);
  const sourceMonsterPortraits = rowsWithSourceIds(rawTables.monster_portraits ?? []);
  const sourceNoteFolders = rowsWithSourceIds(rawTables.note_folders ?? []);
  const sourceNotes = rowsWithSourceIds(rawTables.notes ?? []);

  const assetIdMap = createIdMap(sourceAssets);
  const heroIdMap = createIdMap(sourceHeroes);
  const campaignIdMap = createIdMap(sourceCampaigns);
  const moduleIdMap = createIdMap(sourceModules);
  const sessionIdMap = createIdMap(sourceGameSessions);
  const sceneIdMap = createIdMap(sourceScenes);
  const mapIdMap = createIdMap(sourceMaps);
  const npcIdMap = createIdMap(sourceNpcs);
  const sceneMonsterIdMap = createIdMap(sourceSceneMonsters);
  const customTerrainIdMap = createIdMap(sourceCustomTerrain);
  const audioAssetIdMap = createIdMap(sourceAudioAssets);
  const activityCardIdMap = createIdMap(sourceActivityCards);
  const montageTestIdMap = createIdMap(sourceMontageTests);
  const monsterPortraitIdMap = createIdMap(sourceMonsterPortraits);
  const noteFolderIdMap = createIdMap(sourceNoteFolders);
  const noteIdMap = createIdMap(sourceNotes);

  const assetContentTypes = new Map<string, string>();
  const assets = sourceAssets.map((row) => {
    const oldId = sourceId(row)!;
    const newId = mappedId(assetIdMap, oldId)!;
    const assetType = typeof row['type'] === 'string' ? row['type'] : '';
    if (!isAllowedAssetType(assetType)) {
      throw new RestoreValidationError('Backup contains an invalid asset type');
    }

    const backupFile = sourceFiles.get(oldId);
    const contentType = typeof row['content_type'] === 'string' && row['content_type'].trim()
      ? row['content_type']
      : backupFile?.contentType ?? '';
    if (!isAllowedAssetContentType(assetType, contentType)) {
      throw new RestoreValidationError('Backup contains an asset with a disallowed content type');
    }
    assetContentTypes.set(oldId, contentType);

    const backupSize = typeof backupFile?.size === 'number' && Number.isFinite(backupFile.size)
      ? backupFile.size
      : null;
    const rowSize = typeof row['file_size'] === 'number' && Number.isFinite(row['file_size'])
      ? row['file_size']
      : null;

    return pickRow('assets', row, {
      id: newId,
      user_id: user.id,
      type: assetType,
      storage_key: storageKeyFor(user.id, newId, contentType),
      thumbnail_key: null,
      content_type: contentType,
      file_size: backupSize ?? rowSize,
    });
  });

  const heroes = sourceHeroes.map((row) => {
    const portraitAssetId = mappedId(assetIdMap, row['portrait_asset_id']);
    return pickRow('heroes', row, {
      id: mappedId(heroIdMap, row['id'])!,
      user_id: user.id,
      portrait_asset_id: portraitAssetId,
      portrait_url: portraitAssetId ? `/api/assets/${portraitAssetId}/data` : row['portrait_url'] ?? null,
    });
  });

  const campaigns = sourceCampaigns.map((row) => pickRow('campaigns', row, {
    id: mappedId(campaignIdMap, row['id'])!,
    director_id: user.id,
  }));

  const modules = sourceModules
    .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
    .map((row) => pickRow('modules', row, {
      id: mappedId(moduleIdMap, row['id'])!,
      campaign_id: mappedId(campaignIdMap, row['campaign_id']),
    }));

  const gameSessions = sourceGameSessions
    .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
    .map((row) => pickRow('game_sessions', row, {
      id: mappedId(sessionIdMap, row['id'])!,
      campaign_id: mappedId(campaignIdMap, row['campaign_id']),
      module_id: mappedId(moduleIdMap, row['module_id']),
      active_scene_id: mappedId(sceneIdMap, row['active_scene_id']),
    }));

  const scenes = sourceScenes
    .filter((row) => mappedId(sessionIdMap, row['game_session_id']))
    .map((row) => pickRow('scenes', row, {
      id: mappedId(sceneIdMap, row['id'])!,
      game_session_id: mappedId(sessionIdMap, row['game_session_id']),
    }));

  const maps = sourceMaps
    .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
    .map((row) => pickRow('maps', row, {
      id: mappedId(mapIdMap, row['id'])!,
      campaign_id: mappedId(campaignIdMap, row['campaign_id']),
      asset_id: mappedId(assetIdMap, row['asset_id']),
    }));

  const audioAssets = sourceAudioAssets
    .filter((row) => mappedId(campaignIdMap, row['campaign_id']) && mappedId(assetIdMap, row['asset_id']))
    .map((row) => pickRow('audio_assets', row, {
      id: mappedId(audioAssetIdMap, row['id'])!,
      campaign_id: mappedId(campaignIdMap, row['campaign_id']),
      asset_id: mappedId(assetIdMap, row['asset_id']),
    }));

  const noteFolders = sourceNoteFolders
    .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
    .map((row) => pickRow('note_folders', row, {
      id: mappedId(noteFolderIdMap, row['id'])!,
      campaign_id: mappedId(campaignIdMap, row['campaign_id']),
      user_id: user.id,
      parent_folder_id: mappedId(noteFolderIdMap, row['parent_folder_id']),
    }));
  const noteFolderIds = new Set(stringIds(noteFolders, 'id'));

  const restoredTables: BackupTables = {
    assets,
    heroes,
    campaigns,
    modules,
    game_sessions: gameSessions,
    scenes,
    campaign_members: (rawTables.campaign_members ?? [])
      .filter((row) => row['user_id'] === sourceUserId && mappedId(campaignIdMap, row['campaign_id']))
      .map((row) => pickRow('campaign_members', row, {
        campaign_id: mappedId(campaignIdMap, row['campaign_id']),
        user_id: user.id,
        hero_id: mappedId(heroIdMap, row['hero_id']),
        role: 'director',
      })),
    session_participants: (rawTables.session_participants ?? [])
      .filter((row) => row['user_id'] === sourceUserId && mappedId(sessionIdMap, row['game_session_id']))
      .map((row) => pickRow('session_participants', row, {
        game_session_id: mappedId(sessionIdMap, row['game_session_id']),
        user_id: user.id,
        hero_id: mappedId(heroIdMap, row['hero_id']),
      })),
    maps,
    map_terrains: (rawTables.map_terrains ?? [])
      .filter((row) => mappedId(mapIdMap, row['map_id']))
      .map((row) => pickRow('map_terrains', row, { map_id: mappedId(mapIdMap, row['map_id']) })),
    map_biomes: (rawTables.map_biomes ?? [])
      .filter((row) => mappedId(mapIdMap, row['map_id']))
      .map((row) => pickRow('map_biomes', row, { map_id: mappedId(mapIdMap, row['map_id']) })),
    map_tags: (rawTables.map_tags ?? [])
      .filter((row) => mappedId(mapIdMap, row['map_id']))
      .map((row) => pickRow('map_tags', row, { map_id: mappedId(mapIdMap, row['map_id']) })),
    npcs: sourceNpcs
      .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
      .map((row) => pickRow('npcs', row, {
        id: mappedId(npcIdMap, row['id'])!,
        campaign_id: mappedId(campaignIdMap, row['campaign_id']),
        portrait_asset_id: mappedId(assetIdMap, row['portrait_asset_id']),
      })),
    scene_monsters: sourceSceneMonsters
      .filter((row) => mappedId(sceneIdMap, row['scene_id']))
      .map((row) => pickRow('scene_monsters', row, {
        id: mappedId(sceneMonsterIdMap, row['id'])!,
        scene_id: mappedId(sceneIdMap, row['scene_id']),
      })),
    custom_terrain: sourceCustomTerrain
      .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
      .map((row) => pickRow('custom_terrain', row, {
        id: mappedId(customTerrainIdMap, row['id'])!,
        campaign_id: mappedId(campaignIdMap, row['campaign_id']),
        asset_id: mappedId(assetIdMap, row['asset_id']),
      })),
    audio_assets: audioAssets,
    audio_scene_types: (rawTables.audio_scene_types ?? [])
      .filter((row) => mappedId(audioAssetIdMap, row['audio_id']))
      .map((row) => pickRow('audio_scene_types', row, { audio_id: mappedId(audioAssetIdMap, row['audio_id']) })),
    audio_tags: (rawTables.audio_tags ?? [])
      .filter((row) => mappedId(audioAssetIdMap, row['audio_id']))
      .map((row) => pickRow('audio_tags', row, { audio_id: mappedId(audioAssetIdMap, row['audio_id']) })),
    activity_cards: sourceActivityCards
      .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
      .map((row) => pickRow('activity_cards', row, {
        id: mappedId(activityCardIdMap, row['id'])!,
        campaign_id: mappedId(campaignIdMap, row['campaign_id']),
      })),
    montage_tests: sourceMontageTests
      .filter((row) => mappedId(sceneIdMap, row['scene_id']))
      .map((row) => pickRow('montage_tests', row, {
        id: mappedId(montageTestIdMap, row['id'])!,
        scene_id: mappedId(sceneIdMap, row['scene_id']),
      })),
    monster_portraits: sourceMonsterPortraits
      .filter((row) => mappedId(campaignIdMap, row['campaign_id']) && mappedId(assetIdMap, row['asset_id']))
      .map((row) => pickRow('monster_portraits', row, {
        id: mappedId(monsterPortraitIdMap, row['id'])!,
        campaign_id: mappedId(campaignIdMap, row['campaign_id']),
        asset_id: mappedId(assetIdMap, row['asset_id']),
      })),
    note_folders: noteFolders,
    notes: sourceNotes
      .filter((row) => mappedId(campaignIdMap, row['campaign_id']))
      .filter((row) => mappedId(noteFolderIdMap, row['folder_id']) && noteFolderIds.has(mappedId(noteFolderIdMap, row['folder_id'])!))
      .map((row) => pickRow('notes', row, {
        id: mappedId(noteIdMap, row['id'])!,
        campaign_id: mappedId(campaignIdMap, row['campaign_id']),
        user_id: user.id,
        folder_id: mappedId(noteFolderIdMap, row['folder_id']),
    })),
  };

  const assetStorageKeys = new Map<string, string>();
  for (const sourceAsset of sourceAssets) {
    const oldId = sourceId(sourceAsset);
    const newId = oldId ? mappedId(assetIdMap, oldId) : null;
    const asset = assets.find((candidate) => candidate['id'] === newId);
    if (oldId && typeof asset?.['storage_key'] === 'string') {
      assetStorageKeys.set(oldId, asset['storage_key']);
    }
  }

  const restoredFileData: Array<{ storageKey: string; contentType: string; data: ArrayBuffer }> = [];
  for (const file of archive.files) {
    const storageKey = assetStorageKeys.get(file.assetId);
    if (!storageKey) continue;
    const contentType = assetContentTypes.get(file.assetId);
    if (!contentType) continue;
    let data: ArrayBuffer;
    try {
      data = base64ToArrayBuffer(file.dataBase64);
    } catch {
      throw new RestoreValidationError('Backup contains invalid file data');
    }
    if (data.byteLength === 0 || data.byteLength > MAX_ASSET_FILE_SIZE) {
      throw new RestoreValidationError('Backup contains a file with an invalid size');
    }
    if (file.size > 0 && file.size !== data.byteLength) {
      throw new RestoreValidationError('Backup file size does not match its content');
    }
    restoredFileData.push({ storageKey, contentType, data });
  }

  for (const table of RESTORE_ORDER) {
    if (table === 'note_folders') {
      const rows = restoredTables.note_folders ?? [];
      await insertRows(c.env.DB, 'note_folders', rows.map((row) => ({ ...row, parent_folder_id: null })));
      for (const row of rows) {
        if (typeof row['id'] !== 'string') continue;
        const parentId = typeof row['parent_folder_id'] === 'string' && noteFolderIds.has(row['parent_folder_id'])
          ? row['parent_folder_id']
          : null;
        await c.env.DB.prepare('UPDATE note_folders SET parent_folder_id = ? WHERE id = ? AND user_id = ?')
          .bind(parentId, row['id'], user.id)
          .run();
      }
      continue;
    }
    await insertRows(c.env.DB, table, restoredTables[table] ?? []);
  }

  for (const { storageKey, contentType, data } of restoredFileData) {
    await c.env.ASSETS.put(storageKey, data, { httpMetadata: { contentType } });
  }

  return { ...tableCounts(restoredTables), files: restoredFileData.length };
}

accountRoutes.get('/backup', async (c) => {
  const user = c.get('user') as AuthUser;
  const archive = await buildArchive(c, user);
  const body = JSON.stringify(archive);
  return new Response(body, {
    headers: {
      'Content-Type': 'application/vnd.anvil.backup+json',
      'Content-Disposition': `attachment; filename="${safeFileName(user.username)}-${dateStamp()}.anv"`,
      'Cache-Control': 'no-store',
    },
  });
});

accountRoutes.post('/restore', async (c) => {
  const user = c.get('user') as AuthUser;
  const form = await c.req.formData();
  const file = form.get('backup');
  if (!(file instanceof File)) return c.json({ error: 'Backup file is required' }, 400);
  if (!file.name.toLowerCase().endsWith('.anv')) return c.json({ error: 'Backup must be a .anv file' }, 400);
  if (file.size > MAX_BACKUP_SIZE) return c.json({ error: 'Backup file is too large' }, 400);

  let archive: AccountBackupArchive | null = null;
  try {
    archive = parseArchive(JSON.parse(await file.text()));
  } catch {
    return c.json({ error: 'Invalid backup archive' }, 400);
  }
  if (!archive) return c.json({ error: 'Invalid backup archive' }, 400);

  let counts: Record<string, number>;
  try {
    counts = await restoreArchive(c, archive, user);
  } catch (error) {
    if (error instanceof RestoreValidationError) {
      return c.json({ error: error.message }, 400);
    }
    throw error;
  }
  return c.json({ ok: true, counts });
});

accountRoutes.delete('/', async (c) => {
  const user = c.get('user') as AuthUser;
  const body = await c.req.json<{ confirmation?: string }>().catch(() => ({}) as { confirmation?: string });
  if (body.confirmation !== user.username) {
    return c.json({ error: 'Type your username to confirm account deletion' }, 400);
  }

  const db = c.env.DB;
  const assetRows = await allRows(db, 'SELECT id, storage_key, thumbnail_key FROM assets WHERE user_id = ?', [user.id]);
  const storageKeys = uniqueStrings([
    ...assetRows.map((row) => (typeof row['storage_key'] === 'string' ? row['storage_key'] : null)),
    ...assetRows.map((row) => (typeof row['thumbnail_key'] === 'string' ? row['thumbnail_key'] : null)),
  ]);

  const campaignRows = await allRows(db, 'SELECT id FROM campaigns WHERE director_id = ?', [user.id]);
  const campaignIds = stringIds(campaignRows, 'id');
  const sessionRows = await rowsWhereIn(db, 'game_sessions', 'campaign_id', campaignIds);
  const sessionIds = stringIds(sessionRows, 'id');
  const sceneRows = await rowsWhereIn(db, 'scenes', 'game_session_id', sessionIds);
  const sceneIds = stringIds(sceneRows, 'id');
  const mapRows = await rowsWhereIn(db, 'maps', 'campaign_id', campaignIds);
  const mapIds = stringIds(mapRows, 'id');
  const audioRows = await rowsWhereIn(db, 'audio_assets', 'campaign_id', campaignIds);
  const audioIds = stringIds(audioRows, 'id');

  await db.prepare('DELETE FROM ws_tokens WHERE user_id = ?').bind(user.id).run();
  await deleteWhereIn(db, 'ws_tokens', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'ws_tokens', 'session_id', sessionIds);

  await deleteWhereIn(db, 'audio_scene_types', 'audio_id', audioIds);
  await deleteWhereIn(db, 'audio_tags', 'audio_id', audioIds);
  await deleteWhereIn(db, 'map_terrains', 'map_id', mapIds);
  await deleteWhereIn(db, 'map_biomes', 'map_id', mapIds);
  await deleteWhereIn(db, 'map_tags', 'map_id', mapIds);
  await deleteWhereIn(db, 'scene_monsters', 'scene_id', sceneIds);
  await deleteWhereIn(db, 'montage_tests', 'scene_id', sceneIds);

  await db.prepare('DELETE FROM notes WHERE user_id = ?').bind(user.id).run();
  await deleteWhereIn(db, 'notes', 'campaign_id', campaignIds);
  await db.prepare('DELETE FROM note_folders WHERE user_id = ?').bind(user.id).run();
  await deleteWhereIn(db, 'note_folders', 'campaign_id', campaignIds);

  await deleteWhereIn(db, 'monster_portraits', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'activity_cards', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'custom_terrain', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'audio_assets', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'npcs', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'maps', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'scenes', 'game_session_id', sessionIds);

  await db.prepare('DELETE FROM session_participants WHERE user_id = ?').bind(user.id).run();
  await deleteWhereIn(db, 'session_participants', 'game_session_id', sessionIds);
  await db.prepare('DELETE FROM campaign_members WHERE user_id = ?').bind(user.id).run();
  await deleteWhereIn(db, 'campaign_members', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'campaign_invites', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'game_sessions', 'campaign_id', campaignIds);
  await deleteWhereIn(db, 'modules', 'campaign_id', campaignIds);
  await db.prepare('DELETE FROM campaigns WHERE director_id = ?').bind(user.id).run();

  await db.prepare('DELETE FROM heroes WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM assets WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM user_identities WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();

  const storageDeletes = await Promise.allSettled(storageKeys.map((key) => c.env.ASSETS.delete(key)));
  const failedStorageDeletes = storageDeletes.filter((result) => result.status === 'rejected').length;
  clearSessionCookie(c);
  return c.json({ ok: true, failedStorageDeletes });
});
