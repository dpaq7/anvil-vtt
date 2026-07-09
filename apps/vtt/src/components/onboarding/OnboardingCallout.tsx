import type { CSSProperties } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button, cn } from '@anvil/ui';
import type { OnboardingStep } from './steps.js';

interface OnboardingCalloutProps {
  step: OnboardingStep;
  stepIndex: number;
  stepCount: number;
  style: CSSProperties;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

/** Parchment tour card with dice-pip progress. Theme-stable colors. */
export function OnboardingCallout({
  step,
  stepIndex,
  stepCount,
  style,
  onBack,
  onNext,
  onSkip,
}: OnboardingCalloutProps) {
  const isFinal = stepIndex === stepCount - 1;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-onboarding-step-title"
      className="texture-parchment fixed z-[80] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-card border border-anvil-parchment-300 p-5 shadow-paper-lift motion-safe:animate-pop-in"
      style={style}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" aria-label={`Step ${stepIndex + 1} of ${stepCount}`}>
          {Array.from({ length: stepCount }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                'size-2 rounded-full transition-colors',
                index <= stepIndex ? 'bg-anvil-ember-500' : 'bg-anvil-parchment-300',
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Skip onboarding"
          onClick={onSkip}
          className="flex size-8 shrink-0 items-center justify-center rounded-chip text-anvil-ink-soft/70 transition-colors hover:bg-anvil-ink/5 hover:text-anvil-ink"
        >
          <X size={16} />
        </button>
      </div>
      <h2
        id="dashboard-onboarding-step-title"
        className="mt-3 font-display text-lg font-semibold text-anvil-ink"
      >
        {step.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-anvil-ink-soft">{step.description}</p>
      <div className="mt-5 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBack}
          disabled={stepIndex === 0}
          className="rounded-chip border-anvil-parchment-300 bg-transparent text-anvil-ink hover:bg-anvil-ink/5 hover:text-anvil-ink"
        >
          <ChevronLeft size={14} />
          Back
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onNext}
          className="rounded-chip bg-anvil-ember-500 text-white hover:bg-anvil-ember-600"
        >
          {isFinal ? (
            <>
              <CheckCircle2 size={14} />
              Start your first steps
            </>
          ) : (
            <>
              Next
              <ChevronRight size={14} />
            </>
          )}
        </Button>
      </div>
      {!isFinal && (
        <button
          type="button"
          onClick={onSkip}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-anvil-ink-soft/70 transition-colors hover:text-anvil-ink"
        >
          Skip the tour
          <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}
