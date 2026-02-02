// Elementalist Elements (Subclass) data from Draw Steel rules

import type { ElementalistElement } from '@anvil/types';

export interface ElementData {
  id: ElementalistElement;
  name: string;
  theme: string;
  description: string;
  damageType: string;
  color: string;
  mantleBonus: string;
  level5Feature: {
    name: string;
    description: string;
  };
}

export const ELEMENTALIST_ELEMENTS: Record<ElementalistElement, ElementData> = {
  earth: {
    id: 'earth',
    name: 'Earth',
    theme: 'Stone, stability, and endurance',
    description:
      'You draw power from the earth itself, commanding stone and metal. Your magic grants unshakeable defense and crushing force.',
    damageType: 'Bludgeoning',
    color: '#92400e',
    mantleBonus: '+1 Stability and resistance to forced movement',
    level5Feature: {
      name: 'Stone Body',
      description:
        'While your Mantle of Essence is active, you gain resistance to physical damage equal to your Reason score.',
    },
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    theme: 'Flame, destruction, and passion',
    description:
      'You wield the primal force of fire, burning away opposition. Your magic ignites foes and leaves devastation in your wake.',
    damageType: 'Fire',
    color: '#dc2626',
    mantleBonus: '+2 damage to all fire abilities',
    level5Feature: {
      name: 'Blazing Fury',
      description:
        'When you deal fire damage to an enemy, they take additional fire damage equal to half your Reason score at the start of their next turn.',
    },
  },
  green: {
    id: 'green',
    name: 'Green',
    theme: 'Nature, growth, and vitality',
    description:
      'You channel the life force of nature, commanding plants and healing energy. Your magic restores allies and entangles foes.',
    damageType: 'Poison',
    color: '#16a34a',
    mantleBonus: 'Allies within 2 squares gain temporary Stamina equal to your Reason score at start of each round',
    level5Feature: {
      name: 'Verdant Growth',
      description:
        'When you use a healing ability, the target also gains temporary Stamina equal to your Reason score.',
    },
  },
  void: {
    id: 'void',
    name: 'Void',
    theme: 'Darkness, distance, and the spaces between',
    description:
      'You tap into the void between worlds, commanding darkness and spatial magic. Your spells reach further and bypass defenses.',
    damageType: 'Cold',
    color: '#4c1d95',
    mantleBonus: '+2 range on all magic abilities',
    level5Feature: {
      name: 'Void Reach',
      description:
        'Your abilities ignore cover and concealment. Enemies cannot use triggered actions to avoid your abilities.',
    },
  },
};

// Get element data by ID
export function getElementData(elementId: ElementalistElement): ElementData {
  return ELEMENTALIST_ELEMENTS[elementId];
}
