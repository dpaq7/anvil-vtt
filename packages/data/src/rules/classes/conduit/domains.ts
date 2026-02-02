// Conduit Domains data from Draw Steel rules
// Conduit selects TWO domains at character creation

import type { ConduitDomain } from '@anvil/types';

export interface DomainData {
  id: ConduitDomain;
  name: string;
  theme: string;
  description: string;
  pietyTrigger: string;
  prayerEffect: string;
  healingGraceBonus: string;
}

export const CONDUIT_DOMAINS: Record<ConduitDomain, DomainData> = {
  creation: {
    id: 'creation',
    name: 'Creation',
    theme: 'Building, crafting, and making things whole',
    description:
      'You serve the divine force of creation, channeling the power to build, restore, and forge anew.',
    pietyTrigger: 'When an ally creates or repairs something during combat',
    prayerEffect: 'Create a temporary magical item that lasts until the end of the encounter',
    healingGraceBonus: 'Target gains temporary Stamina equal to your Intuition score',
  },
  death: {
    id: 'death',
    name: 'Death',
    theme: 'The natural end, transition, and rest',
    description:
      'You serve the divine force of death - not as destruction, but as the peaceful transition and final rest.',
    pietyTrigger: 'When a creature dies within 5 squares of you',
    prayerEffect: 'Grant an ally the ability to ignore the first death they suffer this encounter',
    healingGraceBonus: 'Target becomes immune to the dying condition until the end of their next turn',
  },
  fate: {
    id: 'fate',
    name: 'Fate',
    theme: 'Destiny, prophecy, and inevitability',
    description:
      'You serve the divine force of fate, reading the threads of destiny and guiding others toward their purpose.',
    pietyTrigger: 'When you or an ally rolls a natural 19 or 20',
    prayerEffect: 'Force one creature to reroll any roll before your next turn and take the worse result',
    healingGraceBonus: 'Target gains an edge on their next power roll',
  },
  knowledge: {
    id: 'knowledge',
    name: 'Knowledge',
    theme: 'Learning, secrets, and understanding',
    description:
      'You serve the divine force of knowledge, seeking truth and illuminating the hidden.',
    pietyTrigger: 'When you or an ally succeeds on a Reason test',
    prayerEffect: 'Learn one fact about a creature or object you can see (weaknesses, resistances, etc.)',
    healingGraceBonus: 'Target learns the current Stamina and conditions of one enemy they can see',
  },
  life: {
    id: 'life',
    name: 'Life',
    theme: 'Vitality, growth, and renewal',
    description:
      'You serve the divine force of life, channeling the energy of living things to heal and restore.',
    pietyTrigger: 'When you restore Stamina to an ally',
    prayerEffect: 'One ally within 10 squares regains Stamina equal to twice your Intuition score',
    healingGraceBonus: '+1 Stamina healed per use of Healing Grace',
  },
  love: {
    id: 'love',
    name: 'Love',
    theme: 'Connection, devotion, and bonds',
    description:
      'You serve the divine force of love, strengthening the bonds between allies and inspiring devotion.',
    pietyTrigger: 'When an ally uses a triggered action to help another ally',
    prayerEffect: 'Two allies within 10 squares can swap positions as a free action',
    healingGraceBonus: 'If you heal an ally within 2 squares, you also regain Stamina equal to your Intuition',
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    theme: 'The wild, beasts, and natural order',
    description:
      'You serve the divine force of nature, commanding the primal energies of the wild world.',
    pietyTrigger: 'When you or an ally deals damage with a natural weapon or nature ability',
    prayerEffect: 'Summon a spectral beast that attacks one enemy, dealing damage equal to twice your Intuition',
    healingGraceBonus: 'Target gains immunity to poison and disease until end of encounter',
  },
  protection: {
    id: 'protection',
    name: 'Protection',
    theme: 'Defense, shielding, and warding',
    description:
      'You serve the divine force of protection, creating barriers and shields to guard the innocent.',
    pietyTrigger: 'When you or an ally uses a triggered action to defend another creature',
    prayerEffect: 'Create a shield that absorbs damage equal to twice your Intuition for one ally',
    healingGraceBonus: 'Target gains +1 to all defenses until the start of your next turn',
  },
  storm: {
    id: 'storm',
    name: 'Storm',
    theme: 'Thunder, lightning, and tempest',
    description:
      'You serve the divine force of storms, wielding the fury of thunder and lightning.',
    pietyTrigger: 'When you or an ally deals lightning or thunder damage',
    prayerEffect: 'Call down lightning on an enemy, dealing damage equal to twice your Intuition',
    healingGraceBonus: 'Target can immediately shift 2 squares',
  },
  sun: {
    id: 'sun',
    name: 'Sun',
    theme: 'Light, truth, and burning radiance',
    description:
      'You serve the divine force of the sun, wielding holy light to reveal truth and burn away darkness.',
    pietyTrigger: 'When you or an ally deals holy or fire damage',
    prayerEffect: 'Remove all magical darkness and invisibility in a 5-square burst',
    healingGraceBonus: 'Target becomes immune to the blinded condition until end of encounter',
  },
  trickery: {
    id: 'trickery',
    name: 'Trickery',
    theme: 'Deception, illusion, and misdirection',
    description:
      'You serve the divine force of trickery, using illusions and deception to confound enemies.',
    pietyTrigger: 'When you or an ally successfully deceives an enemy',
    prayerEffect: 'Create an illusory duplicate of yourself or an ally that lasts until damaged',
    healingGraceBonus: 'Target becomes invisible until they attack or end of their next turn',
  },
  war: {
    id: 'war',
    name: 'War',
    theme: 'Battle, victory, and martial prowess',
    description:
      'You serve the divine force of war, inspiring martial excellence and leading allies to victory.',
    pietyTrigger: 'When you or an ally reduces an enemy to 0 Stamina',
    prayerEffect: 'Grant one ally +2 to damage on all attacks until the end of their next turn',
    healingGraceBonus: 'Target gains an edge on their next attack roll',
  },
};

// Get domain data by ID
export function getDomainData(domainId: ConduitDomain): DomainData {
  return CONDUIT_DOMAINS[domainId];
}

// Get all domain options as array
export function getAllDomains(): DomainData[] {
  return Object.values(CONDUIT_DOMAINS);
}
