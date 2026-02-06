import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function KitStep({ character, onChange }: Props) {
  const kits = GameData.getAllKits();

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your Kit</h2>
      <p className="mb-4 text-sm text-zinc-400">Your kit provides equipment and combat bonuses.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kits.map((k) => {
          const selected = character.kit === k.id;
          return (
            <Card
              key={k.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                selected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => onChange({ kit: k.id })}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                    {k.name}
                  </CardTitle>
                  {selected && <Check className="h-5 w-5 text-creator-highlight shrink-0" />}
                </div>
              </CardHeader>
              {k.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-creator-text-muted">{k.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
