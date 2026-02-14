/**
 * Summoner Class Abilities - Synced with Draw Steel Heroes v10
 * Resource: Essence
 * Primary Characteristic: Reason
 */
import type { Ability } from '@anvil/types';

// ============================================================
// SIGNATURE ABILITIES (No cost / at-will)
// ============================================================

export const summonerSignatureAbilities: Ability[] = [
  {
    id: 'summoner-strike',
    name: 'Summoner Strike',
    flavorText:
      'A bolt of magical energy lashes out at your foe, sapping their mobility.',
    actionType: 'action',
    keywords: ['Magic', 'Melee', 'Ranged', 'Strike'],
    distance: 'Melee 1 or Ranged 5',
    target: 'One creature or object',
    effect:
      'Deal R damage. P < WEAK, the target is slowed (save ends). This ability can be used as a free strike and has the Charge keyword when used as a melee attack.',
  },
  {
    id: 'strike-for-me',
    name: 'Strike For Me',
    flavorText:
      'Your minions lash out on your behalf when an opportunity arises.',
    actionType: 'freeTriggered',
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'Your minions',
    trigger:
      'You use a triggered action to make a free strike or signature ability.',
    powerRoll: {
      characteristic: 'reason',
      tier1: 'Up to 3 of your minions each make a free strike',
      tier2: 'Up to 5 of your minions each make a free strike',
      tier3: 'Up to 7 of your minions each make a free strike',
    },
    effect:
      'On a natural 19-20, each of your minions makes a free strike. If the original trigger granted a signature ability, you gain an edge on this power roll.',
  },
  {
    id: 'call-forth',
    name: 'Call Forth',
    flavorText: 'You reach beyond the veil and summon your servants.',
    actionType: 'action',
    essenceCost: 1,
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon minions. Option A (Signature): 1 minion per 1 Essence spent. Option B (Portfolio): Summon the listed number of minions for the fixed Essence cost on the stat block.',
    additionalEffects: [
      {
        cost: 'Variable Essence',
        description:
          'You may spend additional Essence to summon more signature minions (1 per Essence) or summon portfolio minions at their listed cost.',
      },
    ],
  },
  {
    id: 'minion-bridge',
    name: 'Minion Bridge',
    flavorText:
      'You teleport to the side of one of your loyal servants.',
    actionType: 'maneuver',
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'Self',
    effect:
      'Shift to a square adjacent to a target minion you control. You can shift through minion squares, extending your shift distance.',
    additionalEffects: [
      {
        cost: 'Spend 1 Essence',
        description: 'One adjacent ally shifts with you.',
      },
    ],
  },
];

// ============================================================
// 3-ESSENCE ABILITIES
// ============================================================

