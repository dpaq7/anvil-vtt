import type { ReactNode } from 'react';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** One resolved summary line; null renders as a muted em dash. */
export interface ReviewField {
  label: string;
  value: string | null;
}

interface BuildReviewScreensArgs {
  complete: boolean;
  /** WizardLogic.getWizardProgress — % shown while incomplete. */
  progress: number;
  /** Desktop's "Missing: …" line, reused verbatim while incomplete. */
  missingText: string | null;
  identity: ReviewField[];
  stats: ReviewField[];
  /** Compact characteristics line (e.g. "M2 A1 R1 I0 P-1"). */
  characteristics: string | null;
  selections: ReviewField[];
}

// Plain render helpers (not components) so this builder module keeps a
// single function export and stays react-refresh clean.
function renderFieldRow(field: ReviewField): ReactNode {
  return (
    <div key={field.label} className="flex min-h-11 items-center justify-between gap-3 py-1.5">
      <span className="shrink-0 text-sm text-creator-text-muted">{field.label}</span>
      <span className="min-w-0 break-words text-right text-sm font-medium text-creator-text">
        {field.value ?? <span className="text-creator-border">—</span>}
      </span>
    </div>
  );
}

function renderSection(title: string, children: ReactNode): ReactNode {
  return (
    <section className="flex flex-col gap-1 pt-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
        {title}
      </h3>
      <div className="divide-y divide-creator-border/60 rounded-lg border border-creator-border bg-creator-card px-3">
        {children}
      </div>
    </section>
  );
}

/**
 * Single summary screen — with the sidebar hidden on phone, this is the
 * player's first full picture of their hero. Purely presentational: the
 * step resolves every name (via resolveWizardSummary and its own lookups)
 * and passes plain strings; incomplete fields arrive as null and render as
 * muted dashes. The footer's Create Hero button owns the completion gate.
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * ReviewStep's original WizardPreview card.
 */
export function buildReviewScreens({
  complete,
  progress,
  missingText,
  identity,
  stats,
  characteristics,
  selections,
}: BuildReviewScreensArgs): DecisionScreenSpec[] {
  return [
    {
      id: 'review-summary',
      render: () => (
        <DecisionScreen
          overline="Review"
          question="Ready to forge?"
          helper={
            complete
              ? 'Everything is in place — Create Hero below makes it official.'
              : `Your hero is ${progress}% complete — dashes below mark what's missing.`
          }
        >
          {!complete && missingText && (
            <p className="text-sm font-medium text-creator-highlight">{missingText}</p>
          )}
          {renderSection('Identity', identity.map(renderFieldRow))}
          {renderSection('Stats', stats.map(renderFieldRow))}
          {renderSection(
            'Characteristics',
            <div className="py-2.5 font-mono text-sm text-creator-text">
              {characteristics ?? <span className="text-creator-border">—</span>}
            </div>,
          )}
          {renderSection(
            'Selections',
            selections.map((field) => (
              <div key={field.label} className="py-2.5">
                <span className="text-sm text-creator-text-muted">{field.label}</span>
                {field.value ? (
                  <p className="mt-0.5 text-sm font-medium leading-relaxed text-creator-text">
                    {field.value}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-creator-border">—</p>
                )}
              </div>
            )),
          )}
        </DecisionScreen>
      ),
    },
  ];
}
