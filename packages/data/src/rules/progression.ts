// Character Progression Data - SRD Section 6

import type {
  LevelProgression,
  Ward,
  SevenEssenceAbility,
  NineEssenceAbility,
  ElevenEssenceAbility,
  CircleUpgrade,
} from '@anvil/types';

// ============================================================
// WARDS (Level 3 and 9 Kit upgrades)
// ============================================================

export const wards: Ward[] = [
  {
    id: 'conjured',
    name: 'Conjured Ward',
    description: '+3 Stamina (scales with level). Your maximum stamina increases by 3, plus an additional 1 at levels 5 and 9.',
  },
  {
    id: 'emergency',
    name: 'Emergency Ward',
    description: 'When you take damage, you can use a triggered action to shift 1 square and summon a Signature Minion adjacent to you.',
  },
  {
    id: 'howling',
    name: 'Howling Ward',
    description: 'Enemies that start their turn within 1 square of you take R damage.',
  },
  {
    id: 'snare',
    name: 'Snare Ward',
    description: 'When you take melee damage, you can use a triggered action to pull the attacker R squares toward you.',
  },
];

// ============================================================
// 7-ESSENCE ABILITIES (Level 3)
// ============================================================

export const sevenEssenceAbilities: SevenEssenceAbility[] = [
  {
    id: 'blitz_tactics',
    name: 'Blitz Tactics',
    description: 'Your minions knock enemies prone when moving through their spaces.',
    cost: 7,
  },
  {
    id: 'cavalry_call',
    name: 'Cavalry Call',
    description: 'Summon a temporary squad of 6 Signature Minions that act immediately and disappear at the end of the round.',
    cost: 7,
  },
  {
    id: 'essence_funnel',
    name: 'Essence Funnel',
    description: 'Line 10 area attack. You may sacrifice minions in the line to add +1 damage per minion sacrificed.',
    cost: 7,
  },
  {
    id: 'lead_by_example',
    name: 'Lead By Example',
    description: 'Make a powerful attack that deals high damage and dazes the target.',
    cost: 7,
  },
];

// ============================================================
// 9-ESSENCE ABILITIES - Champions (Level 6)
// ============================================================

export const nineEssenceAbilities: NineEssenceAbility[] = [
  {
    id: 'champions_cry',
    name: "A Champion's Cry",
    description: 'Burst 3 centered on your Champion. All enemies in the area are frightened (save ends).',
    cost: 9,
  },
  {
    id: 'armys_idol',
    name: "Army's Idol",
    description: 'Burst 4 centered on your Champion. All allies in the area gain +2 to saving throws until the end of your next turn.',
    cost: 9,
  },
  {
    id: 'champion_slams_earth',
    name: 'The Champion Slams the Earth',
    description: 'Cube 4 area attack. All creatures in the area take damage and are knocked prone.',
    cost: 9,
  },
  {
    id: 'pall_shrouds_all',
    name: 'Their Pall Shrouds All',
    description: 'Burst 4 centered on your Champion. All enemies are weakened and take half damage from all sources (save ends).',
    cost: 9,
  },
];

// ============================================================
// 11-ESSENCE ABILITIES - Ultimate (Level 9)
// ============================================================

export const elevenEssenceAbilities: ElevenEssenceAbility[] = [
  {
    id: 'ten_thousand_minions',
    name: '10,000 Minions',
    description: 'The entire floor becomes a damaging hazard. Enemies that start their turn on the ground take damage.',
    cost: 11,
  },
  {
    id: 'bodyguard_tactics',
    name: 'Bodyguard Tactics',
    description: 'All allies within 10 squares of you gain Immunity 5 until the end of your next turn.',
    cost: 11,
  },
  {
    id: 'i_abjure_thee',
    name: 'I Abjure Thee',
    description: 'Destroy all enemy minions within range. Enemy leaders and bosses are banished to another plane (save ends).',
    cost: 11,
  },
  {
    id: 'champions_wrath',
    name: "The Champion's Wrath",
    description: 'Massive area of effect attack. All enemies in a burst 6 take heavy damage and are pushed to the edge of the area.',
    cost: 11,
  },
];

