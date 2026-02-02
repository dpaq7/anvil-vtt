import type { ReactNode } from 'react';
import { Button } from '@anvil/ui';
import { WizardProgress } from './WizardProgress.js';

interface Props {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  onBack: () => void;
  onNext: () => void;
  canGoNext: boolean;
  children: ReactNode;
  preview?: ReactNode;
}

export function WizardLayout({ currentStep, totalSteps, stepLabels, onBack, onNext, canGoNext, children, preview }: Props) {
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="flex h-full flex-col">
      <WizardProgress current={currentStep} total={totalSteps} labels={stepLabels} />

      <div className="flex flex-1 gap-6 overflow-hidden p-6">
        <div className="flex-1 overflow-y-auto">{children}</div>
        {preview && (
          <div className="w-[35%] shrink-0 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            {preview}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3">
        <Button variant="ghost" onClick={onBack} disabled={isFirst}>
          Back
        </Button>
        <span className="text-sm text-zinc-500">
          Step {currentStep} of {totalSteps}
        </span>
        <Button onClick={onNext} disabled={!canGoNext}>
          {isLast ? 'Save Hero' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
