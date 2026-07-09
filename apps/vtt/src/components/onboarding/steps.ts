import type { DashboardRoleKey } from '../dashboard/types.js';

export const APP_VERSION = '0.2.0';
const ONBOARDING_STORAGE_VERSION = `v${APP_VERSION}`;

export type OnboardingPhase = 'hidden' | 'welcome' | 'tour';
export type OnboardingPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement?: OnboardingPlacement;
}

export interface OnboardingRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Storage key is per-user, per-role, and versioned by APP_VERSION so a major
 * release can re-offer the tour.
 */
export function onboardingStorageKey(userId: string | undefined, roleKey: DashboardRoleKey): string {
  return `anvil-dashboard-onboarding:${ONBOARDING_STORAGE_VERSION}:${userId ?? 'anonymous'}:${roleKey}`;
}

/**
 * Find a step's anchor element. Warns in dev when an anchor has drifted so a
 * dashboard refactor that renames a `data-onboarding` attribute is caught
 * immediately instead of silently degrading the tour.
 */
export function queryOnboardingTarget(target: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(`[data-onboarding="${target}"]`);
  if (!el && import.meta.env.DEV) {
    console.warn(`[onboarding] missing anchor: data-onboarding="${target}"`);
  }
  return el;
}

const COMMON_OPENING_STEPS: OnboardingStep[] = [
  {
    id: 'toolkit',
    target: 'menu-bar',
    title: 'Your toolkit lives here',
    description:
      'Everything — dashboard, live tables, notes, theme, and the issue reporter — hangs off this rail. Collapse it when you want more table.',
    placement: 'right',
  },
  {
    id: 'role-switcher',
    target: 'menu-role-toggle',
    title: 'Two chairs at the table',
    description:
      'Switch between the Director flow (running the game) and the Player flow (playing in one) whenever you like.',
    placement: 'right',
  },
  {
    id: 'dashboard',
    target: 'dashboard-header',
    title: 'Home base',
    description:
      'Your dashboard greets you with quick actions for the things you do most. Sections below can be dragged into whatever order suits you.',
    placement: 'bottom',
  },
  {
    id: 'stats',
    target: 'dashboard-stats',
    title: 'The table at a glance',
    description: 'Live rooms, campaigns, heroes, and uploads — one quick pulse before you dive in.',
    placement: 'bottom',
  },
];

export const DASHBOARD_ONBOARDING_STEPS: Record<DashboardRoleKey, OnboardingStep[]> = {
  director: [
    ...COMMON_OPENING_STEPS,
    {
      id: 'campaigns',
      target: 'dashboard-section-campaigns',
      title: 'Campaigns are where prep happens',
      description:
        'Forge a campaign, sketch scenes onto your film strip, and invite your party. Your first steps checklist will walk you through it.',
      placement: 'top',
    },
  ],
  player: [
    ...COMMON_OPENING_STEPS,
    {
      id: 'characters',
      target: 'dashboard-section-characters',
      title: 'Heroes start here',
      description:
        'Roll up a hero, then join your Director’s table with a room code. Your first steps checklist will walk you through it.',
      placement: 'top',
    },
  ],
};
