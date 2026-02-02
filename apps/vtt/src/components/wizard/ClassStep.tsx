import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';

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
              className={`cursor-pointer transition ${selected ? 'border-blue-500 bg-zinc-800/50' : 'hover:border-zinc-600'}`}
              onClick={() => onChange({ heroClass: cls.id as CharacterInProgress['heroClass'], subclass: null })}
            >
              <CardHeader className="py-3">
                <CardTitle className="text-base">{cls.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {cls.description && <p className="text-sm text-zinc-400">{cls.description}</p>}
                {cls.role && (
                  <p className="mt-1 text-xs text-zinc-500">Role: {cls.role}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
