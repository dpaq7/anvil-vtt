import { Input } from '@anvil/ui';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a selected title that the phone screen needs. */
export interface TitleEntry {
  id: string;
  name: string;
}

interface BuildTitlesScreensArgs {
  /** Titles already on the character (free-text entries, like desktop). */
  titles: TitleEntry[];
  onAddTitle: () => void;
  onRenameTitle: (index: number, name: string) => void;
  onRemoveTitle: (index: number) => void;
  /** Advances to the next wizard step — the decision is optional. */
  onSkip: () => void;
}

/**
 * Single optional decision screen for titles. Titles here are free-text
 * entries (the wizard stores { id, name } the player types, not picks from
 * the TITLES catalog), so the screen mirrors desktop's add/rename/remove
 * rows rather than a ChoiceRow list. "Skip for now" advances without adding
 * anything. Rendered by PhoneDecisionFlow on phone viewports only — desktop
 * keeps TitlesStep's original layout.
 */
export function buildTitlesScreens({
  titles,
  onAddTitle,
  onRenameTitle,
  onRemoveTitle,
  onSkip,
}: BuildTitlesScreensArgs): DecisionScreenSpec[] {
  return [
    {
      id: 'titles-add',
      render: () => (
        <DecisionScreen
          overline="Titles"
          question="Add a title?"
          helper="Optional — add any titles your character has earned."
          onSkip={onSkip}
        >
          {titles.map((title, index) => (
            <div key={title.id} className="flex items-center gap-2">
              <Input
                className="min-h-11 flex-1"
                value={title.name}
                onChange={(e) => onRenameTitle(index, e.target.value)}
                placeholder="Title name"
              />
              <button
                type="button"
                onClick={() => onRemoveTitle(index)}
                className="min-h-11 shrink-0 rounded-lg px-3 text-sm text-creator-text-muted"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={onAddTitle}
            className="min-h-11 rounded-lg border border-creator-border text-sm text-creator-text-muted"
          >
            Add title
          </button>
        </DecisionScreen>
      ),
    },
  ];
}
