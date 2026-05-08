import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLogic } from '@anvil/data';
import { useWizardStore } from '../stores/wizardStore.js';
import { loadWizardState, clearWizardState, useWizardPersistence } from '../hooks/useWizardPersistence.js';
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
  const loadFromSaved = useWizardStore((state) => state.loadFromSaved);
  const reset = useWizardStore((state) => state.reset);

  // Load saved state from IndexedDB on mount
  useEffect(() => {
    loadWizardState().then((saved) => {
      if (saved) {
        // Need to migrate old saved state to new format if needed
        const savedCharacter = saved.character;
        // Ensure level and levelUpChoices exist
        if (!('level' in savedCharacter)) {
          (savedCharacter as { level?: number }).level = 1;
        }
        if (!('levelUpChoices' in savedCharacter)) {
          (savedCharacter as { levelUpChoices?: Record<number, unknown[]> }).levelUpChoices = {};
        }
        // Convert old numeric step to step ID
        const stepId = typeof saved.step === 'number'
          ? convertLegacyStepToId(saved.step)
          : saved.step;
        loadFromSaved(savedCharacter, stepId);
      }
      setLoaded(true);
    });
  }, [loadFromSaved]);

  // Persist to IndexedDB on change (after initial load)
  useWizardPersistence(currentStepId, character);

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
        abilities: character.selectedAbilities,
        portraitUrl: character.portraitUrl,
        data: {
          heroClass: character.heroClass,
          subclass: character.subclass,
          culture: character.culture,
          kit: character.kit,
          cultureSkills: character.cultureSkills,
          careerSkillChoices: character.careerSkillChoices,
          ancestryTraits: character.ancestryTraits,
          incitingIncident: character.incitingIncident,
          complication: character.complication,
          selectedLanguages: character.selectedLanguages,
          selectedPerks: character.selectedPerks,
          selectedTitles: character.selectedTitles,
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

/**
 * Convert legacy numeric step to step ID for backward compatibility.
 */
function convertLegacyStepToId(step: number): string {
  const mapping: Record<number, string> = {
    1: WizardLogic.WIZARD_STEP_IDS.ANCESTRY,
    2: WizardLogic.WIZARD_STEP_IDS.CULTURE,
    3: WizardLogic.WIZARD_STEP_IDS.CAREER,
    4: WizardLogic.WIZARD_STEP_IDS.CLASS,
    5: WizardLogic.WIZARD_STEP_IDS.SUBCLASS,
    6: WizardLogic.WIZARD_STEP_IDS.COMPLICATION,
    7: WizardLogic.WIZARD_STEP_IDS.CHARACTERISTICS,
    8: WizardLogic.WIZARD_STEP_IDS.KIT,
    9: WizardLogic.WIZARD_STEP_IDS.SKILLS,
    10: WizardLogic.WIZARD_STEP_IDS.LANGUAGES,
    11: WizardLogic.WIZARD_STEP_IDS.PERKS,
    12: WizardLogic.WIZARD_STEP_IDS.TITLES,
    13: WizardLogic.WIZARD_STEP_IDS.ABILITIES,
    14: WizardLogic.WIZARD_STEP_IDS.PERSONAL,
    15: WizardLogic.WIZARD_STEP_IDS.REVIEW,
  };
  return mapping[step] || WizardLogic.WIZARD_STEP_IDS.LEVEL;
}
