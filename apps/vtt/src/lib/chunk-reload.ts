import { lazy, type ComponentType } from 'react';

const CHUNK_RELOAD_ATTEMPT_KEY = 'anvil:chunk-reload-attempted-at';
const CHUNK_RELOAD_QUERY_PARAM = '__anvil_reload';
const CHUNK_RELOAD_ATTEMPT_TTL_MS = 5 * 60 * 1000;

const CHUNK_LOAD_ERROR_PATTERN =
  /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module|loading chunk \d+ failed|chunkloaderror/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : '';
  return CHUNK_LOAD_ERROR_PATTERN.test(`${name} ${message}`);
}

function getReloadUrl(now: number): URL | null {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  url.searchParams.set(CHUNK_RELOAD_QUERY_PARAM, String(now));
  return url;
}

function hasRecentReloadAttempt(now: number): boolean {
  try {
    const attemptedAt = Number(
      sessionStorage.getItem(CHUNK_RELOAD_ATTEMPT_KEY),
    );
    return (
      Number.isFinite(attemptedAt) &&
      now - attemptedAt < CHUNK_RELOAD_ATTEMPT_TTL_MS
    );
  } catch {
    return false;
  }
}

function markReloadAttempt(now: number): void {
  try {
    sessionStorage.setItem(CHUNK_RELOAD_ATTEMPT_KEY, String(now));
  } catch {
    // Storage may be unavailable in private browsing modes.
  }
}

export function markChunkLoadSuccess(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem(CHUNK_RELOAD_ATTEMPT_KEY);
  } catch {
    // Storage may be unavailable in private browsing modes.
  }

  const url = new URL(window.location.href);
  if (!url.searchParams.has(CHUNK_RELOAD_QUERY_PARAM)) return;
  url.searchParams.delete(CHUNK_RELOAD_QUERY_PARAM);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

export function refreshForChunkLoadError(
  options: { force?: boolean } = {},
): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();
  const currentUrl = new URL(window.location.href);
  const alreadyCacheBusted = currentUrl.searchParams.has(
    CHUNK_RELOAD_QUERY_PARAM,
  );

  if (!options.force && alreadyCacheBusted && hasRecentReloadAttempt(now)) {
    return false;
  }

  markReloadAttempt(now);
  const reloadUrl = getReloadUrl(now);
  if (!reloadUrl) return false;
  window.location.replace(reloadUrl.toString());
  return true;
}

export function lazyWithChunkReload(
  load: () => Promise<{ default: ComponentType }>,
) {
  return lazy(async () => {
    try {
      const module = await load();
      markChunkLoadSuccess();
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && refreshForChunkLoadError()) {
        return await new Promise<never>(() => {});
      }
      throw error;
    }
  });
}
