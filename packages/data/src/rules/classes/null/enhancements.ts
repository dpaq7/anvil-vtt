// Null Field Enhancement data from Draw Steel rules

import type { NullFieldEnhancement } from '@anvil/types';

export interface EnhancementData {
  id: NullFieldEnhancement;
  name: string;
  cost: number; // Discipline cost
  effect: string;
  duration: string;
  icon: string;
}

export const NULL_FIELD_ENHANCEMENTS: Record<NullFieldEnhancement, EnhancementData> = {
  graviticDisruption: {
    id: 'graviticDisruption',
    name: 'Gravitic Disruption',
    cost: 1,
    effect: 'Slide targets you damage 2 squares',
    duration: 'Until start of next turn',
    icon: '🌀',
  },
  inertialAnchor: {
    id: 'inertialAnchor',
    name: 'Inertial Anchor',
    cost: 1,
    effect: 'Targets in the Null Field cannot shift',
    duration: 'Until start of next turn',
    icon: '⚓',
  },
  synapticBreak: {
    id: 'synapticBreak',
    name: 'Synaptic Break',
    cost: 1,
    effect: "Allies' potency +1 in the Null Field",
    duration: 'Until start of next turn',
    icon: '🧠',
  },
};

// Get all enhancement options
export function getAllEnhancements(): EnhancementData[] {
  return Object.values(NULL_FIELD_ENHANCEMENTS);
}
