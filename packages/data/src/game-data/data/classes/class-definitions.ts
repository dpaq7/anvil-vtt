// Class definitions for all 10 Draw Steel hero classes
// Contains starting stats, heroic resources, subclass options, and characteristics

import { type HeroClass, type HeroicResourceType } from '../../types/hero.js';
import { type Characteristic, type Characteristics } from '../../types/common.js';

export interface SubclassOption {
  id: string;
  name: string;
  description?: string;
}

export interface ClassDefinition {
  id: HeroClass;
  name: string;
  description: string;
  role: 'Defender' | 'Controller' | 'Striker' | 'Support';
  masterClass: boolean;

  // Starting stats
  startingStamina: number;
  staminaPerLevel: number;
  startingRecoveries: number;

  // Heroic resource
  heroicResource: {
    name: string;
    type: HeroicResourceType;
    startingAmount: 'victories';
    gainPerTurn: string;
    gainTrigger: string;
  };

  // Characteristics
  startingCharacteristics: Partial<Characteristics>;
  potencyCharacteristic: Characteristic;

  // Skills
  fixedSkills: string[];
  skillGroupChoices: { groups: string[]; count: number }[];

  // Subclass info
  subclassName: string;
  subclassNamePlural?: string; // e.g., "Domains" for Conduit
  subclassSelectCount: number; // 1 for most, 2 for Conduit
  subclasses: SubclassOption[];
}

