import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function PerksStep({ character, onChange }: Props) {
  const perks = GameData.getAllPerks();

  const toggle = (id: string) => {
    const current = character.selectedPerks;
    if (current.includes(id)) {
      onChange({ selectedPerks: current.filter((p) => p !== id) });
    } else {
      onChange({ selectedPerks: [...current, id] });
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Select Perks</h2>
      <p className="mb-4 text-sm text-zinc-400">Choose any perks you qualify for.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {perks.map((perk) => {
          const selected = character.selectedPerks.includes(perk.id);
          return (
            <Card
              key={perk.id}
              className={`cursor-pointer transition ${selected ? 'border-blue-500 bg-zinc-800/50' : 'hover:border-zinc-600'}`}
              onClick={() => toggle(perk.id)}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base">{perk.name}</CardTitle>
              </CardHeader>
              {perk.effect && (
                <CardContent className="pt-0">
                  <p className="text-sm text-zinc-400">{perk.effect}</p>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