export const summonerThreeEssenceAbilities: Ability[] = [
  // -- Demon 3-Essence --
  {
    id: 'summon-archer-spittlich',
    name: 'Summon Archer Spittlich',
    flavorText:
      'A venomous demon materializes, spitting corrosive poison at distant foes.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Archer Spittlich (Artillery, 1S). Speed 5, Stamina 5, Free Strike 5 poison (Range 10). Splash Strike: 2 poison damage to enemy adjacent to target; poisoned targets cannot shift.',
  },
  {
    id: 'summon-twisted-bengrul',
    name: 'Summon Twisted Bengrul',
    flavorText:
      'A towering demon twists the minds of those who oppose you.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Twisted Bengrul (Hexer, 1L). Speed 5, Stamina 5, Free Strike 4 psychic. Mind Twist: 2d10 + R psychic damage, target is twisted (no edges, cannot search).',
  },
  {
    id: 'summon-fanged-musilex',
    name: 'Summon Fanged Musilex',
    flavorText:
      'A massive-jawed demon lunges forth to drag enemies to their doom.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Fanged Musilex (Brute, 1L). Speed 6, Stamina 6, Free Strike 5. Mawful Strike: Range 2 + R, Pull 2 (increases +2 per extra Musilex). If pulled adjacent: +2 damage or Grab.',
  },
  // -- Elemental 3-Essence --
  {
    id: 'summon-crux-of-ash',
    name: 'Summon Crux of Ash',
    flavorText:
      'A swirling cloud of soot and cinders takes form, concealing your allies.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Crux of Ash (Ambusher, 1M). Soot Strike: Hides allies from target. On death (Cost 1 Essence): create concealment cloud that blocks line of effect.',
  },
  {
    id: 'summon-flow-of-magma',
    name: 'Summon Flow of Magma',
    flavorText:
      'Molten rock rises from the earth, flowing across the battlefield.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Flow of Magma (Harrier, 1L). Climb. Molten Strike: 2d10 + R damage, shift and leave fire trail. On death (Cost 1 Essence): create lava zone (difficult terrain + fire damage).',
  },
  {
    id: 'summon-desolation-of-sand',
    name: 'Summon Desolation of Sand',
    flavorText:
      'Living sand erupts from below, burying and trapping your enemies.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Desolation of Sand (Hexer, 1M). Burrow. Burying Strike: Slow/Restrain. On death (Cost 1 Essence): difficult terrain + allies shift 3.',
  },
  // -- Fey 3-Essence --
  {
    id: 'summon-pixie-hydrain',
    name: 'Summon Pixie Hydrain',
    flavorText:
      'A rain-bringing pixie descends, acid drops healing friends and burning foes.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Pixie Hydrain (Artillery, 1T). Fly. Rain: 2d10 + R acid damage + weakened. Ally can spend Recovery or cleanse a condition.',
  },
  {
    id: 'summon-sprite-orchiguard',
    name: 'Summon Sprite Orchiguard',
    flavorText:
      'A stalwart sprite guardian interposes itself between your allies and harm.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Sprite Orchiguard (Defender, 1S). Fly. Fairy Guard: Take half damage for adjacent ally.',
  },
  {
    id: 'summon-pixie-loftlilly',
    name: 'Summon Pixie Loftlilly',
    flavorText:
      'Floating lilies drift across the battlefield, lifting enemies from solid ground.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Pixie Loftlilly (Controller, 1T). Fly. Floating Toxins: Aura floats enemies (cannot shift, +2 forced movement distance, bane on power rolls).',
  },
  // -- Undead 3-Essence --
  {
    id: 'summon-grave-knight',
    name: 'Summon Grave Knight',
    flavorText:
      'An armored corpse claws its way from the earth, blade in hand.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Grave Knight (Brute, 1M). Knight Strike: 2d10 + R corruption damage + bleeding. To the Grave: makes a free strike on death.',
  },
  {
    id: 'summon-stalker-shade',
    name: 'Summon Stalker Shade',
    flavorText:
      'A shadowy specter phases into existence, invisible and intangible.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Stalker Shade (Ambusher, 1M). Fly, invisible. Shadow Phasing: Move through walls and creatures.',
  },
  {
    id: 'summon-zombie-lumberer',
    name: 'Summon Zombie Lumberer',
    flavorText:
      'A hulking zombie lumbers forth, grasping at anything that moves.',
    actionType: 'action',
    essenceCost: 3,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Zombie Lumberer (Defender, Size 2). Zombie Clutch: Grab + damage. Death Grasp: Restrain on death.',
  },
];

// ============================================================
// 5-ESSENCE ABILITIES
// ============================================================

