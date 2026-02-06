import { GameData } from '@anvil/data';
import type { CharacterInProgress, HeroLogic as HeroLogicTypes } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function SubclassStep({ character, onChange }: Props) {
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
    </div>
  );
}
