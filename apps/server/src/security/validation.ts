export interface ValidationError {
  error: string;
  status?: number;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; status?: number };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function jsonByteLength(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function trimString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

export function optionalTrimString(value: unknown, maxLength: number): string | undefined {
  if (value === undefined) return undefined;
  if (value === null) return '';
  if (typeof value !== 'string') return undefined;
  return value.trim().slice(0, maxLength);
}

export function nullableTrimString(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function boundedInteger(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

export function safeStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, maxLength))
    .slice(0, maxItems);
}

/**
 * Escape LIKE wildcard metacharacters (`%`, `_`, and the escape char itself) in
 * user-supplied search terms. Pair with `LIKE ? ESCAPE '\'` so a search for
 * "50%" matches a literal percent instead of acting as a wildcard.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Returns true if any object in the structure carries a prototype-pollution key
 * (`__proto__`, `prototype`, `constructor`). Use before persisting or merging
 * client-supplied JSON. The depth guard bounds traversal cost on hostile input.
 */
export function hasUnsafeObjectKey(value: unknown, depth = 0): boolean {
  if (depth > 64 || value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => hasUnsafeObjectKey(item, depth + 1));
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (UNSAFE_OBJECT_KEYS.has(key)) return true;
    if (hasUnsafeObjectKey((value as Record<string, unknown>)[key], depth + 1)) return true;
  }
  return false;
}

/**
 * Returns true if the structure nests deeper than `maxDepth` levels of objects
 * or arrays. Guards against deeply-nested JSON that fits a byte budget but can
 * exhaust the stack during later JSON operations.
 */
export function exceedsJsonDepth(value: unknown, maxDepth: number, depth = 1): boolean {
  if (value === null || typeof value !== 'object') return false;
  if (depth > maxDepth) return true;
  const entries = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  return entries.some((entry) => exceedsJsonDepth(entry, maxDepth, depth + 1));
}