export const summonerFiveEssenceAbilities: Ability[] = [
  // -- Demon 5-Essence --
  {
    id: 'summon-gushing-spewler',
    name: 'Summon Gushing Spewler',
    flavorText:
      'A blob of acidic demon ooze appears, sliding enemies around the battlefield.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Gushing Spewler (Controller, 1M). Speed 5, Stamina 4 each, Free Strike 3 acid (Range 10). Gushing Strike: Slide target R + 2. Spew Slide: When damaged, shift 2 and leave slime (bane on strikes).',
  },
  {
    id: 'summon-hulking-chimor',
    name: 'Summon Hulking Chimor',
    flavorText:
      'A shifting, ever-changing demon takes the field, weakening all it touches.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Hulking Chimor (Defender, Size 2). Speed 5, Stamina 7 each, Free Strike 3. Mercurial Strike: Weakened (EoT), potency = current round number. Evershifting: Immune to opportunity attacks.',
  },
  {
    id: 'summon-violent',
    name: 'Summon Violent',
    flavorText:
      'Shapeshifting demons appear disguised as innocuous objects, waiting to strike.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Violent (Ambusher, 1M). Speed 7, Stamina 5 each, Free Strike 1 corruption. Mimicry: Start turn hidden as object. Transforming Strike: +2 damage if hidden.',
  },
  // -- Elemental 5-Essence --
  {
    id: 'summon-dancing-silk',
    name: 'Summon Dancing Silk',
    flavorText:
      'Threads of elemental silk drift through the air, ensnaring your foes.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Dancing Silk (Artillery, 1T). Fly. Entangling Strike: Range 5, restrain target + slow adjacent. On death (Cost 1 Essence): web zone (difficult terrain + slow).',
  },
  {
    id: 'summon-quiet-of-snow',
    name: 'Summon Quiet of Snow',
    flavorText:
      'Hushed elemental spirits of frost descend, freezing enemies in their tracks.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Quiet of Snow (Controller, 1S). Fly. Freezing Howl: 2d10 + R cold damage + slow/stop. Cold Surge: On death, allies in burst gain a surge.',
  },
  {
    id: 'summon-principle-of-the-swamp',
    name: 'Summon Principle of the Swamp',
    flavorText:
      'A massive swamp elemental rises from stagnant water, grasping all in reach.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Principle of the Swamp (Brute, Size 2). Swim. Encroaching Strike: Grab (unlimited targets). On death (Cost 1 Essence): pull enemies to center.',
  },
  // -- Fey 5-Essence --
  {
    id: 'summon-nixie-hemloche',
    name: 'Summon Nixie Hemloche',
    flavorText:
      'Whirling waters rise around a nixie, sweeping enemies off their feet.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Nixie Hemloche (Hexer, 1T). Swim. Whirling Waves: Difficult terrain aura + slide 3.',
  },
  {
    id: 'summon-pixie-rosenthall',
    name: 'Summon Pixie Rosenthall',
    flavorText:
      'A swarm of rose-adorned pixies descend in a symphony of thorns and beauty.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Pixie Rosenthall (Harrier, Size 2). Fly/Swarm. Symphony: 2d10 + R damage + pull + bleeding + cannot shift. Swarm: Occupy enemy space (2 damage/turn).',
  },
  {
    id: 'summon-sprite-foxglow',
    name: 'Summon Sprite Foxglow',
    flavorText:
      'Cunning foxfire sprites flit across the battlefield, dazing the unwary.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Sprite Foxglow (Ambusher, 1T). Fly. Flash Strike: Daze (if hidden). Quiet: Silence aura (bane on search).',
  },
  // -- Undead 5-Essence --
  {
    id: 'summon-accursed-mummy',
    name: 'Summon Accursed Mummy',
    flavorText:
      'Dusty bandages unravel as ancient mummies shamble forth, their curses palpable.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Accursed Mummy (Hexer, 1M). Fetid Bindings: 2d10 + R poison damage + pull + weakened. Mummy Dust: Reflect 2 poison damage to melee attackers.',
  },
  {
    id: 'summon-phase-ghoul',
    name: 'Summon Phase Ghoul',
    flavorText:
      'Ravenous ghouls phase in and out of reality, pouncing on the living.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Phase Ghoul (Harrier, 1M). Teleport. Leaping Strike: Teleport 5 + strike + prone.',
  },
  {
    id: 'summon-ceaseless-mournling',
    name: 'Summon Ceaseless Mournling',
    flavorText:
      'An unending wail echoes from beneath the ground as mourning spirits surface.',
    actionType: 'action',
    essenceCost: 5,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Ceaseless Mournling (Controller, Size 2). Burrow. Always Crying: Sonic damage aura, enemies cannot shift.',
  },
];

// ============================================================
// 7-ESSENCE ABILITIES
// ============================================================

