// Tactician Doctrines (Subclass) data from Draw Steel rules

import type { TacticianDoctrine } from '@anvil/types';

export interface DoctrineData {
  id: TacticianDoctrine;
  name: string;
  theme: string;
  description: string;
  markBonus: string;
  level5Feature: {
    name: string;
    description: string;
  };
}

export const TACTICIAN_DOCTRINES: Record<TacticianDoctrine, DoctrineData> = {
  insurgent: {
    id: 'insurgent',
    name: 'Insurgent',
    theme: 'Guerrilla tactics and covert operations',
    description:
      'You specialize in unconventional warfare, using subterfuge and misdirection to undermine your enemies. Your tactics turn the tide of battle through cunning rather than brute force.',
    markBonus: 'When you mark a creature, you can become hidden from them until the end of your next turn.',
    level5Feature: {
      name: 'Saboteur',
      description:
        'When you or an ally attacks a marked target from hidden, the target cannot use triggered actions until the start of their next turn.',
    },
  },
  mastermind: {
    id: 'mastermind',
    name: 'Mastermind',
    theme: 'Strategic planning and tactical reconnaissance',
    description:
      'You see the battlefield as a grand chess game, always thinking several moves ahead. Your tactical genius allows you to predict and counter enemy actions.',
    markBonus: 'When you mark a creature, you learn their current Stamina and any conditions affecting them.',
    level5Feature: {
      name: 'Calculated Strike',
      description:
        'Once per round when an ally attacks your marked target, you can spend 2 Focus to let them reroll the power roll and take either result.',
    },
  },
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    theme: 'Leadership and frontline command',
    description:
      'You lead from the front, inspiring your allies through courage and decisive action. Your presence on the battlefield bolsters morale and coordination.',
    markBonus: 'When you mark a creature, all allies within 5 squares of you gain temporary Stamina equal to your Reason score.',
    level5Feature: {
      name: 'Rally the Troops',
      description:
        'As a maneuver, spend 3 Focus to end one condition affecting each ally within 5 squares of you.',
    },
  },
};

// Get doctrine data by ID
export function getDoctrineData(doctrineId: TacticianDoctrine): DoctrineData {
  return TACTICIAN_DOCTRINES[doctrineId];
}
