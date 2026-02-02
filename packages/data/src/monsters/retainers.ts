/**
 * Retainer Companion Monsters for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Retainers are NPC followers who fight alongside heroes and can level up.
 * A lowly level 1 goblin guide can advance up to level 10!
 *
 * Full set: 21 retainers across all roles and levels 1-6.
 */

import type { CompendiumMonster, MonsterRole } from '../types/monster.js';

// ============================================================================
// RETAINER RULES AND PROGRESSION
// ============================================================================

/**
 * Retainer lore and companion rules
 */
export const RETAINER_RULES = {
  name: 'Retainer',
  description: 'A retainer is a type of NPC follower who fights alongside the heroes. Retainer creatures can gain levels just as heroes do, so their battlefield contributions remain relevant as the heroes grow in status and power.',
  levelingRules: [
    'Retainers level up when the party gains Victories.',
    'At level 2, pick one characteristic to increase (+1).',
    'At level 4, choose a role-specific encounter ability OR custom ability.',
    'At level 5, increase all characteristics (+1 each).',
    'At level 7, choose a role-specific encounter ability OR custom ability.',
    'At level 8, pick one characteristic to increase (+1).',
    'At level 10, choose a role-specific capstone ability.',
  ],
  combatRules: [
    'Retainers act on their mentor\'s turn.',
    'Retainers use their mentor\'s power roll bonus for attacks.',
    'Retainers can use any characteristic for their power rolls.',
    'If a retainer is reduced to 0 Stamina, they are knocked out but stabilize automatically.',
  ],
};

/**
 * Role-based standard abilities gained at levels 4, 7, and 10
 */
export const RETAINER_STANDARD_ABILITIES = {
  Ambusher: {
    level4: { name: 'Go for the Jugular', description: 'Bonus damage when attacking from concealment' },
    level7: { name: 'Hamstring Slice', description: 'Slowed condition on hit' },
    level10: { name: 'Hold \'Em Down', description: 'Grabbed and prone on hit' },
  },
  Artillery: {
    level4: { name: 'Supporting Volley', description: 'Allies gain edge on next attack vs target' },
    level7: { name: 'Line \'Em Up', description: 'Multi-target ranged attack' },
    level10: { name: 'Ricochet Shot', description: 'Hits bounce to nearby enemies' },
  },
  Brute: {
    level4: { name: 'Big Windup', description: 'Charge with extra damage' },
    level7: { name: 'Overhand Swat', description: 'Push and prone on hit' },
    level10: { name: 'Dizzying Sweep', description: 'Area attack with dazed' },
  },
  Controller: {
    level4: { name: 'Elemental Blast', description: 'Area damage with push' },
    level7: { name: 'Oil Slick', description: 'Create difficult terrain' },
    level10: { name: 'Shattering Shards', description: 'Area damage and weakened' },
  },
  Defender: {
    level4: { name: 'Watch Out!', description: 'Redirect attack to self' },
    level7: { name: 'It\'s Me You Want!', description: 'Taunt enemies' },
    level10: { name: 'Last Stand', description: 'Temporary HP and damage reduction' },
  },
  Harrier: {
    level4: { name: 'Tackle', description: 'Charge with prone' },
    level7: { name: 'Meet You There', description: 'Teleport and attack' },
    level10: { name: 'Nab and Stab', description: 'Grab and free strike' },
  },
  Hexer: {
    level4: { name: 'Backfire Curse', description: 'Damage attacker on hit' },
    level7: { name: 'Take Root', description: 'Restrained condition' },
    level10: { name: 'Mazed', description: 'Target loses turn' },
  },
  Mount: {
    level4: { name: 'Cavalry Charge', description: 'Bonus damage while ridden' },
    level7: { name: 'Giddyup!', description: 'Extra movement for rider' },
    level10: { name: 'Rearing Trample', description: 'Area trample attack' },
  },
  Support: {
    level4: { name: 'Battlefield Medic', description: 'Ally spends Recovery' },
    level7: { name: 'Focus Fire', description: 'Allies gain edge vs target' },
    level10: { name: 'Back from the Dead', description: 'Revive dying ally' },
  },
};

// ============================================================================
// LEVEL 1 RETAINERS
// ============================================================================

/**
 * Angulotl Hopper (Retainer Harrier, Level 1)
 * A nimble frog-like companion that excels at hit-and-run tactics.
 */
