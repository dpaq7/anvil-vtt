import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a class definition that the phone screen needs. */
export interface ClassChoice {
  id: string;
  name: string;
  /** Canonical one-liner from class data. */
  description: string;
}

interface BuildClassScreensArgs {
  classes: ClassChoice[];
  selectedClassId: string | null;
  onSelectClass: (classId: string) => void;
  onPeekClass: (classId: string) => void;
}

/**
 * Single decision screen picking the hero's class. Rendered by
 * PhoneDecisionFlow on phone viewports only — desktop keeps ClassStep's
 * original card grid.
 */
export function buildClassScreens({
  classes,
  selectedClassId,
  onSelectClass,
  onPeekClass,
}: BuildClassScreensArgs): DecisionScreenSpec[] {
  return [
    {
      id: 'class-pick',
      render: () => (
        <DecisionScreen
          overline='Class'
          question='Choose your class'
          helper='Your class defines your role in combat and your heroic abilities.'
        >
          {classes.map((cls) => (
            <ChoiceRow
              key={cls.id}
              title={cls.name}
              summary={cls.description}
              selected={selectedClassId === cls.id}
              onSelect={() => onSelectClass(cls.id)}
              onInfo={() => onPeekClass(cls.id)}
            />
          ))}
        </DecisionScreen>
      ),
    },
  ];
}
