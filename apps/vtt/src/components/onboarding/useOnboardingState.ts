import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardRoleKey } from '../dashboard/types.js';
import { onboardingStorageKey } from './steps.js';

export type OnboardingStatus = 'unseen' | 'skipped' | 'completed' | 'never';

export interface OnboardingRecord {
  status: OnboardingStatus;
  checklistDismissed: boolean;
  /** Bump alongside a major redesign to re-offer the tour within a version. */
  tourVersion: number;
}

export interface OnboardingState {
  record: OnboardingRecord;
  setStatus: (status: OnboardingStatus) => void;
  dismissChecklist: () => void;
  /** Re-arm the full first-run experience (welcome, tour, checklist). */
  reset: () => void;
}

export const CURRENT_TOUR_VERSION = 1;

const DEFAULT_RECORD: OnboardingRecord = {
  status: 'unseen',
  checklistDismissed: false,
  tourVersion: CURRENT_TOUR_VERSION,
};

function readRecord(storageKey: string): OnboardingRecord {
  if (typeof window === 'undefined') return DEFAULT_RECORD;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_RECORD;
    // Legacy format: the bare string 'never' (the only value the old tour
    // ever wrote). Migrate it so "never show again" keeps being honored.
    if (raw === 'never') return { ...DEFAULT_RECORD, status: 'never' };
    const parsed = JSON.parse(raw) as Partial<OnboardingRecord>;
    if (
      parsed.status === 'unseen' ||
      parsed.status === 'skipped' ||
      parsed.status === 'completed' ||
      parsed.status === 'never'
    ) {
      return {
        status: parsed.status,
        checklistDismissed: parsed.checklistDismissed === true,
        tourVersion: typeof parsed.tourVersion === 'number' ? parsed.tourVersion : CURRENT_TOUR_VERSION,
      };
    }
  } catch {
    // Unreadable record — treat as a fresh user.
  }
  return DEFAULT_RECORD;
}

function writeRecord(storageKey: string, record: OnboardingRecord): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // Storage unavailable (private mode / quota) — the tour just re-offers.
  }
}

/**
 * Persistent onboarding state, one record per user+role+app-version.
 *
 * Unlike the original implementation — which only persisted the explicit
 * "never show again" checkbox, so the tour re-appeared on every visit —
 * finishing or skipping now persists too.
 */
export function useOnboardingState(
  userId: string | undefined,
  roleKey: DashboardRoleKey,
): OnboardingState {
  const storageKey = useMemo(() => onboardingStorageKey(userId, roleKey), [userId, roleKey]);
  const [record, setRecord] = useState<OnboardingRecord>(() => readRecord(storageKey));

  useEffect(() => {
    setRecord(readRecord(storageKey));
  }, [storageKey]);

  const update = useCallback(
    (patch: Partial<OnboardingRecord>) => {
      setRecord((current) => {
        const next = { ...current, ...patch, tourVersion: CURRENT_TOUR_VERSION };
        writeRecord(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const setStatus = useCallback((status: OnboardingStatus) => update({ status }), [update]);
  const dismissChecklist = useCallback(() => update({ checklistDismissed: true }), [update]);
  const reset = useCallback(
    () => update({ status: 'unseen', checklistDismissed: false }),
    [update],
  );

  return { record, setStatus, dismissChecklist, reset };
}
