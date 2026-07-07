import { useSyncExternalStore } from 'react';
import { PHONE_COMPANION_MEDIA_QUERY } from '../lib/device.js';

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(PHONE_COMPANION_MEDIA_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(PHONE_COMPANION_MEDIA_QUERY).matches;
}

/**
 * Reactive variant of `isPhoneCompanionViewport` — re-renders when the
 * viewport crosses the phone-companion media query (rotation, resize).
 */
export function useIsPhoneViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
