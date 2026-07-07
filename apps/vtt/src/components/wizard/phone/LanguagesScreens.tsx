import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a language definition that the phone screen needs. */
export interface LanguageChoice {
  id: string;
  name: string;
  /** Canonical "related to" line from game data. */
  relatedTo: string;
}

interface BuildLanguagesScreensArgs {
  languages: LanguageChoice[];
  /** Ids currently on the character. */
  selectedIds: string[];
  /** Total picks the career grants (WizardLogic.getLanguageSelectionsNeeded). */
  needed: number;
  /** The language every hero knows (Caelian), surfaced in the helper. */
  grantedLanguageName: string | null;
  onToggle: (id: string) => void;
  onPeek: (language: LanguageChoice) => void;
}

/**
 * Single multi-select decision screen for languages. Rows toggle through the
 * step's existing handler; once the budget is spent, unselected rows disable
 * (mirroring desktop's toggle, which ignores adds past the budget but always
 * allows deselecting). Rendered by PhoneDecisionFlow on phone viewports only
 * — desktop keeps LanguagesStep's original card grid.
 */
export function buildLanguagesScreens({
  languages,
  selectedIds,
  needed,
  grantedLanguageName,
  onToggle,
  onPeek,
}: BuildLanguagesScreensArgs): DecisionScreenSpec[] {
  const granted = grantedLanguageName ? `${grantedLanguageName} is granted.` : null;

  // No picks to make and nothing to deselect — informational screen only.
  if (needed === 0 && selectedIds.length === 0) {
    return [
      {
        id: 'languages-none',
        render: () => (
          <DecisionScreen
            overline="Languages"
            question="No language choices to make"
            helper={['Your career grants no language picks.', granted].filter(Boolean).join(' ')}
          />
        ),
      },
    ];
  }

  const remaining = Math.max(needed - selectedIds.length, 0);
  const budgetSpent = selectedIds.length >= needed;
  const helper = [
    // needed === 0 here means selections outlived the budget (e.g. after a
    // career change) — the early return above handles the no-selection case.
    needed === 0
      ? 'Your career grants no language picks — remove any you no longer need.'
      : `Choose ${needed} ${needed === 1 ? 'language' : 'languages'} · ${remaining} remaining.`,
    granted,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    {
      id: 'languages-pick',
      render: () => (
        <DecisionScreen overline="Languages" question="Pick your languages" helper={helper}>
          {languages.map((language) => {
            const isSelected = selectedIds.includes(language.id);
            return (
              <ChoiceRow
                key={language.id}
                title={language.name}
                summary={language.relatedTo}
                selected={isSelected}
                disabled={!isSelected && budgetSpent}
                onSelect={() => onToggle(language.id)}
                onInfo={() => onPeek(language)}
              />
            );
          })}
        </DecisionScreen>
      ),
    },
  ];
}
