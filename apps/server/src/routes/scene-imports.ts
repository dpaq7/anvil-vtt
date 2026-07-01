import { Hono } from 'hono';
import type { AppEnv, AuthUser } from '../types.js';
import { authMiddleware } from '../middleware/auth.js';
import { createImportedCampaign, importIntoCampaign, sceneImportResult } from '../lib/scene-import.js';
import { parseSceneImportDocument } from '../contracts/scene-import.js';
import { SCENE_IMPORT_LIMITS } from '../policy/limits.js';
import { importRateLimits } from '../security/rate-limits.js';
import { jsonError, readJsonBody } from '../security/request.js';
import { requireCampaignDirector } from '../security/authorization.js';

export const sceneImportRoutes = new Hono<AppEnv>();

sceneImportRoutes.use('/*', authMiddleware);

sceneImportRoutes.post('/import', async (c) => {
  const user = c.get('user') as AuthUser;
  const rateLimitError = await importRateLimits.sceneImport(c, user.id);
  if (rateLimitError) return rateLimitError;

  const raw = await readJsonBody<unknown>(c, { maxBytes: SCENE_IMPORT_LIMITS.jsonBodyBytes, label: 'Import document' });
  if (!raw.ok) return jsonError(c, raw);
  const parsed = parseSceneImportDocument(raw.value);
  if (!parsed.ok) return jsonError(c, parsed);

  return c.json(await createImportedCampaign(c.env.DB, user.id, parsed.value), 201);
});

sceneImportRoutes.post('/:campaignId/import', async (c) => {
  const user = c.get('user') as AuthUser;
  const campaignId = c.req.param('campaignId');
  const accessError = await requireCampaignDirector(c, campaignId, user);
  if (accessError) return accessError;

  const rateLimitError = await importRateLimits.sceneImport(c, user.id);
  if (rateLimitError) return rateLimitError;

  const raw = await readJsonBody<unknown>(c, { maxBytes: SCENE_IMPORT_LIMITS.jsonBodyBytes, label: 'Import document' });
  if (!raw.ok) return jsonError(c, raw);
  const parsed = parseSceneImportDocument(raw.value);
  if (!parsed.ok) return jsonError(c, parsed);

  const ids = await importIntoCampaign(c.env.DB, campaignId, parsed.value);
  return c.json(sceneImportResult(campaignId, ids), 201);
});