export const summonerSevenEssenceAbilities: Ability[] = [
  // -- Level 3 choice abilities (non-summon) --
  {
    id: 'blitz-tactics',
    name: 'Blitz Tactics',
    flavorText:
      'Your minions surge forward as a coordinated wave, knocking enemies aside.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'Your minions',
    effect:
      'Each of your minions can shift up to their speed. Any enemy a minion moves through is knocked prone.',
  },
  {
    id: 'cavalry-call',
    name: 'Cavalry Call',
    flavorText:
      'You reach across the veil and summon a temporary reinforcement squad.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon'],
    distance: "Summoner's Range",
    target: 'Unoccupied spaces in range',
    effect:
      'Summon a temporary squad of 6 signature minions. This squad does not count toward your squad limit. The squad lasts until the end of the encounter or until destroyed.',
  },
  {
    id: 'essence-funnel',
    name: 'Essence Funnel',
    flavorText:
      'You channel the life force of your minions into a devastating beam of energy.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Area', 'Magic'],
    distance: 'Line 10',
    target: 'Each creature in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '4 + R damage',
      tier2: '7 + R damage',
      tier3: '10 + R damage',
    },
    effect:
      'Before rolling, you may sacrifice any number of your minions in range. For each minion sacrificed, deal +1 damage.',
  },
  {
    id: 'lead-by-example',
    name: 'Lead By Example',
    flavorText:
      'You wade into battle yourself, inspiring your minions with your bravery.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Melee', 'Strike'],
    distance: 'Melee 1',
    target: 'One creature',
    powerRoll: {
      characteristic: 'reason',
      tier1: '6 + R damage',
      tier2: '10 + R damage; dazed (save ends)',
      tier3: '14 + R damage; dazed (save ends)',
    },
    effect: '',
  },
  // -- Demon 7-Essence summons --
  {
    id: 'summon-faded-blightling',
    name: 'Summon Faded Blightling',
    flavorText:
      'A decaying winged demon descends, spreading corruption to shield your allies.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Faded Blightling (Support, 1L). Speed 5 (Fly), Stamina 17 each, Free Strike 7 corruption. Blighted Strike: 2d10 + R corruption damage; target ally can take double bane on next defense instead of taking damage.',
  },
  {
    id: 'summon-gorrre',
    name: 'Summon Gorrre',
    flavorText:
      'A massive horned demon charges across the field, goring everything in its path.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Gorrre (Brute, Size 2). Speed 5, Stamina 17 each, Free Strike 8. Gorrring Strike: Knock prone if charged through object/enemy. Devastating Charge: Break size 1 objects, 3 damage to enemies passed through.',
  },
  {
    id: 'summon-vicisittante',
    name: 'Summon Vicisittante',
    flavorText:
      'A wickedly fast psychic demon streaks across the battlefield, flaying minds.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Demon'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Vicisittante (Harrier, Size 2). Speed 10, Stamina 17 each, Free Strike 7 psychic. Cerebral Flay: 2d10 + R psychic damage + weakened. Weakened targets grant flanking.',
  },
  // -- Elemental 7-Essence summons --
  {
    id: 'summon-iron-reaver',
    name: 'Summon Iron Reaver',
    flavorText:
      'Iron shards burst from the ground, forming razor-edged elemental constructs.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 3 Iron Reaver (Harrier, 1L). Burrow. Decentralized: Share move/cover with other Reavers. Bladed Strike: Bleeding + shift 2 + strike again. On death (Cost 1 Essence): leave iron shards (cover + immunity 2).',
  },
  {
    id: 'summon-light-of-the-sun',
    name: 'Summon Light of the Sun',
    flavorText:
      'A blazing orb of elemental fire descends, warming allies and scorching foes.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Light of the Sun (Support, Size 2). Fly. Solar Blade: 2d10 + R damage. On death (Cost 2 Essence): Fire zone (damage enemies, heal/buff allies).',
  },
  {
    id: 'summon-knight-of-blood',
    name: 'Summon Knight of Blood',
    flavorText:
      'A crimson elemental knight rises from a pool of blood, reaping the wounded.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Elemental'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Knight of Blood (Controller, 1L). Scarlet Death: Severe bleeding (minimum roll 3). On death (Cost 2 Essence): move speed + leave blood trail (damage + pull bleeding enemies).',
  },
  // -- Fey 7-Essence summons --
  {
    id: 'summon-nixie-corallia',
    name: 'Summon Nixie Corallia',
    flavorText:
      'A coral-crowned water nixie emerges, purifying the field for your allies.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Nixie Corallia (Support, 1T). Swim. Seafoam Pool: Aura purifies terrain + cleanses conditions from allies.',
  },
  {
    id: 'summon-pixie-belladonix',
    name: 'Summon Pixie Belladonix',
    flavorText:
      'A deadly pixie archer descends, loosing thorns that root enemies in place.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Pixie Belladonix (Artillery, 1T). Fly. Thorn: 2d10 + R poison damage + restrained. Restrained target treats neighbors as enemies.',
  },
  {
    id: 'summon-sprite-olyender',
    name: 'Summon Sprite Olyender',
    flavorText:
      'A surprisingly powerful sprite hurls enemies about with unnatural strength.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Fey'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      "Summon 2 Sprite Olyender (Brute, 1T). Fly. Warrior's Toss: Push 4 + prone. Use Their Might: Counts as larger size for physics interactions.",
  },
  // -- Undead 7-Essence summons --
  {
    id: 'summon-false-vampire',
    name: 'Summon False Vampire',
    flavorText:
      'Giant bat-like undead descend from the shadows, draining the blood of the living.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 False Vampire (Brute, 1L). Proboscis Strike: Restrain + damage. Bloodthirsty: Speed 10 when near bleeding target.',
  },
  {
    id: 'summon-zombie-titan',
    name: 'Summon Zombie Titan',
    flavorText:
      'An enormous undead colossus heaves itself from the earth, crushing all beneath it.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 1 Zombie Titan (Defender, Size 4). Stamina 40. Big Stomp: Knock prone. Overwhelming Size: Crush prone enemies. Flesh to Mountains: On death, restrain/crush enemies under corpse.',
  },
  {
    id: 'summon-phantom-of-the-ripper',
    name: 'Summon Phantom of the Ripper',
    flavorText:
      'Screaming phantoms tear through the battlefield, ripping at the living.',
    actionType: 'action',
    essenceCost: 7,
    keywords: ['Magic', 'Summon', 'Undead'],
    distance: "Summoner's Range",
    target: 'Unoccupied space in range',
    effect:
      'Summon 2 Phantom of the Ripper (Ambusher, 1M). Fly. Plunge: 2d10 + R damage + slow. Ripping Phase: Pass through creature for damage + bane.',
  },
];

