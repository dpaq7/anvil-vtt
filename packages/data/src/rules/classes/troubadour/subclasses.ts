// Troubadour Class Acts (subclasses)
// Based on Draw Steel TTRPG rules

export type TroubadourClassAct = 'auteur' | 'duelist' | 'virtuoso';

export interface ClassActDefinition {
  id: TroubadourClassAct;
  name: string;
  description: string;
  theme: string;
  signatureManeuver: string;
  signatureTriggeredAction: string;
}

export const classActDefinitions: Record<TroubadourClassAct, ClassActDefinition> = {
  auteur: {
    id: 'auteur',
    name: 'Auteur',
    description: 'The Auteur seeks drama from story and recount, manipulating the sequence of events unfolding before them. They are master manipulators of the battlefield, repositioning allies and enemies alike.',
    theme: 'Storyteller & Director',
    signatureManeuver: 'Dramatic Monologue',
    signatureTriggeredAction: 'Turnabout Is Fair Play',
  },
  duelist: {
    id: 'duelist',
    name: 'Duelist',
    description: 'The Duelist finds drama in movement and tandem action, specializing in fencing and quick reflexes. They excel at swashbuckling combat and enabling allies to strike with precision.',
    theme: 'Acrobatic Swordfighter',
    signatureManeuver: 'Star Power',
    signatureTriggeredAction: 'Riposte',
  },
  virtuoso: {
    id: 'virtuoso',
    name: 'Virtuoso',
    description: 'The Virtuoso finds drama in music and song, wielding magic that flows from the vibrations they produce. Their routines are literal songs that empower allies and strike enemies.',
    theme: 'Musical Performer',
    signatureManeuver: 'Power Chord',
    signatureTriggeredAction: 'Harmonize',
  },
};

export function getClassActDefinition(classAct: TroubadourClassAct): ClassActDefinition {
  return classActDefinitions[classAct];
}

export function getAllClassActs(): ClassActDefinition[] {
  return Object.values(classActDefinitions);
}
