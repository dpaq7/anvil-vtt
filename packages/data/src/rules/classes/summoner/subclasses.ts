/**
 * Summoner Circles (Subclasses) from Draw Steel rules (v10)
 * Each circle maps to a portfolio of minion types.
 */

import type { SummonerCircle } from '@anvil/types';
import type { PortfolioType } from '@anvil/types';

export interface CircleFeature {
  name: string;
  description: string;
  level: number; // Level at which feature is gained
}

export interface CircleData {
  id: SummonerCircle;
  name: string;
  title: string; // e.g., "Demonologist", "Necromancer"
  portfolioType: PortfolioType;
  portfolioKeyword: string; // 'Abyssal', 'Necropolitan', 'Arcadia', 'Quintessence'
  theme: string;
  description: string;
  communicatesWith: string;
  features: CircleFeature[];
  level5Features: CircleFeature[];
}

export const SUMMONER_CIRCLES: Record<SummonerCircle, CircleData> = {
  blight: {
    id: 'blight',
    name: 'Circle of Blight',
    title: 'Demonologist',
    portfolioType: 'demon',
    portfolioKeyword: 'Abyssal',
    theme: 'Demons, corruption, and the abyss',
    description:
      'You command demons from the Abyssal plane. Your minions are aggressive and deal extra damage when they perish.',
    communicatesWith: 'Abyssal entities',
    features: [
      {
        name: 'Death Snap',
        description:
          'When a demon minion you control dies unwillingly, it deals free strike damage to one adjacent creature.',
        level: 1,
      },
      {
        name: 'Soulsense',
        description:
          'You can see "trails" of creatures with souls. Duration: 5 x Level minutes.',
        level: 1,
      },
    ],
    level5Features: [
      {
        name: 'Shaping',
        description:
          'You can disguise your minions, making them appear as other creatures or objects.',
        level: 5,
      },
      {
        name: 'Soul Flense',
        description:
          'As a maneuver, you can have a minion deal damage to an adjacent ally to cleanse one condition on that ally.',
        level: 5,
      },
    ],
  },
  graves: {
    id: 'graves',
    name: 'Circle of Graves',
    title: 'Necromancer',
    portfolioType: 'undead',
    portfolioKeyword: 'Necropolitan',
    theme: 'Undead, death, and the grave',
    description:
      'You command the undead from the Necropolitan plane. Your minions rise from the fallen and refuse to stay dead.',
    communicatesWith: 'Undead entities',
    features: [
      {
        name: 'Dead Men Tell All Tales',
        description:
          'Touch a corpse (less than 1 week old) to ask it questions. First question is free; subsequent questions require a Reason test.',
        level: 1,
      },
      {
        name: 'Rise!',
        description:
          'Triggered action (1/round): When a creature dies within your range, summon a signature undead minion in its space (free cost). The new minion has summoning sickness (acts next turn).',
        level: 1,
      },
    ],
    level5Features: [
      {
        name: 'Channel',
        description:
          'You can host a spirit within a minion, granting it access to the spirit\'s skills for tests.',
        level: 5,
      },
      {
        name: 'Dread March',
        description:
          'Your undead minions ignore difficult terrain. When an undead minion would die, it instead persists until the end of its next turn.',
        level: 5,
      },
    ],
  },
  spring: {
    id: 'spring',
    name: 'Circle of Spring',
    title: 'Feybright',
    portfolioType: 'fey',
    portfolioKeyword: 'Arcadia',
    theme: 'Fey, nature, and Arcadia',
    description:
      'You command fey creatures from Arcadia. Your minions provide healing and support when they fall.',
    communicatesWith: 'Fey entities',
    features: [
      {
        name: 'Fairy Whispers',
        description:
          'When you send a minion on a task, it returns with rumors. Make a Reason test to determine the validity of the information.',
        level: 1,
      },
      {
        name: 'Pixie Dust',
        description:
          'You gain +2 recoveries. When a fey minion you control dies, you can spend a recovery to give temporary stamina equal to 2 x R to allies adjacent to the dying minion.',
        level: 1,
      },
    ],
    level5Features: [
      {
        name: 'Flash Powder',
        description:
          'When Pixie Dust triggers, the temporary stamina is accompanied by additional buffs (edge on next power roll).',
        level: 5,
      },
      {
        name: 'Pixie Lift',
        description:
          'You gain the Fly and Hover movement modes while you have at least one fey minion active.',
        level: 5,
      },
    ],
  },
  storms: {
    id: 'storms',
    name: 'Circle of Storms',
    title: 'Storm Caster',
    portfolioType: 'elemental',
    portfolioKeyword: 'Quintessence',
    theme: 'Elementals, nature, and the quintessence',
    description:
      'You command elementals from the Quintessence plane. Your minions are versatile and leave powerful effects when they die.',
    communicatesWith: 'Elemental entities',
    features: [
      {
        name: 'Elemental Affinity',
        description:
          'When summoning a non-signature elemental, you also get 1 free signature elemental (must share the element type or be a Mote).',
        level: 1,
      },
      {
        name: 'Heart of Nature',
        description:
          'You can sense elementals and dragons within 1 mile. You have a minimum tier 2 outcome on Intuition social tests with elementals and dragons.',
        level: 1,
      },
    ],
    level5Features: [
      {
        name: 'Nature Watch',
        description:
          'You can send an Elemental Mote as a scout. It can travel up to 1 mile and relay what it senses back to you.',
        level: 5,
      },
      {
        name: 'Split',
        description:
          'As a maneuver, you can split an elemental minion into two copies at reduced HP. The original loses half its stamina and the copy appears adjacent with the remaining stamina.',
        level: 5,
      },
    ],
  },
};

// Get circle data by ID
export function getCircleData(circleId: SummonerCircle): CircleData {
  return SUMMONER_CIRCLES[circleId];
}

// Get all circle options as array
export function getAllCircles(): CircleData[] {
  return Object.values(SUMMONER_CIRCLES);
}

// Get circle from portfolio type
export function getCircleFromPortfolio(portfolioType: PortfolioType): SummonerCircle {
  const mapping: Record<PortfolioType, SummonerCircle> = {
    demon: 'blight',
    undead: 'graves',
    fey: 'spring',
    elemental: 'storms',
  };
  return mapping[portfolioType];
}

// Get portfolio type from circle
export function getPortfolioFromCircle(circle: SummonerCircle): PortfolioType {
  return SUMMONER_CIRCLES[circle].portfolioType;
}
