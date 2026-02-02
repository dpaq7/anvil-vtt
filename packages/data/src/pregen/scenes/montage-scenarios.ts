/**
 * Montage Scenarios for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * These are ready-to-run montage test scenarios for Directors.
 */

import type { PregenMontageScene } from '../types.js';

// ---------------------------------------------------------------------------
// Fight Fire Montage
// ---------------------------------------------------------------------------

export const FIGHT_FIRE: PregenMontageScene = {
  id: 'montage-fight-fire',
  type: 'montage',
  name: 'Fight Fire',
  description: 'Fire has broken out in the town! The heroes must prevent the conflagration from spreading while saving as many townsfolk as possible.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partySize: 4,
  partyLevel: 1,
  difficulty: 'moderate',
  tags: ['urban', 'rescue', 'disaster', 'time-pressure'],

  template: {
    title: 'Fight Fire',
    goal: 'Prevent the fire from spreading while saving as many townsfolk as possible.',
    description: 'Fire has broken out in the town! The heroes must prevent the conflagration from spreading while saving as many townsfolk as possible. Their efforts might be more complicated if the cause of the fire — such as a marauding dragon or an invading army — is still around causing trouble.',

    difficulty: 'moderate',
    rounds: undefined,

    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,

    challenges: [
      {
        id: 'ff-bucket-chains',
        name: 'Bucket Chains',
        description: 'Organize the would-be firefighters into disciplined bucket brigades or fight the fire in some other way.',
        category: 'general',
        suggestedCharacteristics: ['presence', 'reason'],
        suggestedSkills: ['Architecture', 'Intimidate', 'Lead'],
        unlockType: 'none',
        order: 0,
      },
      {
        id: 'ff-clearing-firebreak',
        name: 'Clearing a Firebreak',
        description: 'Prevent the fire from spreading by clearing the ground of flammable materials, either by moving it or burning it away. A creature loses a Recovery if they incur a consequence on this test.',
        category: 'hazard',
        suggestedCharacteristics: ['might', 'reason'],
        suggestedSkills: ['Endurance', 'Lift'],
        specialNote: 'Abilities that deal fire damage may be used. Consequence: Lose a Recovery.',
        unlockType: 'none',
        order: 1,
      },
      {
        id: 'ff-evacuating-buildings',
        name: 'Evacuating Buildings',
        description: 'Save people trapped in burning buildings. Heroes can attempt this task twice during the montage, since there are plenty of people to save. A creature that doesn\'t have fire immunity loses a Recovery if they incur a consequence on their test.',
        category: 'hazard',
        suggestedCharacteristics: ['might', 'presence'],
        suggestedSkills: ['Climb', 'Endurance', 'Persuade'],
        specialNote: 'May attempt twice. Consequence (no fire immunity): Lose a Recovery.',
        unlockType: 'none',
        order: 2,
      },
      {
        id: 'ff-find-firefighters',
        name: 'Find More Firefighters',
        description: 'Find groups that aren\'t fighting the fire, such as fleeing civilians, and convince them to help.',
        category: 'general',
        suggestedCharacteristics: ['presence'],
        suggestedSkills: ['Intimidate', 'Lead', 'Persuade'],
        unlockType: 'none',
        order: 3,
      },
      {
        id: 'ff-free-horses',
        name: 'Free the Horses',
        description: 'Loose the stabled horses threatened by the fire and lead them to safety.',
        category: 'general',
        suggestedCharacteristics: ['might', 'presence'],
        suggestedSkills: ['Lift', 'Handle Animals', 'Ride'],
        unlockType: 'none',
        order: 4,
      },
      {
        id: 'ff-move-rubble',
        name: 'Move Burning Rubble',
        description: 'Shifting burning debris blocking doorways to allow people to escape the blaze. A creature that doesn\'t have fire immunity loses a Recovery if they incur a consequence on this test.',
        category: 'hazard',
        suggestedCharacteristics: ['might'],
        suggestedSkills: ['Endurance', 'Lift'],
        specialNote: 'Consequence (no fire immunity): Lose a Recovery.',
        unlockType: 'none',
        order: 5,
      },
      {
        id: 'ff-use-horses',
        name: 'Use the Freed Horses',
        description: '(if Free the Horses was successful) Put the horses to work clearing rubble or bringing people to safety.',
        category: 'restricted',
        suggestedCharacteristics: ['reason', 'presence'],
        suggestedSkills: ['Drive', 'Handle Animals', 'Ride'],
        specialNote: 'Requires successful "Free the Horses" challenge.',
        unlockType: 'all_of',
        unlockChallengeIds: ['ff-free-horses'],
        order: 6,
      },
    ],

    hazards: [
      'Building Collapse: While a hero is in or near a blazing building, it starts to collapse. The hero must escape before the building crumbles. (Agility/Intuition: Climb, Jump, Gymnastics)',
      'Cause of the Fire: A hostile cause of the fire appears — a squad of an invading army, a dragon, a team of arsonists, and so forth. Standard or hard combat encounter.',
      'Help!: Townsfolk are about to run into a burning building to save a trapped relative. Two tests required - one to prevent entry, one to rescue the relative. (Might/Presence: Lift, Persuade)',
    ],

    outcomes: {
      totalSuccess: 'The fire is extinguished. Buildings are damaged but no lives were lost. The party achieves 2 Victories if the montage test was hard, or 1 Victory if it was easy or moderate, in addition to any Victories earned from combat during the montage test.',
      partialSuccess: 'The fire is quenched, although many buildings burned and a few lives were lost. Each character earns 1 Victory if the montage test was moderate or hard, in addition to any Victories earned from combat during the montage test.',
      totalFailure: 'When the fire finally burns out, the town lies in ruins. Townsfolk mourn their dead or grimly prepare to find a new home. Characters earn no Victories from the montage test, but might earn Victories from combat undertaken during the montage test.',
    },

    readAloudText: 'Fire blazes in several buildings whose occupants need to be rescued. Elsewhere, some townsfolk flee while others throw water on the fire with no organization or plan. Without leadership and a way to stop its spread, the fire could easily consume everything. In a nearby stable, horses are panicking as their hay smolders. Burning rubble blocks pathways everywhere.',

    directorNotes: `TWIST: At the end of the first montage test round, an emergency crops up. One or more heroes, selected by the players, must deal with the situation before the end of the round. If the heroes successfully deal with the twist, they earn a success for the montage test. Otherwise, they earn a failure.`,
  },
};

