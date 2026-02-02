import { Input } from '@anvil/ui';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function NegotiationSceneEditor({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm text-zinc-400">
        NPC Name
        <Input
          className="mt-1"
          value={(data['npcName'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, npcName: e.target.value })}
          placeholder="Who the heroes are negotiating with"
        />
      </label>

      <label className="text-sm text-zinc-400">
        NPC Portrait URL
        <Input
          className="mt-1"
          value={(data['npcPortraitUrl'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, npcPortraitUrl: e.target.value })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Starting Interest (0-5)
        <Input
          className="mt-1"
          type="number"
          min={0}
          max={5}
          value={(data['startingInterest'] as number) ?? 2}
          onChange={(e) => onChange({ ...data, startingInterest: Number(e.target.value) })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Starting Patience
        <Input
          className="mt-1"
          type="number"
          min={1}
          value={(data['startingPatience'] as number) ?? 5}
          onChange={(e) => onChange({ ...data, startingPatience: Number(e.target.value) })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Motivations (one per line)
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={3}
          value={(data['motivations'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, motivations: e.target.value })}
          placeholder="Wants to protect their family&#10;Desires gold above all"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Pitfalls (one per line)
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={3}
          value={(data['pitfalls'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, pitfalls: e.target.value })}
          placeholder="Mentioning the war&#10;Insulting their honor"
        />
      </label>
    </div>
  );
}
