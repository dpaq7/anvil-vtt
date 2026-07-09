import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { HeroSummary, Note } from '@anvil/types';
import type { CampaignData, CampaignSession } from '../sessions/types.js';

export const DASHBOARD_BACKGROUNDS = {
  director: '/dashboard/director-flow-background.webp',
  player: '/dashboard/player-flow-background.webp',
} as const;

export interface AssetItem {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  file_size: number | null;
  created_at: string;
  uploaded_at: string | null;
}

export interface DashboardNote extends Note {
  campaignName: string;
}

export interface DashboardState {
  campaigns: CampaignData[];
  heroes: HeroSummary[];
  notes: DashboardNote[];
  assets: AssetItem[];
}

export interface LiveTable {
  campaign: CampaignData;
  session: CampaignSession;
}

export interface RecentCharacter {
  id: string;
  name: string;
  detail: string;
  badge: string;
  date: string | null;
  to: string;
}

export interface StatConfig {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone: 'cyan' | 'amber' | 'green' | 'rose';
}

export interface QuickAction {
  label: string;
  to: string;
  icon: LucideIcon;
}

export type DashboardSectionId = 'live' | 'campaigns' | 'notes' | 'characters' | 'assets';
export type DashboardRoleKey = keyof typeof DASHBOARD_BACKGROUNDS;

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  eyebrow: string;
  title: string;
  to?: string;
  className?: string;
  body: ReactNode;
}
