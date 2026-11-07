import type {
  CampaignPackageAsset,
  CampaignPackageAssetRegistration,
  CampaignPackageContent,
  CampaignPackageImportRequest,
  CampaignPackageManifest,
} from '@anvil/types';
import { CAMPAIGN_PACKAGE_FORMAT } from '@anvil/types';
import { isAllowedAssetContentType, isAllowedAssetType, MAX_ASSET_FILE_SIZE } from '../lib/assets.js';
import { hasUnsafeObjectKey, isRecord, jsonByteLength, trimString, type ValidationResult } from '../security/validation.js';
import { parseSceneImportDocument } from './scene-import.js';

const REF_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const VALID_REGISTRATION_KINDS = new Set(['map', 'terrain', 'npc', 'audio', 'monster-portrait']);

function safeArchivePath(value: unknown): string | null {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.includes('\\')) return null;
  const parts = value.split('/');
  return parts.some((part) => !part || part === '.' || part === '..') ? null : value;
}

function parseRegistration(value: unknown): ValidationResult<CampaignPackageAssetRegistration> {
  if (!isRecord(value) || !VALID_REGISTRATION_KINDS.has(String(value['kind']))) {
    return { ok: false, error: 'Invalid campaign asset registration' };
  }
  const kind = value['kind'] as CampaignPackageAssetRegistration['kind'];
  if (kind === 'npc') {
    const name = trimString(value['name'], 180);
    if (!name) return { ok: false, error: 'NPC registration name is required' };
  }
  if (kind === 'monster-portrait') {
    const monsterName = trimString(value['monsterName'], 180);
    if (!monsterName) return { ok: false, error: 'Monster portrait name is required' };
  }
  if (kind === 'terrain') {
    const categories = ['environmental', 'fieldwork', 'mechanism', 'siege-engine', 'power-fixture', 'supernatural'];
    if (!categories.includes(String(value['category']))) return { ok: false, error: 'Invalid terrain category' };
  }
  // Registration-specific values are constrained again by the database. Keeping
  // the original object here lets the shared package type remain the contract.
  return { ok: true, value: value as unknown as CampaignPackageAssetRegistration };
}

function parseAsset(value: unknown): ValidationResult<CampaignPackageAsset> {
  if (!isRecord(value)) return { ok: false, error: 'Each campaign asset must be an object' };
  const ref = trimString(value['ref'], 128);
  const path = safeArchivePath(value['path']);
  const name = trimString(value['name'], 240);
  const type = value['type'];
  const contentType = trimString(value['contentType'], 160);
  const size = value['size'];
  const sha256 = typeof value['sha256'] === 'string' ? value['sha256'].toLowerCase() : '';
  if (!ref || !REF_PATTERN.test(ref)) return { ok: false, error: 'Invalid campaign asset ref' };
  if (!path) return { ok: false, error: `Invalid archive path for ${ref}` };
  if (!name) return { ok: false, error: `Asset name is required for ${ref}` };
  if (typeof type !== 'string' || !isAllowedAssetType(type)) return { ok: false, error: `Invalid asset type for ${ref}` };
  if (!contentType || !isAllowedAssetContentType(type, contentType)) {
    return { ok: false, error: `File type is not allowed for ${ref}` };
  }
  if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0 || size > MAX_ASSET_FILE_SIZE) {
    return { ok: false, error: `Invalid asset size for ${ref}` };
  }
  if (!SHA256_PATTERN.test(sha256)) return { ok: false, error: `Invalid SHA-256 for ${ref}` };
  const registrations: CampaignPackageAssetRegistration[] = [];
  if (value['registrations'] !== undefined && !Array.isArray(value['registrations'])) {
    return { ok: false, error: `Registrations must be an array for ${ref}` };
  }
  for (const registration of Array.isArray(value['registrations']) ? value['registrations'] : []) {
    const parsed = parseRegistration(registration);
    if (!parsed.ok) return parsed;
    registrations.push(parsed.value);
  }
  return { ok: true, value: { ref, path, name, type, contentType, size, sha256, ...(registrations.length ? { registrations } : {}) } };
}