// ---------------------------------------------------------------------------
// Infiltrate the Palace Montage
// ---------------------------------------------------------------------------

export const INFILTRATE_PALACE: PregenMontageScene = {
  id: 'montage-infiltrate-palace',
  type: 'montage',
  name: 'Infiltrate the Palace',
  description: 'Whether the heroes are trying to reach a tyrant\'s throne room, pull off a daring art heist, or rescue royalty from captivity, they\'re somewhere they\'re not supposed to be.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partySize: 4,
  partyLevel: 3,
  difficulty: 'moderate',
  tags: ['stealth', 'heist', 'urban', 'infiltration'],

  template: {
    title: 'Infiltrate the Palace',
    goal: 'Reach your objective within the palace without being caught.',
    description: 'Whether the heroes are trying to reach a tyrant\'s throne room, pull off a daring art heist, or rescue royalty from captivity, they\'re somewhere they\'re not supposed to be — and they\'d prefer to keep their presence secret.',

    difficulty: 'moderate',
    rounds: undefined,

    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,

    challenges: [
      // Preparation Phase
      {
        id: 'ip-bribe-guards',
        name: 'Bribe Guards (Preparation)',
        description: 'The heroes can pay off guards to look the other way. If successful, one or more heroes\' Wealth is lowered by 1.',
        category: 'general',
        suggestedCharacteristics: ['presence'],
        suggestedSkills: ['Criminal Underworld', 'Flirt', 'Persuade'],
        specialNote: 'Preparation phase - doesn\'t affect alarm level. Success costs 1 Wealth.',
        unlockType: 'none',
        order: 0,
      },
      {
        id: 'ip-find-blueprints',
        name: 'Find Blueprints (Preparation)',
        description: 'Researching secret entrances and little-known passageways can be undertaken in forgotten libraries or well-guarded town halls.',
        category: 'general',
        suggestedCharacteristics: ['agility', 'reason'],
        suggestedSkills: ['Architecture', 'Sneak', 'History'],
        specialNote: 'Preparation phase - doesn\'t affect alarm level.',
        unlockType: 'none',
        order: 1,
      },
      {
        id: 'ip-unguarded-entrance',
        name: 'Identify Unguarded Entrances (Preparation)',
        description: 'Scouting around or consulting contacts can reveal a forgotten back door or accessible window.',
        category: 'general',
        suggestedCharacteristics: ['agility', 'intuition'],
        suggestedSkills: ['Alertness', 'Architecture', 'Criminal Underworld'],
        specialNote: 'Preparation phase - doesn\'t affect alarm level.',
        unlockType: 'none',
        order: 2,
      },
      {
        id: 'ip-guard-schedules',
        name: 'Learn Guard Schedules (Preparation)',
        description: 'By keeping their ears and eyes open, characters can learn when guards go off duty.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'reason'],
        suggestedSkills: ['Alertness', 'Eavesdrop', 'Track'],
        specialNote: 'Preparation phase - doesn\'t affect alarm level.',
        unlockType: 'none',
        order: 3,
      },
      {
        id: 'ip-false-identities',
        name: 'Make False Identities (Preparation)',
        description: 'By procuring forged documents or badges, characters can prepare to walk into the palace in plain sight.',
        category: 'general',
        suggestedCharacteristics: ['presence', 'reason'],
        suggestedSkills: ['Disguise', 'Forgery', 'Lie'],
        specialNote: 'Preparation phase - doesn\'t affect alarm level.',
        unlockType: 'none',
        order: 4,
      },
      // Infiltration Phase
      {
        id: 'ip-aerial-route',
        name: 'Aerial Route',
        description: 'Characters can follow a path that leads along catwalks or high ledges.',
        category: 'hazard',
        suggestedCharacteristics: ['agility', 'might'],
        suggestedSkills: ['Climb', 'Gymnastics', 'Jump'],
        unlockType: 'none',
        order: 5,
      },
      {
        id: 'ip-avoid-traffic',
        name: 'Avoid Traffic',
        description: 'By finding the dustiest, least-traveled areas and sticking to them, characters can avoid notice.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'reason'],
        suggestedSkills: ['Navigate', 'Search', 'Track'],
        unlockType: 'none',
        order: 6,
      },
      {
        id: 'ip-lay-low',
        name: 'Lay Low',
        description: 'Once while the alarm level is greater than 0, the heroes can find a place to hide for a bit, reducing the alarm level by 1. This activity doesn\'t require a test or generate a success or failure.',
        category: 'general',
        suggestedSkills: [],
        specialNote: 'No test required. Reduces alarm level by 1. Only usable when alarm > 0.',
        unlockType: 'none',
        order: 7,
      },
      {
        id: 'ip-diversion',
        name: 'Make a Diversion',
        description: 'After causing a ruckus, the characters quickly go the other way.',
        category: 'general',
        suggestedCharacteristics: ['might', 'presence'],
        suggestedSkills: ['Alchemy', 'Perform', 'Sabotage'],
        unlockType: 'none',
        order: 8,
      },
      {
        id: 'ip-skulk',
        name: 'Skulk in the Shadows',
        description: 'Keeping out of sight is the simplest way for characters to move through the palace. The heroes can attempt this challenge twice during the montage test.',
        category: 'general',
        suggestedCharacteristics: ['agility'],
        suggestedSkills: ['Hide', 'Sneak'],
        specialNote: 'May attempt twice.',
        unlockType: 'none',
        order: 9,
      },
      {
        id: 'ip-pose-guards',
        name: 'Pose as Guards',
        description: 'Using stolen or specially prepared uniforms can let the characters move freely through the palace. The test for this challenge gains an edge if the characters prepared disguises in advance or defeated guards during their infiltration.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'presence'],
        suggestedSkills: ['Disguise', 'Lie', 'Search'],
        specialNote: 'Edge if prepared disguises or defeated guards.',
        unlockType: 'none',
        order: 10,
      },
    ],

    hazards: [
      'At any time during the infiltration, the heroes may encounter another group breaking into the site at the same time, possibly after the same prize. They can fight, negotiate, or let them go.',
    ],

    outcomes: {
      totalSuccess: 'The heroes reach their goal and secure an escape route that lets them leave the palace safely. Each character earns 2 Victories if the montage test was hard, or 1 Victory if it was easy or moderate, in addition to any Victories earned from combat during the montage test.',
      partialSuccess: 'The heroes reach their goal, but they need to fight a standard combat encounter to escape the palace. Each character earns 1 Victory if the montage test was moderate or hard, in addition to any Victories earned from combat during the montage test.',
      totalFailure: 'The palace is locked down and the heroes\' goal is out of reach. The characters need to fight a hard combat encounter to escape. Characters earn no Victories from the montage test, but might earn Victories from combat undertaken during the montage test.',
    },

    readAloudText: 'The palace is well defended, with exterior patrols always on the alert. The few obvious entrances are locked and guarded, and once the party is inside, no one knows the way to the goal. Guards patrol the interior of the site as well, forcing the characters to sneak or bluff their way past them.',

    directorNotes: `ALARM SYSTEM:
When the heroes start their infiltration, the alarm level of the palace starts at 0.

While they infiltrate the site, whenever any hero fails a test as part of the montage test, the alarm level increases by 1, to a maximum of 2. Each time the heroes succeed on such a test, the alarm level decreases, to a minimum of 0.

- Alarm Level 1: Tests take a bane
- Alarm Level 2: Tests have a double bane

The first time any hero fails a test while the alarm level is 2, they encounter guards and must engage in a hard combat encounter.

The second time any hero fails such a test while the alarm level is 2, the montage test is a total failure.

PREPARATION PHASE:
Half the work of any successful infiltration is done before setting foot in the target site. The players can choose to have the heroes make individual tests as part of the montage test before they attempt to enter the palace. One round of tests can be made this way, and those tests don't affect the alarm level.`,
  },
};

