import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AppEnv } from '../types.js';
import type { ValidationResult } from './validation.js';

interface JsonBodyOptions {
  maxBytes: number;
  label?: string;
}

export async function readJsonBody<T>(
  c: Context<AppEnv>,
  options: JsonBodyOptions,
): Promise<ValidationResult<T>> {
  const contentLength = c.req.header('content-length');
  if (contentLength) {
    const length = Number.parseInt(contentLength, 10);
    if (Number.isFinite(length) && length > options.maxBytes) {
      return { ok: false, error: `${options.label ?? 'Request'} is too large`, status: 413 };
    }
  }

  let text: string;
  try {
    text = await c.req.text();
  } catch {
    return { ok: false, error: 'Could not read request body', status: 400 };
  }

  if (new TextEncoder().encode(text).byteLength > options.maxBytes) {
    return { ok: false, error: `${options.label ?? 'Request'} is too large`, status: 413 };
  }

  try {
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: 'Invalid JSON body', status: 400 };
  }
}

export function jsonError(c: Context<AppEnv>, result: { error: string; status?: number }): Response {
  return c.json({ error: result.error }, (result.status ?? 400) as ContentfulStatusCode);
}