export const ANGULOTL_HOPPER: CompendiumMonster = {
  _id: 'forgesteel/retainers/angulotl-hopper',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Angulotl Hopper',
  level: 1,
  roles: ['Harrier'],
  ancestry: ['Angulotl', 'Humanoid'],
  ev: '0',
  stamina: '21',
  speed: 6,
  movement: 'Climb, swim',
  size: '1S',
  stability: 0,
  free_strike: 2,
  might: 1,
  agility: 2,
  reason: 0,
  intuition: 0,
  presence: 0,
  flavor: 'A nimble angulotl companion that hops around the battlefield, striking quickly and avoiding retaliation.',
  immunities: ['Poison 2'],
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Leapfrog',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage' },
        { name: 'Effect', effect: 'Before or after making this strike, the hopper jumps up to 2 squares, or up to 4 squares if they jump over their mentor\'s space.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Toxiferous',
      icon: '☠️',
      effects: [{ effect: 'Whenever an adjacent enemy grabs the hopper or uses a melee ability against them, that enemy takes 3 poison damage.' }],
    },
  ],
};

/**
 * Dwarf Mortar (Retainer Hexer, Level 1)
 * Long-range artillery with devastating shells.
 */
export const DWARF_MORTAR: CompendiumMonster = {
  _id: 'forgesteel/retainers/dwarf-mortar',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Dwarf Mortar',
  level: 1,
  roles: ['Hexer'],
  ancestry: ['Dwarf', 'Humanoid'],
  ev: '0',
  stamina: '21',
  speed: 5,
  size: '1M',
  stability: 3,
  free_strike: 3,
  might: 2,
  agility: 0,
  reason: 0,
  intuition: 1,
  presence: 0,
  flavor: 'A dwarven artillery specialist carrying a portable mortar, providing devastating ranged support.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Armor-Piercing Shell',
      icon: '💥',
      ability_type: 'Signature Ability',
      keywords: ['Ranged', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Ranged 15',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage' },
        { name: 'Effect', effect: 'This ability ignores cover and bypasses temporary Stamina.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Voice Thrower',
      icon: '📡',
      effects: [{ effect: 'The mortar can use a magical rune to talk to their mentor over any distance as long as both are in the same world.' }],
    },
  ],
};

/**
 * Goblin Guide (Retainer Harrier, Level 1)
 * A clever goblin who knows all the shortcuts and hidden paths.
 */
export const GOBLIN_GUIDE: CompendiumMonster = {
  _id: 'forgesteel/retainers/goblin-guide',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Goblin Guide',
  level: 1,
  roles: ['Harrier'],
  ancestry: ['Goblin', 'Humanoid'],
  ev: '0',
  stamina: '21',
  speed: 5,
  movement: 'Climb',
  size: '1S',
  stability: 0,
  free_strike: 2,
  might: -1,
  agility: 1,
  reason: 0,
  intuition: 0,
  presence: 1,
  flavor: 'A resourceful goblin who knows every shortcut, hiding spot, and trap in the area.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Stabbity Stab',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage' },
        { name: 'Effect', effect: 'The target can\'t make opportunity attacks until the end of the guide\'s turn.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Crafty',
      icon: '🦊',
      effects: [{ effect: 'The guide doesn\'t provoke opportunity attacks by moving.' }],
    },
  ],
};

/**
 * High Elf Weatherwise (Retainer Controller, Level 1)
 * A fey magic user who commands the seasons.
 */
export const HIGH_ELF_WEATHERWISE: CompendiumMonster = {
  _id: 'forgesteel/retainers/high-elf-weatherwise',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'High Elf Weatherwise',
  level: 1,
  roles: ['Controller'],
  ancestry: ['Fey', 'High Elf', 'Humanoid'],
  ev: '0',
  stamina: '21',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 2,
  might: -1,
  agility: 1,
  reason: 2,
  intuition: 0,
  presence: 1,
  flavor: 'An elven spellcaster who channels the power of the seasons.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Summer\'s Bolt',
      icon: '☀️',
      ability_type: 'Signature Ability',
      keywords: ['Magic', 'Ranged', 'Strike'],
      usage: 'Main Action',
      distance: 'Ranged 10',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '3 fire damage', tier2: '5 fire damage', tier3: '7 fire damage' },
        { name: 'Effect', effect: 'If the weatherwise targets their mentor, the mentor ignores the damage and gains temporary Stamina equal to the damage dealt.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Otherworldly Grace',
      icon: '✨',
      effects: [{ effect: 'At the start of their turn, the weatherwise can choose one effect that can be ended by a saving throw. That effect ends at the end of their turn.' }],
    },
  ],
};

