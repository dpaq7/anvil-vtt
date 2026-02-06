import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, Input, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function CareerStep({ character, onChange }: Props) {
  const careers = GameData.getAllCareers();

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your Career</h2>
      <p className="mb-4 text-sm text-zinc-400">Your career reflects what you did before becoming a hero.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {careers.map((c) => {
          const selected = character.career === c.id;
          return (
            <Card
              key={c.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                selected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => onChange({ career: c.id })}
            >
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                    {c.name}
                  </CardTitle>
                  {selected && <Check className="h-5 w-5 text-creator-highlight shrink-0" />}
                </div>
              </CardHeader>
              {c.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-creator-text-muted">{c.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {character.career && (
        <div className="mt-6">
          <label className="text-sm text-zinc-400">
            Inciting Incident
            <Input
              className="mt-1"
              value={character.incitingIncident ?? ''}
              onChange={(e) => onChange({ incitingIncident: e.target.value })}
              placeholder="What drove you to become a hero?"
            />
          </label>
        </div>
      )}
    </div>
  );
}
