import { skillGroups } from '@anvil/data';
import type { Skill } from '@anvil/data';
import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of SkillsStep's SkillSource that the phone screens need. */
export interface SkillChoiceSource {
  id: string;
  label: string;
  description: string;
  skillGroups: string[];
  selectedSkill: string | null;
}

interface BuildSkillsScreensArgs {
  /** Sources the player actually picks from; granted sources are skipped on phone. */
  selectableSources: SkillChoiceSource[];
  /** Every source (granted included) — used to grey out skills taken elsewhere. */
  allSources: SkillChoiceSource[];
  grantedSkillNames: ReadonlySet<string>;
  getAvailableSkills: (skillGroups: string[]) => Skill[];
  onSelectSkill: (sourceId: string, skillName: string) => void;
  onPeekSkill: (skill: Skill) => void;
}

/**
 * One decision screen per selectable skill source. Rendered by PhoneDecisionFlow
 * on phone viewports only — desktop keeps SkillsStep's original layout.
 */
export function buildSkillsScreens({
  selectableSources,
  allSources,
  grantedSkillNames,
  getAvailableSkills,
  onSelectSkill,
  onPeekSkill,
}: BuildSkillsScreensArgs): DecisionScreenSpec[] {
  if (selectableSources.length === 0) {
    const grantedOnly = allSources.length > 0;
    return [
      {
        id: 'skills-none',
        render: () => (
          <DecisionScreen
            overline="Skills"
            question={grantedOnly ? 'No skill choices to make' : 'No skills to pick yet'}
            helper={
              grantedOnly
                ? 'All of your skills are granted automatically. Continue to move on.'
                : 'Select your culture and career first to see available skills.'
            }
          />
        ),
      },
    ];
  }

  return selectableSources.map((source, index) => ({
    id: source.id,
    render: () => (
      <DecisionScreen
        overline={`Skills · ${index + 1} of ${selectableSources.length} — ${source.label}`}
        question="Pick a skill"
        helper={source.description}
      >
        {getAvailableSkills(source.skillGroups).map((skill) => {
          const isSelected = source.selectedSkill === skill.name;
          const isAlreadyTaken =
            !isSelected &&
            (grantedSkillNames.has(skill.name) ||
              allSources.some(
                (s) => s.id !== source.id && s.selectedSkill === skill.name,
              ));

          return (
            <ChoiceRow
              key={skill.id}
              title={skill.name}
              summary={skillGroups[skill.group]?.name ?? skill.group}
              selected={isSelected}
              disabled={isAlreadyTaken}
              onSelect={() => onSelectSkill(source.id, skill.name)}
              onInfo={() => onPeekSkill(skill)}
            />
          );
        })}
      </DecisionScreen>
    ),
  }));
}
