// Fury class features
import type { Feature } from '@anvil/types';

// Core Fury Features (all aspects)
export const furyFeatures: Feature[] = [
  // Level 1 Core
  {
    id: 'mighty-leaps',
    name: 'Mighty Leaps',
    description: 'You cannot obtain lower than a tier 2 outcome on any Might test made to jump.',
    levelRequired: 1,
  },

  // Level 4 Core Features
  {
    id: 'primordial-attunement',
    name: 'Primordial Attunement',
    description: 'You sense whether any creature within 10 squares has damage immunity or weakness to elemental damage (acid, cold, corruption, fire, lightning, poison, or sonic), knowing the value and specific damage type.',
    levelRequired: 4,
  },
  {
    id: 'primordial-strike',
    name: 'Primordial Strike',
    description: 'As part of any strike, you can spend 1 Ferocity to gain 1 Surge (must be used on that strike). The extra damage dealt by the surge can be converted into any elemental damage type.',
    levelRequired: 4,
  },
  {
    id: 'damaging-ferocity',
    name: 'Damaging Ferocity',
    description: 'You now gain +2 Ferocity (instead of +1) the first time per round you take damage.',
    levelRequired: 4,
  },

  // Level 7 Core Features
  {
    id: 'greater-ferocity',
    name: 'Greater Ferocity',
    description: 'At the start of your turn, you now gain 1d3 + 1 Ferocity (instead of 1d3).',
    levelRequired: 7,
  },
  {
    id: 'elemental-form',
    name: 'Elemental Form',
    description: 'You gain elemental damage immunity equal to your Might score to all elemental damage types. A Stormwight gains immunity equal to twice their Might score to the damage type of their Primordial Storm.',
    levelRequired: 7,
  },

  // Level 10 Core Features
  {
    id: 'primordial-power',
    name: 'Primordial Power',
    description: 'You gain an epic resource called Primordial Power equal to XP gained during a respite. Primordial Power can be spent as Ferocity. You can spend any amount of Primordial Power as a free maneuver to end one effect on yourself for each point spent.',
    levelRequired: 10,
  },
  {
    id: 'primordial-ferocity',
    name: 'Primordial Ferocity',
    description: 'You now gain +3 Ferocity (instead of +2) the first time per round you take damage.',
    levelRequired: 10,
  },
];

// Berserker-specific Features
export const berserkerFeatures: Feature[] = [
  {
    id: 'primordial-strength',
    name: 'Primordial Strength',
    description: 'Your weapon strikes against objects deal extra damage equal to your Might score. Pushing a creature into an object deals extra damage equal to your Might score.',
    levelRequired: 1,
  },
  {
    id: 'unstoppable-force',
    name: 'Unstoppable Force',
    description: 'You can use strike signature or heroic abilities instead of free strikes on a Charge action. You can jump during a charge.',
    levelRequired: 2,
  },
  {
    id: 'immovable-object',
    name: 'Immovable Object',
    description: 'Add your level to your effective size for lifting and resisting forced movement. You gain bonus stability equal to your Might score.',
    levelRequired: 3,
  },
  {
    id: 'bounder',
    name: 'Bounder',
    description: 'Your jump distance and height double. You reduce falling height by your jump distance. You are not prone when landing on another creature after falling.',
    levelRequired: 5,
  },
];

// Reaver-specific Features
export const reaverFeatures: Feature[] = [
  {
    id: 'primordial-cunning',
    name: 'Primordial Cunning',
    description: 'You are never surprised. You can slide instead of push when imposing forced movement.',
    levelRequired: 1,
  },
  {
    id: 'inescapable-wrath',
    name: 'Inescapable Wrath',
    description: 'Your speed increases by a bonus equal to your Agility score. You ignore difficult terrain.',
    levelRequired: 2,
  },
  {
    id: 'see-through-tricks',
    name: 'See Through Their Tricks',
    description: 'You have a double edge on tests to search for hidden creatures, discern motives, detect lies, and gamble.',
    levelRequired: 3,
  },
  {
    id: 'unfettered',
    name: 'Unfettered',
    description: 'You can end the restrained condition on yourself at the start of your turn. You have a double edge on tests to escape confinement or imprisonment.',
    levelRequired: 5,
  },
];

// Stormwight-specific Features
export const stormwightFeatures: Feature[] = [
  {
    id: 'aspect-of-wild',
    name: 'Aspect of the Wild',
    description: 'As a maneuver, you can shift into your kit-specific animal form or hybrid form. You retain your stats but gain form benefits and use Might for strikes. Your form ends when you take damage (triggering Furious Change if at 4+ Ferocity).',
    levelRequired: 1,
  },
  {
    id: 'relentless-hunter',
    name: 'Relentless Hunter',
    description: 'You have an edge on tests made using the Track skill.',
    levelRequired: 1,
  },
  {
    id: 'tooth-and-claw',
    name: 'Tooth and Claw',
    description: 'Adjacent enemies take damage equal to your Might score at the end of your turn.',
    levelRequired: 2,
  },
  {
    id: 'natures-knight',
    name: "Nature's Knight",
    description: 'You can speak with animals and elementals. You automatically sense animals and elementals within 10 squares. You gain +1 Renown when negotiating with elementals or animals.',
    levelRequired: 3,
  },
  {
    id: 'stormborn',
    name: 'Stormborn',
    description: "You and your allies ignore weather penalties. You can use the Conduit's Blessing of Fortunate Weather feature.",
    levelRequired: 5,
  },
];

// Helper to get features by aspect
export const getFeaturesForAspect = (aspect: string): Feature[] => {
  switch (aspect) {
    case 'berserker':
      return [...furyFeatures, ...berserkerFeatures];
    case 'reaver':
      return [...furyFeatures, ...reaverFeatures];
    case 'stormwight':
      return [...furyFeatures, ...stormwightFeatures];
    default:
      return furyFeatures;
  }
};

// Get features available at a specific level
export const getFeaturesAtLevel = (aspect: string, level: number): Feature[] => {
  const allFeatures = getFeaturesForAspect(aspect);
  return allFeatures.filter(f => (f.levelRequired || 1) <= level);
};
