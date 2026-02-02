/**
 * Pre-Generated Scenes
 *
 * Official Draw Steel Encounters pre-built scenes.
 * Includes montage scenarios and negotiation NPCs ported from Forgesteel.
 */

// Individual scenes
export { SAVE_THE_HOSTAGE } from './save-the-hostage.js';
export { KILL_LORD_RELG } from './kill-lord-relg.js';
export { INFILTRATE_MASQUERADE } from './infiltrate-masquerade.js';
export { RECRUITING_MERCS } from './recruiting-mercs.js';

// Montage Scenarios (from Forgesteel)
export {
  FIGHT_FIRE,
  INFILTRATE_PALACE,
  PREPARE_FOR_BATTLE,
  TRACK_THE_FUGITIVE,
  WILDERNESS_RACE,
  MONTAGE_SCENARIOS,
  getMontageScenarioById,
  getAllMontageScenarios,
} from './montage-scenarios.js';

// Negotiation NPCs (from Forgesteel)
export {
  BANDIT_CHIEF,
  KNIGHT,
  GUILDMASTER,
  WARLORD,
  BURGOMASTER,
  VIRTUOSO,
  HIGH_PRIEST,
  DUKE,
  DRAGON,
  MONARCH,
  LICH,
  DEITY,
  NEGOTIATION_NPCS,
  getNegotiationNPCById,
  getAllNegotiationNPCs,
  getNegotiationNPCsByImpression,
  getNegotiationNPCsByTier,
} from './negotiation-npcs.js';

import type { PregenScene } from '../types.js';
import { SAVE_THE_HOSTAGE } from './save-the-hostage.js';
import { KILL_LORD_RELG } from './kill-lord-relg.js';
import { INFILTRATE_MASQUERADE } from './infiltrate-masquerade.js';
import { RECRUITING_MERCS } from './recruiting-mercs.js';
import { MONTAGE_SCENARIOS } from './montage-scenarios.js';
import { NEGOTIATION_NPCS } from './negotiation-npcs.js';

/**
 * All pre-generated scenes (individual + collections)
 */
export const PREGEN_SCENES: PregenScene[] = [
  // Individual scenes
  SAVE_THE_HOSTAGE,
  KILL_LORD_RELG,
  INFILTRATE_MASQUERADE,
  RECRUITING_MERCS,
  // Forgesteel montage scenarios
  ...MONTAGE_SCENARIOS,
  // Forgesteel negotiation NPCs
  ...NEGOTIATION_NPCS,
];

/**
 * Get pre-gen scenes by type
 */
export function getPregenScenesByType(type: PregenScene['type']): PregenScene[] {
  return PREGEN_SCENES.filter(scene => scene.type === type);
}

/**
 * Get pre-gen scene by ID
 */
export function getPregenSceneById(id: string): PregenScene | undefined {
  return PREGEN_SCENES.find(scene => scene.id === id);
}
