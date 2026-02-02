import { Input } from '@anvil/ui';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function BattleSceneEditor({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm text-zinc-400">
        Map Image URL
        <Input
          className="mt-1"
          value={(data['mapUrl'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, mapUrl: e.target.value })}
          placeholder="Enter map URL or upload in assets"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Grid Size (squares)
        <Input
          className="mt-1"
          type="number"
          value={(data['gridSize'] as number) ?? 20}
          onChange={(e) => onChange({ ...data, gridSize: Number(e.target.value) })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Creature Groups (one per line)
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={4}
          value={(data['creatureGroups'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, creatureGroups: e.target.value })}
          placeholder="Goblin x3&#10;Goblin Cursespitter x1"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Difficulty
        <select
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          value={(data['difficulty'] as string) ?? 'standard'}
          onChange={(e) => onChange({ ...data, difficulty: e.target.value })}
        >
          <option value="easy">Easy</option>
          <option value="standard">Standard</option>
          <option value="hard">Hard</option>
          <option value="extreme">Extreme</option>
        </select>
      </label>

      <label className="text-sm text-zinc-400">
        Director Notes
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={3}
          value={(data['notes'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Tactical notes for the encounter..."
        />
      </label>
    </div>
  );
}
