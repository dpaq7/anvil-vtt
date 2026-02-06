import { useEffect, useRef } from 'react';
import type { CharacterInProgress } from '@anvil/data';

const DB_NAME = 'anvil-wizard';
const STORE_NAME = 'wizard-state';
const KEY = 'current';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saved wizard state structure.
 * Note: `step` can be a number (legacy format) or string (new step ID format).
 */
interface SavedWizardState {
  step: number | string;
  character: CharacterInProgress;
}

export async function loadWizardState(): Promise<SavedWizardState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveWizardState(step: number | string, character: CharacterInProgress): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ step, character }, KEY);
  } catch {
    // silently fail
  }
}

export async function clearWizardState(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(KEY);
  } catch {
    // silently fail
  }
}

export function useWizardPersistence(
  step: number | string,
  character: CharacterInProgress,
) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    saveWizardState(step, character);
  }, [step, character]);
}
