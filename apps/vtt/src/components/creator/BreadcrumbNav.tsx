import type { WizardStepDefinition, StepStatus } from "@anvil/data";
import { cn } from "@anvil/ui";
import { Check } from "lucide-react";

interface Props {
  steps: WizardStepDefinition[];
  currentStepId: string;
  getStepStatus: (stepId: string) => StepStatus;
  onStepClick: (stepId: string) => void;
}

const STATUS_COLORS: Record<StepStatus, string> = {
  complete: "text-creator-highlight hover:text-creator-highlight",
  incomplete: "text-creator-highlight/80 hover:text-creator-highlight",
  "not-begun": "text-creator-text-muted hover:text-creator-highlight",
};

export function BreadcrumbNav({
  steps,
  currentStepId,
  getStepStatus,
  onStepClick,
}: Props) {
  return (
    <nav className="flex flex-wrap items-end gap-x-1 gap-y-1 border-b border-creator-border bg-creator-bg px-4 py-2">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const isCurrent = step.id === currentStepId;
        const complete = status === "complete";

        return (
          <div key={step.id} className="flex items-end">
            {index > 0 && (
              <span
                className="mx-2 pb-1 text-creator-border select-none"
                aria-hidden
              >
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex min-h-10 flex-col items-center justify-end rounded px-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-creator-highlight",
                STATUS_COLORS[status],
                isCurrent &&
                  "underline underline-offset-4 decoration-2 decoration-creator-highlight",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className="flex h-4 items-center justify-center"
                aria-hidden
              >
                {complete ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : null}
              </span>
              <span>{step.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
