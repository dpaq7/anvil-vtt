import { csrfHeaders } from './csrf.js';
import { reportApiError } from './bug-reporting.js';

const API_BASE = import.meta.env['VITE_API_BASE'] || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(method),
        ...options?.headers,
      },
    });
  } catch (error) {
    reportApiError({
      method,
      path,
      message: error instanceof Error ? error.message : 'Request failed before response',
      stack: error instanceof Error ? error.stack ?? null : null,
    });
    throw error;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    const message = body.error ?? `Request failed: ${res.status}`;
    if (res.status >= 500) reportApiError({ method, path, status: res.status, message });
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/** Upload raw binary data (e.g. file bytes to R2 via the assets endpoint) */
async function putRaw(path: string, data: ArrayBuffer, contentType: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': contentType || 'application/octet-stream', ...csrfHeaders('PUT') },
      body: data,
    });
  } catch (error) {
    reportApiError({
      method: 'PUT',
      path,
      message: error instanceof Error ? error.message : 'Upload failed before response',
      stack: error instanceof Error ? error.stack ?? null : null,
    });
    throw error;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    const message = body.error ?? `Upload failed: ${res.status}`;
    if (res.status >= 500) reportApiError({ method: 'PUT', path, status: res.status, message });
    throw new Error(message);
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
