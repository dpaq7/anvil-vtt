import type { ReactNode } from 'react';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

interface BuildComplicationScreensArgs {
  /**
   * Renders the step's SplitViewSelector. Its phone mode already provides
   * single-column cards plus a peek sheet with the Select button, so that
   * sheet is the info mechanism — this screen adds no step-level peek.
   */
  renderComplicationSelector: () => ReactNode;
  /** Advances to the next wizard step — the decision is optional. */
  onSkip: () => void;
}

/**
 * Single optional decision screen picking a complication; "Skip for now"
 * advances without choosing (it never clears an existing pick). Rendered by
 * PhoneDecisionFlow on phone viewports only — desktop keeps
 * ComplicationStep's original split view.
 */
export function buildComplicationScreens({
  renderComplicationSelector,
  onSkip,
}: BuildComplicationScreensArgs): DecisionScreenSpec[] {
  return [
    {
      id: 'complication-pick',
      render: () => (
        <DecisionScreen
          overline='Complication'
          question='Add a complication?'
          helper='Optional — a complication adds a benefit and a drawback to your backstory.'
          onSkip={onSkip}
        >
          {renderComplicationSelector()}
        </DecisionScreen>
      ),
    },
  ];
}