/**
 * Human Warrior (Retainer Defender, Level 1)
 * A devoted soldier who protects their mentor.
 */
export const HUMAN_WARRIOR: CompendiumMonster = {
  _id: 'forgesteel/retainers/human-warrior',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Human Warrior',
  level: 1,
  roles: ['Defender'],
  ancestry: ['Human', 'Humanoid'],
  ev: '0',
  stamina: '21',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 2,
  might: 2,
  agility: 0,
  reason: 0,
  intuition: 0,
  presence: 1,
  flavor: 'A skilled fighter who has sworn to protect their mentor at all costs.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Chop',
      icon: '⚔️',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage' },
        { name: 'Effect', effect: 'If the warrior is adjacent to their mentor, this ability gains an edge.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Supernatural Insight',
      icon: '👁️',
      effects: [{ effect: 'The warrior ignores concealment if it\'s granted by a supernatural effect.' }],
    },
  ],
};

/**
 * Human Healer (Retainer Support, Level 1)
 * A devoted medic who keeps the party on their feet.
 */
export const HUMAN_HEALER: CompendiumMonster = {
  _id: 'forgesteel/retainers/human-healer',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Human Healer',
  level: 1,
  roles: ['Support'],
  ancestry: ['Human', 'Humanoid'],
  ev: '0',
  stamina: '18',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 2,
  might: 0,
  agility: 0,
  reason: 1,
  intuition: 2,
  presence: 1,
  flavor: 'A skilled healer who has devoted their life to keeping others alive on the battlefield.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Battlefield Medicine',
      icon: '💊',
      ability_type: 'Signature Ability',
      keywords: ['Ranged'],
      usage: 'Maneuver',
      distance: 'Ranged 5',
      target: 'One ally',
      effects: [{ name: 'Effect', effect: 'The target regains Stamina equal to their recovery value. A creature can only benefit from this ability once per encounter.' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Encouraging Presence',
      icon: '✨',
      effects: [{ effect: 'While adjacent to the healer, the mentor gains an edge on saving throws.' }],
    },
  ],
};

/**
 * Kobold Shieldbearer (Retainer Defender, Level 1)
 * A brave little defender who shields allies.
 */
export const KOBOLD_SHIELDBEARER: CompendiumMonster = {
  _id: 'forgesteel/retainers/kobold-shieldbearer',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Kobold Shieldbearer',
  level: 1,
  roles: ['Defender'],
  ancestry: ['Humanoid', 'Kobold'],
  ev: '0',
  stamina: '21',
  speed: 5,
  size: '1S',
  stability: 0,
  free_strike: 2,
  might: 2,
  agility: 1,
  reason: 0,
  intuition: 0,
  presence: 0,
  flavor: 'A small but incredibly brave kobold who carries an oversized shield.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Gladius',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage; taunted (EoT)' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Shield, Boss?',
      icon: '🛡️',
      effects: [{ effect: 'While the shieldbearer is adjacent to their mentor, both have +1 stability, have cover, and grant cover to allies.' }],
    },
  ],
};

/**
 * Orc Charger (Retainer Harrier, Level 1)
 * A fast and relentless orc warrior.
 */
export const ORC_CHARGER: CompendiumMonster = {
  _id: 'forgesteel/retainers/orc-charger',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Orc Charger',
  level: 1,
  roles: ['Harrier'],
  ancestry: ['Humanoid', 'Orc'],
  ev: '0',
  stamina: '21',
  speed: 8,
  size: '1M',
  stability: 0,
  free_strike: 3,
  might: 2,
  agility: 2,
  reason: 0,
  intuition: 0,
  presence: 0,
  flavor: 'A swift orc warrior who charges headlong into battle.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Notched Axe',
      icon: '🪓',
      ability_type: 'Signature Ability',
      keywords: ['Charge', 'Melee', 'Ranged', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1 or Ranged 5',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Relentless',
      icon: '💀',
      effects: [{ effect: 'If the charger is reduced to 0 Stamina, they can make a free strike before dying. If the target is reduced to 0 Stamina, the charger is reduced to 1 Stamina instead.' }],
    },
  ],
};