export const classDefinitions: Record<HeroClass, ClassDefinition> = {
  censor: {
    id: 'censor',
    name: 'Censor',
    description: 'A trained warrior devoted to a saint or god, specializing in confronting the wicked and locking down single enemies.',
    role: 'Defender',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 12,
    heroicResource: {
      name: 'Wrath',
      type: 'wrath',
      startingAmount: 'victories',
      gainPerTurn: '2',
      gainTrigger: 'First time per round a judged creature deals damage to you OR you deal damage to judged creature',
    },
    startingCharacteristics: { might: 2, presence: 2 },
    potencyCharacteristic: 'presence',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Order',
    subclassNamePlural: 'Orders',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'exorcist', name: 'Exorcist', description: 'Specialists in banishing supernatural threats and protecting the faithful from demonic corruption' },
      { id: 'oracle', name: 'Oracle', description: 'Seers who channel divine visions to guide allies and reveal hidden truths' },
      { id: 'paragon', name: 'Paragon', description: 'Living exemplars of their faith who inspire others through heroic deeds and unwavering conviction' },
    ],
  },

  conduit: {
    id: 'conduit',
    name: 'Conduit',
    description: 'The devoted spellcasting priest of a saint or god who wields divine magic to smite enemies and support allies.',
    role: 'Support',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Piety',
      type: 'piety',
      startingAmount: 'victories',
      gainPerTurn: '1d3',
      gainTrigger: 'Can Pray before rolling for chance at more Piety or Domain Effect (risk psychic damage)',
    },
    startingCharacteristics: { intuition: 2 },
    potencyCharacteristic: 'intuition',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Domain',
    subclassNamePlural: 'Domains',
    subclassSelectCount: 2, // Conduit chooses TWO domains
    subclasses: [
      { id: 'creation', name: 'Creation', description: 'Domain of crafting, building, and bringing forth new things' },
      { id: 'death', name: 'Death', description: 'Domain of endings, transitions, and the peace of the grave' },
      { id: 'fate', name: 'Fate', description: 'Domain of destiny, prophecy, and the threads that bind all things' },
      { id: 'knowledge', name: 'Knowledge', description: 'Domain of learning, secrets, and the pursuit of truth' },
      { id: 'life', name: 'Life', description: 'Domain of healing, growth, and vitality' },
      { id: 'love', name: 'Love', description: 'Domain of bonds, passion, and connection between beings' },
      { id: 'nature', name: 'Nature', description: 'Domain of the wild, beasts, and the green world' },
      { id: 'protection', name: 'Protection', description: 'Domain of defense, guardianship, and warding' },
      { id: 'storm', name: 'Storm', description: 'Domain of weather, lightning, and the fury of the skies' },
      { id: 'sun', name: 'Sun', description: 'Domain of light, fire, and righteous flame' },
      { id: 'trickery', name: 'Trickery', description: 'Domain of deception, luck, and cunning' },
      { id: 'war', name: 'War', description: 'Domain of battle, strategy, and martial prowess' },
    ],
  },

  elementalist: {
    id: 'elementalist',
    name: 'Elementalist',
    description: 'A mage who wields elemental forces with a versatile array of tricks to control combat and manipulate the environment.',
    role: 'Controller',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Essence',
      type: 'essence',
      startingAmount: 'victories',
      gainPerTurn: '2',
      gainTrigger: 'First time per round you or an ally takes elemental (non-untyped/non-holy) damage',
    },
    startingCharacteristics: { reason: 2 },
    potencyCharacteristic: 'reason',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Specialization',
    subclassNamePlural: 'Specializations',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'earth', name: 'Earth', description: 'Master of stone, metal, and geological forces' },
      { id: 'fire', name: 'Fire', description: 'Wielder of flame and destructive heat' },
      { id: 'green', name: 'Green', description: 'Controller of plant life and natural poison' },
      { id: 'void', name: 'Void', description: 'Manipulator of cold, darkness, and gravity' },
    ],
  },

  fury: {
    id: 'fury',
    name: 'Fury',
    description: 'A mobile warrior coursing with ferocity who deals damage up close and pushes foes around the battlefield.',
    role: 'Striker',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 10,
    heroicResource: {
      name: 'Ferocity',
      type: 'ferocity',
      startingAmount: 'victories',
      gainPerTurn: '1d3',
      gainTrigger: 'First time per round you take damage (+1). First time per encounter you become winded or dying (+1d3).',
    },
    startingCharacteristics: { might: 2, agility: 2 },
    potencyCharacteristic: 'might',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Aspect',
    subclassNamePlural: 'Primordial Aspects',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'berserker', name: 'Berserker', description: 'Masters of brute force who leverage Might to dominate the battlefield through raw physical power' },
      { id: 'reaver', name: 'Reaver', description: 'Cunning warriors who use Agility to slide through enemies, ignoring terrain and exploiting openings' },
      { id: 'stormwight', name: 'Stormwight', description: 'Elemental shapeshifters who channel primordial storms, transforming into beast forms' },
    ],
  },

  null: {
    id: 'null',
    name: 'Null',
    description: 'An unarmed psionic warrior dedicated to discipline and order. They dampen supernatural effects and resist potencies.',
    role: 'Defender',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Discipline',
      type: 'discipline',
      startingAmount: 'victories',
      gainPerTurn: '2',
      gainTrigger: 'First time per round an enemy in Null Field uses main action OR Director spends Malice',
    },
    startingCharacteristics: { agility: 2, intuition: 2 },
    potencyCharacteristic: 'intuition',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Tradition',
    subclassNamePlural: 'Traditions',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'chronokinetic', name: 'Chronokinetic', description: 'Manipulators of time who speed allies, slow enemies, and bend causality' },
      { id: 'cryokinetic', name: 'Cryokinetic', description: 'Masters of entropy and cold who drain heat and freeze foes in place' },
      { id: 'metakinetic', name: 'Metakinetic', description: 'Controllers of kinetic energy who redirect force and momentum' },
    ],
  },

  shadow: {
    id: 'shadow',
    name: 'Shadow',
    description: 'An expert infiltrator and thief utilizing magic to remain hidden. Excels at burst damage and battlefield mobility.',
    role: 'Striker',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Insight',
      type: 'insight',
      startingAmount: 'victories',
      gainPerTurn: '1d3',
      gainTrigger: 'First time per round dealing damage with 1+ surges. Abilities cost 1 less if power roll has edge/double edge.',
    },
    startingCharacteristics: { agility: 2 },
    potencyCharacteristic: 'agility',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'College',
    subclassNamePlural: 'Colleges',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'black-ash', name: 'College of Black Ash', description: 'Teleporting assassins who move through ash and shadow to strike unseen' },
      { id: 'caustic-alchemy', name: 'College of Caustic Alchemy', description: 'Poisoners and alchemists who coat their weapons with deadly substances' },
      { id: 'harlequin-mask', name: 'College of the Harlequin Mask', description: 'Deceivers and tricksters who hide in plain sight using charm and misdirection' },
    ],
  },

  summoner: {
    id: 'summoner',
    name: 'Summoner',
    description: 'A master class focused on piercing the veil between worlds to summon minions that form an army under your command.',
    role: 'Controller',
    masterClass: true,
    startingStamina: 15,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Essence',
      type: 'essence',
      startingAmount: 'victories',
      gainPerTurn: '2',
      gainTrigger: 'First time per round a minion dies unwillingly. Can sacrifice minions to reduce ability costs.',
    },
    startingCharacteristics: { reason: 2 },
    potencyCharacteristic: 'reason',
    fixedSkills: ['Magic', 'Strategy'],
    skillGroupChoices: [{ groups: ['intrigue', 'lore'], count: 2 }],
    subclassName: 'Circle',
    subclassNamePlural: 'Circles',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'blight', name: 'Circle of Blight', description: 'Demonologist summoning demons from Abyssal Waste' },
      { id: 'graves', name: 'Circle of Graves', description: 'Necromancer raising undead from Necropolitan Ruin' },
      { id: 'spring', name: 'Circle of Spring', description: 'Feybright beckoning fey spirits from Arcadia' },
      { id: 'storms', name: 'Circle of Storms', description: 'Storm caster summoning elementals from Quintessence' },
    ],
  },

  tactician: {
    id: 'tactician',
    name: 'Tactician',
    description: "A brilliant strategist and weapons expert who excels at commanding allies and controlling the battle's flow.",
    role: 'Support',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 10,
    heroicResource: {
      name: 'Focus',
      type: 'focus',
      startingAmount: 'victories',
      gainPerTurn: '2',
      gainTrigger: 'First time per round you or ally damages marked target OR ally uses heroic ability',
    },
    startingCharacteristics: { might: 2, reason: 2 },
    potencyCharacteristic: 'reason',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Doctrine',
    subclassNamePlural: 'Doctrines',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'insurgent', name: 'Insurgent', description: 'Guerrilla warfare specialists who excel at hit-and-run tactics and covert operations' },
      { id: 'mastermind', name: 'Mastermind', description: 'Strategic geniuses who study enemies and exploit weaknesses with precise coordination' },
      { id: 'vanguard', name: 'Vanguard', description: 'Frontline commanders who lead from the front, inspiring allies through personal valor' },
    ],
  },

  talent: {
    id: 'talent',
    name: 'Talent',
    description: 'A master of psionics who can bend the world to their will. Can spend Clarity below 0, becoming Strained.',
    role: 'Controller',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Clarity',
      type: 'clarity',
      startingAmount: 'victories',
      gainPerTurn: '1d3',
      gainTrigger: 'First time per round a creature is force moved. Can spend below 0 (to -(1+Reason)), becoming Strained.',
    },
    startingCharacteristics: { reason: 2, presence: 2 },
    potencyCharacteristic: 'reason',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Tradition',
    subclassNamePlural: 'Traditions',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'chronopathy', name: 'Chronopathy', description: 'Seers of time who perceive past and future, accelerating allies and predicting enemy actions' },
      { id: 'telekinesis', name: 'Telekinesis', description: 'Masters of psychic force who move objects and creatures with the power of their mind' },
      { id: 'telepathy', name: 'Telepathy', description: 'Mind-readers who communicate silently, sense thoughts, and project psychic attacks' },
    ],
  },

  troubadour: {
    id: 'troubadour',
    name: 'Troubadour',
    description: 'A storytelling swashbuckler who channels battle dynamism into Drama to inspire allies and influence narrative.',
    role: 'Support',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    heroicResource: {
      name: 'Drama',
      type: 'drama',
      startingAmount: 'victories',
      gainPerTurn: '1d3',
      gainTrigger: '3+ heroes same turn (+2), hero winded (+2), natural 19-20 (+3), hero dies (+10). Can resurrect at 30 Drama!',
    },
    startingCharacteristics: { agility: 2, presence: 2 },
    potencyCharacteristic: 'presence',
    fixedSkills: [],
    skillGroupChoices: [],
    subclassName: 'Class Act',
    subclassNamePlural: 'Class Acts',
    subclassSelectCount: 1,
    subclasses: [
      { id: 'auteur', name: 'Auteur', description: 'Storytellers who manipulate the narrative of battle, controlling the sequence of events' },
      { id: 'duelist', name: 'Duelist', description: 'Acrobatic swashbucklers who find drama in movement and tandem action' },
      { id: 'virtuoso', name: 'Virtuoso', description: 'Musical performers who wield magic through song and instrumental performance' },
    ],
  },
};

