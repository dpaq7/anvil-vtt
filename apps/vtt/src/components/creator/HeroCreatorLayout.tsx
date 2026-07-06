import type { ReactNode } from 'react';
import { WizardLogic } from '@anvil/data';
import { Button, cn } from '@anvil/ui';
import { BreadcrumbNav } from './BreadcrumbNav.js';
import { CharacterSidebar } from './CharacterSidebar.js';
import { PhoneStepHeader } from './phone/index.js';
import { useWizardStore, useWizardNavigation } from '../../stores/wizardStore.js';
import { useIsPhoneViewport } from '../../hooks/useIsPhoneViewport.js';

interface Props {
  children: ReactNode;
  onSave?: () => void;
  saving?: boolean;
}

export function HeroCreatorLayout({ children, onSave, saving = false }: Props) {
  const character = useWizardStore((state) => state.character);
  const getStepStatus = useWizardStore((state) => state.getStepStatus);
  const sidebarVisible = useWizardStore((state) => state.sidebarVisible);
  const isPhone = useIsPhoneViewport();

  const {
    steps,
    currentStepId,
    currentIndex,
    canGoBack,
    canGoNext: _canGoNext,
    goBack,
    goNext,
    goToStep,
    subStepIndex,
    subStepCount,
  } = useWizardNavigation();

  const isLastStep = currentIndex === steps.length - 1;
  const isLastSubStep = subStepIndex === subStepCount - 1;
  const currentStep = steps[currentIndex];

  // For the last step, check if character is complete
  const canProceed = isLastStep
    ? WizardLogic.isCharacterComplete(character)
    : true;

  const handleNext = () => {
    if (isLastStep && isLastSubStep && onSave) {
      onSave();
    } else {
      goNext();
    }
  };

  return (
    <div className="flex h-full flex-col bg-creator-bg">
      {/* Step Navigation Chrome */}
      {isPhone ? (
        <PhoneStepHeader
          steps={steps}
          currentStepId={currentStepId}
          currentIndex={currentIndex}
          canGoBack={canGoBack}
          onBack={goBack}
          getStepStatus={getStepStatus}
          onStepClick={goToStep}
        />
      ) : (
        <BreadcrumbNav
          steps={steps}
          currentStepId={currentStepId}
          getStepStatus={getStepStatus}
          onStepClick={goToStep}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">
            {/* Step Header (phone header already names the step) */}
            {!isPhone && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-creator-text">
                  {currentStep?.label}
                </h2>
              </div>
            )}

            {/* Step Content */}
            {children}
          </div>
        </div>

        {/* Character Sidebar */}
        <CharacterSidebar character={character} visible={sidebarVisible} />
      </div>

      {/* Footer Navigation */}
      <div
        className={cn(
          'flex items-center justify-between border-t border-creator-border px-4 py-3 bg-creator-card sm:px-6',
          isPhone && 'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={!canGoBack}
          className={cn(
            'text-creator-text hover:text-creator-text/80',
            isPhone && 'h-12 flex-1 max-w-40',
          )}
        >
          Back
        </Button>
        {isPhone && subStepCount > 1 ? (
          <div
            role="img"
            aria-label={`Part ${subStepIndex + 1} of ${subStepCount}`}
            className="flex items-center gap-1.5 px-2"
          >
            {Array.from({ length: subStepCount }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'size-1.5 rounded-full',
                  i <= subStepIndex ? 'bg-creator-highlight' : 'bg-creator-card',
                )}
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <span className="text-sm text-creator-text-muted">
            Step {currentIndex + 1} of {steps.length}
          </span>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed || saving || (isLastStep && !onSave)}
          className={cn(
            'bg-creator-highlight text-creator-bg hover:bg-creator-highlight/90',
            isPhone && 'h-12 flex-1 max-w-40',
          )}
        >
          {saving ? 'Saving...' : isLastStep ? 'Create Hero' : isPhone ? 'Continue' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