/**
 * Radenwight Sidekick (Retainer Support, Level 1)
 * A helpful rat-folk companion.
 */
export const RADENWIGHT_SIDEKICK: CompendiumMonster = {
  _id: 'forgesteel/retainers/radenwight-sidekick',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Radenwight Sidekick',
  level: 1,
  roles: ['Support'],
  ancestry: ['Humanoid', 'Radenwight'],
  ev: '0',
  stamina: '21',
  speed: 5,
  movement: 'Climb',
  size: '1S',
  stability: 0,
  free_strike: 2,
  might: 0,
  agility: 2,
  reason: 0,
  intuition: 1,
  presence: 0,
  flavor: 'A nimble radenwight who assists allies with quick strikes and distractions.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Dagger\'s Bite',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1 or Ranged 5',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '3 damage', tier2: '5 damage', tier3: '7 damage' }],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Ready Rodent',
      icon: '🐀',
      ability_type: 'Triggered Action',
      keywords: ['Melee', 'Weapon'],
      usage: 'Triggered (ally deals damage to target)',
      distance: 'Melee 1',
      target: 'One creature',
      effects: [{ name: 'Effect', effect: 'The sidekick makes a free strike against the target.' }],
    },
  ],
};

/**
 * Undead Servitor (Retainer Brute, Level 1)
 * A shambling undead servant.
 */
export const UNDEAD_SERVITOR: CompendiumMonster = {
  _id: 'forgesteel/retainers/undead-servitor',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Undead Servitor',
  level: 1,
  roles: ['Brute'],
  ancestry: ['Undead', 'Soulless'],
  ev: '0',
  stamina: '21',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 3,
  might: 2,
  agility: -1,
  reason: -3,
  intuition: -1,
  presence: 0,
  flavor: 'A reanimated corpse bound to serve its master.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Lunching Swipe',
      icon: '🧟',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '4 damage', tier2: '7 damage', tier3: '10 damage' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Arise',
      icon: '💀',
      effects: [{ effect: 'The first time in an encounter that the servitor is reduced to 0 Stamina by damage that isn\'t fire or holy, they regain half their max Stamina and fall prone.' }],
    },
  ],
};

/**
 * Unquiet Spirit (Retainer Hexer, Level 1)
 * A ghostly companion that phases through enemies.
 */
export const UNQUIET_SPIRIT: CompendiumMonster = {
  _id: 'forgesteel/retainers/unquiet-spirit',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Unquiet Spirit',
  level: 1,
  roles: ['Hexer'],
  ancestry: ['Undead', 'Soulless'],
  ev: '0',
  stamina: '21',
  speed: 5,
  movement: 'Fly, hover',
  size: '1M',
  stability: 1,
  free_strike: 2,
  might: -4,
  agility: 1,
  reason: 0,
  intuition: 0,
  presence: 2,
  flavor: 'A spectral being that phases through the material world.',
  weaknesses: ['Corruption 3', 'Poison 3'],
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Chill of Death',
      icon: '❄️',
      ability_type: 'Signature Ability',
      keywords: ['Magic', 'Ranged', 'Strike'],
      usage: 'Main Action',
      distance: 'Ranged 10',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '3 cold damage', tier2: '5 cold damage', tier3: '7 cold damage; P < strong slowed (EoT)' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Corruptive Phasing',
      icon: '👻',
      effects: [{ effect: 'The spirit can move through creatures and objects. The first time each round they move through a creature, that creature takes 2 corruption damage.' }],
    },
  ],
};

/**
 * Wode Elf Arrowswift (Retainer Artillery, Level 1)
 * A skilled forest hunter who provides ranged support.
 */
