import { GameData } from '@anvil/data';
import type { CharacterInProgress, HeroLogic as HeroLogicTypes } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

function getFeatureId(feature: { name: string; metadata: { scc: string[] } }): string {
  return feature.metadata.scc[0] ?? feature.name;
}

export function AbilitiesStep({ character, onChange }: Props) {
  if (!character.heroClass) {
    return <p className="text-zinc-500">Select a class first.</p>;
  }

  const abilities = GameData.getAbilitiesByClassAndLevel(
    character.heroClass as HeroLogicTypes.HeroClass,
    1,
  );

  const toggle = (id: string) => {
    const current = character.selectedAbilities;
    if (current.includes(id)) {
      onChange({ selectedAbilities: current.filter((a) => a !== id) });
    } else {
      onChange({ selectedAbilities: [...current, id] });
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Choose Abilities</h2>
      <p className="mb-4 text-sm text-zinc-400">Select your starting abilities.</p>

      <div className="grid grid-cols-1 gap-3">
        {abilities.map((ability) => {
          const id = getFeatureId(ability);
          const selected = character.selectedAbilities.includes(id);
          return (
            <Card
              key={id}
              className={`cursor-pointer transition ${selected ? 'border-blue-500 bg-zinc-800/50' : 'hover:border-zinc-600'}`}
              onClick={() => toggle(id)}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base">{ability.name}</CardTitle>
              </CardHeader>
              {'keywords' in ability && ability.keywords.length > 0 && (
                <CardContent className="pt-0">
                  <p className="text-xs text-zinc-500">{ability.keywords.join(', ')}</p>
                </CardContent>
              )}
            </Card>
          );
        })}

        {abilities.length === 0 && (
          <p className="text-zinc-500">No abilities available for this class at level 1.</p>
        )}
      </div>
    </div>
  );
}
