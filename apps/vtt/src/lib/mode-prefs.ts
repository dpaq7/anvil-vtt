import { useSyncExternalStore } from 'react';

/*
 * Client-side preferences for the mode screens (DESIGN.md section 9, Gate 3). They live on this
 * device only and are never sent to the table.
 * - Text size: the Smaller / Larger text buttons scale the reading surfaces of Story, Montage and
 *   Negotiation. The CSS keeps every size at 13 px or more (section 3.3).
 * - Volume: the Player's own volume for the Director's sound. It changes this browser's audio only.
 */

export const TEXT_STEPS = [0.85, 1, 1.15, 1.3, 1.5] as const;
const TEXT_KEY = 'anvil-mode-text';
const VOLUME_KEY = 'anvil-player-volume';
const DEFAULT_TEXT_STEP = 1;
const DEFAULT_VOLUME = 0.4;

type Listener = () => void;

function createStore<T>(key: string, parse: (raw: string | null) => T) {
  const listeners = new Set<Listener>();
  let value = (() => {
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      return parse(null);
    }
  })();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Still applies for this visit.
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const textStore = createStore<number>(TEXT_KEY, (raw) => {
  const n = raw === null ? NaN : Number(JSON.parse(raw));
  return Number.isInteger(n) && n >= 0 && n < TEXT_STEPS.length ? n : DEFAULT_TEXT_STEP;
});

const volumeStore = createStore<number>(VOLUME_KEY, (raw) => {
  const n = raw === null ? NaN : Number(JSON.parse(raw));
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : DEFAULT_VOLUME;
});

/** The text step: an index into TEXT_STEPS, with helpers to step it. */
export function useTextScale() {
  const step = useSyncExternalStore(textStore.subscribe, textStore.get, textStore.get);
  return {
    step,
    scale: TEXT_STEPS[step] ?? 1,
    canSmaller: step > 0,
    canLarger: step < TEXT_STEPS.length - 1,
    smaller: () => textStore.set(Math.max(0, step - 1)),
    larger: () => textStore.set(Math.min(TEXT_STEPS.length - 1, step + 1)),
  };
}

/** The Player's own volume, 0 to 1. */
export function usePlayerVolume(): [number, (volume: number) => void] {
  const volume = useSyncExternalStore(volumeStore.subscribe, volumeStore.get, volumeStore.get);
  return [volume, (next) => volumeStore.set(Math.max(0, Math.min(1, next)))];
}
