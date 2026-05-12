import { Hono } from 'hono';
import type { Context } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware, clearSessionCookie } from '../middleware/auth.js';

export const accountRoutes = new Hono<AppEnv>();

accountRoutes.use('/*', authMiddleware);

const BACKUP_FORMAT = 'anvil.account-backup';
const BACKUP_VERSION = 1;
const MAX_BACKUP_SIZE = 100 * 1024 * 1024;

type DbValue = string | number | null;
type DbRow = Record<string, DbValue>;

const TABLE_COLUMNS = {
  assets: ['id', 'user_id', 'name', 'type', 'storage_key', 'thumbnail_key', 'width', 'height', 'tags', 'created_at', 'content_type', 'file_size', 'uploaded_at'],
  heroes: ['id', 'user_id', 'name', 'ancestry', 'culture', 'career', 'hero_class', 'subclass', 'level', 'characteristics', 'kit', 'skills', 'abilities', 'portrait_url', 'data', 'version', 'created_at', 'updated_at', 'deleted_at'],
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

function extensionForAsset(row: DbRow): string {
  const fromKey = typeof row['storage_key'] === 'string' ? row['storage_key'].split('.').pop() : null;
  if (fromKey && /^[a-z0-9]+$/i.test(fromKey)) return fromKey;
  const contentType = typeof row['content_type'] === 'string' ? row['content_type'].split(';')[0]?.toLowerCase() : '';
  const known: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'application/pdf': 'pdf',
  };
  return known[contentType ?? ''] ?? 'bin';
}

