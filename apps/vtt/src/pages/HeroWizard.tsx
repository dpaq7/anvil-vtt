import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { useWizardPersistence, loadWizardState, clearWizardState } from '../hooks/useWizardPersistence.js';
import { WizardLayout } from '../components/wizard/WizardLayout.js';
import { WizardPreview } from '../components/wizard/WizardPreview.js';
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

const STEP_LABELS = [
  'Ancestry', 'Culture', 'Career', 'Class', 'Subclass',
  'Complications', 'Characteristics', 'Kit', 'Skills',
  'Languages', 'Perks', 'Titles', 'Abilities', 'Personal', 'Review',
];

const TOTAL_STEPS = STEP_LABELS.length;

export function HeroWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<CharacterInProgress>(() =>
    WizardLogic.createEmptyCharacter(),
  );
  const [saving, setSaving] = useState(false);

  // Restore from IndexedDB on mount
  useEffect(() => {
    loadWizardState().then((saved) => {
      if (saved) {
        setStep(saved.step);
        setCharacter(saved.character);
      }
    });
  }, []);

  // Persist to IndexedDB on change
  useWizardPersistence(step, character);

  const patch = useCallback((updates: Partial<CharacterInProgress>) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
  }, []);

  const canGoNext = step === TOTAL_STEPS
    ? WizardLogic.isCharacterComplete(character)
    : WizardLogic.isStepComplete(character, step);

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    // Final step: save
    setSaving(true);
    try {
      const result = await api.post<{ id: string }>('/api/heroes', {
        name: character.name,
        ancestry: character.ancestry,
        culture: JSON.stringify(character.culture),
        career: character.career,
        heroClass: character.heroClass,
        subclass: Array.isArray(character.subclass) ? character.subclass.join(',') : character.subclass,
        characteristics: character.characteristics,
        kit: character.kit,
        skills: character.selectedSkills,
        abilities: character.selectedAbilities,
        portraitUrl: character.portraitUrl,
        data: {
          ancestryTraits: character.ancestryTraits,
          incitingIncident: character.incitingIncident,
          complication: character.complication,
          selectedLanguages: character.selectedLanguages,
          selectedPerks: character.selectedPerks,
          selectedTitles: character.selectedTitles,
          pronouns: character.pronouns,
          backstory: character.backstory,
          appearance: character.appearance,
        },
      });
      await clearWizardState();
      navigate(`/app/heroes/${result.id}`);
    } catch {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    const props = { character, onChange: patch };
    switch (step) {
      case 1: return <AncestryStep {...props} />;
      case 2: return <CultureStep {...props} />;
      case 3: return <CareerStep {...props} />;
      case 4: return <ClassStep {...props} />;
      case 5: return <SubclassStep {...props} />;
      case 6: return <ComplicationStep {...props} />;
      case 7: return <CharacteristicsStep {...props} />;
      case 8: return <KitStep {...props} />;
      case 9: return <SkillsStep {...props} />;
      case 10: return <LanguagesStep {...props} />;
      case 11: return <PerksStep {...props} />;
      case 12: return <TitlesStep {...props} />;
      case 13: return <AbilitiesStep {...props} />;
      case 14: return <PersonalStep {...props} />;
      case 15: return <ReviewStep character={character} />;
      default: return null;
    }
  };

  return (
    <WizardLayout
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      stepLabels={STEP_LABELS}
      onBack={handleBack}
      onNext={handleNext}
      canGoNext={canGoNext && !saving}
      preview={step < TOTAL_STEPS ? <WizardPreview character={character} /> : undefined}
    >
      {renderStep()}
    </WizardLayout>
  );
}
