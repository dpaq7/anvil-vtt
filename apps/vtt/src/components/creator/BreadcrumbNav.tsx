import type { WizardStepDefinition, StepStatus } from '@anvil/data';
import { cn } from '@anvil/ui';

interface Props {
  steps: WizardStepDefinition[];
  currentStepId: string;
  getStepStatus: (stepId: string) => StepStatus;
  onStepClick: (stepId: string) => void;
}

const STATUS_COLORS: Record<StepStatus, string> = {
  complete: 'text-creator-highlight hover:text-creator-highlight/80',
  incomplete: 'text-amber-400 hover:text-amber-300',
  'not-begun': 'text-creator-text-muted hover:text-creator-text',
};

export function BreadcrumbNav({ steps, currentStepId, getStepStatus, onStepClick }: Props) {
  return (
    <nav className="flex flex-wrap items-center gap-1 px-4 py-3 border-b border-creator-border bg-creator-bg">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isCurrent = step.id === currentStepId;

        return (
          <div key={step.id} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-creator-border select-none" aria-hidden>
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                'text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1',
                STATUS_COLORS[status],
                isCurrent && 'underline underline-offset-4 decoration-2'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {step.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
