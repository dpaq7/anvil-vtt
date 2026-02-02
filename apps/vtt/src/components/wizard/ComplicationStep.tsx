import type { CharacterInProgress } from '@anvil/data';
import { Input } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function ComplicationStep({ character, onChange }: Props) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Complication</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Optionally add a complication that adds depth to your character. This is entirely optional.
      </p>

      <div className="flex flex-col gap-4">
        <label className="text-sm text-zinc-400">
          Complication Name
          <Input
            className="mt-1"
            value={character.complication?.name ?? ''}
            onChange={(e) =>
              onChange({
                complication: e.target.value
                  ? { id: character.complication?.id ?? crypto.randomUUID(), name: e.target.value, description: character.complication?.description }
                  : null,
              })
            }
            placeholder="e.g. Hunted, Cursed, Indebted"
          />
        </label>

        {character.complication && (
          <label className="text-sm text-zinc-400">
            Description
            <textarea
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
              rows={3}
              value={character.complication.description ?? ''}
              onChange={(e) =>
                onChange({
                  complication: { ...character.complication!, description: e.target.value },
                })
              }
              placeholder="Describe the complication..."
            />
          </label>
        )}
      </div>
    </div>
  );
}
