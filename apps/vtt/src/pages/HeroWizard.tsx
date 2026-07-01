import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { uploadFile } from '../stores/assetsStore.js';

const MAX_PORTRAIT_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_PORTRAIT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function uploadPortraitDataUrl(dataUrl: string): Promise<string> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!ALLOWED_PORTRAIT_TYPES.has(blob.type)) throw new Error('Choose a PNG, JPEG, WEBP, or GIF portrait.');
  if (blob.size > MAX_PORTRAIT_UPLOAD_BYTES) throw new Error('Choose a portrait under 2 MB.');

  const extension = blob.type.split('/')[1] ?? 'png';
  const file = new File([blob], `hero-portrait.${extension}`, { type: blob.type });
  return uploadFile(file, 'portrait');
}

export function HeroWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobileRoute = location.pathname.startsWith('/app/mobile');
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
      let portraitAssetId: string | null = null;
      let portraitUrl = character.portraitUrl;
      if (portraitUrl?.startsWith('data:')) {
        portraitAssetId = await uploadPortraitDataUrl(portraitUrl);
        portraitUrl = null;
      }

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
        portraitAssetId,
        portraitUrl,
        data: {
          heroClass: character.heroClass,
          subclass: character.subclass,
          culture: character.culture,
          kit: character.kit,
          secondaryKit: character.secondaryKit,
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
          summonerMinionChoices: character.summonerMinionChoices,
          companion: character.companion,
          pronouns: character.pronouns,
          backstory: character.backstory,
          appearance: character.appearance,
          levelUpChoices: character.levelUpChoices,
        },
      });
      if (!result.id) {
        throw new Error('Hero was created without an id');
      }
      await clearWizardState();
      reset();
      navigate(
        isMobileRoute ? `/app/mobile/heroes/${result.id}` : `/app/heroes/${result.id}`,
        { replace: true },
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Hero creation failed');
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
