import type {
  SceneImportDocument,
  SceneImportModule,
  SceneImportRequest,
  SceneImportScene,
  SceneImportSession,
  SceneType,
} from '@anvil/types';
import { SCENE_IMPORT_FORMAT } from '@anvil/types';
import { SCENE_IMPORT_LIMITS } from '../policy/limits.js';
import {
  isRecord,
  jsonByteLength,
  trimString,
  type ValidationResult,
} from '../security/validation.js';

const VALID_SCENE_TYPES = new Set<SceneType>(['battle', 'story', 'montage', 'negotiation', 'respite']);

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, maxLength);
}

function orderIndex(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function parseScene(value: unknown): ValidationResult<SceneImportScene> {
  if (!isRecord(value)) return { ok: false, error: 'Each scene must be an object' };
  const title = trimString(value['title'], SCENE_IMPORT_LIMITS.nameLength);
  if (!title) return { ok: false, error: 'Scene title is required' };
  if (!VALID_SCENE_TYPES.has(value['type'] as SceneType)) {
    return { ok: false, error: `Invalid scene type: ${String(value['type'])}` };
  }
  const data = value['data'] === undefined ? undefined : value['data'];
  if (data !== undefined && !isRecord(data)) return { ok: false, error: 'Scene data must be an object' };
  if (data !== undefined && jsonByteLength(data) > SCENE_IMPORT_LIMITS.sceneDataBytes) {
    return { ok: false, error: 'Scene data is too large', status: 413 };
  }
  return {
    ok: true,
    value: {
      title,
      type: value['type'] as SceneType,
      ...(data ? { data } : {}),
      ...(orderIndex(value['orderIndex']) !== undefined ? { orderIndex: orderIndex(value['orderIndex']) } : {}),
    },
  };
}

function parseSession(value: unknown): ValidationResult<SceneImportSession> {
  if (!isRecord(value)) return { ok: false, error: 'Each session must be an object' };
  const name = trimString(value['name'], SCENE_IMPORT_LIMITS.nameLength);
  if (!name) return { ok: false, error: 'Session name is required' };
  if (!Array.isArray(value['scenes'])) return { ok: false, error: 'Session scenes must be an array' };
  if (value['scenes'].length === 0) return { ok: false, error: 'Each imported session must contain at least one scene' };

  const scenes: SceneImportScene[] = [];
  for (const scene of value['scenes']) {
    const parsed = parseScene(scene);
    if (!parsed.ok) return parsed;
    scenes.push(parsed.value);
  }

  return {
    ok: true,
    value: {
      name,
      scenes,
      ...(optionalText(value['description'], SCENE_IMPORT_LIMITS.descriptionLength) !== undefined
        ? { description: optionalText(value['description'], SCENE_IMPORT_LIMITS.descriptionLength) }
        : {}),
      ...(orderIndex(value['orderIndex']) !== undefined ? { orderIndex: orderIndex(value['orderIndex']) } : {}),
    },
  };
}

function parseModule(value: unknown): ValidationResult<SceneImportModule> {
  if (!isRecord(value)) return { ok: false, error: 'Each module must be an object' };
  const name = trimString(value['name'], SCENE_IMPORT_LIMITS.nameLength);
  if (!name) return { ok: false, error: 'Module name is required' };
  if (!Array.isArray(value['sessions'])) return { ok: false, error: 'Module sessions must be an array' };
  if (value['sessions'].length === 0) return { ok: false, error: 'Each imported module must contain at least one session' };

  const sessions: SceneImportSession[] = [];
  for (const session of value['sessions']) {
    const parsed = parseSession(session);
    if (!parsed.ok) return parsed;
    sessions.push(parsed.value);
  }

  return {
    ok: true,
    value: {
      name,
      sessions,
      ...(optionalText(value['description'], SCENE_IMPORT_LIMITS.descriptionLength) !== undefined
        ? { description: optionalText(value['description'], SCENE_IMPORT_LIMITS.descriptionLength) }
        : {}),
      ...(orderIndex(value['orderIndex']) !== undefined ? { orderIndex: orderIndex(value['orderIndex']) } : {}),
    },
  };
}

export function parseSceneImportDocument(raw: unknown): ValidationResult<SceneImportDocument> {
  const maybeRequest = isRecord(raw) && isRecord(raw['document'])
    ? raw as unknown as SceneImportRequest
    : { document: raw } as SceneImportRequest;
  const document = maybeRequest.document;

  if (!isRecord(document)) return { ok: false, error: 'Import document must be a JSON object' };
  if (document['format'] !== SCENE_IMPORT_FORMAT) return { ok: false, error: `Unsupported import format: expected ${SCENE_IMPORT_FORMAT}` };
  if (document['version'] !== 1) return { ok: false, error: 'Unsupported scene import version' };

  const campaign = document['campaign'];
  if (!isRecord(campaign)) return { ok: false, error: 'Campaign is required' };
  const campaignName = trimString(campaign['name'], SCENE_IMPORT_LIMITS.nameLength);
  if (!campaignName) return { ok: false, error: 'Campaign name is required' };
  const settings = campaign['settings'];
  if (settings !== undefined && !isRecord(settings)) return { ok: false, error: 'Campaign settings must be an object' };
  if (settings !== undefined && jsonByteLength(settings) > SCENE_IMPORT_LIMITS.settingsBytes) {
    return { ok: false, error: 'Campaign settings are too large', status: 413 };
  }

  const rawModules = document['modules'];
  const rawSessions = document['sessions'];
  if (rawModules !== undefined && !Array.isArray(rawModules)) return { ok: false, error: 'modules must be an array' };
  if (rawSessions !== undefined && !Array.isArray(rawSessions)) return { ok: false, error: 'sessions must be an array' };
  if ((rawModules?.length ?? 0) > SCENE_IMPORT_LIMITS.maxModules) return { ok: false, error: 'Too many modules', status: 413 };

  const modules: SceneImportModule[] = [];
  for (const module of Array.isArray(rawModules) ? rawModules : []) {
    const parsed = parseModule(module);
    if (!parsed.ok) return parsed;
    modules.push(parsed.value);
  }

  const sessions: SceneImportSession[] = [];
  for (const session of Array.isArray(rawSessions) ? rawSessions : []) {
    const parsed = parseSession(session);
    if (!parsed.ok) return parsed;
    sessions.push(parsed.value);
  }

  const nestedSessions = modules.reduce((count, module) => count + module.sessions.length, 0);
  const sceneCount = sessions.reduce((count, session) => count + session.scenes.length, 0)
    + modules.reduce((count, module) => count + module.sessions.reduce((sum, session) => sum + session.scenes.length, 0), 0);
  if (modules.length + sessions.length === 0) return { ok: false, error: 'Import document must contain at least one module or session' };
  if (nestedSessions + sessions.length > SCENE_IMPORT_LIMITS.maxSessions) return { ok: false, error: 'Too many sessions', status: 413 };
  if (sceneCount > SCENE_IMPORT_LIMITS.maxScenes) return { ok: false, error: 'Too many scenes', status: 413 };

  return {
    ok: true,
    value: {
      format: SCENE_IMPORT_FORMAT,
      version: 1,
      campaign: {
        name: campaignName,
        ...(optionalText(campaign['description'], SCENE_IMPORT_LIMITS.descriptionLength) !== undefined
          ? { description: optionalText(campaign['description'], SCENE_IMPORT_LIMITS.descriptionLength) }
          : {}),
        ...(settings ? { settings } : {}),
      },
      ...(modules.length > 0 ? { modules } : {}),
      ...(sessions.length > 0 ? { sessions } : {}),
    },
  };
}
