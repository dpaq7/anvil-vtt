import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLogic } from '@anvil/data';
import { useWizardStore } from '../stores/wizardStore.js';
import { clearWizardState, useWizardPersistence } from '../hooks/useWizardPersistence.js';
import { HeroCreatorLayout, LevelSelectStep, LevelUpStep } from '../components/creator/index.js';
import { AncestryStep } from '../components/wizard/AncestryStep.js';
import { CultureStep } from '../components/wizard/CultureStep.js';
import { CareerStep } from '../components/wizard/CareerStep.js';
import { ClassStep } from '../components/wizard/ClassStep.js';
import { SubclassStep } from '../components/wizard/SubclassStep.js';
import { ComplicationStep } from '../components/wizard/ComplicationStep.js';
import { CharacteristicsStep } from '../components/wizard/CharacteristicsStep.js';
import { KitStep } from '../components/wizard/KitStep.js';
import { SkillsStep } from '../components/wizard/SkillsStep.js';
import { LanguagesStep } from '../components/wizard/LanguagesStep.js';
import { PerksStep } from '../components/wizard/PerksStep.js';
import { TitlesStep } from '../components/wizard/TitlesStep.js';
import { AbilitiesStep } from '../components/wizard/AbilitiesStep.js';
import { PersonalStep } from '../components/wizard/PersonalStep.js';
import { ReviewStep } from '../components/wizard/ReviewStep.js';
import { api } from '../lib/api.js';

export function HeroWizard() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const character = useWizardStore((state) => state.character);
  const currentStepId = useWizardStore((state) => state.currentStepId);
  const patch = useWizardStore((state) => state.patch);
  const reset = useWizardStore((state) => state.reset);

  // `/heroes/new` is always a new creation flow; stale drafts should not repopulate it.
  useEffect(() => {
    let cancelled = false;
    clearWizardState().then(() => {
      if (!cancelled) {
        reset();
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [reset]);

  // Persist to IndexedDB on change (after initial load)
  useWizardPersistence(currentStepId, character, loaded && !saving);

  const handleSave = async () => {
    if (!WizardLogic.isCharacterComplete(character)) return;

    setSaving(true);
    try {
      const result = await api.post<{ id: string }>('/api/heroes', {
        name: character.name,
        level: character.level,
        ancestry: character.ancestry,
        culture: JSON.stringify(character.culture),
        career: character.career,
        heroClass: character.heroClass,
        subclass: Array.isArray(character.subclass) ? character.subclass.join(',') : character.subclass,
        characteristics: character.characteristics,
        kit: character.kit,
        skills: WizardLogic.getSelectedSkillNames(character),
        abilities: WizardLogic.getSelectedAbilityIds(character),
        portraitUrl: character.portraitUrl,
        data: {
          heroClass: character.heroClass,
          subclass: character.subclass,
          culture: character.culture,
          kit: character.kit,
          cultureSkills: character.cultureSkills,
          careerSkillChoices: character.careerSkillChoices,
          classSkillChoices: character.classSkillChoices,
          ancestryTraits: character.ancestryTraits,
          incitingIncident: character.incitingIncident,
          careerPerk: character.careerPerk,
          complication: character.complication,
          selectedLanguages: character.selectedLanguages,
          selectedPerks: WizardLogic.getSelectedPerkIds(character),
          selectedTitles: character.selectedTitles,
          abilityChoices: character.abilityChoices,
          companion: character.companion,
          pronouns: character.pronouns,
          backstory: character.backstory,
          appearance: character.appearance,
          levelUpChoices: character.levelUpChoices,
        },
      });
      await clearWizardState();
      reset();
      navigate(`/app/heroes/${result.id}`);
    } catch {
      setSaving(false);
    }
  };

  // Wait for IndexedDB load before rendering
  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const renderStep = () => {
    const stepProps = { character, onChange: patch };

    // Handle level-up steps
    if (currentStepId.startsWith('level-')) {
      const lvl = parseInt(currentStepId.replace('level-', ''), 10);
      return <LevelUpStep level={lvl} />;
    }

    switch (currentStepId) {
      case WizardLogic.WIZARD_STEP_IDS.LEVEL:
        return <LevelSelectStep />;
      case WizardLogic.WIZARD_STEP_IDS.ANCESTRY:
        return <AncestryStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.CULTURE:
        return <CultureStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.CAREER:
        return <CareerStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.CLASS:
        return <ClassStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.SUBCLASS:
        return <SubclassStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.COMPLICATION:
        return <ComplicationStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.CHARACTERISTICS:
        return <CharacteristicsStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.KIT:
        return <KitStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.SKILLS:
        return <SkillsStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.LANGUAGES:
        return <LanguagesStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.PERKS:
        return <PerksStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.TITLES:
        return <TitlesStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.ABILITIES:
        return <AbilitiesStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.PERSONAL:
        return <PersonalStep {...stepProps} />;
      case WizardLogic.WIZARD_STEP_IDS.REVIEW:
        return <ReviewStep character={character} />;
      default:
        return null;
    }
  };

  return (
    <HeroCreatorLayout onSave={handleSave} saving={saving}>
      {renderStep()}
    </HeroCreatorLayout>
  );
}
