import { Input } from '@anvil/ui';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function StorySceneEditor({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm text-zinc-400">
        Read-Aloud Text
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={6}
          value={(data['readAloud'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, readAloud: e.target.value })}
          placeholder="The text players will see..."
        />
      </label>

      <label className="text-sm text-zinc-400">
        Director Notes
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={4}
          value={(data['notes'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Private notes for the Director..."
        />
      </label>

      <label className="text-sm text-zinc-400">
        Asset URL
        <Input
          className="mt-1"
          value={(data['assetUrl'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, assetUrl: e.target.value })}
          placeholder="Image or handout URL"
        />
      </label>
    </div>
  );
}
