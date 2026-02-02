import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function LanguagesStep({ character, onChange }: Props) {
  const languages = GameData.getSelectableLanguages();
  const needed = WizardLogic.getLanguageSelectionsNeeded(character);

  const toggle = (id: string) => {
    const current = character.selectedLanguages;
    if (current.includes(id)) {
      onChange({ selectedLanguages: current.filter((l) => l !== id) });
    } else if (current.length < needed) {
      onChange({ selectedLanguages: [...current, id] });
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Select Languages</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Choose {needed} language{needed !== 1 ? 's' : ''}.
      </p>

      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => {
          const isSelected = character.selectedLanguages.includes(lang.id);
          return (
            <button
              key={lang.id}
              className={`rounded-md border px-3 py-1.5 text-sm transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                  : 'border-zinc-700 text-zinc-300 hover:border-zinc-600'
              }`}
              onClick={() => toggle(lang.id)}
            >
              {lang.name}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {character.selectedLanguages.length} / {needed} selected
      </p>
    </div>
  );
}
