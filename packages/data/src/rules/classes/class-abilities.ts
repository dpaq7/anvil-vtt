/**
 * Unified class abilities data access
 * Provides functions to retrieve abilities for all hero classes
 * Synced with Draw Steel Heroes v1 rules
 */

import type { Ability } from '@anvil/types';
import type { HeroClass } from '@anvil/types';
import {
  furySignatureAbilities,
  furyThreeFerocityAbilities,
  furyFiveFerocityAbilities,
  furySevenFerocityAbilities,
  furyNineFerocityAbilities,
  furyElevenFerocityAbilities,
  getAspectAbilitiesByCost,
  getAspectTriggeredAction,
} from './fury/abilities.js';
import {
  conduitSignatureAbilities,
  conduitThreePietyAbilities,
  conduitFivePietyAbilities,
  conduitSevenPietyAbilities,
  conduitNinePietyAbilities,
  conduitElevenPietyAbilities,
  conduitTriggeredActions,
  rayOfWrath,
  healingGrace,
} from './conduit/abilities.js';
import {
  censorSignatureAbilities,
  censorThreeWrathAbilities,
  censorFiveWrathAbilities,
  censorSevenWrathAbilities,
  censorNineWrathAbilities,
  censorElevenWrathAbilities,
} from './censor/abilities.js';
import {
  elementalistSignatureAbilities,
  elementalistThreeEssenceAbilities,
  elementalistFiveEssenceAbilities,
  elementalistSevenEssenceAbilities,
  elementalistNineEssenceAbilities,
  elementalistElevenEssenceAbilities,
  elementalistTriggeredActions,
  getSpecializationTriggeredAction,
} from './elementalist/abilities.js';
import {
  nullSignatureAbilities,
  nullThreeDisciplineAbilities,
  nullFiveDisciplineAbilities,
  nullSevenDisciplineAbilities,
  nullNineDisciplineAbilities,
  nullElevenDisciplineAbilities,
} from './null/abilities.js';
import {
  shadowSignatureAbilities,
  shadowThreeInsightAbilities,
  shadowFiveInsightAbilities,
  shadowSevenInsightAbilities,
  shadowNineInsightAbilities,
  shadowElevenInsightAbilities,
} from './shadow/abilities.js';
import {
  tacticianSignatureAbilities,
  tacticianThreeFocusAbilities,
  tacticianFiveFocusAbilities,
  tacticianSevenFocusAbilities,
  tacticianNineFocusAbilities,
  tacticianElevenFocusAbilities,
  tacticianTriggeredActions,
  getDoctrineTriggeredAction,
} from './tactician/abilities.js';
import {
  talentSignatureAbilities,
  talentThreeClarityAbilities,
  talentFiveClarityAbilities,
  talentSevenClarityAbilities,
  talentNineClarityAbilities,
  talentElevenClarityAbilities,
  talentTraditionFeatures,
} from './talent/abilities.js';
import {
  troubadourSignatureAbilities,
  troubadourThreeDramaAbilities,
  troubadourFiveDramaAbilities,
  troubadourSevenDramaAbilities,
  troubadourNineDramaAbilities,
  troubadourElevenDramaAbilities,
  troubadourTriggeredActions,
  getClassActTriggeredAction,
} from './troubadour/abilities.js';
import {
  beastheartSignatureAbilities,
  beastheartThreeFerocityAbilities,
  beastheartFiveFerocityAbilities,
  beastheartSevenFerocityAbilities,
  beastheartNineFerocityAbilities,
  beastheartElevenFerocityAbilities,
  beastheartTriggeredActions,
  getWildNatureAbilitiesByCost,
  getWildNatureTriggeredAction,
} from './beastheart/abilities.js';
import {
  summonerSignatureAbilities,
  summonerThreeEssenceAbilities,
  summonerFiveEssenceAbilities,
  summonerSevenEssenceAbilities,
  summonerNineEssenceAbilities,
  summonerElevenEssenceAbilities,
  summonerTriggeredActions,
} from './summoner/abilities.js';

// Types for ability categories
export interface AbilitiesByTier {
  signature: Ability[];
  threeCost: Ability[];
  fiveCost: Ability[];
  sevenCost: Ability[];
  nineCost: Ability[];
  elevenCost: Ability[];
  triggeredActions: Ability[];
  other: Ability[];
}

/**
 * Get all Fury abilities organized by cost tier
 */
