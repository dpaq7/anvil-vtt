import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { cn } from '@anvil/ui';
import { Check } from 'lucide-react';

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
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm transition-all flex items-center gap-1.5',
                isSelected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20 text-creator-highlight'
                  : 'border-creator-border text-creator-text hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => toggle(lang.id)}
            >
              {lang.name}
              {isSelected && <Check className="h-3.5 w-3.5 text-creator-highlight" />}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-creator-text-muted">
        {character.selectedLanguages.length} / {needed} selected
      </p>
    </div>
  );
}
