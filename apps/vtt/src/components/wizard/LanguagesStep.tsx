import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardContent, cn } from '@anvil/ui';
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {languages.map((lang) => {
          const isSelected = character.selectedLanguages.includes(lang.id);
          return (
            <Card
              key={lang.id}
              className={cn(
                'cursor-pointer bg-creator-card transition-all',
                isSelected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-highlight/60 hover:bg-creator-card-hover'
              )}
              onClick={() => toggle(lang.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={cn('font-medium text-creator-text', isSelected && 'text-creator-highlight')}>
                      {lang.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-creator-text-muted">
                      {lang.relatedTo}
                    </p>
                  </div>
                  {isSelected && <Check className="h-5 w-5 shrink-0 text-creator-highlight" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-creator-text-muted">
        {character.selectedLanguages.length} / {needed} selected
      </p>
    </div>
  );
}
