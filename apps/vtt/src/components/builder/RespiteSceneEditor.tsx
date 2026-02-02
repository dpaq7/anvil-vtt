import { Input } from '@anvil/ui';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function RespiteSceneEditor({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm text-zinc-400">
        Location Description
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={3}
          value={(data['locationDescription'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, locationDescription: e.target.value })}
          placeholder="Where the heroes are resting..."
        />
      </label>

      <label className="text-sm text-zinc-400">
        Duration
        <Input
          className="mt-1"
          value={(data['duration'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, duration: e.target.value })}
          placeholder="e.g. 'One full day', '8 hours'"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Available Activities (one per line)
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={4}
          value={(data['activities'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, activities: e.target.value })}
          placeholder="Research at the library&#10;Craft a weapon&#10;Tend to wounds"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Director Notes
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={3}
          value={(data['notes'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
        />
      </label>
    </div>
  );
}