// ============================================================
// CIRCLE UPGRADES (Level 5)
// ============================================================

export const circleUpgrades: CircleUpgrade[] = [
  // Blight (Demon)
  {
    id: 'shaping',
    circle: 'blight',
    name: 'Shaping',
    description: 'You can disguise your demon minions to appear as other creatures or objects. They retain their abilities but gain a mundane appearance.',
  },
  {
    id: 'soul_flense',
    circle: 'blight',
    name: 'Soul Flense',
    description: 'As a maneuver, you can have a demon minion deal damage to an adjacent ally to cleanse one condition from that ally.',
  },
  // Graves (Undead)
  {
    id: 'channel',
    circle: 'graves',
    name: 'Channel',
    description: 'You can host a spirit in your body, gaining access to skills and knowledge the spirit possessed in life.',
  },
  {
    id: 'dread_march',
    circle: 'graves',
    name: 'Dread March',
    description: 'Your undead minions ignore difficult terrain. When an undead minion would die, it instead remains at 1 HP until the end of your next turn.',
  },
  // Spring (Fey)
  {
    id: 'flash_powder',
    circle: 'spring',
    name: 'Flash Powder',
    description: 'When you use Pixie Dust, allies also gain temporary flight and concealment until the start of your next turn.',
  },
  {
    id: 'pixie_lift',
    circle: 'spring',
    name: 'Pixie Lift',
    description: 'You gain a fly speed equal to your speed and can hover. While flying, you have concealment.',
  },
  // Storms (Elemental)
  {
    id: 'nature_watch',
    circle: 'storms',
    name: 'Nature Watch',
    description: 'You can see through the senses of any elemental mote within 1 mile. The mote can scout ahead and report back.',
  },
  {
    id: 'split',
    circle: 'storms',
    name: 'Split',
    description: 'As a maneuver, you can split an elemental minion into two copies, each with half the original HP. Both act on your turn.',
  },
];

// ============================================================
// LEVEL PROGRESSION DATA
// ============================================================

