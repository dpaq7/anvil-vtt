import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';

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
              className={`cursor-pointer transition ${selected ? 'border-blue-500 bg-zinc-800/50' : 'hover:border-zinc-600'}`}
              onClick={() => onChange({ kit: k.id })}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base">{k.name}</CardTitle>
              </CardHeader>
              {k.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-zinc-400">{k.description}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
