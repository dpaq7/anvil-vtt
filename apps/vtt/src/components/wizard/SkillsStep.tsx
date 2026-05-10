import { useMemo } from "react";
import {
  GameData,
  WizardLogic,
  skills as allSkillsData,
  skillGroups,
  getSkillsByGroup,
} from "@anvil/data";
import type {
  CharacterInProgress,
  SkillGroup,
  Skill,
  CultureBenefit,
} from "@anvil/data";
import { Card, CardContent, cn } from "@anvil/ui";
import { Check, Lock } from "lucide-react";

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

interface SkillSource {
  id: string;
  label: string;
  description: string;
  skillGroups: string[]; // Skill group names from culture/career
  selectedSkill: string | null;
  isGranted?: boolean;
}

const CAREER_SKILL_GROUP_NAMES = new Set([
  "crafting",
  "exploration",
  "interpersonal",
  "intrigue",
  "lore",
]);

function isCareerSkillChoice(skillName: string): boolean {
  return (
    skillName.includes("/") ||
    CAREER_SKILL_GROUP_NAMES.has(skillName.toLowerCase())
  );
}

// Parse skill groups from culture option's skills array
// e.g., ["Exploration", "Interpersonal"] or specific skills like "Navigate"
function getAvailableSkillsForSource(
  skillStrings: string[] | undefined,
): Skill[] {
  if (!skillStrings || !Array.isArray(skillStrings)) {
    return [];
  }
  const availableSkills: Skill[] = [];

  for (const str of skillStrings) {
    // Check if it's a skill group name
    const normalized = str.toLowerCase();
    if (
      ["crafting", "exploration", "interpersonal", "intrigue", "lore"].includes(
        normalized,
      )
    ) {
      availableSkills.push(...getSkillsByGroup(normalized as SkillGroup));
    } else {
      // It's a specific skill - find it
      const skill = allSkillsData.find(
        (s) => s.name.toLowerCase() === normalized || s.id === normalized,
      );
      if (skill) availableSkills.push(skill);
    }
  }

  // Remove duplicates
  return [...new Map(availableSkills.map((s) => [s.id, s])).values()];
}

