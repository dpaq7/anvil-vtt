/**
 * Summoner Level Features from Draw Steel rules (v10)
 * Levels 1-10 progression
 */

export interface SummonerLevelFeature {
  level: number;
  name: string;
  description: string;
  category: 'passive' | 'active' | 'resource' | 'epic';
}

export const SUMMONER_LEVEL_FEATURES: SummonerLevelFeature[] = [
  // ===== Level 1 =====
  {
    level: 1,
    name: 'Minion Management',
    description:
      'You can control up to 8 minions across a maximum of 2 squads (8 minions per squad). All minions in a squad must share the same name. Squads share a single stamina pool. Damage equal to one minion\'s max HP kills one minion (closest to damage source). Overflow damage beyond the squad total deals 2 + Level damage to the Summoner.',
    category: 'passive',
  },
  {
    level: 1,
    name: 'Essence',
    description:
      'Your resource is Essence. Start of combat: Essence = current victories. Start of each turn: gain +2 Essence. Triggered: gain +1 Essence the first time any minion (ally or enemy) dies unwillingly in your range (limit 1/round). Sacrifice: Kill own minions in range to reduce ability Essence cost by 1 per minion (minion cannot have acted this turn).',
    category: 'resource',
  },
  {
    level: 1,
    name: 'Combat Spawning',
    description:
      'Start of combat: Free summon of 2 signature minions within Summoner\'s Range (5 + Reason). Start of each turn: Free summon of 3 signature minions within Summoner\'s Range.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Summoner Strike',
    description:
      'Your free strike is Summoner Strike: Melee 1 or Ranged 5, deal R damage. P < WEAK, target is slowed (save ends). Has Charge keyword when used as melee.',
    category: 'active',
  },
  {
    level: 1,
    name: 'Formation',
    description:
      'Select one formation (Horde, Platoon, Elite, or Leader). Changeable during respite via Intense Study.',
    category: 'passive',
  },
  {
    level: 1,
    name: 'Quick Command',
    description:
      'Select one quick command triggered action (Focus Fire!, Halt!, Not Yet!, or Shield!). Changeable during respite via Intense Study.',
    category: 'active',
  },
  // ===== Level 2 =====
  {
    level: 2,
    name: 'Perk',
    description: 'Gain 1 perk.',
    category: 'passive',
  },
  {
    level: 2,
    name: "Summoner's Dominion",
    description:
      'You can summon a circle-specific fixture (standard action, 1/encounter). Demon: The Boil (taunt aura, acid explosion). Elemental: Crystal (range buff aura, vertical pull). Fey: Glade Pond (speed buff aura, hides minions). Undead: Barrow Gates (fear aura, immunity buff).',
    category: 'active',
  },
  // ===== Level 3 =====
  {
    level: 3,
    name: 'Kit',
    description:
      'Summoner Strike damage becomes 2 x R. Strike distance becomes Summoner\'s Range. Choose one Ward: Conjured (+3 HP, +scaling), Emergency (react to damage: shift 1 + summon signature minion), Howling (aura 1 deals R damage to enemies starting turn there), or Snare (react to melee damage: pull attacker R squares).',
    category: 'passive',
  },
  {
    level: 3,
    name: '7-Essence Abilities',
    description:
      'Choose one 7-Essence ability: Blitz Tactics, Cavalry Call, Essence Funnel, or Lead By Example.',
    category: 'active',
  },
  // ===== Level 4 =====
  {
    level: 4,
    name: 'Reason Increase',
    description: 'Your Reason score increases to 3.',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Minion Cap Increase',
    description:
      'Your maximum minion count increases by +4 (total 12).',
    category: 'passive',
  },
  {
    level: 4,
    name: 'Stat Boost',
    description:
      'Gain +1 to one characteristic other than Reason.',
    category: 'passive',
  },
  // ===== Level 5 =====
  {
    level: 5,
    name: 'Circle Feature Upgrade',
    description:
      'Gain your circle-specific level 5 features. Blight: Shaping + Soul Flense. Graves: Channel + Dread March. Spring: Flash Powder + Pixie Lift. Storms: Nature Watch + Split.',
    category: 'passive',
  },
  {
    level: 5,
    name: 'Essence Salvage',
    description:
      'The first minion death each round yields 2 Essence instead of 1.',
    category: 'resource',
  },
  {
    level: 5,
    name: 'Minion Chain',
    description:
      'Minions can grapple and bridge gaps, forming physical chains.',
    category: 'passive',
  },
  {
    level: 5,
    name: 'Minion Stats Increase',
    description:
      'Signature minions gain +1 Stamina. 3-cost minions gain +3 Stamina. 5-cost minions gain +2 Stamina.',
    category: 'passive',
  },
  // ===== Level 6 =====
  {
    level: 6,
    name: 'Return to the Source',
    description:
      'You can teleport to your portfolio\'s home plane during respite.',
    category: 'passive',
  },
  {
    level: 6,
    name: 'Minion Machinations',
    description:
      'Gain +2 follower cap. You can recruit an Artisan or Sage from your portfolio.',
    category: 'passive',
  },
  {
    level: 6,
    name: '9-Essence Abilities',
    description:
      "Choose one 9-Essence ability (Champion Summons): A Champion's Cry, Army's Idol, The Champion Slams the Earth, or Their Pall Shrouds All.",
    category: 'active',
  },
  // ===== Level 7 =====
  {
    level: 7,
    name: 'Characteristic Increase',
    description:
      'All characteristics increase by +1 (maximum 4).',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Minion Improvement',
    description:
      'Start of turn free summon count increased by +1.',
    category: 'passive',
  },
  {
    level: 7,
    name: 'Font of Creation',
    description:
      'At the start of your turn, you gain 3 Essence (instead of 2).',
    category: 'resource',
  },
  {
    level: 7,
    name: 'Their Life for Mine',
    description:
      'Reaction to dying: Sacrifice all your minions and spend all Essence to revive at 1 Stamina.',
    category: 'active',
  },
  // ===== Level 9 =====
  {
    level: 9,
    name: 'Kit Improvement',
    description:
      'Summoner Strike potency becomes P < STRONG. Choose a second Ward. When you kill a creature with Summoner Strike, summon a free signature minion.',
    category: 'passive',
  },
  {
    level: 9,
    name: 'Steward',
    description:
      'You gain a diplomacy bonus with your portfolio\'s home plane.',
    category: 'passive',
  },
  {
    level: 9,
    name: '11-Essence Abilities',
    description:
      "Choose one 11-Essence ability (Ultimate): 10,000 Minions, Bodyguard Tactics, I Abjure Thee, or The Champion's Wrath.",
    category: 'active',
  },
  // ===== Level 10 =====
  {
    level: 10,
    name: 'Reason Mastery',
    description: 'Your Reason score increases to 5.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Minion Mastery',
    description:
      'Start of combat summon count scales with victories. Minion stats reach maximum values.',
    category: 'passive',
  },
  {
    level: 10,
    name: 'Eidos',
    description:
      'Gain the Eidos epic resource. You can spend Eidos as Essence and summon 2 bonus minions when you do.',
    category: 'epic',
  },
  {
    level: 10,
    name: 'No Matter the Cost',
    description:
      'When sacrificing minions to reduce Essence cost, each minion reduces cost by the full amount (instead of 1).',
    category: 'epic',
  },
];

// Get features available at a given level
export function getSummonerFeaturesForLevel(level: number): SummonerLevelFeature[] {
  return SUMMONER_LEVEL_FEATURES.filter((f) => f.level <= level);
}

// Get features that unlock at a specific level
export function getSummonerFeaturesUnlockedAtLevel(level: number): SummonerLevelFeature[] {
  return SUMMONER_LEVEL_FEATURES.filter((f) => f.level === level);
}

// Get Essence gain per turn based on level
export function getEssencePerTurn(level: number): number {
  if (level >= 7) return 3;
  return 2;
}

// Get max minion count based on level and formation
export function getMaxMinionCount(level: number, formation: string): number {
  let base = 8;
  if (level >= 4) base = 12;
  if (formation === 'horde') base += 4;
  return base;
}

// Get start-of-turn summon count based on level and formation
export function getStartOfTurnSummonCount(level: number, formation: string): number {
  let count = 3;
  if (formation === 'horde') count = 4;
  if (level >= 7) count += 1;
  return count;
}