function storageKeyFor(userId: string, row: DbRow) {
  const id = typeof row['id'] === 'string' ? row['id'] : crypto.randomUUID();
  return `${userId}/${id}.${extensionForAsset(row)}`;
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
  if (!isRecord(raw) || raw['format'] !== BACKUP_FORMAT || typeof raw['version'] !== 'number') return null;
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

async function insertOrReplaceRows(db: D1Database, table: BackupTableName, rows: DbRow[]) {
  for (const row of rows) {
    const columns = TABLE_COLUMNS[table].filter((column) => row[column] !== undefined);
    if (columns.length === 0) continue;
    const placeholders = columns.map(() => '?').join(', ');
    await db.prepare(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`)
      .bind(...columns.map((column) => row[column] ?? null))
      .run();
  }
}

async function restoreArchive(c: Context<AppEnv>, archive: AccountBackupArchive, user: AuthUser) {
  const sourceUserId = archive.account.id;
  const rawTables = archive.tables;

  const assets = (rawTables.assets ?? []).map((row) => pickRow('assets', row, {
    user_id: user.id,
    storage_key: storageKeyFor(user.id, row),
  }));
  const assetIds = new Set(stringIds(assets, 'id'));

  const heroes = (rawTables.heroes ?? []).map((row) => pickRow('heroes', row, { user_id: user.id }));
  const campaigns = (rawTables.campaigns ?? []).map((row) => pickRow('campaigns', row, { director_id: user.id }));
  const campaignIds = new Set(stringIds(campaigns, 'id'));

  const modules = (rawTables.modules ?? [])
    .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
    .map((row) => pickRow('modules', row));
  const moduleIds = new Set(stringIds(modules, 'id'));

  const gameSessions = (rawTables.game_sessions ?? [])
    .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
    .map((row) => pickRow('game_sessions', row, {
      module_id: typeof row['module_id'] === 'string' && moduleIds.has(row['module_id']) ? row['module_id'] : null,
    }));
  const sessionIds = new Set(stringIds(gameSessions, 'id'));

  const scenes = (rawTables.scenes ?? [])
    .filter((row) => typeof row['game_session_id'] === 'string' && sessionIds.has(row['game_session_id']))
    .map((row) => pickRow('scenes', row));
  const sceneIds = new Set(stringIds(scenes, 'id'));

  const maps = (rawTables.maps ?? [])
    .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
    .map((row) => pickRow('maps', row, {
      asset_id: typeof row['asset_id'] === 'string' && assetIds.has(row['asset_id']) ? row['asset_id'] : null,
    }));
  const mapIds = new Set(stringIds(maps, 'id'));

  const audioAssets = (rawTables.audio_assets ?? [])
    .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
    .map((row) => pickRow('audio_assets', row, {
      asset_id: typeof row['asset_id'] === 'string' && assetIds.has(row['asset_id']) ? row['asset_id'] : null,
    }))
    .filter((row) => typeof row['asset_id'] === 'string');
  const audioIds = new Set(stringIds(audioAssets, 'id'));

  const noteFolders = (rawTables.note_folders ?? [])
    .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
    .map((row) => pickRow('note_folders', row, { user_id: user.id }));
  const noteFolderIds = new Set(stringIds(noteFolders, 'id'));

  const restoredTables: BackupTables = {
    assets,
    heroes,
    campaigns,
    modules,
    game_sessions: gameSessions,
    scenes,
    campaign_members: (rawTables.campaign_members ?? [])
      .filter((row) => row['user_id'] === sourceUserId && typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
      .map((row) => pickRow('campaign_members', row, { user_id: user.id })),
    session_participants: (rawTables.session_participants ?? [])
      .filter((row) => row['user_id'] === sourceUserId && typeof row['game_session_id'] === 'string' && sessionIds.has(row['game_session_id']))
      .map((row) => pickRow('session_participants', row, { user_id: user.id })),
    maps,
    map_terrains: (rawTables.map_terrains ?? [])
      .filter((row) => typeof row['map_id'] === 'string' && mapIds.has(row['map_id']))
      .map((row) => pickRow('map_terrains', row)),
    map_biomes: (rawTables.map_biomes ?? [])
      .filter((row) => typeof row['map_id'] === 'string' && mapIds.has(row['map_id']))
      .map((row) => pickRow('map_biomes', row)),
    map_tags: (rawTables.map_tags ?? [])
      .filter((row) => typeof row['map_id'] === 'string' && mapIds.has(row['map_id']))
      .map((row) => pickRow('map_tags', row)),
    npcs: (rawTables.npcs ?? [])
      .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
      .map((row) => pickRow('npcs', row, {
        portrait_asset_id: typeof row['portrait_asset_id'] === 'string' && assetIds.has(row['portrait_asset_id']) ? row['portrait_asset_id'] : null,
      })),
    scene_monsters: (rawTables.scene_monsters ?? [])
      .filter((row) => typeof row['scene_id'] === 'string' && sceneIds.has(row['scene_id']))
      .map((row) => pickRow('scene_monsters', row)),
    custom_terrain: (rawTables.custom_terrain ?? [])
      .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
      .map((row) => pickRow('custom_terrain', row, {
        asset_id: typeof row['asset_id'] === 'string' && assetIds.has(row['asset_id']) ? row['asset_id'] : null,
      })),
    audio_assets: audioAssets,
    audio_scene_types: (rawTables.audio_scene_types ?? [])
      .filter((row) => typeof row['audio_id'] === 'string' && audioIds.has(row['audio_id']))
      .map((row) => pickRow('audio_scene_types', row)),
    audio_tags: (rawTables.audio_tags ?? [])
      .filter((row) => typeof row['audio_id'] === 'string' && audioIds.has(row['audio_id']))
      .map((row) => pickRow('audio_tags', row)),
    activity_cards: (rawTables.activity_cards ?? [])
      .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
      .map((row) => pickRow('activity_cards', row)),
    montage_tests: (rawTables.montage_tests ?? [])
      .filter((row) => typeof row['scene_id'] === 'string' && sceneIds.has(row['scene_id']))
      .map((row) => pickRow('montage_tests', row)),
    monster_portraits: (rawTables.monster_portraits ?? [])
      .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
      .map((row) => pickRow('monster_portraits', row, {
        asset_id: typeof row['asset_id'] === 'string' && assetIds.has(row['asset_id']) ? row['asset_id'] : null,
      })),
    note_folders: noteFolders,
    notes: (rawTables.notes ?? [])
      .filter((row) => typeof row['campaign_id'] === 'string' && campaignIds.has(row['campaign_id']))
      .filter((row) => typeof row['folder_id'] === 'string' && noteFolderIds.has(row['folder_id']))
      .map((row) => pickRow('notes', row, { user_id: user.id })),
  };

  for (const table of RESTORE_ORDER) {
    if (table === 'note_folders') {
      const rows = restoredTables.note_folders ?? [];
      await insertOrReplaceRows(c.env.DB, 'note_folders', rows.map((row) => ({ ...row, parent_folder_id: null })));
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
    await insertOrReplaceRows(c.env.DB, table, restoredTables[table] ?? []);
  }

  const assetStorageKeys = new Map<string, string>();
  for (const asset of assets) {
    if (typeof asset['id'] === 'string' && typeof asset['storage_key'] === 'string') {
      assetStorageKeys.set(asset['id'], asset['storage_key']);
    }
  }

  let restoredFiles = 0;
  for (const file of archive.files) {
    const storageKey = assetStorageKeys.get(file.assetId);
    if (!storageKey) continue;
    const data = base64ToArrayBuffer(file.dataBase64);
    await c.env.ASSETS.put(storageKey, data, { httpMetadata: { contentType: file.contentType } });
    restoredFiles += 1;
  }

  return { ...tableCounts(restoredTables), files: restoredFiles };
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

  const counts = await restoreArchive(c, archive, user);
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
