import { create } from 'zustand';
import type { CharacterInProgress, WizardStepDefinition, StepStatus, LevelUpChoice } from '@anvil/data';
import { WizardLogic } from '@anvil/data';

interface WizardStore {
  // State
  character: CharacterInProgress;
  currentStepId: string;
  sidebarVisible: boolean;
  steps: WizardStepDefinition[];
  subStepIndex: number;
  subStepCount: number;

  // Actions
  patch: (updates: Partial<CharacterInProgress>) => void;
  goToStep: (stepId: string) => void;
  setSubStepIndex: (index: number) => void;
  registerSubStepCount: (count: number) => void;
  getStepStatus: (stepId: string) => StepStatus;
  setLevel: (level: number) => void;
  setLevelUpChoice: (level: number, choice: LevelUpChoice) => void;
  removeLevelUpChoice: (level: number, featureId: string) => void;
  reset: () => void;
  loadFromSaved: (character: CharacterInProgress, stepId: string) => void;
}

const initialSteps = WizardLogic.generateWizardSteps(1);

export const useWizardStore = create<WizardStore>((set, get) => ({
  character: WizardLogic.createEmptyCharacter(),
  currentStepId: WizardLogic.WIZARD_STEP_IDS.LEVEL,
  sidebarVisible: false,
  steps: initialSteps,
  subStepIndex: 0,
  subStepCount: 1,

  patch: (updates) =>
    set((state) => {
      const newCharacter = { ...state.character, ...updates };

      // Show sidebar on first meaningful selection
      let sidebarVisible = state.sidebarVisible;
      if (
        !sidebarVisible &&
        (updates.ancestry ||
          updates.culture ||
          updates.career ||
          updates.heroClass ||
          updates.kit)
      ) {
        sidebarVisible = true;
      }

      return { character: newCharacter, sidebarVisible };
    }),

  goToStep: (stepId) =>
    set({ currentStepId: stepId, subStepIndex: 0, subStepCount: 1 }),

  setSubStepIndex: (index) => set({ subStepIndex: index }),

  registerSubStepCount: (count) =>
    set((state) => ({
      subStepCount: count,
      subStepIndex: Math.min(state.subStepIndex, count - 1),
    })),

  getStepStatus: (stepId) => {
    const { character } = get();
    return WizardLogic.getStepStatus(character, stepId);
  },

  setLevel: (level) =>
    set((state) => {
      const newCharacter = { ...state.character, level };
      // Clear level-up choices for levels that are now beyond the selected level
      const newLevelUpChoices: Record<number, LevelUpChoice[]> = {};
      for (const [lvl, choices] of Object.entries(state.character.levelUpChoices)) {
        const lvlNum = parseInt(lvl, 10);
        if (lvlNum <= level) {
          newLevelUpChoices[lvlNum] = choices;
        }
      }
      newCharacter.levelUpChoices = newLevelUpChoices;

      // Regenerate steps based on new level
      const steps = WizardLogic.generateWizardSteps(level);

      return { character: newCharacter, steps };
    }),

  setLevelUpChoice: (level, choice) =>
    set((state) => {
      const currentChoices = state.character.levelUpChoices[level] || [];
      // Replace or add choice for this feature
      const filteredChoices = currentChoices.filter(
        (c) => c.featureId !== choice.featureId
      );
      filteredChoices.push(choice);

      return {
        character: {
          ...state.character,
          levelUpChoices: {
            ...state.character.levelUpChoices,
            [level]: filteredChoices,
          },
        },
      };
    }),

  removeLevelUpChoice: (level, featureId) =>
    set((state) => {
      const currentChoices = state.character.levelUpChoices[level] || [];
      const filteredChoices = currentChoices.filter(
        (c) => c.featureId !== featureId
      );

      return {
        character: {
          ...state.character,
          levelUpChoices: {
            ...state.character.levelUpChoices,
            [level]: filteredChoices,
          },
        },
      };
    }),

  reset: () =>
    set({
      character: WizardLogic.createEmptyCharacter(),
      currentStepId: WizardLogic.WIZARD_STEP_IDS.LEVEL,
      sidebarVisible: false,
      steps: WizardLogic.generateWizardSteps(1),
      subStepIndex: 0,
      subStepCount: 1,
    }),

  loadFromSaved: (character, stepId) =>
    set({
      character,
      currentStepId: stepId,
      sidebarVisible:
        !!character.ancestry ||
        !!character.heroClass ||
        !!character.career ||
        !!character.kit,
      steps: WizardLogic.generateWizardSteps(character.level || 1),
      subStepIndex: 0,
      subStepCount: 1,
    }),
}));

/**
 * Selector to get the current step definition.
 */
export function useCurrentStep(): WizardStepDefinition | undefined {
  return useWizardStore((state) =>
    state.steps.find((s) => s.id === state.currentStepId)
  );
}

/**
 * Selector to get the current step index.
 */
export function useCurrentStepIndex(): number {
  return useWizardStore((state) =>
    state.steps.findIndex((s) => s.id === state.currentStepId)
  );
}

/**
 * Selector to check if the character has made any selection (sidebar should show).
 */
export function useHasStartedSelection(): boolean {
  return useWizardStore((state) => state.sidebarVisible);
}

/**
 * Selector to get navigation helpers.
 */
export function useWizardNavigation() {
  const steps = useWizardStore((state) => state.steps);
  const currentStepId = useWizardStore((state) => state.currentStepId);
  const goToStep = useWizardStore((state) => state.goToStep);
  const subStepIndex = useWizardStore((state) => state.subStepIndex);
  const subStepCount = useWizardStore((state) => state.subStepCount);
  const setSubStepIndex = useWizardStore((state) => state.setSubStepIndex);

  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const canGoBack = currentIndex > 0 || subStepIndex > 0;
  const canGoNext = currentIndex < steps.length - 1;

  const goBack = () => {
    if (subStepIndex > 0) {
      setSubStepIndex(subStepIndex - 1);
      return;
    }
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      if (prevStep) {
        goToStep(prevStep.id);
      }
    }
  };

  const goNext = () => {
    if (subStepIndex < subStepCount - 1) {
      setSubStepIndex(subStepIndex + 1);
      return;
    }
    if (canGoNext && currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        goToStep(nextStep.id);
      }
    }
  };

  return {
    steps,
    currentStepId,
    currentIndex,
    canGoBack,
    canGoNext,
    goBack,
    goNext,
    goToStep,
    subStepIndex,
    subStepCount,
  };
}
