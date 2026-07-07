import type { CharacterInProgress, DerivedStats } from '@anvil/data';
import { GameData, PERKS, WizardLogic } from '@anvil/data';

export function getCultureDisplay(character: CharacterInProgress): string | null {
  const preset = character.culture.preset
    ? GameData.getPrebuiltCulture(character.culture.preset)
    : null;
  const environment = character.culture.environment
    ? GameData.getCulturesByType('environment').find((item) => item.id === character.culture.environment)?.name
    : null;
  const organization = character.culture.organization
    ? GameData.getCulturesByType('organization').find((item) => item.id === character.culture.organization)?.name
    : null;
  const upbringing = character.culture.upbringing
    ? GameData.getCulturesByType('upbringing').find((item) => item.id === character.culture.upbringing)?.name
    : null;

  const parts = [environment, organization, upbringing].filter(Boolean);
  if (preset?.type === 'bespoke') {
    return parts.length > 0 ? `${preset.name}: ${parts.join(' / ')}` : preset.name;
  }
  if (preset?.type === 'professional') return preset.name;
  return parts.length > 0 ? parts.join(' / ') : null;
}

/** Every character selection resolved to a display name, plus derived stats. */
export interface WizardSummary {
  stats: DerivedStats | null;
  ancestryName: string | null;
  className: string | null;
  subclassName: string | null;
  careerName: string | null;
  cultureDisplay: string | null;
  complicationName: string | null;
  kitName: string | null;
  secondaryKitName: string | null;
  companionName: string | null;
  selectedSkills: string[];
  selectedAbilities: string[];
  selectedPerks: string[];
  selectedMinions: string[];
}

/**
 * Resolves the character's id-based selections into display names — the
 * single lookup path shared by the desktop WizardPreview and the phone
 * review screen (ReviewStep passes the result on as plain strings).
 */
export function resolveWizardSummary(character: CharacterInProgress): WizardSummary {
  const canDerive = WizardLogic.canCalculateDerivedStats(character);
  let stats: DerivedStats | null = null;
  if (canDerive) {
    stats = WizardLogic.calculateDerivedStats(character);
  }

  const ancestryName = character.ancestry
    ? GameData.getAncestry(character.ancestry)?.name ?? character.ancestry
    : null;
  const className = character.heroClass
    ? GameData.getClass(character.heroClass)?.name ?? character.heroClass
    : null;
  const subclassName = character.subclass && character.heroClass
    ? (Array.isArray(character.subclass) ? character.subclass : [character.subclass])
        .map((id) => GameData.getSubclass(character.heroClass!, id)?.name ?? id)
        .join(', ')
    : null;
  const careerName = character.career
    ? GameData.getCareer(character.career)?.name ?? character.career
    : null;
  const cultureDisplay = getCultureDisplay(character);
  const complicationName = character.complication?.name ?? null;
  const kitName = character.kit
    ? GameData.getKit(character.kit)?.name ?? character.kit
    : null;
  const secondaryKitName = character.secondaryKit
    ? GameData.getKit(character.secondaryKit)?.name ?? character.secondaryKit
    : null;
  const selectedSkills = WizardLogic.getSelectedSkillNames(character);
  const selectedAbilities = WizardLogic.getSelectedAbilityIds(character).map((abilityId) => {
    const slug = abilityId.includes(':') ? abilityId.split(':').pop() ?? abilityId : abilityId;
    const ability = GameData.getByScc(abilityId) ?? GameData.getAbility(abilityId) ?? GameData.getAbility(slug);
    return ability?.name ?? slug;
  });
  const selectedPerks = WizardLogic.getSelectedPerkIds(character).map((perkId) => {
    return PERKS.find((perk) => perk.id === perkId)?.name ?? perkId;
  });
  const selectedMinions = WizardLogic.getSelectedSummonerMinionIds(character).map((minionId) => {
    for (const slot of WizardLogic.getAbilityChoiceSlots(character)) {
      const minion = WizardLogic.getSummonerMinionOptionsForSlot(character, slot).find((option) => option.id === minionId);
      if (minion) return minion.name;
    }
    return minionId;
  });
  const companionName = character.companion
    ? WizardLogic.getCompanionOptions().find((option) => option.id === character.companion)?.name ?? character.companion
    : null;

  return {
    stats,
    ancestryName,
    className,
    subclassName,
    careerName,
    cultureDisplay,
    complicationName,
    kitName,
    secondaryKitName,
    companionName,
    selectedSkills,
    selectedAbilities,
    selectedPerks,
    selectedMinions,
  };
}
