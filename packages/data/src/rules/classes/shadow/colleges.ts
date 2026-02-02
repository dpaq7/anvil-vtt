// Shadow Colleges (Subclass) data from Draw Steel rules

import type { ShadowCollege } from '@anvil/types';

export interface CollegeData {
  id: ShadowCollege;
  name: string;
  theme: string;
  description: string;
  signatureAbility: string;
  level5Feature: {
    name: string;
    description: string;
  };
}

export const SHADOW_COLLEGES: Record<ShadowCollege, CollegeData> = {
  'black-ash': {
    id: 'black-ash',
    name: 'Black Ash',
    theme: 'Ash-teleportation and necrotic shadow magic',
    description:
      'You learned the black ash techniques in secret chambers beneath a forgotten temple. Your magic draws on the boundary between life and death.',
    signatureAbility: 'Ash Step: Teleport through shadows leaving a trail of cinders',
    level5Feature: {
      name: 'Ash Cloud',
      description:
        'When you teleport, you can create a cloud of black ash in a 1-square burst at your origin point. The cloud heavily obscures the area until the end of your next turn.',
    },
  },
  'caustic-alchemy': {
    id: 'caustic-alchemy',
    name: 'Caustic Alchemy',
    theme: 'Poisons, smoke bombs, and alchemical tricks',
    description:
      'You mastered the art of alchemical weaponry. Your poisons burn, your smoke obscures, and your concoctions confound your enemies.',
    signatureAbility: 'Alchemical Strike: Apply poison damage and conditions to attacks',
    level5Feature: {
      name: 'Virulent Compounds',
      description:
        'Your poisons are especially potent. When you deal poison damage, the target has a bane on their next power roll.',
    },
  },
  'harlequin-mask': {
    id: 'harlequin-mask',
    name: 'Harlequin Mask',
    theme: 'Illusions and theatrical deception',
    description:
      'You trained in the ancient art of the Harlequin, using illusions and misdirection to confound your foes while entertaining your allies.',
    signatureAbility: 'Mirror Image: Create illusory duplicates to confuse attackers',
    level5Feature: {
      name: 'Dramatic Exit',
      description:
        'When you use Hesitation Is Weakness, you can leave behind an illusory duplicate that lasts until the start of your next turn. Enemies who attack the duplicate waste their action.',
    },
  },
};

// Get college data by ID
export function getCollegeData(collegeId: ShadowCollege): CollegeData {
  return SHADOW_COLLEGES[collegeId];
}
