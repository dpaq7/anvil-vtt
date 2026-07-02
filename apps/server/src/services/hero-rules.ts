import { GameData, HeroLogic, PERKS, WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { HERO_LIMITS } from '../policy/limits.js';
import { assetDataUrl } from '../security/assets.js';

interface HeroVitalsInput {
  heroClass: string | null;
  level: number;
  kit: string | null;
  data: Record<string, unknown>;
}

export interface HeroVitals {
  staminaMax: number | null;
  recoveriesMax: number | null;
  recoveryValue: number | null;
}

export function validateHeroCreationRules(character: CharacterInProgress): string | null {
  if (!Number.isInteger(character.level) || character.level < 1 || character.level > 10) return 'Level must be 1-10';
  if (!WizardLogic.isCharacterComplete(character)) return 'Hero creation choices are incomplete';

  for (const slot of WizardLogic.getPerkChoiceSlots(character)) {
    if (!slot.selectedPerkId) return `Select ${slot.label} perk`;
    const perk = PERKS.find((candidate) => candidate.id === slot.selectedPerkId);
    if (!perk) return `Invalid perk for ${slot.label}`;
    if (!slot.categories.includes(perk.category)) return `Invalid perk category for ${slot.label}`;
  }

  return null;
}

export function calculateHeroVitals(input: HeroVitalsInput): HeroVitals {
  if (!input.heroClass || !HeroLogic.isValidHeroClass(input.heroClass)) {
    return { staminaMax: null, recoveriesMax: null, recoveryValue: null };
  }

  const kitDef = input.kit ? GameData.getKit(input.kit) : null;
  const levelUpChoices = typeof input.data['levelUpChoices'] === 'object'
    ? input.data['levelUpChoices'] as Parameters<typeof HeroLogic.getMaxStaminaWithAdvancements>[3]
    : undefined;
  const staminaMax = HeroLogic.getMaxStaminaWithAdvancements(
    input.heroClass,
    input.level,
    kitDef?.staminaPerEchelon ?? 0,
    levelUpChoices,
  );

  return {
    staminaMax,
    recoveriesMax: HeroLogic.getMaxRecoveries(input.heroClass),
    recoveryValue: HeroLogic.getRecoveryValue(staminaMax),
  };
}

export function portraitUrlForAsset(assetId: string): string {
  return assetDataUrl(assetId);
}

export function normalizeExternalPortraitUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string' || value.length > HERO_LIMITS.portraitUrlLength) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}
