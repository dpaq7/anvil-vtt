// Censor Orders (Subclass) data from Draw Steel rules

import type { CensorOrder } from '@anvil/types';

export interface OrderData {
  id: CensorOrder;
  name: string;
  theme: string;
  description: string;
  judgmentBonus: string;
  level5Feature: {
    name: string;
    description: string;
  };
}

export const CENSOR_ORDERS: Record<CensorOrder, OrderData> = {
  exorcist: {
    id: 'exorcist',
    name: 'Exorcist',
    theme: 'Banishing supernatural threats',
    description:
      'You specialize in confronting and destroying supernatural entities. Your holy power burns away the influence of demons, undead, and corrupted spirits.',
    judgmentBonus: 'When you judge a creature, you can teleport up to 2 squares toward them.',
    level5Feature: {
      name: 'Banishing Light',
      description:
        'When you deal holy damage to your judged target, they cannot use teleportation or phasing abilities until the end of your next turn.',
    },
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    theme: 'Divine prophecy and immediate retribution',
    description:
      'You see the threads of fate and deliver divine punishment swiftly. Your judgment strikes fear into those who would oppose the divine order.',
    judgmentBonus: 'When you judge a creature, they take holy damage equal to your Presence score.',
    level5Feature: {
      name: 'Foreseen Doom',
      description:
        'When your judged target deals damage to you, they take holy damage equal to twice your Presence score.',
    },
  },
  paragon: {
    id: 'paragon',
    name: 'Paragon',
    theme: 'Heavenly force and vertical control',
    description:
      'You embody the might of the heavens, bringing enemies low or lifting allies high. Your mastery of divine force reshapes the battlefield.',
    judgmentBonus: 'When you judge a creature, you can pull them up to 2 squares toward you (vertically or horizontally).',
    level5Feature: {
      name: 'Ascendant Strike',
      description:
        'When you force move your judged target vertically, they take additional holy damage equal to the distance moved.',
    },
  },
};

// Get order data by ID
export function getOrderData(orderId: CensorOrder): OrderData {
  return CENSOR_ORDERS[orderId];
}
