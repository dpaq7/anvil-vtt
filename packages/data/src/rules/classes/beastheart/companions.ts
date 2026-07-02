export interface BeastheartCompanionOption {
  id: string;
  name: string;
  level: 0;
  roles: string[];
  ancestry: string[];
  size: string;
  speed: string;
  stability: number;
  signatureAbility: string;
}

export interface BeastheartRampageThreshold {
  rampage: number;
  name: string;
  effect: string;
}

export const BEASTHEART_COMPANION_OPTIONS: BeastheartCompanionOption[] = [
  { id: 'basilisk', name: 'Basilisk', level: 0, roles: ['Companion'], ancestry: ['Beast'], size: '1L', speed: '5', stability: 2, signatureAbility: 'Petrify' },
  { id: 'bear', name: 'Bear', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1L', speed: '5 climb', stability: 2, signatureAbility: 'Backhand' },
  { id: 'boar', name: 'Boar', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1M', speed: '5', stability: 2, signatureAbility: 'Gore' },
  { id: 'condor', name: 'Condor', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1M', speed: '7 fly', stability: 0, signatureAbility: 'Flurry of Wings' },
  { id: 'deinonychus', name: 'Deinonychus', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1M', speed: '7', stability: 1, signatureAbility: 'Terrible Claws' },
  { id: 'drake', name: 'Drake', level: 0, roles: ['Companion'], ancestry: ['Dragon'], size: '1M', speed: '5 fly', stability: 1, signatureAbility: 'Drake Breath' },
  { id: 'elemental-spark', name: 'Elemental Spark', level: 0, roles: ['Companion'], ancestry: ['Elemental'], size: '1M', speed: '7', stability: 1, signatureAbility: 'Static Shock' },
  { id: 'gummy-ball', name: 'Gummy Ball', level: 0, roles: ['Companion'], ancestry: ['Ooze'], size: '1L', speed: '5', stability: 2, signatureAbility: 'Absorb' },
  { id: 'hellhound', name: 'Hellhound', level: 0, roles: ['Companion'], ancestry: ['Infernal'], size: '1M', speed: '7', stability: 1, signatureAbility: 'Fire Breath' },
  { id: 'lightbender', name: 'Lightbender', level: 0, roles: ['Companion'], ancestry: ['Beast'], size: '1L', speed: '7', stability: 2, signatureAbility: 'Sparkling Tail Whip' },
  { id: 'panther', name: 'Panther', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1M', speed: '7 climb', stability: 1, signatureAbility: 'Pounce' },
  { id: 'spider', name: 'Spider', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1M', speed: '5 climb', stability: 1, signatureAbility: 'Web Shot' },
  { id: 'sporeling', name: 'Sporeling', level: 0, roles: ['Companion'], ancestry: ['Beast'], size: '1S', speed: '5', stability: 0, signatureAbility: 'Spore Puff' },
  { id: 'wolf', name: 'Wolf', level: 0, roles: ['Companion'], ancestry: ['Animal'], size: '1M', speed: '7', stability: 1, signatureAbility: 'Clamping Jaws' },
];

export const BEASTHEART_COMPANION_COMBAT_RULES = [
  'Companion maximum Stamina equals the beastheart maximum Stamina.',
  'Companions have no Recoveries and spend the beastheart recoveries when an effect lets them spend one.',
  'The beastheart and companion share one turn, one triggered action each round, and split main action and maneuver between them.',
  'The beastheart and companion each take their own move action.',
];

export const BEASTHEART_RAMPAGE_THRESHOLDS: BeastheartRampageThreshold[] = [
  { rampage: 8, name: 'Rampaging', effect: 'At the end of each beastheart turn, the companion must use Feral Strike as a free maneuver.' },
  { rampage: 12, name: 'Raging Hide', effect: 'The companion gains damage immunity equal to the beastheart Intuition.' },
  { rampage: 16, name: 'Savage Strike', effect: 'Feral Strike deals extra damage equal to the beastheart Intuition.' },
  { rampage: 20, name: 'Monstrous Growth', effect: 'The companion can increase size and gains speed, stability, potency, and Feral Strike area bonuses.' },
  { rampage: 24, name: 'Final Rampage', effect: 'The companion can grow larger and rolls 3d10, dropping the lowest die, while enlarged.' },
];

export function getBeastheartCompanionOption(id: string | null | undefined): BeastheartCompanionOption | undefined {
  if (!id) return undefined;
  return BEASTHEART_COMPANION_OPTIONS.find((option) => option.id === id);
}
