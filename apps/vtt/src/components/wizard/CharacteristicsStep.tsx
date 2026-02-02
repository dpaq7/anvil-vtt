import { WizardLogic } from '@anvil/data';
import type { CharacterInProgress, Characteristics } from '@anvil/data';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

const STAT_NAMES: (keyof Characteristics)[] = ['might', 'agility', 'reason', 'intuition', 'presence'];

export function CharacteristicsStep({ character, onChange }: Props) {
  const chars = character.characteristics ?? WizardLogic.createDefaultCharacteristics();

  const update = (name: keyof Characteristics, value: number) => {
    onChange({ characteristics: { ...chars, [name]: value } });
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Assign Characteristics</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Distribute your characteristic values across Might, Agility, Reason, Intuition, and Presence.
      </p>

      <div className="flex flex-col gap-4">
        {STAT_NAMES.map((name) => (
          <div key={name} className="flex items-center gap-4">
            <span className="w-24 text-sm capitalize text-zinc-300">{name}</span>
            <input
              type="range"
              min={-1}
              max={5}
              value={chars[name]}
              onChange={(e) => update(name, Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-8 text-center font-mono text-sm text-zinc-200">
              {chars[name] >= 0 ? `+${chars[name]}` : chars[name]}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Total: {STAT_NAMES.reduce((sum, n) => sum + chars[n], 0)}
      </p>
    </div>
  );
}