// ============================================================
// 9-ESSENCE ABILITIES (Champion Summons)
// ============================================================

export const summonerNineEssenceAbilities: Ability[] = [
  {
    id: 'a-champions-cry',
    name: "A Champion's Cry",
    flavorText:
      'Your champion lets out a terrifying cry that shakes the resolve of all nearby enemies.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Magic', 'Fear'],
    distance: '3 burst',
    target: 'Each enemy in the area',
    effect:
      'Summon your circle champion (limit 1 per encounter). The champion uses its cry: Each enemy in the area is frightened (save ends).',
  },
  {
    id: 'armys-idol',
    name: "Army's Idol",
    flavorText:
      'Your champion inspires your entire army, bolstering their resolve.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Magic'],
    distance: '4 burst',
    target: 'Each ally and minion in the area',
    effect:
      'Summon your circle champion (limit 1 per encounter). The champion rallies: Each ally and minion in the area gains +2 to saving throws until the end of the encounter.',
  },
  {
    id: 'the-champion-slams-the-earth',
    name: 'The Champion Slams the Earth',
    flavorText:
      'Your champion strikes the ground with devastating force, toppling all nearby.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Magic'],
    distance: '4 cube',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '6 + R damage; prone',
      tier2: '10 + R damage; prone',
      tier3: '14 + R damage; prone',
    },
    effect:
      'Summon your circle champion (limit 1 per encounter). The champion slams the earth, dealing damage and knocking enemies prone.',
  },
  {
    id: 'their-pall-shrouds-all',
    name: 'Their Pall Shrouds All',
    flavorText:
      'Your champion emits a pall of dread energy that weakens all enemies caught within.',
    actionType: 'action',
    essenceCost: 9,
    keywords: ['Area', 'Magic'],
    distance: '4 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '3 + R damage; weakened (save ends)',
      tier2: '5 + R damage; weakened (save ends)',
      tier3: '8 + R damage; weakened (save ends)',
    },
    effect:
      'Summon your circle champion (limit 1 per encounter). The champion shrouds the area; targets also take half damage from all sources (save ends).',
  },
];

// ============================================================
// 11-ESSENCE ABILITIES (Ultimate)
// ============================================================

