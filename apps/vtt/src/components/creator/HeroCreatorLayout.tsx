import type { ReactNode } from 'react';
import { Button } from '@anvil/ui';
import { BreadcrumbNav } from './BreadcrumbNav.js';
import { CharacterSidebar } from './CharacterSidebar.js';
import { useWizardStore, useWizardNavigation } from '../../stores/wizardStore.js';

interface Props {
  children: ReactNode;
  onSave?: () => void;
  saving?: boolean;
}

export function HeroCreatorLayout({ children, onSave, saving = false }: Props) {
  const character = useWizardStore((state) => state.character);
  const getStepStatus = useWizardStore((state) => state.getStepStatus);
  const sidebarVisible = useWizardStore((state) => state.sidebarVisible);

  const { steps, currentStepId, currentIndex, canGoBack, canGoNext, goBack, goNext, goToStep } =
    useWizardNavigation();

  const isLastStep = currentIndex === steps.length - 1;
  const currentStep = steps[currentIndex];

  // For the last step, check if character is complete
  const canProceed = isLastStep
    ? getStepStatus(currentStepId) !== 'not-begun'
    : true;

  const handleNext = () => {
    if (isLastStep && onSave) {
      onSave();
    } else {
      goNext();
    }
  };

  return (
    <div className="flex h-full flex-col bg-creator-bg">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav
        steps={steps}
        currentStepId={currentStepId}
        getStepStatus={getStepStatus}
        onStepClick={goToStep}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            {/* Step Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-creator-text">
                {currentStep?.label}
              </h2>
            </div>

            {/* Step Content */}
            {children}
          </div>
        </div>

        {/* Character Sidebar */}
        <CharacterSidebar character={character} visible={sidebarVisible} />
      </div>

      {/* Footer Navigation */}
      <div className="flex items-center justify-between border-t border-creator-border px-6 py-3 bg-creator-card">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={!canGoBack}
          className="text-creator-text hover:text-creator-text/80"
        >
          Back
        </Button>
        <span className="text-sm text-creator-text-muted">
          Step {currentIndex + 1} of {steps.length}
        </span>
        <Button
          onClick={handleNext}
          disabled={!canProceed || saving || (isLastStep && !onSave)}
          className="bg-creator-highlight text-creator-bg hover:bg-creator-highlight/90"
        >
          {saving ? 'Saving...' : isLastStep ? 'Create Hero' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
