import { Input } from '@anvil/ui';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function MontageSceneEditor({ data, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm text-zinc-400">
        Goal
        <Input
          className="mt-1"
          value={(data['goal'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, goal: e.target.value })}
          placeholder="What the heroes are trying to accomplish"
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
        </select>
      </label>

      <label className="text-sm text-zinc-400">
        Successes Needed
        <Input
          className="mt-1"
          type="number"
          value={(data['successesNeeded'] as number) ?? 3}
          onChange={(e) => onChange({ ...data, successesNeeded: Number(e.target.value) })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Failure Limit
        <Input
          className="mt-1"
          type="number"
          value={(data['failureLimit'] as number) ?? 3}
          onChange={(e) => onChange({ ...data, failureLimit: Number(e.target.value) })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Challenges (one per line)
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={4}
          value={(data['challenges'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, challenges: e.target.value })}
          placeholder="Navigate the treacherous mountain path&#10;Find shelter from the storm"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Success Outcome
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={2}
          value={(data['successOutcome'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, successOutcome: e.target.value })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Failure Outcome
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={2}
          value={(data['failureOutcome'] as string) ?? ''}
          onChange={(e) => onChange({ ...data, failureOutcome: e.target.value })}
        />
      </label>
    </div>
  );
}
