import type { WizardStepDefinition, StepStatus } from '@anvil/data';
import { cn } from '@anvil/ui';
import { Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet.js';

const STATUS_COLORS: Record<StepStatus, string> = {
  complete: 'text-creator-highlight',
  incomplete: 'text-creator-highlight/80',
  'not-begun': 'text-creator-text-muted',
};

interface PhoneStepsSheetProps {
  open: boolean;
  onClose: () => void;
  steps: WizardStepDefinition[];
  currentStepId: string;
  getStepStatus: (stepId: string) => StepStatus;
  onStepClick: (stepId: string) => void;
}

export function PhoneStepsSheet({
  open,
  onClose,
  steps,
  currentStepId,
  getStepStatus,
  onStepClick,
}: PhoneStepsSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Steps">
      <ul className="flex flex-col">
        {steps.map((step) => {
          const isCurrent = step.id === currentStepId;
          const status = getStepStatus(step.id);
          const complete = status === 'complete';

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => {
                  onStepClick(step.id);
                  onClose();
                }}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-creator-highlight',
                  STATUS_COLORS[status],
                  isCurrent && 'font-semibold text-creator-highlight',
                )}
              >
                <span
                  className="flex w-5 shrink-0 items-center justify-center"
                  aria-hidden
                >
                  {complete ? (
                    <Check className="h-4 w-4 text-creator-highlight" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{step.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