// ---------------------------------------------------------------------------
// Prepare for Battle Montage
// ---------------------------------------------------------------------------

export const PREPARE_FOR_BATTLE: PregenMontageScene = {
  id: 'montage-prepare-for-battle',
  type: 'montage',
  name: 'Prepare for Battle',
  description: 'Whether it\'s a village threatened by bandits or a great city preparing for a siege, enemies are on their way and ready to attack. The heroes have a limited time to fortify the settlement\'s defenses and bolster its troops.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partySize: 4,
  partyLevel: 3,
  difficulty: 'moderate',
  tags: ['military', 'preparation', 'siege', 'leadership'],

  template: {
    title: 'Prepare for Battle',
    goal: 'Fortify the settlement\'s defenses and prepare its defenders before the enemy arrives.',
    description: 'Whether it\'s a village threatened by bandits or a great city preparing for a siege, enemies are on their way and ready to attack. The heroes have a limited time to fortify the settlement\'s defenses and bolster its troops.',

    difficulty: 'moderate',
    rounds: undefined,

    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,

    challenges: [
      {
        id: 'pfb-arms-armor',
        name: 'Arms and Armor',
        description: 'Crafting or repairing weapons and armor of all kinds can help rebuild the defenders\' stores.',
        category: 'general',
        suggestedCharacteristics: ['might', 'reason'],
        suggestedSkills: ['Alchemy', 'Blacksmithing', 'Fletching'],
        unlockType: 'none',
        order: 0,
      },
      {
        id: 'pfb-evacuation',
        name: 'Evacuation',
        description: 'Heroes can help get noncombatants to safety before the invaders arrive.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'presence'],
        suggestedSkills: ['Handle Animals', 'Lead', 'Persuade'],
        unlockType: 'none',
        order: 1,
      },
      {
        id: 'pfb-fortification',
        name: 'Fortification',
        description: 'Characters can help build or repair walls and other defensive structures.',
        category: 'general',
        suggestedCharacteristics: ['might', 'reason'],
        suggestedSkills: ['Architecture', 'Endurance', 'Lift'],
        unlockType: 'none',
        order: 2,
      },
      {
        id: 'pfb-inspiration',
        name: 'Inspiration',
        description: 'Improving morale with rousing speeches or performances can help prepare the locals for the fight to come.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'presence'],
        suggestedSkills: ['Brag', 'Lead', 'Perform'],
        unlockType: 'none',
        order: 3,
      },
      {
        id: 'pfb-propaganda',
        name: 'Propaganda',
        description: 'Characters can attempt to sow confusion or rebellion in the ranks of the approaching army.',
        category: 'general',
        suggestedCharacteristics: ['agility', 'presence'],
        suggestedSkills: ['Disguise', 'Forgery', 'Lie'],
        unlockType: 'none',
        order: 4,
      },
      {
        id: 'pfb-stockpiling',
        name: 'Stockpiling',
        description: 'Characters can hunt, forage, or supernaturally conjure food or water to augment the settlement\'s supplies.',
        category: 'general',
        suggestedCharacteristics: ['agility', 'reason'],
        suggestedSkills: ['Nature', 'Sneak', 'Track'],
        unlockType: 'none',
        order: 5,
      },
      {
        id: 'pfb-training',
        name: 'Training',
        description: 'Heroes can help train the settlement\'s defenders.',
        category: 'general',
        suggestedCharacteristics: ['might', 'presence'],
        suggestedSkills: ['Endurance', 'Intimidate', 'Lead'],
        unlockType: 'none',
        order: 6,
      },
      {
        id: 'pfb-trapmaking',
        name: 'Trapmaking',
        description: 'Digging concealed pits, placing hindrances, and setting up ambushes will make it harder for the invaders to approach the settlement.',
        category: 'general',
        suggestedCharacteristics: ['might', 'reason'],
        suggestedSkills: ['Conceal Object', 'Endurance', 'Mechanics'],
        unlockType: 'none',
        order: 7,
      },
    ],

    hazards: [
      'At the end of the first round of the montage test, a fast-moving enemy vanguard attacks before the settlement\'s defenders are ready. The heroes must engage in an easy combat encounter.',
    ],

    outcomes: {
      totalSuccess: 'The settlement is fully fortified, and even if the heroes don\'t fight in its defense, the settlement and its people survive. If the heroes wish, they can leave the settlement and fight a standard combat encounter against the leader of the invaders and their lackeys, possibly killing or capturing the leader. Each character earns 2 Victories if the montage test was hard, or 1 Victory if it was easy or moderate, in addition to any Victories earned from combat during the montage test.',
      partialSuccess: 'The settlement\'s fortifications are improved, but the settlement will still fall unless the heroes fight in its defense. To save the settlement, the heroes must triumph in a hard combat encounter against the leader of the invaders and their lackeys. If the heroes lose the encounter, the settlement falls. Each character earns 1 Victory if the montage test was moderate or hard, in addition to any Victories earned from combat during the montage test.',
      totalFailure: 'The heroes each lose a Recovery from their failed efforts to defend the settlement, which is taken over by the invaders. If the players wish, the characters can fight two hard combat encounters against waves of invaders to allow some of the settlement\'s inhabitants to retreat to safety. Characters earn no Victories from the montage test, but might earn Victories from combat undertaken during the montage test.',
    },

    readAloudText: 'The walls or palisades around the settlement (if any) are in poor shape. Roads or rivers through the area give the invaders free access to the settlement unless barricades, traps, or ambushes can be set up. Supplies of food, weapons, and ammunition are too low to survive a long siege. The area is home to few experienced fighters compared to the numbers of the invaders, and the local militia is poorly equipped and untrained.',

    directorNotes: `TWIST: At the end of the first round of the montage test, a fast-moving enemy vanguard attacks before the settlement's defenders are ready. The heroes must engage in an easy combat encounter.`,
  },
};

