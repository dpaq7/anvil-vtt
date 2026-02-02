import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, Input } from '@anvil/ui';

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
              className={`cursor-pointer transition ${selected ? 'border-blue-500 bg-zinc-800/50' : 'hover:border-zinc-600'}`}
              onClick={() => onChange({ career: c.id })}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base">{c.name}</CardTitle>
              </CardHeader>
              {c.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-zinc-400">{c.description}</p>
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
