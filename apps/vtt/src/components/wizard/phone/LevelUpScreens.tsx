import { CheckCircle2 } from 'lucide-react';
import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** One feature gained automatically at this level. */
export interface LevelUpGrantedFeature {
  id: string;
  name: string;
  description: string;
}

/** One selectable option within a choice feature. */
export interface LevelUpChoiceOption {
  id: string;
  name: string;
  description: string;
}

/** One feature that requires picking a single option. */
export interface LevelUpChoiceFeature {
  id: string;
  name: string;
  description: string;
  /** Forwarded to setLevelUpChoice so downstream logic can group choices. */
  category?: string;
  options: LevelUpChoiceOption[];
  selectedOptionId: string | null;
}

interface BuildLevelUpScreensArgs {
  level: number;
  granted: LevelUpGrantedFeature[];
  choices: LevelUpChoiceFeature[];
  onSelectOption: (feature: LevelUpChoiceFeature, option: LevelUpChoiceOption) => void;
  onPeekOption: (option: LevelUpChoiceOption) => void;
}

/**
 * One decision screen for a single level-up step (the wizard already gives
 * each level 2..N its own macro step, so this never sub-paginates). Granted
 * features render as non-interactive rows; each choice feature gets its own
 * group heading with one ChoiceRow per option, all through the step's
 * existing setLevelUpChoice path. Rendered by PhoneDecisionFlow on phone
 * viewports only — desktop keeps LevelUpStep's original card grid.
 */
export function buildLevelUpScreens({
  level,
  granted,
  choices,
  onSelectOption,
  onPeekOption,
}: BuildLevelUpScreensArgs): DecisionScreenSpec[] {
  if (granted.length === 0 && choices.length === 0) {
    return [
      {
        id: `level-up-${level}-empty`,
        render: () => (
          <DecisionScreen
            overline="Level up"
            question={`Level ${level}`}
            helper={`No level-up features available for level ${level}.`}
          />
        ),
      },
    ];
  }

  const hasChoices = choices.length > 0;

  return [
    {
      id: `level-up-${level}`,
      render: () => (
        <DecisionScreen
          overline="Level up"
          question={hasChoices ? `Choose your level ${level} features` : `Level ${level} gains`}
          helper={
            hasChoices
              ? granted.length > 0
                ? 'Granted features are automatic — pick one option for each choice.'
                : 'Pick one option for each choice.'
              : 'These features are gained automatically.'
          }
        >
          {granted.length > 0 && (
            <section className="flex flex-col gap-2">
              {hasChoices && (
                <h3 className="text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
                  Granted
                </h3>
              )}
              {granted.map((feature) => (
                <div
                  key={feature.id}
                  className="flex min-h-11 w-full items-start gap-2.5 rounded-lg border border-creator-border bg-creator-card px-3 py-2.5"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-creator-highlight" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-creator-text">
                      {feature.name}
                    </span>
                    <span className="block whitespace-pre-wrap text-xs text-creator-text-muted">
                      {feature.description}
                    </span>
                  </span>
                </div>
              ))}
            </section>
          )}
          {choices.map((feature) => (
            <section key={feature.id} className="flex flex-col gap-2 pt-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
                  {feature.name}
                </h3>
                <p className="mt-0.5 text-xs text-creator-text-muted">{feature.description}</p>
              </div>
              {feature.options.map((option) => (
                <ChoiceRow
                  key={option.id}
                  title={option.name}
                  summary={option.description || undefined}
                  selected={feature.selectedOptionId === option.id}
                  onSelect={() => onSelectOption(feature, option)}
                  onInfo={option.description ? () => onPeekOption(option) : undefined}
                />
              ))}
            </section>
          ))}
        </DecisionScreen>
      ),
    },
  ];
}
