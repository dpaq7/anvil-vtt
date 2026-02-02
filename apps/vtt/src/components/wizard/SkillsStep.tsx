import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function SkillsStep({ character, onChange }: Props) {
  const allSkills = GameData.getAllSkills();
  const granted = WizardLogic.calculateGrantedItems(character);
  const grantedSkillNames = new Set(granted.skills?.map((s) => s.name) ?? []);
  const needed = WizardLogic.getSkillSelectionsNeeded(character);

  const toggle = (name: string) => {
    if (grantedSkillNames.has(name)) return;
    const current = character.selectedSkills;
    if (current.includes(name)) {
      onChange({ selectedSkills: current.filter((s) => s !== name) });
    } else if (current.length < needed) {
      onChange({ selectedSkills: [...current, name] });
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Select Skills</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Choose {needed} additional skill{needed !== 1 ? 's' : ''}. Granted skills are shown but cannot be removed.
      </p>

      <div className="flex flex-wrap gap-2">
        {allSkills.map((skill) => {
          const isGranted = grantedSkillNames.has(skill.name);
          const isSelected = character.selectedSkills.includes(skill.name);
          return (
            <button
              key={skill.name}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                isGranted
                  ? 'border-green-700 bg-green-900/20 text-green-400'
                  : isSelected
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
              onClick={() => toggle(skill.name)}
              disabled={isGranted}
            >
              {skill.name}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {character.selectedSkills.length} / {needed} selected
      </p>
    </div>
  );
}
