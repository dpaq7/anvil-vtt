import { useState } from 'react';
import type { WizardStepDefinition, StepStatus } from '@anvil/data';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { PhoneStepsSheet } from './PhoneStepsSheet.js';

interface PhoneStepHeaderProps {
  steps: WizardStepDefinition[];
  currentStepId: string;
  currentIndex: number;
  canGoBack: boolean;
  onBack: () => void;
  getStepStatus: (stepId: string) => StepStatus;
  onStepClick: (stepId: string) => void;
}

export function PhoneStepHeader({
  steps,
  currentStepId,
  currentIndex,
  canGoBack,
  onBack,
  getStepStatus,
  onStepClick,
}: PhoneStepHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const stepNumber = currentIndex + 1;
  const label = steps[currentIndex]?.label ?? '';
  const progressPercent = steps.length > 0 ? (stepNumber / steps.length) * 100 : 0;

  return (
    <header className="border-b border-creator-border bg-creator-bg">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          aria-label="Back"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-creator-text disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-creator-highlight"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label={`Step ${stepNumber} of ${steps.length}: ${label} — open step list`}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-creator-highlight"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-creator-text-muted">
              Step {stepNumber} of {steps.length}
            </span>
            <span className="block truncate text-base font-semibold text-creator-text">
              {label}
            </span>
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-creator-text-muted"
            aria-hidden
          />
        </button>
      </div>
      <div className="h-1 w-full bg-creator-card" aria-hidden>
        <div
          className="h-full bg-creator-highlight transition-[width] duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <PhoneStepsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        steps={steps}
        currentStepId={currentStepId}
        getStepStatus={getStepStatus}
        onStepClick={onStepClick}
      />
    </header>
  );
}