export const WODE_ELF_ARROWSWIFT: CompendiumMonster = {
  _id: 'forgesteel/retainers/wode-elf-arrowswift',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Wode Elf Arrowswift',
  level: 1,
  roles: ['Artillery'],
  ancestry: ['Fey', 'Humanoid', 'Wode Elf'],
  ev: '0',
  stamina: '21',
  speed: 7,
  size: '1M',
  stability: 1,
  free_strike: 2,
  might: 0,
  agility: 2,
  reason: 0,
  intuition: 1,
  presence: 0,
  flavor: 'A wode elf hunter trained in the ancient archery techniques of the forest.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Longshot',
      icon: '🏹',
      ability_type: 'Signature Ability',
      keywords: ['Ranged', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Ranged 15',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '4 damage', tier2: '7 damage', tier3: '10 damage' },
        { name: 'Effect', effect: 'The arrowswift can take a bane on this ability to gain a +5 bonus to ranged distance.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Masking Glamor',
      icon: '🌿',
      effects: [{ effect: 'Abilities targeting the arrowswift that would take a bane from cover or concealment have a double bane instead.' }],
    },
  ],
};

// Alias for backwards compatibility
export const WODE_ELF_ARCHER = WODE_ELF_ARROWSWIFT;

// ============================================================================
// LEVEL 2 RETAINERS
// ============================================================================

/**
 * Bugbear Commando (Retainer Ambusher, Level 2)
 * A stealthy bugbear who excels at throwing allies.
 */
export const BUGBEAR_COMMANDO: CompendiumMonster = {
  _id: 'forgesteel/retainers/bugbear-commando',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Bugbear Commando',
  level: 2,
  roles: ['Ambusher'],
  ancestry: ['Bugbear', 'Goblin', 'Humanoid', 'Fey'],
  ev: '0',
  stamina: '30',
  speed: 5,
  size: '1L',
  stability: 0,
  free_strike: 2,
  might: 2,
  agility: 2,
  reason: 0,
  intuition: 1,
  presence: 0,
  flavor: 'A large bugbear who can catch and throw allies with surprising gentleness.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Bear Hug',
      icon: '🐻',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '5 damage', tier2: '6 damage', tier3: '11 damage' },
        { name: 'Effect', effect: 'If the commando started their turn with concealment or hidden, they gain 1 surge.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Throw',
      icon: '🎯',
      keywords: ['Melee', 'Strike'],
      usage: 'Maneuver',
      distance: 'Melee 1',
      target: 'One grabbed creature or object',
      effects: [{ name: 'Effect', effect: 'The target is vertical pushed up to 5 squares. An ally doesn\'t take damage from being force moved this way.' }],
    },
  ],
};

/**
 * Gnoll Gnasher (Retainer Harrier, Level 2)
 * A bloodthirsty gnoll who frenzies when allies fall.
 */
export const GNOLL_GNASHER: CompendiumMonster = {
  _id: 'forgesteel/retainers/gnoll-gnasher',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Gnoll Gnasher',
  level: 2,
  roles: ['Harrier'],
  ancestry: ['Fiend', 'Gnoll'],
  ev: '0',
  stamina: '30',
  speed: 7,
  size: '1M',
  stability: 1,
  free_strike: 3,
  might: 1,
  agility: 2,
  reason: 0,
  intuition: 0,
  presence: 1,
  flavor: 'A savage gnoll warrior who enters a frenzy when blood is spilled.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Gnash',
      icon: '🦷',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '4 damage', tier2: '7 damage', tier3: '10 damage; M < strong bleeding (save ends)' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Death Frenzy',
      icon: '🩸',
      effects: [{ effect: 'Whenever a non-minion ally within 7 squares is reduced to 0 Stamina, the gnasher moves up to their speed and can make a melee free strike.' }],
    },
  ],
};

// ============================================================================
// LEVEL 3 RETAINERS
// ============================================================================

/**
 * Minotaur Gorer (Retainer Brute, Level 3)
 * A powerful minotaur who charges and gores enemies.
 */
export const MINOTAUR_GORER: CompendiumMonster = {
  _id: 'forgesteel/retainers/minotaur-gorer',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Minotaur Gorer',
  level: 3,
  roles: ['Brute'],
  ancestry: ['Accursed', 'Humanoid', 'Minotaur'],
  ev: '0',
  stamina: '39',
  speed: 6,
  size: '2',
  stability: 2,
  free_strike: 6,
  might: 2,
  agility: 1,
  reason: 0,
  intuition: 1,
  presence: 0,
  flavor: 'A mighty minotaur whose horns are feared across the battlefield.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Gore',
      icon: '🐂',
      ability_type: 'Signature Ability',
      keywords: ['Charge', 'Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '5 damage', tier2: '9 damage', tier3: '12 damage; M < strong prone' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Minotaur Sense',
      icon: '🧭',
      effects: [{ effect: 'The gorer can\'t obtain less than a tier 2 outcome when making tests to navigate, search, or seek.' }],
    },
  ],
};

