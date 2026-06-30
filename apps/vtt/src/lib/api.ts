import { csrfHeaders } from './csrf.js';

const API_BASE = (import.meta.env['VITE_API_BASE'] || '').replace(/\/$/, '');
const ABSOLUTE_URL_RE = /^[a-z][a-z\d+\-.]*:/i;

export function resolveApiUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (ABSOLUTE_URL_RE.test(path) || path.startsWith('//')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function isConfiguredApiUrl(path: string | null | undefined): boolean {
  const resolved = resolveApiUrl(path);
  if (!resolved) return false;

  try {
    const url = new URL(resolved, window.location.href);
    const apiOrigin = API_BASE ? new URL(API_BASE, window.location.href).origin : window.location.origin;
    return url.origin === apiOrigin && url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const res = await fetch(resolveApiUrl(path) ?? path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(method),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Upload raw binary data (e.g. file bytes to R2 via the assets endpoint) */
async function putRaw(path: string, data: ArrayBuffer, contentType: string): Promise<void> {
  const res = await fetch(resolveApiUrl(path) ?? path, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': contentType || 'application/octet-stream', ...csrfHeaders('PUT') },
    body: data,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `Upload failed: ${res.status}`);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  putRaw,
};