export function getFuryAbilities(aspect?: string): AbilitiesByTier {
  // Core abilities by tier
  const signature = [...furySignatureAbilities];
  const threeCost = [...furyThreeFerocityAbilities];
  const sevenCost = [...furySevenFerocityAbilities];
  const nineCost = [...furyNineFerocityAbilities];
  const elevenCost = [...furyElevenFerocityAbilities];

  // 5-cost: Core abilities + aspect-specific
  let fiveCost = [...furyFiveFerocityAbilities];
  if (aspect) {
    const aspectFiveCost = getAspectAbilitiesByCost(aspect, 5);
    fiveCost = [...fiveCost, ...aspectFiveCost];
  }

  // Add aspect-specific 9-cost abilities
  if (aspect) {
    const aspectNineCost = getAspectAbilitiesByCost(aspect, 9);
    nineCost.push(...aspectNineCost);
  }

  // Add aspect-specific 11-cost abilities
  if (aspect) {
    const aspectElevenCost = getAspectAbilitiesByCost(aspect, 11);
    elevenCost.push(...aspectElevenCost);
  }

  // Triggered actions (aspect-specific)
  const triggeredActions: Ability[] = [];
  if (aspect) {
    const aspectTriggered = getAspectTriggeredAction(aspect);
    if (aspectTriggered) {
      triggeredActions.push(aspectTriggered);
    }
  }

  return {
    signature,
    threeCost,
    fiveCost,
    sevenCost,
    nineCost,
    elevenCost,
    triggeredActions,
    other: [],
  };
}

/**
 * Get all Conduit abilities organized by cost tier
 */
export function getConduitAbilities(): AbilitiesByTier {
  return {
    signature: [...conduitSignatureAbilities, rayOfWrath, healingGrace],
    threeCost: [...conduitThreePietyAbilities],
    fiveCost: [...conduitFivePietyAbilities],
    sevenCost: [...conduitSevenPietyAbilities],
    nineCost: [...conduitNinePietyAbilities],
    elevenCost: [...conduitElevenPietyAbilities],
    triggeredActions: [...conduitTriggeredActions],
    other: [],
  };
}

/**
 * Get all Beastheart abilities organized by cost tier
 */
export function getBeastheartAbilities(wildNature?: string): AbilitiesByTier {
  const signature = [...beastheartSignatureAbilities];
  const threeCost = [...beastheartThreeFerocityAbilities];
  let fiveCost = [...beastheartFiveFerocityAbilities];
  const sevenCost = [...beastheartSevenFerocityAbilities];
  let nineCost = [...beastheartNineFerocityAbilities];
  let elevenCost = [...beastheartElevenFerocityAbilities];

  // Add wild nature-specific abilities
  if (wildNature) {
    fiveCost = [...fiveCost, ...getWildNatureAbilitiesByCost(wildNature, 5)];
    nineCost = [...nineCost, ...getWildNatureAbilitiesByCost(wildNature, 9)];
    elevenCost = [...elevenCost, ...getWildNatureAbilitiesByCost(wildNature, 11)];
  }

  // Triggered actions (wild nature-specific)
  const triggeredActions: Ability[] = [];
  if (wildNature) {
    const wildNatureTriggered = getWildNatureTriggeredAction(wildNature);
    if (wildNatureTriggered) {
      triggeredActions.push(wildNatureTriggered);
    }
  }

  return {
    signature,
    threeCost,
    fiveCost,
    sevenCost,
    nineCost,
    elevenCost,
    triggeredActions,
    other: [],
  };
}

/**
 * Get all Summoner abilities organized by cost tier
 */
export function getSummonerAbilities(): AbilitiesByTier {
  return {
    signature: [...summonerSignatureAbilities],
    threeCost: [...summonerThreeEssenceAbilities],
    fiveCost: [...summonerFiveEssenceAbilities],
    sevenCost: [...summonerSevenEssenceAbilities],
    nineCost: [...summonerNineEssenceAbilities],
    elevenCost: [...summonerElevenEssenceAbilities],
    triggeredActions: [...summonerTriggeredActions],
    other: [],
  };
}

/**
 * Get all Censor abilities organized by cost tier
 */
export function getCensorAbilities(): AbilitiesByTier {
  return {
    signature: [...censorSignatureAbilities],
    threeCost: [...censorThreeWrathAbilities],
    fiveCost: [...censorFiveWrathAbilities],
    sevenCost: [...censorSevenWrathAbilities],
    nineCost: [...censorNineWrathAbilities],
    elevenCost: [...censorElevenWrathAbilities],
    triggeredActions: [],
    other: [],
  };
}

/**
 * Get all Elementalist abilities organized by cost tier
 */
export function getElementalistAbilities(specialization?: string): AbilitiesByTier {
  const triggeredActions: Ability[] = [];
  if (specialization) {
    const specTriggered = getSpecializationTriggeredAction(specialization);
    if (specTriggered) {
      triggeredActions.push(specTriggered);
    }
  }

  return {
    signature: [...elementalistSignatureAbilities],
    threeCost: [...elementalistThreeEssenceAbilities],
    fiveCost: [...elementalistFiveEssenceAbilities],
    sevenCost: [...elementalistSevenEssenceAbilities],
    nineCost: [...elementalistNineEssenceAbilities],
    elevenCost: [...elementalistElevenEssenceAbilities],
    triggeredActions,
    other: [],
  };
}

/**
 * Get all Null abilities organized by cost tier
 */
