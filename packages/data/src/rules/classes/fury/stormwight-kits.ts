// Stormwight Kit definitions
import type { StormwightKit, PrimordialStormType } from '@anvil/types';

export interface StormwightKitDefinition {
  id: StormwightKit;
  name: string;
  description: string;
  animalForm: string;
  primordialStorm: PrimordialStormType;
  primordialStormName: string;
  animalFormBenefits: string;
  hybridFormBenefits: string;
}

export const stormwightKits: Record<StormwightKit, StormwightKitDefinition> = {
  boren: {
    id: 'boren',
    name: 'Boren (Bear)',
    description: "Channel the blizzard's fury through the form of a mighty bear.",
    animalForm: 'Bear',
    primordialStorm: 'cold',
    primordialStormName: 'Blizzard',
    animalFormBenefits: 'Increased size, enhanced grappling, cold damage aura',
    hybridFormBenefits: 'Retains humanoid attacks with bear strength and cold damage',
  },
  corven: {
    id: 'corven',
    name: 'Corven (Crow)',
    description: 'Ride the anabatic winds as a cunning crow of flame.',
    animalForm: 'Crow',
    primordialStorm: 'fire',
    primordialStormName: 'Anabatic Wind',
    animalFormBenefits: 'Flight, fire damage on flyby attacks',
    hybridFormBenefits: 'Wings for flight, fire-enhanced melee strikes',
  },
  raden: {
    id: 'raden',
    name: 'Raden (Rat)',
    description: 'Become the swarming pestilence of the rat flood.',
    animalForm: 'Rat',
    primordialStorm: 'corruption',
    primordialStormName: 'Rat Flood',
    animalFormBenefits: 'Small size, swarm movement, corruption damage on bites',
    hybridFormBenefits: 'Enhanced stealth, corruption-laced attacks',
  },
  vuken: {
    id: 'vuken',
    name: 'Vuken (Wolf)',
    description: 'Run with the thunderstorm as a lightning-touched wolf.',
    animalForm: 'Wolf',
    primordialStorm: 'lightning',
    primordialStormName: 'Thunderstorm',
    animalFormBenefits: 'Pack tactics, lightning damage on charges',
    hybridFormBenefits: 'Enhanced speed, lightning-charged strikes',
  },
};

export const getKitById = (id: StormwightKit): StormwightKitDefinition => stormwightKits[id];

export const getPrimordialStormForKit = (kit: StormwightKit): PrimordialStormType => {
  return stormwightKits[kit].primordialStorm;
};

export const getAllKits = (): StormwightKitDefinition[] => Object.values(stormwightKits);
