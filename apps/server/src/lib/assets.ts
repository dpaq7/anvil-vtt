export const MAX_ASSET_FILE_SIZE = 50 * 1024 * 1024;

export const VALID_ASSET_TYPES = ['map', 'token', 'portrait', 'handout', 'audio', 'other'] as const;

export type AssetType = (typeof VALID_ASSET_TYPES)[number];

const ACTIVE_CONTENT_TYPES = new Set([
  'application/xhtml+xml',
  'application/xml',
  'image/svg+xml',
  'text/html',
  'text/xml',
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
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
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
  if (!normalized || ACTIVE_CONTENT_TYPES.has(normalized)) return false;
  if (assetType === 'map' || assetType === 'token' || assetType === 'portrait') return normalized.startsWith('image/');
  if (assetType === 'audio') return normalized.startsWith('audio/');
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