export function getNullAbilities(): AbilitiesByTier {
  return {
    signature: [...nullSignatureAbilities],
    threeCost: [...nullThreeDisciplineAbilities],
    fiveCost: [...nullFiveDisciplineAbilities],
    sevenCost: [...nullSevenDisciplineAbilities],
    nineCost: [...nullNineDisciplineAbilities],
    elevenCost: [...nullElevenDisciplineAbilities],
    triggeredActions: [],
    other: [],
  };
}

/**
 * Get all Shadow abilities organized by cost tier
 */
export function getShadowAbilities(): AbilitiesByTier {
  return {
    signature: [...shadowSignatureAbilities],
    threeCost: [...shadowThreeInsightAbilities],
    fiveCost: [...shadowFiveInsightAbilities],
    sevenCost: [...shadowSevenInsightAbilities],
    nineCost: [...shadowNineInsightAbilities],
    elevenCost: [...shadowElevenInsightAbilities],
    triggeredActions: [],
    other: [],
  };
}

/**
 * Get all Tactician abilities organized by cost tier
 */
export function getTacticianAbilities(doctrine?: string): AbilitiesByTier {
  const triggeredActions: Ability[] = [];
  if (doctrine) {
    const doctrineTriggered = getDoctrineTriggeredAction(doctrine);
    if (doctrineTriggered) {
      triggeredActions.push(doctrineTriggered);
    }
  }

  return {
    signature: [...tacticianSignatureAbilities],
    threeCost: [...tacticianThreeFocusAbilities],
    fiveCost: [...tacticianFiveFocusAbilities],
    sevenCost: [...tacticianSevenFocusAbilities],
    nineCost: [...tacticianNineFocusAbilities],
    elevenCost: [...tacticianElevenFocusAbilities],
    triggeredActions,
    other: [],
  };
}

/**
 * Get all Talent abilities organized by cost tier
 */
export function getTalentAbilities(): AbilitiesByTier {
  return {
    signature: [...talentSignatureAbilities],
    threeCost: [...talentThreeClarityAbilities],
    fiveCost: [...talentFiveClarityAbilities],
    sevenCost: [...talentSevenClarityAbilities],
    nineCost: [...talentNineClarityAbilities],
    elevenCost: [...talentElevenClarityAbilities],
    triggeredActions: [],
    other: [...talentTraditionFeatures],
  };
}

/**
 * Get all Troubadour abilities organized by cost tier
 */
export function getTroubadourAbilities(classAct?: string): AbilitiesByTier {
  const triggeredActions: Ability[] = [];
  if (classAct) {
    const classActTriggered = getClassActTriggeredAction(classAct);
    if (classActTriggered) {
      triggeredActions.push(classActTriggered);
    }
  }

  return {
    signature: [...troubadourSignatureAbilities],
    threeCost: [...troubadourThreeDramaAbilities],
    fiveCost: [...troubadourFiveDramaAbilities],
    sevenCost: [...troubadourSevenDramaAbilities],
    nineCost: [...troubadourNineDramaAbilities],
    elevenCost: [...troubadourElevenDramaAbilities],
    triggeredActions,
    other: [],
  };
}

/**
 * Get abilities for any class - returns abilities from data files
 */
export function getClassAbilities(
  heroClass: HeroClass,
  subclass?: string
): AbilitiesByTier {
  switch (heroClass) {
    case 'beastheart':
      return getBeastheartAbilities(subclass);
    case 'fury':
      return getFuryAbilities(subclass);
    case 'conduit':
      return getConduitAbilities();
    case 'summoner':
      return getSummonerAbilities();
    case 'censor':
      return getCensorAbilities();
    case 'elementalist':
      return getElementalistAbilities(subclass);
    case 'null':
      return getNullAbilities();
    case 'shadow':
      return getShadowAbilities();
    case 'tactician':
      return getTacticianAbilities(subclass);
    case 'talent':
      return getTalentAbilities();
    case 'troubadour':
      return getTroubadourAbilities(subclass);
    default:
      return {
        signature: [],
        threeCost: [],
        fiveCost: [],
        sevenCost: [],
        nineCost: [],
        elevenCost: [],
        triggeredActions: [],
        other: [],
      };
  }
}

/**
 * Get the resource name for a class
 */
export function getClassResourceName(heroClass: HeroClass): string {
  const resourceMap: Record<HeroClass, string> = {
    beastheart: 'Ferocity',
    fury: 'Ferocity',
    summoner: 'Essence',
    elementalist: 'Essence',
    censor: 'Wrath',
    conduit: 'Piety',
    null: 'Discipline',
    shadow: 'Insight',
    tactician: 'Focus',
    talent: 'Clarity',
    troubadour: 'Drama',
  };
  return resourceMap[heroClass] || 'Resource';
}

/**
 * Check if an ability is selected by the hero
 */
export function isAbilitySelected(
  abilityId: string,
  heroAbilities: Ability[]
): boolean {
  return heroAbilities.some(a => a.id === abilityId);
}
