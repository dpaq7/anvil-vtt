// Psionic Augmentation data from Draw Steel rules

import type { PsionicAugmentation } from '@anvil/types';

export interface AugmentationData {
  id: PsionicAugmentation;
  name: string;
  effects: string[];
  statModifications: {
    staminaPerLevel?: number; // Stamina bonus per level
    stability?: number;
    damage?: number; // On psionic abilities
    speed?: number;
    disengage?: number;
  };
}

export const PSIONIC_AUGMENTATIONS: Record<PsionicAugmentation, AugmentationData> = {
  density: {
    id: 'density',
    name: 'Density Augmentation',
    effects: ['+6 Stamina per level', '+1 Stability'],
    statModifications: {
      staminaPerLevel: 6,
      stability: 1,
    },
  },
  force: {
    id: 'force',
    name: 'Force Augmentation',
    effects: ['+1 rolled damage on psionic abilities'],
    statModifications: {
      damage: 1,
    },
  },
  speed: {
    id: 'speed',
    name: 'Speed Augmentation',
    effects: ['+1 speed', '+1 Disengage shift distance'],
    statModifications: {
      speed: 1,
      disengage: 1,
    },
  },
};

// Calculate total stat bonuses from augmentation
export function getAugmentationBonuses(
  augmentation: PsionicAugmentation | undefined,
  level: number
): { stamina: number; stability: number; damage: number; speed: number; disengage: number } {
  if (!augmentation) {
    return { stamina: 0, stability: 0, damage: 0, speed: 0, disengage: 0 };
  }

  const data = PSIONIC_AUGMENTATIONS[augmentation];
  return {
    stamina: (data.statModifications.staminaPerLevel || 0) * level,
    stability: data.statModifications.stability || 0,
    damage: data.statModifications.damage || 0,
    speed: data.statModifications.speed || 0,
    disengage: data.statModifications.disengage || 0,
  };
}
