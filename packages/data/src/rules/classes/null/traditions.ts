// Null Traditions (Subclass) data from Draw Steel rules

import type { NullTradition } from '@anvil/types';

export interface TraditionMasteryBenefit {
  threshold: number;
  benefit: string;
}

export interface TraditionData {
  id: NullTradition;
  name: string;
  focus: string;
  inertialShieldBonus: string;
  masteryBenefits: TraditionMasteryBenefit[];
  level5Feature: {
    name: string;
    description: string;
  };
}

export const NULL_TRADITIONS: Record<NullTradition, TraditionData> = {
  chronokinetic: {
    id: 'chronokinetic',
    name: 'Chronokinetic',
    focus: 'Manipulating the flow of time and movement',
    inertialShieldBonus: 'Gain the Disengage move action (free triggered action)',
    masteryBenefits: [
      { threshold: 4, benefit: '+1 surge upon movement' },
      { threshold: 6, benefit: 'Edge on maneuvers' },
      { threshold: 8, benefit: '+2 surges upon movement' },
      { threshold: 10, benefit: 'Double edge on maneuvers' },
    ],
    level5Feature: {
      name: 'Instant Action',
      description:
        'If not surprised, gain edge on ability rolls and 2 surges at start of combat. Can spend 3 Discipline to remove Surprise.',
    },
  },
  cryokinetic: {
    id: 'cryokinetic',
    name: 'Cryokinetic',
    focus: 'Harnessing absolute cold energy',
    inertialShieldBonus: 'Can use the Grab maneuver (free triggered action)',
    masteryBenefits: [
      { threshold: 4, benefit: '+1 surge upon grabbing or enemy movement in Null Field' },
      { threshold: 6, benefit: 'Edge on maneuvers' },
      { threshold: 8, benefit: '+2 surges upon grabbing or enemy movement in Null Field' },
      { threshold: 10, benefit: 'Double edge on maneuvers' },
    ],
    level5Feature: {
      name: 'Frozen Grip',
      description:
        'Grabbed targets take cold damage equal to your Intuition score at the start of their turn.',
    },
  },
  metakinetic: {
    id: 'metakinetic',
    name: 'Metakinetic',
    focus: 'Amplifying psionic potential and durability',
    inertialShieldBonus: 'Can use the Knockback maneuver (free triggered action)',
    masteryBenefits: [
      { threshold: 4, benefit: '+1 surge upon taking damage or being force moved' },
      { threshold: 6, benefit: 'Edge on maneuvers' },
      { threshold: 8, benefit: '+2 surges upon taking damage or being force moved' },
      { threshold: 10, benefit: 'Double edge on maneuvers' },
    ],
    level5Feature: {
      name: 'Inertial Fulcrum',
      description:
        'Whenever reducing damage or forced movement, deal damage equal to Reason score to one enemy in the Null Field.',
    },
  },
};

// Get the active threshold tier based on current Discipline
export function getActiveThreshold(discipline: number): 0 | 4 | 6 | 8 | 10 | 12 {
  if (discipline >= 12) return 12;
  if (discipline >= 10) return 10;
  if (discipline >= 8) return 8;
  if (discipline >= 6) return 6;
  if (discipline >= 4) return 4;
  return 0;
}

// Get all active benefits for a tradition at a given Discipline level
export function getActiveBenefits(
  tradition: NullTradition,
  discipline: number
): TraditionMasteryBenefit[] {
  const traditionData = NULL_TRADITIONS[tradition];
  const threshold = getActiveThreshold(discipline);
  return traditionData.masteryBenefits.filter((b) => b.threshold <= threshold);
}
