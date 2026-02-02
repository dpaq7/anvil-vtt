// Fury Primordial Aspects (subclasses)
import type { FuryAspect } from '@anvil/types';

export interface FuryAspectDefinition {
  id: FuryAspect;
  name: string;
  description: string;
  focusCharacteristic: 'might' | 'agility';
  theme: string;
  features: string[]; // Feature IDs unlocked by this aspect
}

export const furyAspects: Record<FuryAspect, FuryAspectDefinition> = {
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    description: 'Focuses on physical strength, forced movement, and durability. Uses Might for Growing Ferocity bonuses.',
    focusCharacteristic: 'might',
    theme: 'Physical devastation through raw power',
    features: ['primordial-strength', 'unstoppable-force', 'immovable-object', 'bounder'],
  },
  reaver: {
    id: 'reaver',
    name: 'Reaver',
    description: 'Focuses on agility, surprise, stealth, and exploiting tactical advantage. Uses Agility for Growing Ferocity bonuses.',
    focusCharacteristic: 'agility',
    theme: 'Swift, cunning devastation',
    features: ['primordial-cunning', 'inescapable-wrath', 'see-through-tricks', 'unfettered'],
  },
  stormwight: {
    id: 'stormwight',
    name: 'Stormwight',
    description: 'Channels primordial storms, utilizing animal and hybrid forms with elemental damage. Requires kit selection.',
    focusCharacteristic: 'might',
    theme: 'Primal transformation and elemental fury',
    features: ['aspect-of-wild', 'relentless-hunter', 'tooth-and-claw', 'natures-knight', 'stormborn'],
  },
};

export const getAspectById = (id: FuryAspect): FuryAspectDefinition => furyAspects[id];

export const getAllAspects = (): FuryAspectDefinition[] => Object.values(furyAspects);
