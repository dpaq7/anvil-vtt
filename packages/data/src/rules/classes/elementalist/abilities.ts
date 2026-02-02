/**
 * Elementalist Class Abilities - Synced with Draw Steel Heroes v1
 * Resource: Essence
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost, at-will)
// ============================================================

export const elementalistSignatureAbilities: Ability[] = [
  {
    id: 'afflict-a-bountiful-decay',
    name: 'Afflict a Bountiful Decay',
    flavorText: 'Your curse causes your foe\'s flesh to rot off as spores that aid your allies.',
    actionType: 'action',
    keywords: ['Green', 'Magic', 'Ranged', 'Rot', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R corruption damage',
      tier2: '4 + R corruption damage',
      tier3: '6 + R corruption damage',
    },
    effect: 'Choose yourself or one ally within distance. That character can end one effect on them that is ended by a saving throw or that ends at the end of their turn.',
  },
  {
    id: 'bifurcated-incineration',
    name: 'Bifurcated Incineration',
    flavorText: 'Two jets of flame lance out at your command.',
    actionType: 'action',
    keywords: ['Fire', 'Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'Two creatures or objects',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 fire damage',
      tier2: '4 fire damage',
      tier3: '6 fire damage',
    },
    effect: '',
  },
  {
    id: 'grasp-of-beyond',
    name: 'Grasp of Beyond',
    flavorText: 'You absorb the life energy of another creature and use it to teleport.',
    actionType: 'action',
    keywords: ['Magic', 'Melee', 'Strike', 'Void'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 + R corruption damage',
      tier2: '6 + R corruption damage',
      tier3: '9 + R corruption damage',
    },
    effect: 'You can teleport up to a number of squares equal to your Reason score.',
  },
  {
    id: 'the-green-within-the-green-without',
    name: 'The Green Within, the Green Without',
    flavorText: 'Whipping vines erupt from a foe\'s body to grasp at another close by.',
    actionType: 'action',
    keywords: ['Green', 'Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R damage',
      tier2: '5 + R damage',
      tier3: '7 + R damage',
    },
    effect: 'You slide one creature within 10 squares of the target up to 2 squares.',
  },
  {
    id: 'meteoric-introduction',
    name: 'Meteoric Introduction',
    flavorText: 'You give your enemy a gentle tap-like an asteroid impact.',
    actionType: 'action',
    keywords: ['Earth', 'Magic', 'Melee', 'Strike'],
    distance: 'Melee 1',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 + R damage; push 2',
      tier2: '5 + R damage; push 3',
      tier3: '8 + R damage; push 4',
    },
    effect: '',
  },
  {
    id: 'ray-of-agonizing-self-reflection',
    name: 'Ray of Agonizing Self-Reflection',
    flavorText: 'You inflict pain and doubt in equal measure.',
    actionType: 'action',
    keywords: ['Magic', 'Ranged', 'Strike', 'Void'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R corruption damage; R < WEAK, slowed (save ends)',
      tier2: '4 + R corruption damage; R < AVERAGE, slowed (save ends)',
      tier3: '6 + R corruption damage; R < STRONG, slowed (save ends)',
    },
    effect: '',
  },
  {
    id: 'unquiet-ground',
    name: 'Unquiet Ground',
    flavorText: 'A sudden storm of detritus assaults your foes and leaves them struggling to move.',
    actionType: 'action',
    keywords: ['Area', 'Earth', 'Magic', 'Ranged'],
    distance: '2 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 damage',
      tier2: '5 damage',
      tier3: '7 damage',
    },
    effect: 'The ground beneath the area is difficult terrain for enemies.',
  },
  {
    id: 'viscous-fire',
    name: 'Viscous Fire',
    flavorText: 'A jet of heavy fire erupts where you strike.',
    actionType: 'action',
    keywords: ['Fire', 'Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 + R fire damage; push 2',
      tier2: '5 + R fire damage; push 3',
      tier3: '7 + R fire damage; push 4',
    },
    effect: '',
  },
];

// ============================================================
// 3-ESSENCE ABILITIES
// ============================================================

export const elementalistThreeEssenceAbilities: Ability[] = [
  {
    id: 'behold-the-mystery',
    name: 'Behold the Mystery',
    flavorText: 'You open a rift into the void to harry your foes.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Magic', 'Ranged', 'Void'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 psychic damage',
      tier2: '4 psychic damage',
      tier3: '6 psychic damage',
    },
    effect: 'Persistent 1: At the start of your turn, you can use a maneuver to use this ability again without spending essence.',
  },
  {
    id: 'the-flesh-a-crucible',
    name: 'The Flesh, a Crucible',
    flavorText: 'Fire engulfs your target and continues to churn.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Fire', 'Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '5 + R fire damage',
      tier2: '8 + R fire damage',
      tier3: '11 + R fire damage',
    },
    effect: 'Persistent 1: If the target is within distance at the start of your turn, you can make the power roll again without spending essence (no action required).',
  },
  {
    id: 'invigorating-growth',
    name: 'Invigorating Growth',
    flavorText: 'Mushrooms erupt from a foe, sapping their vitality to spread strengthening spores.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Green', 'Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '4 + R poison damage',
      tier2: '7 + R poison damage',
      tier3: '11 + R poison damage',
    },
    effect: 'Mushrooms cover the target\'s body. While the mushrooms are on the target, you and any ally adjacent to the target gain 1 surge whenever the target takes damage. The mushrooms can be removed by the target or an adjacent creature as a main action.',
  },
  {
    id: 'ripples-in-the-earth',
    name: 'Ripples in the Earth',
    flavorText: 'Like a stone was dropped into a pond, waves in the earth radiate from you.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Area', 'Earth', 'Magic'],
    distance: '2 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 damage',
      tier2: '5 damage',
      tier3: '8 damage; M < STRONG, prone',
    },
    effect: 'You must be touching the ground to use this ability. Additionally, you can choose a square of ground in the area that is unoccupied or is occupied by you or any ally. A pillar of earth rises out of the ground in that square, with a height in squares up to your Reason score. The pillar can\'t collide with any creatures or objects, nor can it force creatures raised by it to collide with other creatures or objects.',
  },
];

// ============================================================
// 5-ESSENCE ABILITIES
// ============================================================

export const elementalistFiveEssenceAbilities: Ability[] = [
  {
    id: 'conflagration',
    name: 'Conflagration',
    flavorText: 'A storm of fire descends upon your enemies.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Fire', 'Magic', 'Ranged'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '4 fire damage',
      tier2: '6 fire damage',
      tier3: '10 fire damage',
    },
    effect: 'Persistent 2: At the start of your turn, you can use a maneuver to use this ability again without spending essence.',
  },
  {
    id: 'instantaneous-excavation',
    name: 'Instantaneous Excavation',
    flavorText: 'The surface of the world around you opens up to swallow foes.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Earth', 'Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Special',
    powerRoll: {
      characteristic: 'reason',
      tier1: 'The target can shift 1 square from the edge of the hole to the nearest unoccupied space of their choice.',
      tier2: 'The target falls into the hole.',
      tier3: 'The target falls into the hole and can\'t reduce the height of the fall.',
    },
    effect: 'You open up two holes with 1-square openings that are 4 squares deep, which can be placed on any mundane surface within distance. You can place these holes next to each other to create fewer holes with wider openings. When the holes open, make a separate power roll for each creature on the ground above a hole and small enough to fall in. Persistent 1: At the start of your turn, you open another hole, making a power roll against each creature who could fall into the hole when it opens without spending essence.',
  },
  {
    id: 'no-more-than-a-breeze',
    name: 'No More Than a Breeze',
    flavorText: 'The material substance of a creature shreds away at your command.',
    actionType: 'maneuver',
    essenceCost: 5,
    keywords: ['Magic', 'Ranged', 'Void'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    effect: 'Until the start of your next turn, the target can move through solid matter, they ignore difficult terrain, and their movement can\'t provoke opportunity attacks. If the target ends their turn inside solid matter, they are forced out into the space where they entered it and this effect ends. Persistent 1: The effect lasts until the start of your next turn.',
  },
  {
    id: 'test-of-rain',
    name: 'Test of Rain',
    flavorText: 'You call down a rain that burns your enemies and restores your allies.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Area', 'Green', 'Magic', 'Ranged'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '4 acid damage',
      tier2: '6 acid damage',
      tier3: '10 acid damage',
    },
    effect: 'You can end one effect on yourself that is ended by a saving throw or that ends at the end of your turn. Each ally in the area also gains this benefit.',
  },
];

// ============================================================
// 7-ESSENCE ABILITIES
// ============================================================

export const elementalistSevenEssenceAbilities: Ability[] = [
  {
    id: 'erase',
    name: 'Erase',
    flavorText: 'With a flick of the wrist, you phase creatures out of existence.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Ranged', 'Strike', 'Void'],
    distance: 'Ranged 10',
    target: 'Special',
    powerRoll: {
      characteristic: 'reason',
      tier1: 'One creature',
      tier2: 'Two creatures',
      tier3: 'Three creatures',
    },
    effect: 'Each target begins to fade from existence (save ends). On their first turn while fading from existence, a target takes a bane on power rolls. At the end of their first turn, they have a double bane on power rolls. At the end of their second turn, they fade from existence for 1 hour, after which they reappear in their original space or the nearest unoccupied space.',
  },
  {
    id: 'maw-of-earth',
    name: 'Maw of Earth',
    flavorText: 'You open up the ground, spewing out shrapnel of stone and debris.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Earth', 'Magic', 'Ranged'],
    distance: '3 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '5 damage',
      tier2: '9 damage',
      tier3: '12 damage',
    },
    effect: 'The ground in or directly beneath the area drops 3 squares.',
  },
  {
    id: 'swarm-of-spirits',
    name: 'Swarm of Spirits',
    flavorText: 'Guardian animal spirits surround you to harry your foes and bolster your allies.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Green', 'Magic'],
    distance: '3 aura',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 damage',
      tier2: '6 damage',
      tier3: '9 damage',
    },
    effect: 'Until the end of your next turn, each ally in the area has each of their characteristic scores treated as 1 higher for the purpose of resisting potencies, and has a +1 bonus to saving throws. Persistent 1: You make the power roll again to target each enemy in the area without spending essence, and the effect lasts until the start of your next turn.',
  },
  {
    id: 'wall-of-fire',
    name: 'Wall of Fire',
    flavorText: 'A blazing, beautifully organized inferno erupts at your command.',
    actionType: 'maneuver',
    essenceCost: 7,
    keywords: ['Area', 'Fire', 'Magic', 'Ranged'],
    distance: '10 wall within 10',
    target: 'Special',
    effect: 'The wall lasts until the start of your next turn, and can be placed in occupied squares. Creatures can enter and pass through the wall. Each enemy who enters the area for the first time in a combat round or starts their turn there takes fire damage equal to your Reason score for each square of the area they start their turn in or enter. Persistent 1: The wall lasts until the start of your next turn, and you can add a number of squares to the wall equal to your Reason score.',
  },
];

// ============================================================
// 9-ESSENCE ABILITIES
// ============================================================

export const elementalistNineEssenceAbilities: Ability[] = [
  {
    id: 'combustion-deferred',
    name: 'Combustion Deferred',
    flavorText: 'Your flames dance from kindling to kindling to kindling.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Fire', 'Magic', 'Ranged', 'Strike'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '8 + R fire damage',
      tier2: '13 + R fire damage',
      tier3: '17 + R fire damage',
    },
    effect: 'When the target ends their next turn, or if they drop to 0 Stamina before then, each enemy adjacent to them takes fire damage equal to twice your Reason score. Each affected enemy then gains this same effect.',
  },
  {
    id: 'storm-of-sands',
    name: 'Storm of Sands',
    flavorText: 'Dirt and debris swirl into a dark, pulsing hurricane.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Earth', 'Magic', 'Ranged'],
    distance: '4 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 damage',
      tier2: '5 damage',
      tier3: '7 damage',
    },
    effect: 'The area lasts until the start of your next turn. It is difficult terrain for enemies, and you and your allies have concealment while in the area. Persistent 1: The area remains until the start of your next turn, and you can move it up to 5 squares (no action required). As a maneuver, you can make the power roll again without spending essence.',
  },
  {
    id: 'subverted-perception-of-space',
    name: 'Subverted Perception of Space',
    flavorText: 'You rip an enemy\'s world in twain.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Magic', 'Ranged', 'Strike', 'Void'],
    distance: 'Ranged 10',
    target: 'One creature or object',
    powerRoll: {
      characteristic: 'reason',
      tier1: '9 + R corruption damage',
      tier2: '10 + R corruption damage; the target has line of effect only to creatures and objects within 4 squares of them until the start of your next turn',
      tier3: '15 + R corruption damage; the target has line of effect only to adjacent creatures and objects until the start of your next turn',
    },
    effect: '',
  },
  {
    id: 'web-of-all-thats-come-before',
    name: 'Web of All That\'s Come Before',
    flavorText: 'Threads you\'ve been weaving through your adventures create a vibrant, pearlescent web.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Green', 'Magic', 'Ranged'],
    distance: '4 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '2 corruption damage; A < WEAK, restrained (save ends)',
      tier2: '3 corruption damage; A < AVERAGE, restrained (save ends)',
      tier3: '5 corruption damage; A < STRONG, restrained (save ends)',
    },
    effect: 'The area is difficult terrain until the start of your next turn. Each enemy who ends their turn in the area is restrained (save ends). Persistent 1: The area remains until the start of your next turn.',
  },
];

// ============================================================
// 11-ESSENCE ABILITIES
// ============================================================

export const elementalistElevenEssenceAbilities: Ability[] = [
  {
    id: 'heart-of-the-wode',
    name: 'Heart of the Wode',
    flavorText: 'You call forth one of the Great Tree\'s many splinters to provide for your every need.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Green', 'Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Special',
    effect: 'A size 5 tree appears in an unoccupied space within distance. The tree has 100 Stamina and can\'t be force moved. You and any ally can touch the tree to use the Catch Breath maneuver as a free maneuver. Additionally, when you start your turn with line of effect to the tree, you can end one effect on yourself that is ended by a saving throw or that ends at the end of your turn, or you can stand up if you are prone. Each ally within distance also gains this benefit. Each enemy who ends their turn within 3 squares of the tree is restrained until the end of their next turn. A creature restrained this way can use a main action to end the effect early.',
  },
  {
    id: 'muse-of-fire',
    name: 'Muse of Fire',
    flavorText: 'The fire burns hot enough to sear the face of any god watching.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Fire', 'Magic', 'Ranged'],
    distance: '5 cube within 10',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '7 fire damage; the Director loses 2 Malice',
      tier2: '10 fire damage; the Director loses 3 Malice',
      tier3: '15 fire damage; the Director loses 4 Malice',
    },
    effect: 'The Director\'s Malice can become negative as a result of this ability.',
  },
  {
    id: 'return-to-oblivion',
    name: 'Return to Oblivion',
    flavorText: 'You create a tear in reality that could consume everything.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic', 'Ranged', 'Void'],
    distance: 'Ranged 10',
    target: 'Special',
    effect: 'You create a size 1L vortex that lasts until the end of the encounter. At the start of each combat round while the vortex is unoccupied, the vortex vertical pulls 3 each enemy within 5 squares of it. Each enemy who enters the vortex or starts their turn there is knocked prone. At the end of the round, if a winded enemy who is not a leader or solo creature is in the vortex, they are instantly destroyed.',
  },
  {
    id: 'world-torn-asunder',
    name: 'World Torn Asunder',
    flavorText: 'You stomp your foot and quake the whole world over.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Earth', 'Magic'],
    distance: '5 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: 'M < WEAK, prone',
      tier2: 'M < AVERAGE, prone',
      tier3: 'M < STRONG, prone',
    },
    effect: 'You create a fissure in the ground adjacent to you that is a 10 x 2 line and 6 squares deep. Each creature in the area who is prone and size 2 or smaller falls in. Other creatures can enter the fissure or can shift to the nearest unoccupied space of their choice outside it.',
  },
];

// ============================================================
// SPECIALIZATION TRIGGERED ACTIONS
// ============================================================

export const elementalistTriggeredActions: Ability[] = [
  {
    id: 'breath-of-dawn-remembered',
    name: 'Breath of Dawn Remembered',
    flavorText: 'The power you channel grants the ability to get back in the fight.',
    actionType: 'triggered',
    keywords: ['Green', 'Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    trigger: 'The target starts their turn or takes damage.',
    effect: 'The target can spend a Recovery. Spend 1+ Essence: The target can spend an additional Recovery for each essence spent.',
  },
  {
    id: 'explosive-assistance',
    name: 'Explosive Assistance',
    flavorText: 'You add a little magic to an ally\'s aggression at just the right time.',
    actionType: 'triggered',
    keywords: ['Fire', 'Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    trigger: 'The target force moves a creature or object.',
    effect: 'The forced movement distance gains a bonus equal to your Reason score. Spend 1 Essence: The forced movement distance gains a bonus equal to twice your Reason score instead.',
  },
  {
    id: 'skin-like-castle-walls',
    name: 'Skin Like Castle Walls',
    flavorText: 'You cover yourself or an ally in protective stone.',
    actionType: 'triggered',
    keywords: ['Earth', 'Magic', 'Ranged'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    trigger: 'The target takes damage.',
    effect: 'The target takes half the damage. Spend 1 Essence: If the damage has any potency effects associated with it, the potency is reduced by 1 for the target.',
  },
  {
    id: 'subtle-relocation',
    name: 'Subtle Relocation',
    flavorText: 'You call on the void to swallow and spit out an ally.',
    actionType: 'triggered',
    keywords: ['Magic', 'Ranged', 'Void'],
    distance: 'Ranged 10',
    target: 'Self or one ally',
    trigger: 'The target starts their turn, moves, or is force moved.',
    effect: 'You teleport the target up to a number of squares equal to your Reason score. If the target moves to trigger this ability, you can teleport them at any point during the move. Spend 1 Essence: You teleport the target up to a number of squares equal to twice your Reason score instead.',
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

// All core Elementalist abilities
export const elementalistAbilities: Ability[] = [
  ...elementalistSignatureAbilities,
  ...elementalistThreeEssenceAbilities,
  ...elementalistFiveEssenceAbilities,
  ...elementalistSevenEssenceAbilities,
  ...elementalistNineEssenceAbilities,
  ...elementalistElevenEssenceAbilities,
];

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return elementalistAbilities.find(a => a.id === id);
};

export const getAbilitiesByCost = (maxCost: number): Ability[] => {
  return elementalistAbilities.filter(a => (a.essenceCost || 0) <= maxCost);
};

export const getSignatureAbilities = (): Ability[] => {
  return elementalistSignatureAbilities;
};

export const getHeroicAbilities = (): Ability[] => {
  return elementalistAbilities.filter(a => a.essenceCost && a.essenceCost > 0);
};

// Get specialization triggered action
export const getSpecializationTriggeredAction = (specialization: string): Ability | undefined => {
  switch (specialization) {
    case 'earth':
      return elementalistTriggeredActions.find(a => a.id === 'skin-like-castle-walls');
    case 'fire':
      return elementalistTriggeredActions.find(a => a.id === 'explosive-assistance');
    case 'green':
      return elementalistTriggeredActions.find(a => a.id === 'breath-of-dawn-remembered');
    case 'void':
      return elementalistTriggeredActions.find(a => a.id === 'subtle-relocation');
  }
  return undefined;
};
