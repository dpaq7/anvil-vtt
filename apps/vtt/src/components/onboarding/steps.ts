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

const COMMON_MENU_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'account-menu',
    target: 'menu-account',
    title: 'Account menu',
    description: 'Open profile settings, app preferences, and data controls from here.',
    placement: 'right',
  },
  {
    id: 'role-switcher',
    target: 'menu-role-toggle',
    title: 'Flow switcher',
    description: 'Move between Director and Player flow when you need a different workspace.',
    placement: 'right',
  },
  {
    id: 'dashboard-nav',
    target: 'menu-anvil',
    title: 'Dashboard',
    description: 'Return to this overview from anywhere in the app.',
    placement: 'right',
  },
  {
    id: 'live-nav',
    target: 'menu-live',
    title: 'Live',
    description: 'Find active tables, lobby rooms, and session entry points.',
    placement: 'right',
  },
];

const COMMON_UTILITY_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'notes-nav',
    target: 'menu-notes',
    title: 'Notes',
    description: 'Open campaign and personal notes without leaving the main workspace.',
    placement: 'right',
  },
  {
    id: 'report-issue',
    target: 'menu-report-issue',
    title: 'Report issue',
    description:
      'Send a manual report when something crashes, looks wrong, or feels out of sync. Recent navigation and session breadcrumbs are included automatically.',
    placement: 'right',
  },
  {
    id: 'theme-toggle',
    target: 'menu-theme',
    title: 'Theme',
    description: 'Switch between light and dark display modes.',
    placement: 'right',
  },
  {
    id: 'sidebar-toggle',
    target: 'menu-sidebar-toggle',
    title: 'Menu width',
    description: 'Collapse or expand the menu bar when you want more room on the dashboard.',
    placement: 'right',
  },
];

export const DASHBOARD_ONBOARDING_STEPS: Record<DashboardRoleKey, OnboardingStep[]> = {
  director: [
    ...COMMON_MENU_ONBOARDING_STEPS,
    {
      id: 'campaigns-nav',
      target: 'menu-campaigns',
      title: 'Campaigns',
      description: 'Build campaigns, organize modules, prepare scenes, and manage invites.',
      placement: 'right',
    },
    {
      id: 'assets-nav',
      target: 'menu-assets',
      title: 'Assets',
      description: 'Manage maps, portraits, audio, terrain, NPCs, and other table material.',
      placement: 'right',
    },
    ...COMMON_UTILITY_ONBOARDING_STEPS,
    {
      id: 'dashboard-header',
      target: 'dashboard-header',
      title: 'Director dashboard',
      description: 'This header summarizes your current prep surface and keeps the primary Director actions close.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-actions',
      target: 'dashboard-actions',
      title: 'Quick actions',
      description: 'Jump straight to Live, Campaigns, Assets, or Notes from these shortcut buttons.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-stats',
      target: 'dashboard-stats',
      title: 'Prep snapshot',
      description: 'These counters show live rooms, campaign volume, prepared scenes, and uploaded assets.',
      placement: 'bottom',
    },
    {
      id: 'live-section',
      target: 'dashboard-section-live',
      title: 'Sessions in progress',
      description: 'Active and lobby sessions appear here so you can rejoin the table quickly.',
      placement: 'bottom',
    },
    {
      id: 'campaigns-section',
      target: 'dashboard-section-campaigns',
      title: 'Campaign activity',
      description: 'Recent campaigns stay visible with session, scene, player, and last-played context.',
      placement: 'right',
    },
    {
      id: 'notes-section',
      target: 'dashboard-section-notes',
      title: 'Notebook updates',
      description: 'Recently updated notes surface here for fast prep review.',
      placement: 'left',
    },
    {
      id: 'characters-section',
      target: 'dashboard-section-characters',
      title: 'Player roster',
      description: 'Joined player characters are collected here as your table fills out.',
      placement: 'right',
    },
    {
      id: 'assets-section',
      target: 'dashboard-section-assets',
      title: 'Uploads',
      description: 'Your newest maps, portraits, audio, and files appear here after upload.',
      placement: 'left',
    },
  ],
  player: [
    ...COMMON_MENU_ONBOARDING_STEPS,
    {
      id: 'heroes-nav',
      target: 'menu-heroes',
      title: 'Heroes',
      description: 'Create heroes, review character sheets, and prepare for live play.',
      placement: 'right',
    },
    ...COMMON_UTILITY_ONBOARDING_STEPS,
    {
      id: 'dashboard-header',
      target: 'dashboard-header',
      title: 'Player dashboard',
      description: 'This header keeps your table status, characters, and player actions in one place.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-actions',
      target: 'dashboard-actions',
      title: 'Quick actions',
      description: 'Jump to live rooms, heroes, join codes, or notes from these shortcut buttons.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-stats',
      target: 'dashboard-stats',
      title: 'Play snapshot',
      description: 'These counters show live rooms, joined campaigns, heroes, and note activity.',
      placement: 'bottom',
    },
    {
      id: 'live-section',
      target: 'dashboard-section-live',
      title: 'Available sessions',
      description: 'Rooms opened by your Director appear here when it is time to join.',
      placement: 'bottom',
    },
    {
      id: 'campaigns-section',
      target: 'dashboard-section-campaigns',
      title: 'Joined tables',
      description: 'Campaigns you belong to are listed here with recent activity and table context.',
      placement: 'right',
    },
    {
      id: 'notes-section',
      target: 'dashboard-section-notes',
      title: 'Notebook updates',
      description: 'Recent personal, session, and campaign notes are easy to reopen from this area.',
      placement: 'left',
    },
    {
      id: 'characters-section',
      target: 'dashboard-section-characters',
      title: 'Hero roster',
      description: 'Your heroes appear here with level and class details for fast access.',
      placement: 'right',
    },
    {
      id: 'assets-section',
      target: 'dashboard-section-assets',
      title: 'Uploads',
      description: 'Recent files connected to your characters or notes appear here.',
      placement: 'left',
    },
  ],
};

export function onboardingStorageKey(userId: string | undefined, roleKey: DashboardRoleKey) {
  return `anvil-dashboard-onboarding:${ONBOARDING_STORAGE_VERSION}:${userId ?? 'anonymous'}:${roleKey}`;
}

export function hasOnboardingDismissal(storageKey: string) {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'never';
  } catch {
    return false;
  }
}

export function writeOnboardingDismissal(storageKey: string) {
  try {
    localStorage.setItem(storageKey, 'never');
  } catch {
    /* noop */
  }
}
