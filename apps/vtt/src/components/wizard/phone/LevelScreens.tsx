import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of level data the phone screen needs. */
export interface LevelChoice {
  level: number;
  /** Echelon number (1-4) from HeroLogic.getEchelon. */
  echelon: number;
  /** Echelon display name (Adventurer, Veteran, Master, Legend). */
  echelonName: string;
}

interface BuildLevelScreensArgs {
  levels: LevelChoice[];
  selectedLevel: number;
  onSelectLevel: (level: number) => void;
}

/**
 * Single decision screen picking the hero's starting level. Selecting a level
 * regenerates the wizard's step list (level-up steps appear for levels 2+),
 * but this stays the one-screen 'level' step, so the phone flow's sub-step
 * registration is unaffected. Rendered by PhoneDecisionFlow on phone
 * viewports only — desktop keeps LevelSelectStep's original echelon grid.
 */
export function buildLevelScreens({
  levels,
  selectedLevel,
  onSelectLevel,
}: BuildLevelScreensArgs): DecisionScreenSpec[] {
  // Mirrors desktop's "Level X Selected" callout: levels above 1 append
  // level-up steps after base creation.
  const levelUpSteps = selectedLevel - 1;
  const helper =
    levelUpSteps > 0
      ? `You'll complete ${levelUpSteps} level-up ${levelUpSteps === 1 ? 'step' : 'steps'} after base creation.`
      : 'Higher levels add level-up steps after base creation.';

  return [
    {
      id: 'level-pick',
      render: () => (
        <DecisionScreen overline="Level" question="What level is this hero?" helper={helper}>
          {levels.map(({ level, echelon, echelonName }) => (
            <ChoiceRow
              key={level}
              title={`Level ${level}`}
              summary={`${echelonName} · Echelon ${echelon}`}
              selected={level === selectedLevel}
              onSelect={() => onSelectLevel(level)}
            />
          ))}
        </DecisionScreen>
      ),
    },
  ];
}