export const levelProgressions: LevelProgression[] = [
  // Level 2
  {
    level: 2,
    features: [
      {
        id: 'perk_level2',
        name: 'Perk',
        description: 'Gain 1 Perk of your choice.',
        type: 'automatic',
      },
      {
        id: 'summoners_dominion',
        name: "Summoner's Dominion",
        description: 'You can now summon your portfolio\'s Fixture (The Boil, Primordial Crystal, Glade Pond, or Barrow Gates) once per encounter as a maneuver. Summoning costs 0 essence. Relocate (free maneuver, 1 essence) to move the fixture up to 5 squares.',
        type: 'automatic',
      },
    ],
  },

  // Level 3
  {
    level: 3,
    features: [
      {
        id: 'kit_upgrade',
        name: 'Kit Upgrade',
        description: 'Your Summoner Strike damage increases to 2×R and range extends to Summoner\'s Range. Choose a Ward.',
        type: 'choice',
        choices: wards.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
        })),
        category: 'ward',
      },
      {
        id: 'seven_essence_abilities',
        name: '7-Essence Abilities',
        description: 'Choose one 7-Essence ability to add to your repertoire.',
        type: 'choice',
        choices: sevenEssenceAbilities.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
        })),
        category: '7-essence',
      },
    ],
  },

  // Level 4 - Minion Improvement (Summoner v1.0 SRD)
  {
    level: 4,
    features: [
      {
        id: 'reason_increase',
        name: 'Reason Increase',
        description: 'Your Reason characteristic is now 3.',
        type: 'automatic',
      },
      {
        id: 'minion_cap_increase',
        name: 'Minion Cap Increase',
        description: 'Your maximum minion count increases by 4 (to 12 total, or 16 with Horde).',
        type: 'automatic',
      },
      {
        id: 'essence_salvage',
        name: 'Essence Salvage',
        description: 'The first minion death each round now grants 2 Essence instead of 1.',
        type: 'automatic',
      },
      {
        id: 'minion_stats',
        name: 'Minion Stat Boost',
        description: 'Signature minions gain +1 Stamina. 3-Essence minions gain +3 Stamina. 5-Essence minions gain +2 Stamina.',
        type: 'automatic',
      },
      {
        id: 'stat_boost',
        name: 'Characteristic Boost',
        description: 'Increase one characteristic (other than Reason) by 1.',
        type: 'choice',
        choices: [
          { id: 'might', name: 'Might', description: 'Increase Might by 1.' },
          { id: 'agility', name: 'Agility', description: 'Increase Agility by 1.' },
          { id: 'intuition', name: 'Intuition', description: 'Increase Intuition by 1.' },
          { id: 'presence', name: 'Presence', description: 'Increase Presence by 1.' },
        ],
        category: 'stat-boost',
      },
    ],
    statChanges: {
      reason: 3,
      minionCap: 4,
      signatureStaminaBonus: 1,
      threeEssenceStaminaBonus: 3,
      fiveEssenceStaminaBonus: 2,
    },
  },

  // Level 5 - Circle Feature Upgrade
  {
    level: 5,
    features: [
      {
        id: 'circle_feature_upgrade',
        name: 'Circle Feature Upgrade',
        description: 'Choose an upgrade to your circle\'s features.',
        type: 'choice',
        // Choices will be filtered by circle in the UI
        choices: circleUpgrades.map(u => ({
          id: u.id,
          name: u.name,
          description: u.description,
        })),
        category: 'circle-upgrade',
      },
      {
        id: 'minion_chain',
        name: 'Minion Chain',
        description: 'Your minions can grapple each other to form bridges across gaps.',
        type: 'automatic',
      },
    ],
  },

  // Level 6
  {
    level: 6,
    features: [
      {
        id: 'return_to_source',
        name: 'Return to the Source',
        description: 'During a Respite, you can teleport yourself and allies to your portfolio\'s home plane.',
        type: 'automatic',
      },
      {
        id: 'minion_machinations',
        name: 'Minion Machinations',
        description: '+2 Follower Cap. You can recruit an Artisan or Sage from your portfolio.',
        type: 'automatic',
      },
      {
        id: 'nine_essence_abilities',
        name: '9-Essence Abilities (Champions)',
        description: 'You can now summon a Champion (9 Essence, limit 1/encounter). Choose a Champion ability.',
        type: 'choice',
        choices: nineEssenceAbilities.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
        })),
        category: '9-essence',
      },
    ],
  },

  // Level 7 - Minion Improvement II (Summoner v1.0 SRD)
  {
    level: 7,
    features: [
      {
        id: 'characteristic_increase',
        name: 'All Characteristics +1',
        description: 'All your characteristics increase by 1 (maximum 4).',
        type: 'automatic',
      },
      {
        id: 'minion_cap_increase_l7',
        name: 'Minion Cap Increase',
        description: 'Your maximum minion count increases by 4 (to 16 total, or 20 with Horde).',
        type: 'automatic',
      },
      {
        id: 'minion_improvement',
        name: 'Minion Improvement',
        description: 'Your free summon count at the start of your turn increases by 1 (to 4 base).',
        type: 'automatic',
      },
      {
        id: 'font_of_creation',
        name: 'Font of Creation',
        description: 'You now gain 3 Essence at the start of your turn instead of 2.',
        type: 'automatic',
      },
      {
        id: 'minion_stats_l7',
        name: 'Minion Stat Boost II',
        description: 'All minions gain additional Stamina: Signature +1 (total +2), 3-Essence +3 (total +6), 5-Essence +2 (total +4), 7-Essence +5.',
        type: 'automatic',
      },
      {
        id: 'their_life_for_mine',
        name: 'Their Life For Mine',
        description: 'When you would die, you can sacrifice all your minions and essence to revive at 1 HP.',
        type: 'automatic',
      },
    ],
    statChanges: {
      allStats: 1,
      minionCap: 4,
      freeSummonCount: 1,
      essencePerTurn: 3,
      signatureStaminaBonus: 1,
      threeEssenceStaminaBonus: 3,
      fiveEssenceStaminaBonus: 2,
      sevenEssenceStaminaBonus: 5,
    },
  },

  // Level 9
  {
    level: 9,
    features: [
      {
        id: 'kit_improvement',
        name: 'Kit Improvement',
        description: 'Your Summoner Strike now uses Strong potency (R < Strong). Choose a second Ward. You summon a free Signature Minion when you kill an enemy.',
        type: 'choice',
        choices: wards.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
        })),
        category: 'second-ward',
      },
      {
        id: 'steward',
        name: 'Steward',
        description: 'You have advantage on diplomacy checks with creatures from your portfolio\'s home plane.',
        type: 'automatic',
      },
      {
        id: 'eleven_essence_abilities',
        name: '11-Essence Abilities (Ultimate)',
        description: 'Choose one 11-Essence ultimate ability to add to your repertoire.',
        type: 'choice',
        choices: elevenEssenceAbilities.map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
        })),
        category: '11-essence',
      },
    ],
  },

  // Level 10 - Minion Improvement III (Summoner v1.0 SRD)
  {
    level: 10,
    features: [
      {
        id: 'reason_max',
        name: 'Reason Mastery',
        description: 'Your Reason characteristic is now 5.',
        type: 'automatic',
      },
      {
        id: 'minion_cap_increase_l10',
        name: 'Minion Cap Increase',
        description: 'Your maximum minion count increases by 4 (to 20 total, or 24 with Horde).',
        type: 'automatic',
      },
      {
        id: 'minion_improvement_combat',
        name: 'Combat Summon Scaling',
        description: 'Your start of combat free summon now scales with your Victories (+2 per 2 Victories).',
        type: 'automatic',
      },
      {
        id: 'minion_stats_l10',
        name: 'Minion Stat Boost III',
        description: 'All minions gain additional Stamina: Signature +1 (total +3), 3-Essence +3 (total +9), 5-Essence +2 (total +6), 7-Essence +5 (total +10).',
        type: 'automatic',
      },
      {
        id: 'eidos',
        name: 'Eidos',
        description: 'You gain access to the Eidos epic resource. Eidos can be spent as Essence and also summons 2 bonus minions.',
        type: 'automatic',
      },
      {
        id: 'no_matter_the_cost',
        name: 'No Matter the Cost',
        description: 'When sacrificing minions to reduce ability cost, each minion reduces the cost by its full essence value instead of 1.',
        type: 'automatic',
      },
    ],
    statChanges: {
      reason: 5,
      minionCap: 4,
      signatureStaminaBonus: 1,
      threeEssenceStaminaBonus: 3,
      fiveEssenceStaminaBonus: 2,
      sevenEssenceStaminaBonus: 5,
    },
  },
];

// Helper function to get progression for a specific level
export function getProgressionForLevel(level: number): LevelProgression | undefined {
  return levelProgressions.find(p => p.level === level);
}

// Helper function to get all features up to a level
export function getFeaturesUpToLevel(level: number): LevelProgression[] {
  return levelProgressions.filter(p => p.level <= level);
}

// Helper function to get circle-specific upgrades
export function getCircleUpgrades(circle: 'blight' | 'graves' | 'spring' | 'storms'): CircleUpgrade[] {
  return circleUpgrades.filter(u => u.circle === circle);
}