/**
 * Time Raider Mind Healer (Retainer Support, Level 3)
 * A psionic healer from beyond time.
 */
export const TIME_RAIDER_MIND_HEALER: CompendiumMonster = {
  _id: 'forgesteel/retainers/time-raider-mind-healer',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Time Raider Mind Healer',
  level: 3,
  roles: ['Support'],
  ancestry: ['Humanoid', 'Time Raider'],
  ev: '0',
  stamina: '39',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 4,
  might: 0,
  agility: 2,
  reason: 2,
  intuition: 2,
  presence: 0,
  flavor: 'A strange being from outside time who heals with thought.',
  immunities: ['Psychic 5'],
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Laser Lancet',
      icon: '🔬',
      ability_type: 'Signature Ability',
      keywords: ['Ranged', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Ranged 3',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '5 fire damage', tier2: '8 fire damage', tier3: '11 fire damage' },
        { name: 'Effect', effect: 'If targeting an ally, deal no damage. The target can end one effect that ends by saving throw.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Foresight',
      icon: '🔮',
      effects: [{ effect: 'The mind healer doesn\'t take a bane on strikes against creatures with concealment.' }],
    },
  ],
};

// ============================================================================
// LEVEL 4 RETAINERS
// ============================================================================

/**
 * Shadow Elf Shade (Retainer Ambusher, Level 4)
 * A deadly assassin from the shadows.
 */
export const SHADOW_ELF_SHADE: CompendiumMonster = {
  _id: 'forgesteel/retainers/shadow-elf-shade',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Shadow Elf Shade',
  level: 4,
  roles: ['Ambusher'],
  ancestry: ['Fey', 'Humanoid', 'Shadow Elf'],
  ev: '0',
  stamina: '48',
  speed: 5,
  movement: 'Climb',
  size: '1M',
  stability: 0,
  free_strike: 5,
  might: 1,
  agility: 3,
  reason: 0,
  intuition: 2,
  presence: 1,
  flavor: 'A shadow elf assassin who strikes from darkness.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Gloom Dagger',
      icon: '🗡',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Ranged', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1 or Ranged 3',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '6 damage', tier2: '10 damage', tier3: '13 damage' },
        { name: 'Effect', effect: 'If the shade started their turn with concealment from the target, they gain 1 surge.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Of the Umbra',
      icon: '🌑',
      effects: [{ effect: 'The shade ignores concealment from darkness. In direct sunlight, damage weakness 3. In concealment, damage immunity 3.' }],
    },
  ],
};

/**
 * Hobgoblin Flameslinger (Retainer Controller, Level 4)
 * A hobgoblin pyromancer with infernal power.
 */
export const HOBGOBLIN_FLAMESLINGER: CompendiumMonster = {
  _id: 'forgesteel/retainers/hobgoblin-flameslinger',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Hobgoblin Flameslinger',
  level: 4,
  roles: ['Controller'],
  ancestry: ['Goblin', 'Hobgoblin', 'Humanoid', 'Infernal'],
  ev: '0',
  stamina: '48',
  speed: 5,
  size: '1M',
  stability: 0,
  free_strike: 5,
  might: 1,
  agility: 0,
  reason: 2,
  intuition: 1,
  presence: 3,
  flavor: 'A hobgoblin spellcaster channeling infernal fire.',
  immunities: ['Fire 4'],
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Fire Curse',
      icon: '🔥',
      ability_type: 'Signature Ability',
      keywords: ['Magic', 'Ranged', 'Strike'],
      usage: 'Main Action',
      distance: 'Ranged 10',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '5 fire damage', tier2: '9 fire damage', tier3: '12 fire damage; A < strong burning (save ends)' },
        { name: 'Effect', effect: 'A burning creature takes 1d6 fire damage at the start of each of their turns.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Infernal Ichor',
      icon: '🩸',
      effects: [{ effect: 'When reduced to 0 Stamina, each adjacent creature takes 3 fire damage.' }],
    },
  ],
};

/**
 * Vampire Rebel (Retainer Harrier, Level 4)
 * A vampire who has turned against their kind.
 */