export function parseCampaignPackageImport(raw: unknown): ValidationResult<CampaignPackageImportRequest> {
  if (!isRecord(raw) || !isRecord(raw['manifest']) || !isRecord(raw['uploadedAssets'])) {
    return { ok: false, error: 'Campaign package manifest and uploadedAssets are required' };
  }
  const source = raw['manifest'];
  if (source['format'] !== CAMPAIGN_PACKAGE_FORMAT || source['version'] !== 1) {
    return { ok: false, error: 'Unsupported campaign package format or version' };
  }
  const document = parseSceneImportDocument(source['document']);
  if (!document.ok) return document;
  if (!Array.isArray(source['assets']) || source['assets'].length > 1000) {
    return { ok: false, error: 'Campaign package assets must be an array of at most 1000 files' };
  }
  const assets: CampaignPackageAsset[] = [];
  const refs = new Set<string>();
  const paths = new Set<string>();
  for (const asset of source['assets']) {
    const parsed = parseAsset(asset);
    if (!parsed.ok) return parsed;
    if (refs.has(parsed.value.ref)) return { ok: false, error: `Duplicate asset ref: ${parsed.value.ref}` };
    if (paths.has(parsed.value.path)) return { ok: false, error: `Duplicate asset path: ${parsed.value.path}` };
    refs.add(parsed.value.ref);
    paths.add(parsed.value.path);
    assets.push(parsed.value);
  }
  const uploadedAssets: Record<string, string> = {};
  for (const [ref, assetId] of Object.entries(raw['uploadedAssets'])) {
    if (!refs.has(ref) || typeof assetId !== 'string' || !assetId.trim()) {
      return { ok: false, error: `Invalid uploaded asset mapping: ${ref}` };
    }
    uploadedAssets[ref] = assetId.trim();
  }
  if (assets.some((asset) => !uploadedAssets[asset.ref])) return { ok: false, error: 'Every package asset must be uploaded' };
  let content: CampaignPackageContent | undefined;
  if (source['content'] !== undefined) {
    if (!isRecord(source['content']) || jsonByteLength(source['content']) > 256 * 1024 || hasUnsafeObjectKey(source['content'])) {
      return { ok: false, error: 'Invalid or oversized campaign package content catalog' };
    }
    const input = source['content'];
    if (
      (input['terrain'] !== undefined && !Array.isArray(input['terrain']))
      || (input['npcs'] !== undefined && !Array.isArray(input['npcs']))
      || (input['bestiary'] !== undefined && !Array.isArray(input['bestiary']))
    ) return { ok: false, error: 'Campaign content catalog entries must be arrays' };
    if (((input['terrain'] as unknown[] | undefined)?.length ?? 0) > 100) return { ok: false, error: 'Too many terrain catalog entries' };
    if (((input['npcs'] as unknown[] | undefined)?.length ?? 0) > 250) return { ok: false, error: 'Too many NPC catalog entries' };
    if (((input['bestiary'] as unknown[] | undefined)?.length ?? 0) > 250) return { ok: false, error: 'Too many bestiary catalog entries' };
    for (const entry of [...((input['terrain'] as unknown[] | undefined) ?? []), ...((input['npcs'] as unknown[] | undefined) ?? []), ...((input['bestiary'] as unknown[] | undefined) ?? [])]) {
      if (!isRecord(entry) || !trimString(entry['name'], 180)) return { ok: false, error: 'Each campaign content entry needs a name' };
      for (const refKey of ['assetRef', 'portraitRef']) {
        const ref = entry[refKey];
        if (ref !== undefined && (typeof ref !== 'string' || !refs.has(ref))) return { ok: false, error: `Unknown content asset ref: ${String(ref)}` };
      }
    }
    const categories = new Set(['environmental', 'fieldwork', 'mechanism', 'siege-engine', 'power-fixture', 'supernatural']);
    for (const entry of (input['terrain'] as Record<string, unknown>[] | undefined) ?? []) {
      if (!categories.has(String(entry['category']))) return { ok: false, error: 'Invalid content terrain category' };
    }
    content = input as unknown as CampaignPackageContent;
  }
  const manifest: CampaignPackageManifest = {
    format: CAMPAIGN_PACKAGE_FORMAT,
    version: 1,
    document: document.value,
    assets,
    ...(content ? { content } : {}),
    ...(isRecord(source['metadata']) ? { metadata: source['metadata'] } : {}),
  };
  return { ok: true, value: { manifest, uploadedAssets } };
}
