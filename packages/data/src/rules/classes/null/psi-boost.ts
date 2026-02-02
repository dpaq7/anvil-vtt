// Psi Boost options from Draw Steel rules (L7+)

export type PsiBoostOption = 'magnifiedPower' | 'extendedRange' | 'amplifiedEffect';

export interface PsiBoostData {
  id: PsiBoostOption;
  name: string;
  cost: number; // Discipline cost
  effect: string;
  icon: string;
}

export const PSI_BOOST_OPTIONS: Record<PsiBoostOption, PsiBoostData> = {
  magnifiedPower: {
    id: 'magnifiedPower',
    name: 'Magnified Power',
    cost: 5,
    effect: "Increase the ability's potency by your Reason score",
    icon: '⚡',
  },
  extendedRange: {
    id: 'extendedRange',
    name: 'Extended Range',
    cost: 3,
    effect: "Increase the ability's range by 2 squares",
    icon: '📏',
  },
  amplifiedEffect: {
    id: 'amplifiedEffect',
    name: 'Amplified Effect',
    cost: 4,
    effect: 'Add 1 surge to the damage dealt',
    icon: '💥',
  },
};

// Get all psi boost options
export function getAllPsiBoostOptions(): PsiBoostData[] {
  return Object.values(PSI_BOOST_OPTIONS);
}

// Check if a boost can be afforded
export function canAffordBoost(boostId: PsiBoostOption, currentDiscipline: number): boolean {
  return currentDiscipline >= PSI_BOOST_OPTIONS[boostId].cost;
}