export const summonerElevenEssenceAbilities: Ability[] = [
  {
    id: '10000-minions',
    name: '10,000 Minions',
    flavorText:
      'You summon so many minions that the very ground writhes with their presence.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic'],
    distance: '10 burst',
    target: 'Each enemy in the area',
    effect:
      'The floor in the area becomes a damaging hazard until the end of the encounter. Any enemy that starts their turn in the area or enters the area for the first time on their turn takes R damage.',
  },
  {
    id: 'bodyguard-tactics',
    name: 'Bodyguard Tactics',
    flavorText:
      'Your minions form a living shield around your allies, absorbing incoming blows.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'Each ally in range',
    effect:
      'Each ally in range gains damage immunity 5 until the end of the encounter.',
  },
  {
    id: 'i-abjure-thee',
    name: 'I Abjure Thee',
    flavorText:
      'You command the forces of creation itself, banishing enemy minions and leaders alike.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'Enemy minions and leaders in range',
    effect:
      'All enemy minions in range are instantly destroyed. Enemy leaders in range are banished (removed from the encounter until the end of their next turn).',
  },
  {
    id: 'the-champions-wrath',
    name: "The Champion's Wrath",
    flavorText:
      'Your champion unleashes devastating power across the entire battlefield.',
    actionType: 'action',
    essenceCost: 11,
    keywords: ['Area', 'Magic'],
    distance: '5 burst',
    target: 'Each enemy in the area',
    powerRoll: {
      characteristic: 'reason',
      tier1: '8 + R damage; push 3',
      tier2: '12 + R damage; push 5',
      tier3: '18 + R damage; push 7',
    },
    effect: 'Your champion unleashes massive area damage and pushes all enemies away.',
  },
];

// ============================================================
// TRIGGERED ACTIONS (Quick Commands)
// ============================================================

export const summonerTriggeredActions: Ability[] = [
  {
    id: 'focus-fire',
    name: 'Focus Fire!',
    flavorText:
      'Your minions surge toward the target your ally just struck, pressing the advantage.',
    actionType: 'triggered',
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'The creature that was damaged',
    trigger: 'An ally deals damage to a creature.',
    effect:
      'The target gains 1 surge per adjacent minion you control (maximum 3 surges).',
    additionalEffects: [
      {
        cost: 'Spend 1 Essence',
        description:
          'The triggering ally gains an edge on the power roll that dealt the damage.',
      },
    ],
  },
  {
    id: 'halt',
    name: 'Halt!',
    flavorText:
      'Your minions intercept a moving foe, cutting off their advance.',
    actionType: 'triggered',
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'The moving creature',
    trigger: 'A creature moves or starts their turn.',
    effect:
      'Summon a signature minion adjacent to the target, or shift an existing minion to be adjacent to the target. If the target is force-moved into a minion, you can negate collision damage.',
  },
  {
    id: 'not-yet',
    name: 'Not Yet!',
    flavorText:
      'You refuse to let your ally fall, burning Essence to sustain them.',
    actionType: 'triggered',
    essenceCost: 3,
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'The dying creature',
    trigger:
      'An ally or minion (if last in its squad) would die.',
    effect:
      'Negate the death. The target remains at 1 Stamina instead.',
  },
  {
    id: 'shield',
    name: 'Shield!',
    flavorText:
      'Your minion throws itself in the path of an incoming blow.',
    actionType: 'triggered',
    keywords: ['Magic'],
    distance: "Summoner's Range",
    target: 'The targeted ally',
    trigger: 'An ally or you are targeted by a strike.',
    effect:
      'An adjacent minion you control becomes the new target of the strike instead.',
    additionalEffects: [
      {
        cost: 'Spend 1 Essence',
        description:
          'Summon a new signature minion adjacent to the original target to take the hit.',
      },
    ],
  },
];

// ============================================================
// COMBINED EXPORTS
// ============================================================

export const summonerAbilities: Ability[] = [
  ...summonerSignatureAbilities,
  ...summonerThreeEssenceAbilities,
  ...summonerFiveEssenceAbilities,
  ...summonerSevenEssenceAbilities,
  ...summonerNineEssenceAbilities,
  ...summonerElevenEssenceAbilities,
  ...summonerTriggeredActions,
];

// Helper functions
export const getSummonerAbilityById = (id: string): Ability | undefined => {
  return summonerAbilities.find((a) => a.id === id);
};

export const getSummonerAbilitiesByCost = (maxCost: number): Ability[] => {
  return summonerAbilities.filter((a) => (a.essenceCost || 0) <= maxCost);
};

export const getSummonerSignatureAbilities = (): Ability[] => {
  return summonerSignatureAbilities;
};

export const getSummonerHeroicAbilities = (): Ability[] => {
  return summonerAbilities.filter((a) => a.essenceCost && a.essenceCost > 0);
};
