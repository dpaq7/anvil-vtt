import { Hono } from 'hono';
import type { Context } from 'hono';
import type {
  SceneImportDocument,
  SceneImportRequest,
  SceneType,
} from '@anvil/types';
import { SCENE_IMPORT_FORMAT } from '@anvil/types';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { createImportedCampaign, importIntoCampaign, sceneImportResult } from '../lib/scene-import.js';

export const sceneImportRoutes = new Hono<AppEnv>();

sceneImportRoutes.use('/*', authMiddleware);

const VALID_SCENE_TYPES = new Set<SceneType>(['battle', 'story', 'montage', 'negotiation', 'respite']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeImportBody(raw: unknown): { document?: SceneImportDocument; error?: string } {
  const maybeRequest = isRecord(raw) && isRecord(raw['document'])
    ? raw as unknown as SceneImportRequest
    : { document: raw } as SceneImportRequest;
  const document = maybeRequest.document;

  if (!isRecord(document)) return { error: 'Import document must be a JSON object' };
  if (document['format'] !== SCENE_IMPORT_FORMAT) return { error: `Unsupported import format: expected ${SCENE_IMPORT_FORMAT}` };
  if (document['version'] !== 1) return { error: 'Unsupported scene import version' };

  const campaign = document['campaign'];
  if (!isRecord(campaign) || !nonEmptyString(campaign['name'])) {
    return { error: 'Campaign name is required' };
  }

  const modules = document['modules'];
  const sessions = document['sessions'];
  if (modules !== undefined && !Array.isArray(modules)) return { error: 'modules must be an array' };
  if (sessions !== undefined && !Array.isArray(sessions)) return { error: 'sessions must be an array' };

  for (const module of (Array.isArray(modules) ? modules : [])) {
    const error = validateModule(module);
    if (error) return { error };
  }
  for (const session of (Array.isArray(sessions) ? sessions : [])) {
    const error = validateSession(session);
    if (error) return { error };
  }

  const moduleCount = Array.isArray(modules) ? modules.length : 0;
  const sessionCount = Array.isArray(sessions) ? sessions.length : 0;
  if (moduleCount + sessionCount === 0) return { error: 'Import document must contain at least one module or session' };

  return { document: document as SceneImportDocument };
}

function validateModule(value: unknown): string | null {
  if (!isRecord(value)) return 'Each module must be an object';
  if (!nonEmptyString(value['name'])) return 'Module name is required';
  if (!Array.isArray(value['sessions'])) return 'Module sessions must be an array';
  if (value['sessions'].length === 0) return 'Each imported module must contain at least one session';
  for (const session of value['sessions']) {
    const error = validateSession(session);
    if (error) return error;
  }
  return null;
}

function validateSession(value: unknown): string | null {
  if (!isRecord(value)) return 'Each session must be an object';
  if (!nonEmptyString(value['name'])) return 'Session name is required';
  if (!Array.isArray(value['scenes'])) return 'Session scenes must be an array';
  if (value['scenes'].length === 0) return 'Each imported session must contain at least one scene';
  for (const scene of value['scenes']) {
    const error = validateScene(scene);
    if (error) return error;
  }
  return null;
}

function validateScene(value: unknown): string | null {
  if (!isRecord(value)) return 'Each scene must be an object';
  if (!nonEmptyString(value['title'])) return 'Scene title is required';
  if (!VALID_SCENE_TYPES.has(value['type'] as SceneType)) return `Invalid scene type: ${String(value['type'])}`;
  if (value['data'] !== undefined && !isRecord(value['data'])) return 'Scene data must be an object';
  return null;
}

async function assertCampaignDirector(c: Context<AppEnv>, campaignId: string, userId: string): Promise<boolean> {
  const campaign = await c.env.DB.prepare(
    'SELECT director_id FROM campaigns WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(campaignId)
    .first<{ director_id: string }>();
  return campaign?.director_id === userId;
}

sceneImportRoutes.post('/import', async (c) => {
  const user = c.get('user') as AuthUser;
  const raw = await c.req.json().catch(() => null);
  const parsed = normalizeImportBody(raw);
  if (!parsed.document) return c.json({ error: parsed.error ?? 'Invalid import document' }, 400);

  return c.json(await createImportedCampaign(c.env.DB, user.id, parsed.document), 201);
});

sceneImportRoutes.post('/:campaignId/import', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  if (!(await assertCampaignDirector(c, campaignId, user.id))) return c.json({ error: 'Forbidden' }, 403);

  const raw = await c.req.json().catch(() => null);
  const parsed = normalizeImportBody(raw);
  if (!parsed.document) return c.json({ error: parsed.error ?? 'Invalid import document' }, 400);

  const ids = await importIntoCampaign(c.env.DB, campaignId, parsed.document);
  return c.json(sceneImportResult(campaignId, ids), 201);
});
