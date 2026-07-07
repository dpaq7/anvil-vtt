import type { ReactNode } from 'react';

interface DecisionScreenProps {
  overline?: string;   // "Career · choice 1 of 2"
  question: string;    // "Pick a skill from your upbringing"
  helper?: string;     // one line max — no rules preamble
  onSkip?: () => void; // renders "Skip for now" for optional decisions
  children?: ReactNode; // omit for purely informational screens
}

export function DecisionScreen({ overline, question, helper, onSkip, children }: DecisionScreenProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {overline && (
          <p className="text-xs font-medium uppercase tracking-wider text-creator-text-muted">
            {overline}
          </p>
        )}
        <h2 className="mt-1 text-lg font-semibold text-creator-text">{question}</h2>
        {helper && <p className="mt-1 text-sm text-creator-text-muted">{helper}</p>}
      </div>
      {children != null && <div className="flex flex-col gap-2">{children}</div>}
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 rounded-lg border border-creator-border text-sm text-creator-text-muted"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
