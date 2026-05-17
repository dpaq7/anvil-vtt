import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function ClassStep({ character, onChange }: Props) {
  const classes = GameData.getAllClasses();

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your Class</h2>
      <p className="mb-4 text-sm text-zinc-400">Your class defines your role in combat and your heroic abilities.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {classes.map((cls) => {
          const selected = character.heroClass === cls.id;
          return (
            <Card
              key={cls.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                selected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() =>
                onChange({
                  heroClass: cls.id as CharacterInProgress['heroClass'],
                  subclass: null,
                  companion: null,
                  classSkillChoices: [],
                  abilityChoices: {},
                  selectedAbilities: [],
                  selectedPerks: [],
                })
              }
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                    {cls.name}
                  </CardTitle>
                  {selected && <Check className="h-5 w-5 text-creator-highlight shrink-0" />}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {cls.description && <p className="text-sm text-creator-text-muted">{cls.description}</p>}
                {cls.role && (
                  <p className="mt-1 text-xs text-creator-text-muted/70">Role: {cls.role}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
