// ============================================================================
// SKILLS - Draw Steel Skill System
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  group: SkillGroup;
  description: string;
  // Extended use description from Draw Steel SRD
  use: string;
}

export type SkillGroup = 'crafting' | 'exploration' | 'interpersonal' | 'intrigue' | 'lore';

export interface SkillGroupInfo {
  name: string;
  description: string;
  rewards: string;
  consequences: string;
}

export const skillGroups: Record<SkillGroup, SkillGroupInfo> = {
  crafting: {
    name: 'Crafting',
    description: 'Skills from the crafting skill group are used in the creation and appraisal of goods and for jury-rigging contraptions. They are especially useful during rests and downtime.',
    rewards: 'Having leftover rare material used in the creation process, knowing a buyer willing to pay extra for goods or items you\'re appraising, or making a jury-rigged device so amazing that it lasts for more uses than it should.',
    consequences: 'Wasting rare materials used in the creation process, greatly overestimating or underestimating an item\'s value, and poorly jury-rigging a contraption so that it harms people (or at least the wrong people).',
  },
  exploration: {
    name: 'Exploration',
    description: 'Skills from the exploration skill group are used to physically explore the environment around the characters, and to overcome physical obstacles.',
    rewards: 'Helping another creature engaging in the same task succeed without needing to also make a test, automatically succeeding on a follow-up test while engaged in the same task, reaching a destination faster than anticipated, and learning about or avoiding an upcoming hazard.',
    consequences: 'Harming yourself, your gear, or your allies; becoming lost; or stumbling headlong into a hazard or a place you were trying to avoid.',
  },
  interpersonal: {
    name: 'Interpersonal',
    description: 'Skills from the interpersonal skill group are used to socially interact with other creatures, and are particularly useful during negotiations. You can generally only use interpersonal skills when you attempt to influence creatures who have emotions and who can understand you.',
    rewards: 'Gaining an extra favor, item, or piece of information from the people or creatures you interact with.',
    consequences: 'Making the creature you\'re interacting with angry, sad, embarrassed, offended, or otherwise upset or uncomfortable. This might cause them to ignore you, storm off, spread rumors about you, attack you, betray you, blackmail you, or otherwise attempt to harm you.',
  },
  intrigue: {
    name: 'Intrigue',
    description: 'Skills from the intrigue skill group are used in tasks centered around investigation, thievery, and spycraft.',
    rewards: 'Helping another creature engaging in the same task succeed without needing to also make a test, automatically succeeding on a follow-up test while engaged in the same task, discovering helpful information in addition to what you set out to learn, and performing an extra bit of clandestine activity in addition to what you set out to do.',
    consequences: 'Getting caught in the act or failing to notice a detail that places you in danger, such as triggering a trap or walking into an ambush.',
  },
  lore: {
    name: 'Lore',
    description: 'Skills from the lore skill group are used to research and recall specific information. They are especially useful during rests and downtime.',
    rewards: 'Learning an extra piece of useful information.',
    consequences: 'Learning an incorrect piece of information that seems useful, but which actually works against your interests or wastes time.',
  },
};

