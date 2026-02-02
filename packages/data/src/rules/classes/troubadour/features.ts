// Troubadour Subclass Features
// Based on Draw Steel TTRPG rules

import type { TroubadourClassAct } from './subclasses';

export type FeatureType = 'feature' | 'maneuver' | 'triggered-action' | 'main-action';

export interface SubclassFeature {
  id: string;
  name: string;
  level: number;
  type: FeatureType;
  dramaCost?: number;
  description: string;
}

// ===== AUTEUR FEATURES =====
export const auteurFeatures: SubclassFeature[] = [
  // Level 1
  {
    id: 'dramatic-monologue',
    name: 'Dramatic Monologue',
    level: 1,
    type: 'maneuver',
    description: 'You gain the Dramatic Monologue maneuver, allowing you to reposition allies within your Blocking routine.',
  },
  {
    id: 'turnabout-is-fair-play',
    name: 'Turnabout Is Fair Play',
    level: 1,
    type: 'triggered-action',
    description: 'When an enemy hits an ally with an ability, you can use your triggered action to allow that ally to immediately make a free strike against the attacker.',
  },
  // Level 2
  {
    id: 'guest-star',
    name: 'Guest Star',
    level: 2,
    type: 'main-action',
    dramaCost: 5,
    description: 'Spend 5 Drama to summon a narrative echo that can take actions on your behalf.',
  },
  {
    id: 'twist-at-the-end',
    name: 'Twist at the End',
    level: 2,
    type: 'main-action',
    dramaCost: 5,
    description: 'Spend 5 Drama to retroactively change the outcome of a recent event, rerolling a power roll.',
  },
  // Level 5
  {
    id: 'directors-cut',
    name: 'Director\'s Cut',
    level: 5,
    type: 'feature',
    description: 'Your Take Two! routine now allows targets to choose to use either roll instead of being forced to use the new one.',
  },
  // Level 7
  {
    id: 'narrative-immunity',
    name: 'Narrative Immunity',
    level: 7,
    type: 'feature',
    description: 'You gain the Plot Armor routine. Additionally, you are immune to fear effects.',
  },
];

// ===== DUELIST FEATURES =====
export const duelistFeatures: SubclassFeature[] = [
  // Level 1
  {
    id: 'star-power',
    name: 'Star Power',
    level: 1,
    type: 'maneuver',
    description: 'You gain the Star Power maneuver, allowing you to mark an enemy. While marked, that enemy takes extra damage from allies in your routine aura.',
  },
  {
    id: 'riposte',
    name: 'Riposte',
    level: 1,
    type: 'triggered-action',
    description: 'When an enemy misses you with a melee attack, you can use your triggered action to make a free strike against them.',
  },
  // Level 2
  {
    id: 'leading-role',
    name: 'Leading Role',
    level: 2,
    type: 'main-action',
    dramaCost: 3,
    description: 'Spend 3 Drama to take an additional action this turn, inspiring allies with your heroic presence.',
  },
  {
    id: 'dramatic-entrance',
    name: 'Dramatic Entrance',
    level: 2,
    type: 'main-action',
    dramaCost: 5,
    description: 'Spend 5 Drama to teleport to any space you can see within 10 squares and make a strike with advantage.',
  },
  // Level 5
  {
    id: 'encore-performance',
    name: 'Encore Performance',
    level: 5,
    type: 'feature',
    description: 'Your We Can\'t Be Upstaged! routine now also grants targets temporary Stamina equal to your Presence when they shift.',
  },
  // Level 7
  {
    id: 'perfect-partner',
    name: 'Perfect Partner',
    level: 7,
    type: 'feature',
    description: 'You gain the Tandem Strike routine. Your allies gain advantage on strikes against enemies you have marked.',
  },
];

// ===== VIRTUOSO FEATURES =====
export const virtuosoFeatures: SubclassFeature[] = [
  // Level 1
  {
    id: 'power-chord',
    name: 'Power Chord',
    level: 1,
    type: 'maneuver',
    description: 'You gain the Power Chord maneuver, allowing you to deal sonic damage in an area and push enemies back.',
  },
  {
    id: 'harmonize',
    name: 'Harmonize',
    level: 1,
    type: 'triggered-action',
    description: 'When an ally in your aura makes an ability power roll, you can use your triggered action to grant them an edge on that roll.',
  },
  // Level 2
  {
    id: 'solo',
    name: 'Solo',
    level: 2,
    type: 'main-action',
    dramaCost: 3,
    description: 'Spend 3 Drama to play an intense solo, dealing damage to all enemies in your routine aura.',
  },
  {
    id: 'power-ballad',
    name: 'Power Ballad',
    level: 2,
    type: 'main-action',
    dramaCost: 5,
    description: 'Spend 5 Drama to play a stirring ballad, granting all allies in your aura temporary Stamina and removing one condition.',
  },
  // Level 3 (Second Album)
  {
    id: 'second-album',
    name: 'Second Album',
    level: 3,
    type: 'feature',
    description: 'You learn two additional routines: "Fire Up the Night" and "Never-Ending Hero". You can switch between any of your known routines as a free maneuver.',
  },
  // Level 5 (Medley)
  {
    id: 'medley',
    name: 'Medley',
    level: 5,
    type: 'feature',
    description: 'You can maintain two routines simultaneously. When you activate a routine, you can choose to add it as a secondary routine instead of replacing your primary.',
  },
  // Level 7
  {
    id: 'legendary-performer',
    name: 'Legendary Performer',
    level: 7,
    type: 'feature',
    description: 'Your routine aura increases by 2 squares. Additionally, allies in your aura have resistance to psychic damage.',
  },
  // Level 9
  {
    id: 'greatest-hits',
    name: 'Greatest Hits',
    level: 9,
    type: 'feature',
    description: 'You learn "Moonlight Sonata" and "Radical Fantasia". Your Medley feature now allows you to maintain up to three routines.',
  },
];

/**
 * Get features for a specific Class Act
 */
export function getFeaturesForClassAct(classAct: TroubadourClassAct): SubclassFeature[] {
  switch (classAct) {
    case 'auteur':
      return auteurFeatures;
    case 'duelist':
      return duelistFeatures;
    case 'virtuoso':
      return virtuosoFeatures;
    default:
      return [];
  }
}

/**
 * Get features available at a specific level
 */
export function getFeaturesForLevel(classAct: TroubadourClassAct, level: number): SubclassFeature[] {
  const allFeatures = getFeaturesForClassAct(classAct);
  return allFeatures.filter(f => f.level <= level);
}

/**
 * Get features that unlock at a specific level
 */
export function getNewFeaturesAtLevel(classAct: TroubadourClassAct, level: number): SubclassFeature[] {
  const allFeatures = getFeaturesForClassAct(classAct);
  return allFeatures.filter(f => f.level === level);
}