export const VAMPIRE_REBEL: CompendiumMonster = {
  _id: 'forgesteel/retainers/vampire-rebel',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Vampire Rebel',
  level: 4,
  roles: ['Harrier'],
  ancestry: ['Undead', 'Vampire'],
  ev: '0',
  stamina: '48',
  speed: 5,
  movement: 'Climb',
  size: '1M',
  stability: 0,
  free_strike: 4,
  might: 2,
  agility: 3,
  reason: 0,
  intuition: 0,
  presence: 3,
  flavor: 'A vampire who has broken free of their master\'s control.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Flashing Fangs',
      icon: '🧛',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '5 damage', tier2: '5 damage + 3 corruption', tier3: '5 damage + 6 corruption; M < strong bleeding (save ends)' },
        { name: 'Effect', effect: 'The vampire gains temporary Stamina equal to any corruption damage dealt.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Agonizing Bloodthirst',
      icon: '🩸',
      effects: [{ effect: 'Speed 10 while any creature within 10 squares is bleeding. If able to damage a bleeding creature and doesn\'t, takes 5 corruption damage at turn end.' }],
    },
  ],
};

// ============================================================================
// LEVEL 5 RETAINERS
// ============================================================================

/**
 * Devil Defector (Retainer Hexer, Level 5)
 * A devil who has defected from Hell.
 */
export const DEVIL_DEFECTOR: CompendiumMonster = {
  _id: 'forgesteel/retainers/devil-defector',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Devil Defector',
  level: 5,
  roles: ['Hexer'],
  ancestry: ['Devil', 'Infernal'],
  ev: '0',
  stamina: '60',
  speed: 6,
  movement: 'Fly',
  size: '1M',
  stability: 0,
  free_strike: 5,
  might: 3,
  agility: 2,
  reason: 3,
  intuition: 1,
  presence: 2,
  flavor: 'A devil who has turned against Hell, seeking redemption or revenge.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Black Flame',
      icon: '🖤',
      ability_type: 'Signature Ability',
      keywords: ['Magic', 'Ranged', 'Strike'],
      usage: 'Main Action',
      distance: 'Ranged 10',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '6 fire or corruption damage', tier2: '10 fire or corruption damage', tier3: '13 fire or corruption damage' }],
    },
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Tempting Offer',
      icon: '😈',
      keywords: ['Ranged', 'Strike'],
      usage: 'Triggered (enemy reduced to 0 Stamina, Encounter)',
      distance: 'Ranged 10',
      target: 'Triggering creature',
      effects: [{ name: 'Effect', effect: 'Target can be reduced to 1 Stamina instead. If so, defector controls their next move action. Target must attack defector\'s choice or die. Director can spend 3 Malice to refuse.' }],
    },
  ],
};

/**
 * Troll Mercenary (Retainer Brute, Level 5)
 * A regenerating troll hired for muscle.
 */
export const TROLL_MERCENARY: CompendiumMonster = {
  _id: 'forgesteel/retainers/troll-mercenary',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Troll Mercenary',
  level: 5,
  roles: ['Brute'],
  ancestry: ['Giant', 'Troll'],
  ev: '0',
  stamina: '57',
  speed: 6,
  size: '2',
  stability: 4,
  free_strike: 6,
  might: 3,
  agility: 1,
  reason: -1,
  intuition: 0,
  presence: 1,
  flavor: 'A troll who fights for pay and food.',
  weaknesses: ['Acid 5', 'Fire 5'],
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Big Bite',
      icon: '🦷',
      ability_type: 'Signature Ability',
      keywords: ['Charge', 'Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [
        { roll: 'Power Roll (any characteristic)', tier1: '6 damage', tier2: '11 damage', tier3: '14 damage' },
        { name: 'Effect', effect: 'The mercenary regains Stamina equal to half the damage dealt.' },
      ],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Relentless Hunger',
      icon: '🍖',
      effects: [{ effect: 'The mercenary dies only if reduced to 0 by acid or fire, ends turn at 0, or takes acid/fire while at 0.' }],
    },
  ],
};

// ============================================================================
// LEVEL 6 RETAINERS
// ============================================================================

/**
 * The Nameless (Retainer Defender, Level 6)
 * A mysterious draconian warrior.
 */
