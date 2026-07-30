import { ASSET_LIMITS } from '../policy/limits.js';

export const MAX_ASSET_FILE_SIZE = ASSET_LIMITS.maxFileBytes;

export const VALID_ASSET_TYPES = ['map', 'token', 'portrait', 'handout', 'audio', 'other'] as const;

export type AssetType = (typeof VALID_ASSET_TYPES)[number];

const ACTIVE_CONTENT_TYPES = new Set([
  'application/xhtml+xml',
  'application/xml',
  'image/svg+xml',
  'text/html',
  'text/xml',
]);

/**
 * Active (script-capable) content must never be stored or served inline.
 * Beyond the explicit list above, reject anything whose MIME hints at
 * SVG/XML/HTML/script so near-misses such as `image/svg` (no `+xml`) cannot
 * slip through the allowlist branches below.
 */
function isActiveContentType(normalized: string): boolean {
  if (ACTIVE_CONTENT_TYPES.has(normalized)) return true;
  return /svg|xml|html|script/.test(normalized);
}

const BROWSER_COMPATIBLE_AUDIO_CONTENT_TYPES = new Set([
  'audio/aac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpeg3',
  'audio/vnd.wave',
  'audio/wav',
  'audio/wave',
  'audio/x-aac',
  'audio/x-m4a',
  'audio/x-mp3',
  'audio/x-mpeg',
  'audio/x-mpeg-3',
  'audio/x-wav',
]);

export function normalizeContentType(contentType: string | null | undefined): string {
  return contentType?.toLowerCase().split(';')[0]?.trim() ?? '';
}

export function extensionForContentType(contentType: string): string {
  const normalized = normalizeContentType(contentType);
  const known: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/aac': 'aac',
    'audio/m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/mpeg3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/vnd.wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/x-aac': 'aac',
    'audio/x-m4a': 'm4a',
    'audio/x-mp3': 'mp3',
    'audio/x-mpeg': 'mp3',
    'audio/x-mpeg-3': 'mp3',
    'audio/ogg': 'ogg',
    'audio/webm': 'webm',
    'application/pdf': 'pdf',
  };
  return known[normalized] ?? 'bin';
}

export function isAllowedAssetType(assetType: string): assetType is AssetType {
  return VALID_ASSET_TYPES.includes(assetType as AssetType);
}

export function isAllowedAssetContentType(assetType: string, contentType: string): boolean {
  const normalized = normalizeContentType(contentType);
  if (!normalized || isActiveContentType(normalized)) return false;
  if (assetType === 'map' || assetType === 'token' || assetType === 'portrait') return normalized.startsWith('image/');
  if (assetType === 'audio') return BROWSER_COMPATIBLE_AUDIO_CONTENT_TYPES.has(normalized);
  if (assetType === 'handout') {
    return normalized.startsWith('image/')
      || normalized === 'application/pdf'
      || normalized === 'text/plain'
      || normalized === 'text/markdown';
  }
  return normalized.startsWith('image/')
    || normalized.startsWith('audio/')
    || normalized === 'application/pdf'
    || normalized === 'application/octet-stream';
}

export function shouldServeAssetAsAttachment(assetType: string, contentType: string): boolean {
  return assetType === 'handout' || assetType === 'other' || !isAllowedAssetContentType(assetType, contentType);
}