// All specific skills organized by group
export const skills: Skill[] = [
  // Crafting Skills
  { id: 'alchemy', name: 'Alchemy', group: 'crafting', description: 'Creating potions and alchemical items.', use: 'Make bombs and potions' },
  { id: 'architecture', name: 'Architecture', group: 'crafting', description: 'Designing and understanding structures.', use: 'Create buildings and vehicles' },
  { id: 'blacksmithing', name: 'Blacksmithing', group: 'crafting', description: 'Forging metal items and weapons.', use: 'Forge metal armor and weapons' },
  { id: 'carpentry', name: 'Carpentry', group: 'crafting', description: 'Working with wood to create items.', use: 'Create items out of wood' },
  { id: 'cooking', name: 'Cooking', group: 'crafting', description: 'Preparing food and meals.', use: 'Create delicious dishes' },
  { id: 'fletching', name: 'Fletching', group: 'crafting', description: 'Creating arrows and ranged ammunition.', use: 'Make ranged weapons and ammunition' },
  { id: 'forgery', name: 'Forgery', group: 'crafting', description: 'Creating fake documents and signatures.', use: 'Create false badges, documents, and other items' },
  { id: 'jewelry', name: 'Jewelry', group: 'crafting', description: 'Crafting rings, necklaces, and gems.', use: 'Create bracelets, crowns, rings, and other jewelry' },
  { id: 'mechanics', name: 'Mechanics', group: 'crafting', description: 'Building and repairing mechanisms.', use: 'Build machines and clockwork items' },
  { id: 'tailoring', name: 'Tailoring', group: 'crafting', description: 'Creating and repairing clothing.', use: 'Craft clothing of cloth or leather' },

  // Exploration Skills
  { id: 'climb', name: 'Climb', group: 'exploration', description: 'Scaling walls, cliffs, and surfaces.', use: 'Move up vertical surfaces' },
  { id: 'drive', name: 'Drive', group: 'exploration', description: 'Operating vehicles and mounts.', use: 'Control vehicles' },
  { id: 'endurance', name: 'Endurance', group: 'exploration', description: 'Withstanding physical hardship.', use: 'Remain engaged in strenuous activity over a long period of time' },
  { id: 'gymnastics', name: 'Gymnastics', group: 'exploration', description: 'Acrobatics and physical agility.', use: 'Move across unsteady or narrow surfaces; tumble' },
  { id: 'heal', name: 'Heal', group: 'exploration', description: 'Treating wounds and ailments.', use: 'Use mundane first aid' },
  { id: 'jump', name: 'Jump', group: 'exploration', description: 'Leaping across gaps and obstacles.', use: 'Leap vertical and horizontal distances' },
  { id: 'lift', name: 'Lift', group: 'exploration', description: 'Carrying and moving heavy objects.', use: 'Pick up, carry, and throw heavy objects' },
  { id: 'navigate', name: 'Navigate', group: 'exploration', description: 'Finding your way through terrain.', use: 'Read a map and travel without becoming lost' },
  { id: 'ride', name: 'Ride', group: 'exploration', description: 'Riding mounts in and out of combat.', use: 'Ride and control a nonsapient mount, such as a horse' },
  { id: 'swim', name: 'Swim', group: 'exploration', description: 'Moving through water.', use: 'Move through deep liquid' },

  // Interpersonal Skills
  { id: 'brag', name: 'Brag', group: 'interpersonal', description: 'Boasting and impressing others.', use: 'Impress others with stories of your deeds' },
  { id: 'empathize', name: 'Empathize', group: 'interpersonal', description: 'Understanding others\' feelings.', use: 'Relate to someone on a personal level' },
  { id: 'flirt', name: 'Flirt', group: 'interpersonal', description: 'Charming and attracting others.', use: 'Attract romantic attention from someone' },
  { id: 'gamble', name: 'Gamble', group: 'interpersonal', description: 'Games of chance and reading opponents.', use: 'Make bets with others' },
  { id: 'handle-animals', name: 'Handle Animals', group: 'interpersonal', description: 'Training and controlling animals.', use: 'Interact with nonsapient animal wildlife' },
  { id: 'interrogate', name: 'Interrogate', group: 'interpersonal', description: 'Extracting information forcefully.', use: 'Obtain information from a creature withholding it' },
  { id: 'intimidate', name: 'Intimidate', group: 'interpersonal', description: 'Frightening others into compliance.', use: 'Awe or scare a creature' },
  { id: 'lead', name: 'Lead', group: 'interpersonal', description: 'Inspiring and directing others.', use: 'Inspire people to action' },
  { id: 'lie', name: 'Lie', group: 'interpersonal', description: 'Deceiving through false statements.', use: 'Convince someone that a falsehood is true' },
  { id: 'music', name: 'Music', group: 'interpersonal', description: 'Playing instruments and singing.', use: 'Perform music vocally or with an instrument' },
  { id: 'perform', name: 'Perform', group: 'interpersonal', description: 'Acting, dancing, and entertaining.', use: 'Engage in dance, oratory, acting, or some other physical performance' },
  { id: 'persuade', name: 'Persuade', group: 'interpersonal', description: 'Convincing others through reason.', use: 'Convince someone to agree with you through use of your charms and grace' },
  { id: 'read-person', name: 'Read Person', group: 'interpersonal', description: 'Discerning motivations and lies.', use: 'Read the emotions and body language of other creatures' },

  // Intrigue Skills
  { id: 'alertness', name: 'Alertness', group: 'intrigue', description: 'Noticing threats and hidden dangers.', use: 'Intuitively sense the details of your surroundings' },
  { id: 'conceal-object', name: 'Conceal Object', group: 'intrigue', description: 'Hiding objects on your person.', use: 'Hide an object on your person or in your environment' },
  { id: 'disguise', name: 'Disguise', group: 'intrigue', description: 'Altering your appearance.', use: 'Change your appearance to look like a different person' },
  { id: 'eavesdrop', name: 'Eavesdrop', group: 'intrigue', description: 'Listening to private conversations.', use: 'Actively listen to something that is hard to hear, such as a whispered conversation through a door' },
  { id: 'escape-artist', name: 'Escape Artist', group: 'intrigue', description: 'Freeing yourself from restraints.', use: 'Escape from bonds such as rope or manacles' },
  { id: 'hide', name: 'Hide', group: 'intrigue', description: 'Remaining unseen.', use: 'Conceal yourself from others\' observation' },
  { id: 'pick-lock', name: 'Pick Lock', group: 'intrigue', description: 'Opening locks without keys.', use: 'Open a lock without using the key' },
  { id: 'pick-pocket', name: 'Pick Pocket', group: 'intrigue', description: 'Stealing from others unnoticed.', use: 'Steal an item that another person wears or carries without them noticing' },
  { id: 'sabotage', name: 'Sabotage', group: 'intrigue', description: 'Disabling devices and structures.', use: 'Disable a mechanical device such as a trap' },
  { id: 'search', name: 'Search', group: 'intrigue', description: 'Finding hidden objects and clues.', use: 'Actively search an environment for important details and items' },
  { id: 'sneak', name: 'Sneak', group: 'intrigue', description: 'Moving silently.', use: 'Move silently' },
  { id: 'track', name: 'Track', group: 'intrigue', description: 'Following trails and footprints.', use: 'Follow a trail that another creature has left behind' },

  // Lore Skills
  { id: 'criminal-underworld', name: 'Criminal Underworld', group: 'lore', description: 'Knowledge of criminal organizations.', use: 'Knowing about criminal organizations, their crimes, their relationships, and their leaders' },
  { id: 'culture', name: 'Culture', group: 'lore', description: 'Knowledge of societies and customs.', use: 'Knowing about a culture\'s customs, folktales, and taboos' },
  { id: 'history', name: 'History', group: 'lore', description: 'Knowledge of past events.', use: 'Knowing about significant past events' },
  { id: 'magic', name: 'Magic', group: 'lore', description: 'Understanding of arcane forces.', use: 'Knowing about magical places, spells, rituals, items, and phenomena' },
  { id: 'monsters', name: 'Monsters', group: 'lore', description: 'Knowledge of creatures and beasts.', use: 'Knowing monster ecology, strengths, and weaknesses' },
  { id: 'nature', name: 'Nature', group: 'lore', description: 'Knowledge of plants, animals, and terrain.', use: 'Knowing about natural flora, fauna, and weather' },
  { id: 'psionics', name: 'Psionics', group: 'lore', description: 'Understanding of mental powers.', use: 'Knowing about psionic places, spells, rituals, items, and phenomena' },
  { id: 'religion', name: 'Religion', group: 'lore', description: 'Knowledge of gods and religious practices.', use: 'Knowing about religious mythology, practices, and rituals' },
  { id: 'rumors', name: 'Rumors', group: 'lore', description: 'Knowledge of gossip and news.', use: 'Knowing gossip, legends, and uncertain truths' },
  { id: 'society', name: 'Society', group: 'lore', description: 'Knowledge of noble etiquette and power.', use: 'Knowing noble etiquette and the leadership and power dynamics of noble families' },
  { id: 'strategy', name: 'Strategy', group: 'lore', description: 'Knowledge of tactics and warfare.', use: 'Knowing about battle tactics and logistics' },
  { id: 'timescape', name: 'Timescape', group: 'lore', description: 'Knowledge of the timescape and planar travel.', use: 'Knowing about the many worlds of the timescape' },
];

// Helper to get skills by group
export const getSkillsByGroup = (group: SkillGroup): Skill[] => {
  return skills.filter(s => s.group === group);
};

// Helper to get skill by ID
export const getSkillById = (id: string): Skill | undefined => {
  return skills.find(s => s.id === id);
};

// Helper to parse skill group from string (used for culture/career data)
export const parseSkillGroup = (skillStr: string): SkillGroup | null => {
  const normalized = skillStr.toLowerCase();
  if (normalized === 'crafting') return 'crafting';
  if (normalized === 'exploration') return 'exploration';
  if (normalized === 'interpersonal') return 'interpersonal';
  if (normalized === 'intrigue') return 'intrigue';
  if (normalized === 'lore') return 'lore';
  return null;
};

// Check if a string is a skill group or a specific skill
export const isSkillGroup = (skillStr: string): boolean => {
  return parseSkillGroup(skillStr) !== null;
};

// Find a specific skill by name (case-insensitive)
export const findSkillByName = (name: string): Skill | undefined => {
  const normalized = name.toLowerCase();
  return skills.find(s => s.name.toLowerCase() === normalized || s.id === normalized);
};
