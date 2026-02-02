import { type Perk, type PerkCategory } from '../../types/perk.js';

/**
 * Complete perk definitions from Draw Steel Chapter 7
 * Organized by category for efficient filtering
 */
export const PERKS: Perk[] = [
  // ============================================
  // CRAFTING PERKS
  // ============================================
  {
    id: 'artisan',
    name: 'Artisan',
    category: 'crafting',
    description: 'You automatically succeed on tests to create mundane items using a crafting skill you have, provided you have the necessary materials and time.',
  },
  {
    id: 'efficient-crafter',
    name: 'Efficient Crafter',
    category: 'crafting',
    description: 'When you use a crafting skill to work on a project, you gain 1d6 additional project points.',
  },
  {
    id: 'improviser',
    name: 'Improviser',
    category: 'crafting',
    description: 'You can jury-rig devices using materials at hand. As a maneuver, create a temporary tool that functions for 1 minute.',
  },
  {
    id: 'salvager',
    name: 'Salvager',
    category: 'crafting',
    description: 'When you destroy an object or defeat a construct, you can salvage materials worth 1d10 gold.',
  },
  {
    id: 'quick-fix',
    name: 'Quick Fix',
    category: 'crafting',
    description: 'You can repair a broken mundane item as a maneuver. The item functions normally until the end of the encounter.',
  },

  // ============================================
  // EXPLORATION PERKS
  // ============================================
  {
    id: 'athletic',
    name: 'Athletic',
    category: 'exploration',
    description: 'Whenever you fail a Might test, you can lose Stamina equal to 1d6 + your level to improve the outcome by one tier.',
  },
  {
    id: 'climber',
    name: 'Climber',
    category: 'exploration',
    description: "You have a climb speed equal to your speed. You don't need to make tests to climb unless the surface is extremely slick or unstable.",
  },
  {
    id: 'ive-got-you',
    name: "I've Got You",
    category: 'exploration',
    description: 'As a free triggered action when an ally within your reach falls, you can catch them, preventing all fall damage.',
  },
  {
    id: 'marathoner',
    name: 'Marathoner',
    category: 'exploration',
    description: 'You can travel overland for twice as long before becoming fatigued. You have an edge on tests to resist exhaustion from travel.',
  },
  {
    id: 'swimmer',
    name: 'Swimmer',
    category: 'exploration',
    description: 'You have a swim speed equal to your speed. You can hold your breath for 10 minutes.',
  },
  {
    id: 'tough-as-nails',
    name: 'Tough as Nails',
    category: 'exploration',
    description: 'When you make a test using a skill from the exploration skill group and at least one d10 shows a 1, you can reroll one d10.',
  },
  {
    id: 'danger-sense',
    name: 'Danger Sense',
    category: 'exploration',
    description: "You can't be surprised. When you roll initiative, you can swap your result with a willing ally within 10 squares.",
  },
  {
    id: 'survivalist',
    name: 'Survivalist',
    category: 'exploration',
    description: 'You automatically succeed on tests to find food, water, and shelter in the wilderness. You can lead a group of up to 10 creatures through difficult terrain at normal pace.',
  },

  // ============================================
  // INTERPERSONAL PERKS
  // ============================================
  {
    id: 'captivating-presence',
    name: 'Captivating Presence',
    category: 'interpersonal',
    description: 'Whenever a creature watches you sing, dance, or perform for 1+ minutes, you gain an edge on tests to influence them for 1 hour.',
  },
  {
    id: 'commanding-voice',
    name: 'Commanding Voice',
    category: 'interpersonal',
    description: 'When not in combat, you can shout to get the attention of hearing creatures within 10 squares.',
  },
  {
    id: 'lie-detector',
    name: 'Lie Detector',
    category: 'interpersonal',
    description: 'You have an edge on tests made to detect lies or hidden motives in creatures you can see.',
  },
  {
    id: 'silver-tongue',
    name: 'Silver Tongue',
    category: 'interpersonal',
    description: "If you fail a test using the Lie skill, you don't suffer consequences. In negotiations, you can be caught in one lie without penalty.",
  },
  {
    id: 'soothing-presence',
    name: 'Soothing Presence',
    category: 'interpersonal',
    description: 'You have an edge on tests to calm frightened, panicked, or hostile creatures.',
  },
  {
    id: 'fast-friends',
    name: 'Fast Friends',
    category: 'interpersonal',
    description: 'When you meet someone for the first time, you can spend 10 minutes in conversation to treat them as a contact for the purposes of gathering information.',
  },
  {
    id: 'inspiring-leader',
    name: 'Inspiring Leader',
    category: 'interpersonal',
    description: 'When you spend a respite, allies who can hear you gain temporary Stamina equal to your level + your Presence.',
  },

  // ============================================
  // INTRIGUE PERKS
  // ============================================
  {
    id: 'contacts',
    name: 'Contacts',
    category: 'intrigue',
    description: 'You have a network of criminal contacts. As a respite activity in a settlement, make a Presence test to learn information common or uncommon among criminals.',
  },
  {
    id: 'escape-artist',
    name: 'Escape Artist',
    category: 'intrigue',
    description: 'You gain an edge on tests to escape bonds. Given 1 minute, you escape any mundane bonds without a test.',
  },
  {
    id: 'forgettable-face',
    name: 'Forgettable Face',
    category: 'intrigue',
    description: "If you spend 10 minutes or less with a creature who hasn't met you before, you can cause them to forget your face when you part.",
  },
  {
    id: 'quick-change',
    name: 'Quick Change',
    category: 'intrigue',
    description: 'You can don or remove a disguise as part of any Hide test or while using the Hide maneuver.',
  },
  {
    id: 'slippery',
    name: 'Slippery',
    category: 'intrigue',
    description: 'Whenever you fail a test using an intrigue skill, you can lose Stamina equal to 1d6 + your level to improve the outcome by one tier.',
  },
  {
    id: 'shadow-stalker',
    name: 'Shadow Stalker',
    category: 'intrigue',
    description: 'While hidden, you can move at full speed without making noise. You have an edge on tests to follow creatures without being noticed.',
  },
  {
    id: 'informant-network',
    name: 'Informant Network',
    category: 'intrigue',
    description: 'You have contacts in every major settlement. When you arrive in a new settlement, you can spend 1 hour to learn the local rumors and power structure.',
  },

  // ============================================
  // LORE PERKS
  // ============================================
  {
    id: 'bookworm',
    name: 'Bookworm',
    category: 'lore',
    description: "On any day you don't take a respite, spend 1 hour on a research project using a lore skill to gain 1d10 project points.",
  },
  {
    id: 'know-it-all',
    name: 'Know-It-All',
    category: 'lore',
    description: 'When you fail a test to recall lore, you instinctively recall the nearest location where the information might be found.',
  },
  {
    id: 'linguist',
    name: 'Linguist',
    category: 'lore',
    description: 'You learn two additional languages. You can communicate basic concepts with any creature that has a language.',
  },
  {
    id: 'photographic-memory',
    name: 'Photographic Memory',
    category: 'lore',
    description: "You can perfectly recall any text, image, or scene you've observed for at least 1 minute.",
  },
  {
    id: 'sage-advice',
    name: 'Sage Advice',
    category: 'lore',
    description: 'Once per respite, when an ally makes a test using a lore skill, you can grant them an edge by sharing your knowledge.',
  },
  {
    id: 'walking-encyclopedia',
    name: 'Walking Encyclopedia',
    category: 'lore',
    description: 'You have studied broadly. Choose three additional lore skills. You can make tests with these skills as if you had them.',
  },

  // ============================================
  // SUPERNATURAL PERKS
  // ============================================
  {
    id: 'cantrip',
    name: 'Cantrip',
    category: 'supernatural',
    description: 'You can cast an entertaining spell creating minor magical effects: light sparks, small telekinesis, flavor changes to food, produce odors, or minor illusions.',
  },
  {
    id: 'detect-magic',
    name: 'Detect Magic',
    category: 'supernatural',
    description: 'As a maneuver, you sense the presence and general direction of magic within 5 squares until the end of your next turn.',
  },
  {
    id: 'minor-telepathy',
    name: 'Minor Telepathy',
    category: 'supernatural',
    description: 'You can send a telepathic message of 25 words or fewer to a creature within 5 squares that you can see.',
  },
  {
    id: 'ritual-caster',
    name: 'Ritual Caster',
    category: 'supernatural',
    description: "You can spend 10 minutes to cast certain spells as rituals, even if you don't have spell slots.",
  },
  {
    id: 'sixth-sense',
    name: 'Sixth Sense',
    category: 'supernatural',
    description: 'You can sense the presence of supernatural creatures and effects within 10 squares, though not their exact location.',
  },
  {
    id: 'spirit-speaker',
    name: 'Spirit Speaker',
    category: 'supernatural',
    description: 'You can communicate with spirits of the deceased. Once per day, you can ask a spirit one question about their life or death.',
  },
  {
    id: 'aura-reading',
    name: 'Aura Reading',
    category: 'supernatural',
    description: 'You can see the emotional state of creatures within 5 squares as colored auras. You have an edge on tests to read their intentions.',
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