// Get class definition by ID
export function getClassDefinition(heroClass: HeroClass): ClassDefinition {
  return classDefinitions[heroClass];
}

// Get all class definitions as array
export function getAllClassDefinitions(): ClassDefinition[] {
  return Object.values(classDefinitions);
}

// Get class role color (for UI theming)
export function getClassRoleColor(role: ClassDefinition['role']): string {
  switch (role) {
    case 'Defender':
      return '#3b82f6'; // Blue
    case 'Controller':
      return '#a855f7'; // Purple
    case 'Striker':
      return '#ef4444'; // Red
    case 'Support':
      return '#22c55e'; // Green
  }
}

// Get subclass options for a class
export function getSubclassOptions(heroClass: HeroClass): SubclassOption[] {
  return classDefinitions[heroClass].subclasses;
}

// Get subclass display name (e.g., "Circle", "Domain", "Element")
export function getSubclassTypeName(heroClass: HeroClass): string {
  return classDefinitions[heroClass].subclassName;
}

// Get subclass plural name (e.g., "Circles", "Domains", "Elements")
export function getSubclassTypeNamePlural(heroClass: HeroClass): string {
  return classDefinitions[heroClass].subclassNamePlural || `${classDefinitions[heroClass].subclassName}s`;
}

// Get how many subclasses can be selected (1 for most, 2 for Conduit)
export function getSubclassSelectCount(heroClass: HeroClass): number {
  return classDefinitions[heroClass].subclassSelectCount;
}

// Check if class requires multiple subclass selections
export function requiresMultipleSubclasses(heroClass: HeroClass): boolean {
  return classDefinitions[heroClass].subclassSelectCount > 1;
}

// Get a specific subclass option by ID
export function getSubclassById(heroClass: HeroClass, subclassId: string): SubclassOption | undefined {
  return classDefinitions[heroClass].subclasses.find(s => s.id === subclassId);
}
