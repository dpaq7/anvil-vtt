import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function AncestryStep({ character, onChange }: Props) {
  const ancestries = GameData.getAllAncestries();

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Your Ancestry</h2>
      <p className="mb-4 text-sm text-zinc-400">Your ancestry determines your size, speed, and unique traits.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ancestries.map((a) => {
          const selected = character.ancestry === a.id;
          return (
            <Card
              key={a.id}
              className={`cursor-pointer transition ${selected ? 'border-blue-500 bg-zinc-800/50' : 'hover:border-zinc-600'}`}
              onClick={() => onChange({ ancestry: a.id, ancestryTraits: [] })}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base">{a.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-zinc-400">Size: {a.size} · Speed: {a.speed}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
