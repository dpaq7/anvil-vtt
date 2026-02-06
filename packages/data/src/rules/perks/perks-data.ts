import type { Perk, PerkCategory } from '@anvil/types';

/**
 * Complete perk definitions from Draw Steel Chapter 7
 * Organized by category for efficient filtering
 */
export const PERKS: Perk[] = [
  // ============================================
  // CRAFTING PERKS (6)
  // ============================================
  {
    id: 'area-of-expertise',
    name: 'Area of Expertise',
    category: 'crafting',
    description:
      'Choose one skill you already have from the crafting skill group. Whenever you obtain a tier 1 outcome on an easy or medium test using this skill, you treat it as a tier 2 outcome instead. Additionally, if you spend 1 minute inspecting an object related to the chosen skill, you can estimate its value and learn of any flaws in its construction.',
  },
  {
    id: 'expert-artisan',
    name: 'Expert Artisan',
    category: 'crafting',
    description:
      'Whenever you make a test as part of a crafting or research project that uses a skill you already have from the crafting skill group, you can make the power roll twice and use either roll.',
  },
  {
    id: 'handy',
    name: 'Handy',
    category: 'crafting',
    description:
      "Whenever you make a test to craft something and don't have a skill that applies to the test, you gain a +1 bonus to the power roll.",
  },
  {
    id: 'improvisation-creation',
    name: 'Improvisation Creation',
    category: 'crafting',
    description:
      "Without needing to make a test—and even without tools—you can quickly jury-rig or repair a mundane item or piece of equipment related to a skill you have from the crafting skill group. That item lasts for 1 hour or works for one use or activation (whichever comes first, as the Director determines), then breaks beyond repair. For example, if you have the Carpentry skill, you could repair a rickety wooden bridge long enough for a group of creatures to cross it, or build a simple shovel made of wood that can be used for 1 hour.",
  },
  {
    id: 'inspired-artisan',
    name: 'Inspired Artisan',
    category: 'crafting',
    description:
      "When you make a project roll using a skill from the crafting skill group, you can spend a hero token to make another project roll for the same project as part of the same respite activity. You can't use this perk more than once per respite.",
  },
  {
    id: 'traveling-artisan',
    name: 'Traveling Artisan',
    category: 'crafting',
    description:
      "On any day when you don't take a respite, you can spend 1 uninterrupted hour working on a crafting project using a skill you have from the crafting skill group. If you do so, you gain 1d10 project points toward that project.",
  },

  // ============================================
  // EXPLORATION PERKS (10)
  // ============================================
  {
    id: 'brawny',
    name: 'Brawny',
    category: 'exploration',
    description:
      'Whenever you fail a Might test, you can lose Stamina equal to 1d6 + your level to improve the outcome of the test by one tier. You can use this perk only once per test.',
  },
  {
    id: 'camouflage-hunter',
    name: 'Camouflage Hunter',
    category: 'exploration',
    description:
      "Whenever you are in wilderness, once you are hidden from a creature, you don't need cover or concealment to stay hidden from them.",
  },
  {
    id: 'danger-sense',
    name: 'Danger Sense',
    category: 'exploration',
    description:
      "Whenever you are in a natural environment (but not in a settlement in that environment), you gain an edge on tests made using the Alertness skill, and you can't be surprised. Additionally, you have a connection to nature that warns you if any natural disaster is imminent within the next 72 hours, though you don't know exactly what it will entail (an earthquake, a wildfire, and so forth).",
  },
  {
    id: 'friend-catapult',
    name: 'Friend Catapult',
    category: 'exploration',
    description:
      "As a maneuver, you grab a willing adjacent ally or object of your size or smaller, then vertical push that target up to a number of squares equal to twice your Might score. If a creature you push falls as a result of this movement, the effective distance of the fall is reduced by a number of squares equal to twice your Might score. When you use this perk, you can't use it again until you earn 1 or more Victories.",
  },
  {
    id: 'ive-got-you',
    name: "I've Got You!",
    category: 'exploration',
    description:
      "Whenever a willing ally falls and would land on you or adjacent to you, you can safely catch them as a free triggered action. Neither of you takes damage from the ally's fall.",
  },
  {
    id: 'monster-whisperer',
    name: 'Monster Whisperer',
    category: 'exploration',
    description:
      'You can use the Handle Animals skill to interact with nonsapient creatures who are not animals.',
  },
  {
    id: 'put-your-back-into-it',
    name: 'Put Your Back Into It!',
    category: 'exploration',
    description:
      "During montage tests, whenever you make a test to assist a test and obtain a tier 1 outcome, the assisted test doesn't take a bane. Additionally, once per montage test, you can turn an ally's tier 1 test outcome into a tier 2 outcome.",
  },
  {
    id: 'team-leader',
    name: 'Team Leader',
    category: 'exploration',
    description:
      'At the start of a group test or montage test, you can spend a hero token. If you do, all participants make tests as if they also had any skill you have from the exploration group.',
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    category: 'exploration',
    description:
      "When you take your first turn during any montage test, you can both make a test and assist another hero's test.",
  },
  {
    id: 'wood-wise',
    name: 'Wood Wise',
    category: 'exploration',
    description:
      'When you make a test using a skill from the exploration skill group and at least one of the d10s rolled is a 1, you can reroll one d10. You can use this perk only once per test.',
  },
  // Beastheart-specific exploration perks
  {
    id: 'born-tracker',
    name: 'Born Tracker',
    category: 'exploration',
    description:
      '(Beastheart only) You and your companion have an edge on tests made to track creatures, find your way, or search for hidden creatures.',
  },
  {
    id: 'ride-along',
    name: 'Ride Along',
    category: 'exploration',
    description:
      "(Beastheart only) Your body disappears, and your consciousness shares your companion's body. While in this state, you can control your companion, take actions, and cast your abilities through them. You can return to your own body as a maneuver. Your body reappears within 3 squares of your companion. While this perk is active, your body is unconscious and can't be targeted. If your companion dies while you're in this state, you return to your body and are dazed until the end of your next turn.",
  },
  {
    id: 'wild-rumpus',
    name: 'Wild Rumpus',
    category: 'exploration',
    description:
      "(Beastheart only) As a maneuver, until the end of your next turn you and your companion gain each other's movement tags and use whichever speed is higher between the two of you.",
  },
  {
    id: 'wilds-explorer',
    name: 'Wilds Explorer',
    category: 'exploration',
    description:
      '(Beastheart only) You and your companion have an edge on tests made to overcome environmental challenges, use knowledge of nature, or find food and water in the wilds.',
  },

  // ============================================
  // INTERPERSONAL PERKS (10)
  // ============================================
  {
    id: 'charming-liar',
    name: 'Charming Liar',
    category: 'interpersonal',
    description:
      "If you fail a test using the Lie skill, you don't suffer any consequences associated with the failure. Additionally, during a negotiation, you can be caught in one lie without negative consequences. When you use either benefit of this perk, you can't use this perk again until you earn 1 or more Victories.",
  },
  {
    id: 'dazzler',
    name: 'Dazzler',
    category: 'interpersonal',
    description:
      'Whenever a creature watches you sing, dance, or perform a role (as an actor, not just in disguise) for 1 uninterrupted minute or more, you gain an edge on any test made to influence that creature for 1 hour after the performance ends.',
  },
  {
    id: 'engrossing-monologue',
    name: 'Engrossing Monologue',
    category: 'interpersonal',
    description:
      "Whenever you are not in combat, you can shout to get the attention of hearing creatures within 10 squares of you. Each such creature who is not hostile toward you listens to what you have to say for 1 uninterrupted minute or more, or until they sense danger or any form of imminent harm. While creatures are listening to you, each of your allies gains an edge on tests made to avoid being noticed by those creatures.",
  },
  {
    id: 'harmonizer',
    name: 'Harmonizer',
    category: 'interpersonal',
    description:
      "You can make a Presence test using the Music skill to influence creatures who don't have emotions or can't understand you. Additionally, once during a negotiation when an ally makes an argument, you can play music to give that ally an edge on their test.",
  },
  {
    id: 'lie-detector',
    name: 'Lie Detector',
    category: 'interpersonal',
    description:
      'In response to another creature communicating information to you, you can spend a hero token to determine whether that information contained any knowing lies. If so, you know what the lies are, but not what the truth is.',
  },
  {
    id: 'open-book',
    name: 'Open Book',
    category: 'interpersonal',
    description:
      'Whenever you speak one-on-one with a creature, you can ask them one question about themself that might typically offend them or raise suspicion. If they choose not to answer honestly, they simply deflect or redirect the question, with no further complications. If they choose to answer honestly, the creature can immediately ask you a question about yourself in turn, which you must answer honestly.',
  },
  {
    id: 'pardon-my-friend',
    name: 'Pardon My Friend',
    category: 'interpersonal',
    description:
      "When an ally within 5 squares fails a Presence test, you can step in and make a Presence test that takes a bane, with your roll replacing the ally's roll. This perk can be used only once per test, even if more than one character has it.",
  },
  {
    id: 'power-player',
    name: 'Power Player',
    category: 'interpersonal',
    description:
      'Whenever you make a test that uses the Brag, Flirt, or Intimidate skills, you can use Might instead of any other characteristic the test calls for.',
  },
  {
    id: 'so-tell-me',
    name: 'So Tell Me...',
    category: 'interpersonal',
    description:
      "Whenever you succeed on a Presence test to influence one or more creatures, you can ask one creature you influenced a follow-up question after the test resolves, which they must answer honestly. At the Director's discretion, the creature doesn't have to answer the question completely—or at all—if the response would put them or a loved one in danger.",
  },
  {
    id: 'spot-the-tell',
    name: 'Spot the Tell',
    category: 'interpersonal',
    description:
      'Whenever you make a test to read a person and obtain a tier 3 outcome, you notice several tells that give away their true feelings. Any test you make to read that person in the future gains an edge.',
  },
  // Beastheart-specific interpersonal perks
  {
    id: 'people-sense',
    name: 'People Sense',
    category: 'interpersonal',
    description:
      "(Beastheart only) While within 5 squares of your companion, when you make a test to determine a creature's motives, your partner can make the same test and you use the better of the two results.",
  },
  {
    id: 'voice-of-the-wild',
    name: 'Voice of the Wild',
    category: 'interpersonal',
    description: '(Beastheart only) Your companion can speak any language you can speak.',
  },
  {
    id: 'you-can-pet-them',
    name: "You Can Pet Them, They're Friendly",
    category: 'interpersonal',
    description:
      "(Beastheart only) While within 5 squares of your companion, you can use your companion's Presence score instead of your own for tests.",
  },

  // ============================================
  // INTRIGUE PERKS (6)
  // ============================================
  {
    id: 'criminal-contacts',
    name: 'Criminal Contacts',
    category: 'intrigue',
    description:
      "You have access to a network of criminal contacts. As a respite activity while you take a respite in a settlement, you can ask a question of your contacts by making a Presence test. On a tier 2 outcome, you learn one piece of information that would be common among criminals—the secret entrances into a building, the location of a local criminal in hiding, the name of a local thieves' guild leader, and so forth. On a tier 3 outcome, you can instead gain knowledge that would be uncommon among criminals as long as such information exists—the location of a local treasure cache, the location of a murder weapon used in a noble's assassination, the name of an NPC secretly bankrolling a local assassin's guild, and so forth.",
  },
  {
    id: 'forgettable-face',
    name: 'Forgettable Face',
    category: 'intrigue',
    description:
      "If you spend 10 minutes or less interacting with a creature who hasn't met you before, you can cause them to forget your face when you part. If asked to describe you, the creature gives only a vague, blank, and unhelpful description. Additionally, if you spend 1 hour or more assembling a disguise, you automatically obtain a tier 2 outcome on any test that could make use of the Disguise skill. If you have the Disguise skill, you automatically obtain a tier 3 outcome on the test.",
  },
  {
    id: 'gum-up-the-works',
    name: 'Gum Up the Works',
    category: 'intrigue',
    description:
      "Whenever a mundane trap activates within 3 squares, you can use a triggered action to move up to 3 squares toward it. If this movement brings you adjacent to any of the trap's mechanisms, you can jam the trap, preventing it from activating. As long as you stay adjacent to the mechanism, the trap can't go off unless an attempt to disarm it fails.",
  },
  {
    id: 'lucky-dog',
    name: 'Lucky Dog',
    category: 'intrigue',
    description:
      'Whenever you fail a test using any skill from the intrigue skill group, you can lose Stamina equal to 1d6 + your level to improve the outcome of the test by one tier. You can use this perk only once per test.',
  },
  {
    id: 'master-of-disguise',
    name: 'Master of Disguise',
    category: 'intrigue',
    description:
      'You can don or remove a disguise as part of any test you make using the Hide skill, or while using the Hide maneuver.',
  },
  {
    id: 'slipped-lead',
    name: 'Slipped Lead',
    category: 'intrigue',
    description:
      "You gain an edge on tests made to escape bonds. Given 1 uninterrupted minute, you can escape any mundane bonds without making a test. Additionally, it's not immediately obvious when you've escaped bonds until you do something that makes it clear you have done so (cast them off, use an ability that harms one or more creatures, and so forth).",
  },
  // Beastheart-specific intrigue perk
  {
    id: 'trained-thief',
    name: 'Trained Thief',
    category: 'intrigue',
    description:
      '(Beastheart only) You gain the Conceal Object or Pick Pocket skill. Your companion can make a test using the gained skill as a maneuver.',
  },

  // ============================================
  // LORE PERKS (8)
  // ============================================
  {
    id: 'but-i-know-who-does',
    name: 'But I Know Who Does',
    category: 'lore',
    description:
      "Whenever you fail a test to recall lore using a skill from the lore skill group, you instinctively recall the nearest location where the information you seek might be found. This could be the tower of a local sage, a library in a nearby city, somewhere deep in a dungeon, or any other location of the Director's determination. The Director can decide that certain lore can't be revealed this way.",
  },
  {
    id: 'eidetic-memory',
    name: 'Eidetic Memory',
    category: 'lore',
    description:
      "Your mind is an encyclopedia, though not always an easy one to organize. When you finish a respite, choose one skill from the lore skill group that you don't have. You have that skill until you finish your next respite. Additionally, if you spend 1 uninterrupted minute or more reading any page of text, you can memorize its contents, allowing you to memorize entire books with sufficient time.",
  },
  {
    id: 'expert-sage',
    name: 'Expert Sage',
    category: 'lore',
    description:
      'Whenever you make a test as part of a crafting or research project using a skill from the lore skill group, you can make the power roll twice and use either roll.',
  },
  {
    id: 'ive-read-about-this-place',
    name: "I've Read About This Place",
    category: 'lore',
    description:
      "Each time you enter a settlement you've never been to before, you can ask the Director one of the following questions: Who is the most influential public figure in this settlement? Who in this settlement would be the friendliest to us right now? What does this settlement need most from outsiders? If the Director doesn't have an answer to the question you ask, or doesn't want to answer, you can instead ask a different question.",
  },
  {
    id: 'linguist',
    name: 'Linguist',
    category: 'lore',
    description:
      "You automatically learn two new languages, as long as you have regularly heard those languages spoken or seen them written before. Additionally, if you spend 7 days or more in a place where you regularly hear or read a language you don't know, you can pick up enough of that language to hold a conversation or understand basic written information. Having picked up a language this way, you can subsequently learn it using the Learn New Language research project at half the usual project goal cost.",
  },
  {
    id: 'polymath',
    name: 'Polymath',
    category: 'lore',
    description:
      "Whenever you make a test to recall lore and don't have a skill that applies to the test, you gain a +1 bonus to the power roll.",
  },
  {
    id: 'specialist',
    name: 'Specialist',
    category: 'lore',
    description:
      'You are a leading expert on a particular subject. Choose one skill you have from the lore skill group. You always have a double edge on tests made to recall lore using this skill. Additionally, your specialist knowledge grants you notoriety in fields related to the chosen skill. You treat your Renown as 1 higher when negotiating with an NPC who knows your reputation, or 2 higher if they have the same skill you chose for this perk.',
  },
  {
    id: 'traveling-sage',
    name: 'Traveling Sage',
    category: 'lore',
    description:
      "On any day when you don't take a respite, you can spend 1 uninterrupted hour working on a research project using a skill you have from the lore skill group. If you do so, you gain 1d10 project points toward that project.",
  },

  // ============================================
  // SUPERNATURAL PERKS (7)
  // ============================================
  {
    id: 'arcane-trick',
    name: 'Arcane Trick',
    category: 'supernatural',
    description:
      'You have the Arcane Trick ability. As a main action, you cast an entertaining spell that creates a minor but impressive magical effect. Choose one effect: teleport a size 1S or smaller object adjacent to you into an unoccupied space adjacent to you; shoot harmless noisy sparks from your body that light up adjacent squares until the start of your next turn; ignite or snuff out every mundane light source of 1L or smaller adjacent to you; transform up to 1 pound of edible food you touch to taste delicious or disgusting; make your body exude a particular odor sensed by creatures within 5 squares until the start of your next turn; place or remove a small magical inscription on a mundane object you touch; or cover a size 1T object with an illusion that makes it look like a different object until you stop touching it.',
  },
  {
    id: 'creature-sense',
    name: 'Creature Sense',
    category: 'supernatural',
    description:
      'As a maneuver, choose a creature within 10 squares. If that creature is your level or lower, you learn the keywords in their stat block (Demon, Humanoid, Undead, and so forth).',
  },
  {
    id: 'familiar',
    name: 'Familiar',
    category: 'supernatural',
    description:
      "A supernatural spirit who has taken the form of a specific small animal or animated object has chosen to be your familiar—or to adopt you as their familiar. The familiar can hold small objects in their mouth or claws, but can't perform activities that would typically require hands. They can't harm other creatures or objects. They can flank in combat, but only with you. If your familiar is destroyed, you can restore them as a respite activity, or by spending a Recovery as a main action to bring them back into existence in an unoccupied space adjacent to you. While you and your familiar are within 10 squares of each other, you can communicate telepathically and share each other's senses.",
  },
  {
    id: 'invisible-force',
    name: 'Invisible Force',
    category: 'supernatural',
    description:
      "You have the Invisible Force ability. As a maneuver, you manipulate a tiny object with your mind. You can grab or manipulate one size 1T object within 10 squares, moving it up to a number of squares equal to your Reason, Intuition, or Presence score (your choice). You can use this ability to turn doorknobs, pull levers, and so forth. You can manipulate any small movable piece of a larger object as long as the piece is unattended and size 1T. You can't use this ability to break a smaller piece off a larger object.",
  },
  {
    id: 'psychic-whisper',
    name: 'Psychic Whisper',
    category: 'supernatural',
    description:
      'You have the Psychic Whisper ability. As a maneuver, you send a one-way telepathic message to one ally within 10 squares. As long as the target understands one or more languages, you send a telepathic message to them that takes 10 seconds or less to speak. The target knows who the message is from and can decide to ignore it and subsequent messages.',
  },
  {
    id: 'ritualist',
    name: 'Ritualist',
    category: 'supernatural',
    description:
      "You can spend 1 uninterrupted minute to perform a magic ritual of blessing, targeting yourself or one willing creature you touch. The target has a double edge on the next test they make within the next minute. A target can't use this benefit on an activity that takes longer than 1 minute.",
  },
  {
    id: 'thingspeaker',
    name: 'Thingspeaker',
    category: 'supernatural',
    description:
      "When you hold an object in your hand for 1 uninterrupted minute, you can sense whether it bears emotional resonance. Objects with emotional resonance could include treasured gifts, murder weapons, or personal keepsakes. If the Director determines that the object bears emotional resonance, you learn the most dominant emotion associated with the object, then receive a vision that answers one of the following questions: What was the name of the person whose emotion is imprinted on this object? Why does this emotion linger on the object? How long has it been since the object was held by the person whose emotion lingers on it? After asking one question, you can choose to delve deeper by asking one additional question from the list, but you are then overcome with emotions that do not belong to you. You take a bane on Intuition and Presence tests until you finish a respite, and you can't use this perk again while you suffer this bane.",
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all perks in a specific category
 */
export function getPerksByCategory(category: PerkCategory): Perk[] {
  return PERKS.filter(p => p.category === category);
}

/**
 * Get perks filtered by multiple allowed categories
 */
export function getPerksForCategories(categories: PerkCategory[]): Perk[] {
  return PERKS.filter(p => categories.includes(p.category));
}

/**
 * Get a perk by its ID
 */
export function getPerkById(id: string): Perk | undefined {
  return PERKS.find(p => p.id === id);
}

/**
 * Get all perks except those already selected
 */
export function getAvailablePerks(
  allowedCategories: PerkCategory[],
  selectedPerkIds: string[]
): Perk[] {
  return PERKS.filter(
    p => allowedCategories.includes(p.category) && !selectedPerkIds.includes(p.id)
  );
}

/**
 * Get the total count of perks per category
 */
export function getPerkCountsByCategory(): Record<PerkCategory, number> {
  return {
    crafting: getPerksByCategory('crafting').length,
    exploration: getPerksByCategory('exploration').length,
    interpersonal: getPerksByCategory('interpersonal').length,
    intrigue: getPerksByCategory('intrigue').length,
    lore: getPerksByCategory('lore').length,
    supernatural: getPerksByCategory('supernatural').length,
  };
}