export const THE_NAMELESS: CompendiumMonster = {
  _id: 'forgesteel/retainers/the-nameless',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'The Nameless',
  level: 6,
  roles: ['Defender'],
  ancestry: ['Draconian', 'Dragon', 'Humanoid'],
  ev: '0',
  stamina: '66',
  speed: 5,
  movement: 'Fly',
  size: '1M',
  stability: 4,
  free_strike: 6,
  might: 3,
  agility: 2,
  reason: 1,
  intuition: 1,
  presence: 2,
  flavor: 'A draconian who has forsaken their name and their former masters.',
  immunities: ['Corruption 6'],
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Baneful Blade',
      icon: '⚔️',
      ability_type: 'Signature Ability',
      keywords: ['Charge', 'Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 1',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '6 damage', tier2: '11 damage', tier3: '14 damage; push 2' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Wing Block',
      icon: '🦇',
      effects: [{ effect: 'Ranged attacks against the Nameless take a bane.' }],
    },
  ],
};

// ============================================================================
// LEGACY ALIAS (for backwards compatibility)
// ============================================================================

/**
 * Ogre Bruiser (Custom Retainer Brute, Level 1)
 * A massive ogre companion who hits hard and draws attention.
 */
export const OGRE_BRUISER: CompendiumMonster = {
  _id: 'forgesteel/retainers/ogre-bruiser',
  _category: 'monsters',
  _filename: 'retainers',
  type: 'statblock',
  name: 'Ogre Bruiser',
  level: 1,
  roles: ['Brute'],
  ancestry: ['Ogre', 'Humanoid'],
  ev: '0',
  stamina: '30',
  speed: 5,
  size: '2',
  stability: 2,
  free_strike: 4,
  might: 3,
  agility: -1,
  reason: -2,
  intuition: 0,
  presence: 0,
  flavor: 'A surprisingly loyal ogre who has found purpose in protecting their smaller companions.',
  features: [
    {
      type: 'feature',
      feature_type: 'ability',
      name: 'Crushing Blow',
      icon: '👊',
      ability_type: 'Signature Ability',
      keywords: ['Melee', 'Strike', 'Weapon'],
      usage: 'Main Action',
      distance: 'Melee 2',
      target: 'One creature or object',
      effects: [{ roll: 'Power Roll (any characteristic)', tier1: '5 damage', tier2: '9 damage; push 1', tier3: '13 damage; push 2 and prone' }],
    },
    {
      type: 'feature',
      feature_type: 'trait',
      name: 'Protective Bulk',
      icon: '🛡️',
      effects: [{ effect: 'While adjacent to the bruiser, the mentor gains +2 to their stability.' }],
    },
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All Retainer Companions (21 total)
 */
export const RETAINER_MONSTERS: CompendiumMonster[] = [
  // Level 1
  ANGULOTL_HOPPER,
  DWARF_MORTAR,
  GOBLIN_GUIDE,
  HIGH_ELF_WEATHERWISE,
  HUMAN_WARRIOR,
  HUMAN_HEALER,
  KOBOLD_SHIELDBEARER,
  ORC_CHARGER,
  RADENWIGHT_SIDEKICK,
  UNDEAD_SERVITOR,
  UNQUIET_SPIRIT,
  WODE_ELF_ARROWSWIFT,
  OGRE_BRUISER,
  // Level 2
  BUGBEAR_COMMANDO,
  GNOLL_GNASHER,
  // Level 3
  MINOTAUR_GORER,
  TIME_RAIDER_MIND_HEALER,
  // Level 4
  SHADOW_ELF_SHADE,
  HOBGOBLIN_FLAMESLINGER,
  VAMPIRE_REBEL,
  // Level 5
  DEVIL_DEFECTOR,
  TROLL_MERCENARY,
  // Level 6
  THE_NAMELESS,
];

/**
 * Get retainer by name
 */
export function getRetainerByName(name: string): CompendiumMonster | undefined {
  return RETAINER_MONSTERS.find(r => r.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all retainers
 */
export function getAllRetainers(): CompendiumMonster[] {
  return RETAINER_MONSTERS;
}

/**
 * Get retainers by level
 */
export function getRetainersByLevel(level: number): CompendiumMonster[] {
  return RETAINER_MONSTERS.filter(r => r.level === level);
}

/**
 * Get retainers by role
 */
export function getRetainersByRole(role: MonsterRole): CompendiumMonster[] {
  return RETAINER_MONSTERS.filter(r => r.roles?.includes(role));
}