// ---------------------------------------------------------------------------
// Track the Fugitive Montage
// ---------------------------------------------------------------------------

export const TRACK_THE_FUGITIVE: PregenMontageScene = {
  id: 'montage-track-fugitive',
  type: 'montage',
  name: 'Track the Fugitive',
  description: 'The heroes are on the trail of someone. An escaped criminal? A dangerous beast? A lost or kidnapped child? The difficulties of the chase depend on whether the quarry knows they\'re being pursued and whether they want to be found.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partySize: 4,
  partyLevel: 1,
  difficulty: 'moderate',
  tags: ['tracking', 'chase', 'investigation', 'wilderness'],

  template: {
    title: 'Track the Fugitive',
    goal: 'Find and stay on the fugitive\'s trail until you catch them.',
    description: 'The heroes are on the trail of someone. An escaped criminal? A dangerous beast? A lost or kidnapped child? The difficulties of the chase depend on whether the quarry knows they\'re being pursued and whether they want to be found.',

    difficulty: 'moderate',
    rounds: undefined,

    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,

    challenges: [
      {
        id: 'ttf-ask-around',
        name: 'Ask Around',
        description: 'Characters can gather clues from locals or bystanders — or if they have the proper magic, from animals or the dead.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'presence'],
        suggestedSkills: ['Interrogate', 'Persuade', 'Rumors'],
        unlockType: 'none',
        order: 0,
      },
      {
        id: 'ttf-follow-trail',
        name: 'Follow the Trail',
        description: 'Looking for tracks or other signs of the fugitive\'s passage can lead the characters on. The heroes can attempt this challenge twice.',
        category: 'general',
        suggestedCharacteristics: ['intuition'],
        suggestedSkills: ['Alertness', 'Search', 'Track'],
        specialNote: 'May attempt twice.',
        unlockType: 'none',
        order: 1,
      },
      {
        id: 'ttf-good-view',
        name: 'Obtain a Good View',
        description: 'Characters can climb up high to get the big picture of where the fugitive might have gone.',
        category: 'general',
        suggestedCharacteristics: ['agility', 'might'],
        suggestedSkills: ['Climb', 'Gymnastics', 'Jump'],
        unlockType: 'none',
        order: 2,
      },
      {
        id: 'ttf-predict-move',
        name: 'Predict the Next Move',
        description: 'The heroes might have an idea where the quarry is headed. A character gains an edge on the test for this challenge if they know the quarry well.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'reason'],
        suggestedSkills: ['Navigate', 'Read Person'],
        specialNote: 'Edge if hero knows the quarry well. Use appropriate Lore skill (Nature for animal, Criminal Underworld for criminal, etc.).',
        unlockType: 'none',
        order: 3,
      },
      {
        id: 'ttf-push-ahead',
        name: 'Push Ahead',
        description: 'While the quarry is resting, the heroes have a chance to close in. The hero making the test for this challenge loses a Recovery.',
        category: 'hazard',
        suggestedCharacteristics: ['might'],
        suggestedSkills: ['Endurance', 'Navigate', 'Ride', 'Drive'],
        specialNote: 'Cost: Lose a Recovery.',
        unlockType: 'none',
        order: 4,
      },
    ],

    hazards: [
      'At the end of the first round of the montage test, the heroes stumble upon a trap set by the quarry or a problem they left behind. This might include: a pit trap set with poison spikes, a mob of angry locals who\'ve been told the characters are criminals, or an intentionally set fire. The heroes must deal with the trap or problem before they continue the montage test.',
    ],

    outcomes: {
      totalSuccess: 'The heroes catch their quarry before the fugitive reaches their destination, or before a lost or kidnapped creature comes to harm. Each character earns 2 Victories if the montage test was hard, or 1 Victory if it was easy or moderate, in addition to any Victories earned from combat during the montage test.',
      partialSuccess: 'If the quarry was trying to evade capture, they reach their destination. They find allies and a fortified position from which to defend themselves, or they might have time to cause more harm. If the quarry was lost or kidnapped, they are grievously injured when found. Each character earns 1 Victory if the montage test was moderate or hard, in addition to any Victories earned from combat during the montage test.',
      totalFailure: 'The trail has gone cold, and the heroes will need to seek fresh clues or a different approach before they can resume the hunt. Characters earn no Victories from the montage test, but might earn Victories from combat undertaken during the montage test.',
    },

    readAloudText: 'The fugitive\'s route is easy to follow, but could they be setting a false trail? Did anyone see them pass by, and is there any sense of where they might be headed? The goal is for the characters to do whatever they can to find and stay on the fugitive\'s trail.',

    directorNotes: `TWIST: At the end of the first round of the montage test, the heroes stumble upon a trap set by the quarry or a problem they left behind.

Possible traps/problems:
- Pit trap with poison spikes
- Mob of angry locals told the characters are criminals
- Intentionally set fire
- Misleading signs pointing the wrong way
- Wounded animal or NPC left as a distraction`,
  },
};

