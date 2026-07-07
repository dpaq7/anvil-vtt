import { Check, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@anvil/ui';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';
import { formatScore } from '../wizard-summary.js';

/** One tappable value from the selected array. */
export interface CharacteristicValueChip {
  value: number;
  selected: boolean;
  onSelect: () => void;
}

/** One characteristic row — locked rows carry the class-fixed value. */
export interface CharacteristicRowSpec {
  id: string;
  /** Display name, e.g. 'Might'. */
  name: string;
  /** True when the class fixes this score (no chips, lock icon). */
  locked: boolean;
  /** Current score; null before an array is chosen. */
  value: number | null;
  /** Tappable array values; empty for locked rows and before an array is chosen. */
  chips: CharacteristicValueChip[];
}

/** One selectable class array, labelled like '2, 1, -1'. */
export interface CharacteristicArrayChoice {
  key: string;
  label: string;
  selected: boolean;
  onChoose: () => void;
}

interface BuildCharacteristicsScreensArgs {
  /** False until a class is picked — becomes a single informational screen. */
  hasClass: boolean;
  /** One line naming the fixed scores and the array to distribute. */
  helper: string;
  arrays: CharacteristicArrayChoice[];
  rows: CharacteristicRowSpec[];
  /** From WizardLogic.isValidStartingCharacteristics — drives the status line. */
  isComplete: boolean;
  /** Non-null once scores exist — clears back to no array chosen. */
  onReset: (() => void) | null;
}

function valueTone(value: number): string {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-creator-text-muted';
}

/**
 * One decision screen (no sub-pagination): pick a class array, then rearrange
 * its values across the remaining characteristics via per-row chips. The
 * chips reuse desktop's assign handler, so tapping a value that is already
 * used elsewhere swaps the two stats exactly as on desktop. Rendered by
 * PhoneDecisionFlow on phone viewports only — desktop keeps
 * CharacteristicsStep's original grid layout.
 */
export function buildCharacteristicsScreens({
  hasClass,
  helper,
  arrays,
  rows,
  isComplete,
  onReset,
}: BuildCharacteristicsScreensArgs): DecisionScreenSpec[] {
  if (!hasClass) {
    return [
      {
        id: 'characteristics-no-class',
        render: () => (
          <DecisionScreen
            overline="Characteristics"
            question="No class selected"
            helper="Choose a class before assigning characteristics."
          />
        ),
      },
    ];
  }

  return [
    {
      id: 'characteristics-assign',
      render: () => (
        <DecisionScreen overline="Characteristics" question="Assign your scores" helper={helper}>
          <div className="flex min-h-11 items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
              Remaining Array
            </span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="flex min-h-11 items-center gap-1.5 rounded-lg border border-creator-border px-3 text-xs text-creator-text-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
          {arrays.map((array) => (
            <button
              key={array.key}
              type="button"
              onClick={array.onChoose}
              aria-pressed={array.selected}
              className={cn(
                'flex min-h-12 w-full items-center justify-center rounded-lg border text-base font-semibold transition-colors',
                array.selected
                  ? 'border-creator-highlight bg-creator-highlight/15 text-creator-highlight'
                  : 'border-creator-border bg-creator-card text-creator-text',
              )}
            >
              {array.label}
            </button>
          ))}
          <span className="pt-2 text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
            Your Scores
          </span>
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-creator-border bg-creator-card px-3 py-2"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-creator-text">
                {row.locked && <Lock className="h-3.5 w-3.5 text-creator-highlight" />}
                {row.name}
              </span>
              {row.chips.length > 0 ? (
                <span className="flex flex-wrap justify-end gap-1.5">
                  {row.chips.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={chip.onSelect}
                      aria-pressed={chip.selected}
                      className={cn(
                        'min-h-11 min-w-11 rounded-md border px-2 text-sm font-semibold transition-colors',
                        chip.selected
                          ? 'border-creator-highlight bg-creator-highlight/20 text-creator-highlight'
                          : 'border-creator-border bg-creator-card text-creator-text',
                      )}
                    >
                      {formatScore(chip.value)}
                    </button>
                  ))}
                </span>
              ) : (
                <span
                  className={cn(
                    'text-base font-bold',
                    row.value === null ? 'text-creator-text-muted' : valueTone(row.value),
                  )}
                >
                  {row.value === null ? '--' : formatScore(row.value)}
                </span>
              )}
            </div>
          ))}
          {isComplete ? (
            <span className="flex items-center gap-1 pt-1 text-xs text-green-400">
              <Check className="h-3.5 w-3.5" />
              Valid
            </span>
          ) : (
            <span className="pt-1 text-xs text-creator-text-muted">Choose an array</span>
          )}
        </DecisionScreen>
      ),
    },
  ];
}
