/**
 * Session Types
 * Campaign, Module, Session hierarchy
 */

import type { Scene } from './scene.js';

/**
 * Participant in a session
 */
export interface Participant {
  id: string;
  name: string;
  role: 'director' | 'player';
  heroIds: string[];
  connectionStatus: 'connected' | 'away' | 'disconnected';
  cursorPosition?: { x: number; y: number };
}

/**
 * Session settings
 */
export interface SessionSettings {
  theme: 'dark' | 'light';
  audioEnabled: boolean;
  diceStyle: 'digital' | 'manual';
}

/**
 * Hierarchy reference for breadcrumb navigation
 */
export interface HierarchyRef {
  campaign: { id: string; title: string };
  module: { id: string; title: string };
  session: { id: string; title: string };
}

/**
 * Session - a single game session within a module
 * One sync document per active session
 */
export interface Session {
  id: string;
  moduleId: string;

  name: string;
  description?: string;
  order: number;
  createdAt: number;
  updatedAt: number;

  hierarchy: HierarchyRef;

  scenes: Scene[];
  activeSceneId: string;

  director: Participant;
  players: Participant[];

  settings: SessionSettings;

  /** Shared Victories earned */
  partyVictories: number;
}

/**
 * Module - a story arc or adventure within a campaign
 */
export interface Module {
  id: string;
  campaignId: string;

  name: string;
  description?: string;
  artworkUrl?: string;
  order: number;
  createdAt: number;
  updatedAt: number;

  sessionIds: string[];
}

/**
 * Campaign settings
 */
export interface CampaignSettings {
  defaultTheme: 'dark';
  sharedPartyVictories: number;
}

/**
 * Campaign - top-level organizational container
 */
export interface Campaign {
  id: string;

  name: string;
  description?: string;
  artworkUrl?: string;
  createdAt: number;
  updatedAt: number;

  directorId: string;

  moduleIds: string[];

  settings: CampaignSettings;
}
