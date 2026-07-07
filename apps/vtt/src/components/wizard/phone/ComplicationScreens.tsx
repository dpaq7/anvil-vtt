import type { ReactNode } from 'react';
import { Input } from '@anvil/ui';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

interface BuildComplicationScreensArgs {
  /**
   * Renders the step's SplitViewSelector over the search-filtered list. Its
   * phone mode already provides single-column cards plus a peek sheet with
   * the Select button, so that sheet is the info mechanism — this screen
   * adds no step-level peek.
   */
  renderComplicationSelector: () => ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** True while the character has a complication — shows the remove row. */
  hasSelection: boolean;
  /** Clears the pick, mirroring desktop's Clear Selection button. */
  onClear: () => void;
  /** Advances to the next wizard step — the decision is optional. */
  onSkip: () => void;
}

/**
 * Single optional decision screen picking a complication; "Skip for now"
 * advances without choosing (it never clears an existing pick — the remove
 * row is the clearing affordance). Rendered by PhoneDecisionFlow on phone
 * viewports only — desktop keeps ComplicationStep's original split view.
 */
export function buildComplicationScreens({
  renderComplicationSelector,
  searchValue,
  onSearchChange,
  hasSelection,
  onClear,
  onSkip,
}: BuildComplicationScreensArgs): DecisionScreenSpec[] {
  return [
    {
      id: 'complication-pick',
      render: () => (
        <DecisionScreen
          overline='Complication'
          question='Add a complication?'
          helper='Optional — pick one below, or skip.'
          onSkip={onSkip}
        >
          <Input
            className='min-h-11'
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search complications...'
          />
          {hasSelection && (
            <button
              type='button'
              onClick={onClear}
              className='min-h-11 rounded-lg border border-creator-border text-sm text-creator-text-muted'
            >
              Remove complication
            </button>
          )}
          {renderComplicationSelector()}
        </DecisionScreen>
      ),
    },
  ];
}
