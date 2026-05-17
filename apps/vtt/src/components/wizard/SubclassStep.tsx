import { useMemo, useState } from 'react';
import { GameData, WizardLogic } from '@anvil/data';
import type { CharacterInProgress, HeroLogic as HeroLogicTypes } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, Input, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function SubclassStep({ character, onChange }: Props) {
  const [companionSearch, setCompanionSearch] = useState('');
  const companionOptions = useMemo(() => WizardLogic.getCompanionOptions(), []);
  const filteredCompanions = useMemo(() => {
    const query = companionSearch.trim().toLowerCase();
    const options = query
      ? companionOptions.filter((option) => {
          return (
            option.name.toLowerCase().includes(query) ||
            option.roles.some((role) => role.toLowerCase().includes(query)) ||
            option.ancestry?.some((ancestry) => ancestry.toLowerCase().includes(query))
          );
        })
      : companionOptions;
    return options.slice(0, 60);
  }, [companionOptions, companionSearch]);

  if (!character.heroClass) {
    return <p className="text-zinc-500">Select a class first.</p>;
  }

  const subclasses = GameData.getSubclasses(character.heroClass as HeroLogicTypes.HeroClass);
  const typeName = GameData.getSubclassTypeName(character.heroClass as HeroLogicTypes.HeroClass);
  const selectCount = GameData.getSubclassSelectCount(character.heroClass as HeroLogicTypes.HeroClass);
  const multi = selectCount > 1;

  const isSelected = (id: string) => {
    if (Array.isArray(character.subclass)) return character.subclass.includes(id);
    return character.subclass === id;
  };

  const toggle = (id: string) => {
    if (!multi) {
      onChange({ subclass: id });
      return;
    }
    const current = Array.isArray(character.subclass) ? character.subclass : [];
    if (current.includes(id)) {
      onChange({ subclass: current.filter((s) => s !== id) });
    } else if (current.length < selectCount) {
      onChange({ subclass: [...current, id] });
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your {typeName}</h2>
      <p className="mb-4 text-sm text-zinc-400">
        {multi ? `Select ${selectCount} options.` : `Select one ${typeName.toLowerCase()}.`}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {subclasses.map((sc) => {
          const selected = isSelected(sc.id);
          return (
            <Card
              key={sc.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                selected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => toggle(sc.id)}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                    {sc.name}
                  </CardTitle>
                  {selected && <Check className="h-5 w-5 text-creator-highlight shrink-0" />}
                </div>
              </CardHeader>
              {sc.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-creator-text-muted">{sc.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {WizardLogic.isCompanionRequired(character) && (
        <section className="mt-6 rounded-lg border border-creator-border bg-creator-card p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium text-creator-text">Choose Your Companion</h3>
              <p className="mt-1 text-sm text-creator-text-muted">
                Beasthearts choose a monster companion to fight beside them.
              </p>
            </div>
            {character.companion && (
              <span className="rounded-full border border-creator-highlight px-2 py-1 text-xs text-creator-highlight">
                Selected
              </span>
            )}
          </div>

          <Input
            className="mb-3"
            value={companionSearch}
            onChange={(event) => setCompanionSearch(event.target.value)}
            placeholder="Search monsters, roles, or ancestries..."
          />

          <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredCompanions.map((option) => {
              const selected = character.companion === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onChange({ companion: option.id })}
                  className={cn(
                    'rounded-md border px-3 py-2 text-left text-sm transition',
                    selected
                      ? 'border-creator-highlight bg-creator-highlight/20 text-creator-highlight'
                      : 'border-creator-border text-creator-text hover:border-creator-text-muted hover:bg-creator-card-hover',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{option.name}</span>
                    {selected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
                  </div>
                  <div className="mt-1 text-xs text-creator-text-muted">
                    Level {option.level} / {option.roles.join(', ')}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
