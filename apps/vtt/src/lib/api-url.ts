const RAW_API_BASE = import.meta.env['VITE_API_BASE'] || '';

export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:/i.test(value) || value.startsWith('//');
}

function apiOrigin(): string | null {
  if (!API_BASE || typeof window === 'undefined') return null;

  try {
    return new URL(API_BASE, window.location.href).origin;
  } catch {
    return null;
  }
}

export function resolveApiUrl(pathOrUrl: string): string {
  if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${path}`;
}

export function assetDataUrl(assetId: string): string {
  return resolveApiUrl(`/api/assets/${assetId}/data`);
}

export function resolveApiBackedMediaUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (!value || isAbsoluteUrl(value)) return value;

  const path = value.startsWith('/') ? value : `/${value}`;
  return path.startsWith('/api/') ? resolveApiUrl(path) : value;
}

export function credentialedMediaCrossOrigin(url: string): 'use-credentials' | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const parsed = new URL(url, window.location.href);
    const origin = apiOrigin();
    return origin && parsed.origin === origin ? 'use-credentials' : undefined;
  } catch {
    return undefined;
  }
}

export function mediaElementCrossOrigin(
  url: string,
): 'anonymous' | 'use-credentials' | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin === window.location.origin) return undefined;
    return parsed.origin === apiOrigin() ? 'use-credentials' : 'anonymous';
  } catch {
    return undefined;
  }
}
