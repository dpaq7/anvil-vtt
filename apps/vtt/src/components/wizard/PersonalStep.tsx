import type { CharacterInProgress } from '@anvil/data';
import { Input } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function PersonalStep({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Personal Details</h2>

      <label className="text-sm text-zinc-400">
        Name
        <Input
          className="mt-1"
          value={character.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Your hero's name"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Pronouns
        <Input
          className="mt-1"
          value={character.pronouns}
          onChange={(e) => onChange({ pronouns: e.target.value })}
          placeholder="e.g. they/them, she/her, he/him"
        />
      </label>

      <label className="text-sm text-zinc-400">
        Backstory
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={4}
          value={character.backstory}
          onChange={(e) => onChange({ backstory: e.target.value })}
          placeholder="Your hero's story..."
        />
      </label>

      <label className="text-sm text-zinc-400">
        Appearance
        <textarea
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          rows={3}
          value={character.appearance}
          onChange={(e) => onChange({ appearance: e.target.value })}
        />
      </label>

      <label className="text-sm text-zinc-400">
        Portrait URL
        <Input
          className="mt-1"
          value={character.portraitUrl ?? ''}
          onChange={(e) => onChange({ portraitUrl: e.target.value || null })}
          placeholder="https://..."
        />
      </label>
    </div>
  );
}