export function SkillsStep({ character, onChange }: Props) {
  const granted = WizardLogic.calculateGrantedItems(character);
  const grantedSkillNames = new Set(granted.skills?.map((s) => s.name) ?? []);

  // Build the skill sources based on character's culture and career selections
  const skillSources = useMemo(() => {
    const sources: SkillSource[] = [];

    // Get culture benefits
    const environments = GameData.getCulturesByType("environment");
    const organizations = GameData.getCulturesByType("organization");
    const upbringings = GameData.getCulturesByType("upbringing");

    // Helper to get skill groups from a culture benefit
    const getSkillGroupsFromBenefit = (benefit: CultureBenefit): string[] => {
      return benefit.skills?.length
        ? benefit.skills
        : benefit.skill
          ? [benefit.skill]
          : [];
    };

    // Environment source
    if (character.culture.environment) {
      const env = environments.find(
        (e) => e.id === character.culture.environment,
      );
      if (env) {
        sources.push({
          id: "environment",
          label: `Environment: ${env.name}`,
          description: "Choose 1 skill from your environment",
          skillGroups: getSkillGroupsFromBenefit(env),
          selectedSkill: character.cultureSkills?.environment ?? null,
        });
      }
    }

    // Organization source
    if (character.culture.organization) {
      const org = organizations.find(
        (o) => o.id === character.culture.organization,
      );
      if (org) {
        sources.push({
          id: "organization",
          label: `Organization: ${org.name}`,
          description: "Choose 1 skill from your organization",
          skillGroups: getSkillGroupsFromBenefit(org),
          selectedSkill: character.cultureSkills?.organization ?? null,
        });
      }
    }

    // Upbringing source
    if (character.culture.upbringing) {
      const upb = upbringings.find(
        (u) => u.id === character.culture.upbringing,
      );
      if (upb) {
        sources.push({
          id: "upbringing",
          label: `Upbringing: ${upb.name}`,
          description: "Choose 1 skill from your upbringing",
          skillGroups: getSkillGroupsFromBenefit(upb),
          selectedSkill: character.cultureSkills?.upbringing ?? null,
        });
      }
    }

    // Career source - fixed named skills are granted; groups are player choices.
    if (character.career) {
      const career = GameData.getCareer(character.career);
      if (career) {
        const grantedCareerSkills = career.skills.filter(
          (skill) => !isCareerSkillChoice(skill),
        );

        if (grantedCareerSkills.length > 0) {
          sources.push({
            id: "career-granted",
            label: `Career: ${career.name} (Granted)`,
            description: "These skills are automatically granted",
            skillGroups: grantedCareerSkills,
            selectedSkill: grantedCareerSkills[0] ?? null,
            isGranted: true,
          });
        }

        const choiceSkills = career.skills.filter(isCareerSkillChoice);
        for (let i = 0; i < choiceSkills.length; i++) {
          const choice = choiceSkills[i]!;
          const options = choice.split("/").map((s) => s.trim());
          sources.push({
            id: `career-choice-${i}`,
            label: `Career: ${career.name} (Choice ${i + 1})`,
            description: choice.includes("/")
              ? `Choose 1 skill from: ${options.join(" or ")}`
              : `Choose 1 ${choice.toLowerCase()} skill from your career`,
            skillGroups: options,
            selectedSkill: character.careerSkillChoices?.[i] ?? null,
          });
        }
      }
    }

    return sources;
  }, [
    character.culture,
    character.career,
    character.cultureSkills,
    character.careerSkillChoices,
  ]);

  const handleSelectSkill = (sourceId: string, skillName: string) => {
    let newCultureSkills = { ...character.cultureSkills };
    const newCareerChoices = [...(character.careerSkillChoices ?? [])];

    if (sourceId === "environment") {
      newCultureSkills = { ...newCultureSkills, environment: skillName };
    } else if (sourceId === "organization") {
      newCultureSkills = { ...newCultureSkills, organization: skillName };
    } else if (sourceId === "upbringing") {
      newCultureSkills = { ...newCultureSkills, upbringing: skillName };
    } else if (sourceId.startsWith("career-choice-")) {
      const index = parseInt(sourceId.replace("career-choice-", ""), 10);
      newCareerChoices[index] = skillName;
    }

    const nextCharacter = {
      ...character,
      cultureSkills: newCultureSkills,
      careerSkillChoices: newCareerChoices,
    };

    onChange({
      cultureSkills: newCultureSkills,
      careerSkillChoices: newCareerChoices,
      selectedSkills: WizardLogic.getSelectedSkillNames(nextCharacter),
    });
  };

  // Count total selections needed vs made
  const selectableSources = skillSources.filter((s) => !s.isGranted);
  const selectionsComplete = selectableSources.filter(
    (s) => s.selectedSkill,
  ).length;
  const selectionsNeeded = selectableSources.length;

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="mb-1 text-lg font-semibold">Select Skills</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Your skills come from your culture and career. Select one skill from
          each source below.
        </p>
      </div>

      <div className="space-y-6">
        {skillSources.map((source) => {
          const availableSkills = getAvailableSkillsForSource(
            source.skillGroups,
          );

          // Group skills by their category for display
          const skillsByGroup = availableSkills.reduce(
            (acc, skill) => {
              const group = skill.group;
              if (!acc[group]) acc[group] = [];
              acc[group].push(skill);
              return acc;
            },
            {} as Record<SkillGroup, Skill[]>,
          );

          return (
            <Card key={source.id} className="border-zinc-700 bg-zinc-900/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-zinc-200">
                      {source.label}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {source.description}
                    </p>
                  </div>
                  {source.isGranted && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Lock className="h-3 w-3" />
                      Granted
                    </span>
                  )}
                </div>

                {Object.entries(skillsByGroup).map(([group, groupSkills]) => (
                  <div key={group} className="mb-3 last:mb-0">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                      {skillGroups[group as SkillGroup]?.name ?? group}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupSkills.map((skill) => {
                        const isSelected = source.selectedSkill === skill.name;
                        const isAlreadyTaken =
                          !isSelected &&
                          (grantedSkillNames.has(skill.name) ||
                            skillSources.some(
                              (s) =>
                                s.id !== source.id &&
                                s.selectedSkill === skill.name,
                            ));

                        return (
                          <button
                            key={skill.id}
                            className={cn(
                              "rounded-md border px-3 py-1.5 text-sm transition-all flex items-center gap-1.5",
                              source.isGranted
                                ? "border-green-700 bg-green-900/20 text-green-400 cursor-default"
                                : isSelected
                                  ? "border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20 text-creator-highlight"
                                  : isAlreadyTaken
                                    ? "border-creator-border/50 text-creator-text-muted/50 cursor-not-allowed"
                                    : "border-creator-border text-creator-text hover:border-creator-text-muted hover:bg-creator-card-hover",
                            )}
                            onClick={() =>
                              !source.isGranted &&
                              !isAlreadyTaken &&
                              handleSelectSkill(source.id, skill.name)
                            }
                            disabled={source.isGranted || isAlreadyTaken}
                            title={
                              isAlreadyTaken
                                ? "Already selected from another source"
                                : skill.description
                            }
                          >
                            {skill.name}
                            {(isSelected || source.isGranted) && (
                              <Check
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isSelected &&
                                    !source.isGranted &&
                                    "text-creator-highlight",
                                )}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {skillSources.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            Select your culture and career first to see available skills.
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-zinc-800 pt-3">
        <p className="text-xs text-zinc-500">
          {selectionsComplete} / {selectionsNeeded} skill selections complete
        </p>
      </div>
    </div>
  );
}