// ---------------------------------------------------------------------------
// Wilderness Race Montage
// ---------------------------------------------------------------------------

export const WILDERNESS_RACE: PregenMontageScene = {
  id: 'montage-wilderness-race',
  type: 'montage',
  name: 'Wilderness Race',
  description: 'The heroes must cross trackless wilderness, perhaps to reach a besieged city before it falls or seek the site where a curse is about to be activated. Getting there fast is a priority—but so is getting there alive.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partySize: 4,
  partyLevel: 1,
  difficulty: 'moderate',
  tags: ['travel', 'wilderness', 'survival', 'time-pressure'],

  template: {
    title: 'Wilderness Race',
    goal: 'Cross the wilderness and reach your destination before time runs out.',
    description: 'The heroes must cross trackless wilderness, perhaps to reach a besieged city before it falls or seek the site where a curse is about to be activated. Getting there fast is a priority—but so is getting there alive.',

    difficulty: 'moderate',
    rounds: undefined,

    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,

    challenges: [
      {
        id: 'wr-avoid-hazards',
        name: 'Avoid Hazards',
        description: 'Characters can determine ways to overcome the natural hazards of the wilderness, such as finding insect-repelling herbs in a swamp or making snowshoes to cross tundra.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'reason'],
        suggestedSkills: ['Heal', 'Nature'],
        specialNote: 'May use appropriate Crafting skill (such as Alchemy to make bug repellent).',
        unlockType: 'none',
        order: 0,
      },
      {
        id: 'wr-carry-baggage',
        name: 'Carry Baggage',
        description: 'By carrying supplies for the weaker party members, characters can increase the whole party\'s speed.',
        category: 'general',
        suggestedCharacteristics: ['might'],
        suggestedSkills: ['Endurance', 'Lift'],
        unlockType: 'none',
        order: 1,
      },
      {
        id: 'wr-find-path',
        name: 'Find the Path',
        description: 'Avoiding getting lost is a major challenge for the characters.',
        category: 'general',
        suggestedCharacteristics: ['intuition', 'reason'],
        suggestedSkills: ['Alertness', 'Nature', 'Navigate'],
        unlockType: 'none',
        order: 2,
      },
      {
        id: 'wr-keep-spirits',
        name: 'Keep Up Spirits',
        description: 'Characters can keep up the party\'s morale during a forced march with cheer and song.',
        category: 'general',
        suggestedCharacteristics: ['presence'],
        suggestedSkills: ['Lead', 'Music', 'Perform'],
        unlockType: 'none',
        order: 3,
      },
      {
        id: 'wr-keep-watch',
        name: 'Keep Watch',
        description: 'Characters must be on constant guard against danger.',
        category: 'general',
        suggestedCharacteristics: ['intuition'],
        suggestedSkills: ['Alertness', 'Eavesdrop', 'Track'],
        unlockType: 'none',
        order: 4,
      },
      {
        id: 'wr-push-on',
        name: 'Push On',
        description: 'Characters must be ready to pick up the pace and push past their fatigue.',
        category: 'hazard',
        suggestedCharacteristics: ['might'],
        suggestedSkills: ['Endurance', 'Lead'],
        specialNote: 'Handle Animals, Drive, or Ride if the party has mounts or vehicles.',
        unlockType: 'none',
        order: 5,
      },
      {
        id: 'wr-scout-ahead',
        name: 'Scout Ahead',
        description: 'Investigating the path ahead lets the characters avoid dead-ends and arduous terrain.',
        category: 'general',
        suggestedCharacteristics: ['agility', 'intuition'],
        suggestedSkills: ['Alertness', 'Navigate', 'Sneak'],
        unlockType: 'none',
        order: 6,
      },
    ],

    hazards: [
      'Predatory Monster: The characters stumble into or are stalked by a monstrous predator, and must engage in a standard combat encounter to overcome the threat or drive it off. If any character succeeded on Scout Ahead, let the characters make a group test to sneak past or set an ambush.',
      'Unexpected Hazard: A natural hazard such as an avalanche, rockslide, or wildfire interrupts the journey. Each hero must make a test of your choice to avoid the hazard, losing a Recovery on a failure.',
    ],

    outcomes: {
      totalSuccess: 'The heroes reach their goal in time. Each character earns 2 Victories if the montage test was hard, or 1 Victory if it was easy or moderate, in addition to any Victories earned from combat during the montage test.',
      partialSuccess: 'To reach their goal in time, the heroes must sprint over the last leg of the journey, with each character spending 2 Recoveries to do so. (If even one character doesn\'t have 2 Recoveries remaining, the characters instead earn a total failure for the montage test.) Each character earns 1 Victory if the montage test was moderate or hard, in addition to any Victories earned from combat during the montage test.',
      totalFailure: 'The heroes don\'t arrive in time to avert catastrophe. Characters earn no Victories from the montage test, but might earn Victories from combat undertaken during the montage test.',
    },

    readAloudText: 'The wilds hold unknown dangers. Characters need to figure out the best route while maintaining a good pace, watching out for hazards, and avoiding predatory monsters.',

    directorNotes: `TERRAIN TYPES:
Adapt the challenges based on the terrain:
- Forest: Navigation difficult, predators common
- Desert: Heat hazards, water scarcity
- Mountains: Climbing required, avalanche risk
- Swamp: Disease hazards, difficult terrain
- Tundra: Cold hazards, limited visibility

TWIST: At any point, introduce a Predatory Monster or Unexpected Hazard from the hazards list.`,
  },
};

// ---------------------------------------------------------------------------
// All Montage Scenarios
// ---------------------------------------------------------------------------

export const MONTAGE_SCENARIOS: PregenMontageScene[] = [
  FIGHT_FIRE,
  INFILTRATE_PALACE,
  PREPARE_FOR_BATTLE,
  TRACK_THE_FUGITIVE,
  WILDERNESS_RACE,
];

/**
 * Get montage scenario by ID
 */
export function getMontageScenarioById(id: string): PregenMontageScene | undefined {
  return MONTAGE_SCENARIOS.find(s => s.id === id);
}

/**
 * Get all montage scenarios
 */
export function getAllMontageScenarios(): PregenMontageScene[] {
  return MONTAGE_SCENARIOS;
}
