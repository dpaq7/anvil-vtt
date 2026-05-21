const RAW_API_BASE = import.meta.env['VITE_API_BASE'] || '';

export const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

function isAbsoluteUrl(value: string): boolean {
  return /^[a-z][a-z\d+\-.]*:/i.test(value) || value.startsWith('//');
}

export function resolveApiUrl(pathOrUrl: string): string {
  if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${API_BASE}${path}`;
}

export function assetDataUrl(assetId: string): string {
  return resolveApiUrl(`/api/assets/${assetId}/data`);
}

export function credentialedMediaCrossOrigin(url: string): 'use-credentials' | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin ? undefined : 'use-credentials';
  } catch {
    return undefined;
  }
}
