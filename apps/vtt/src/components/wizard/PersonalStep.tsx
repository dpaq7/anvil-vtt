import { useState, type ChangeEvent } from 'react';
import type { CharacterInProgress } from '@anvil/data';
import { Input } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024;

export function PersonalStep({ character, onChange }: Props) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePortraitUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file.');
      return;
    }

    if (file.size > MAX_PORTRAIT_BYTES) {
      setUploadError('Choose an image under 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange({ portraitUrl: reader.result });
        setUploadError(null);
      }
    };
    reader.onerror = () => setUploadError('Could not read that image.');
    reader.readAsDataURL(file);
  };

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

      <div className="text-sm text-zinc-400">
        <label>
          Portrait URL
          <Input
            className="mt-1"
            value={character.portraitUrl ?? ''}
            onChange={(e) => onChange({ portraitUrl: e.target.value || null })}
            placeholder="https://..."
          />
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900">
            Upload image
            <input type="file" accept="image/*" className="sr-only" onChange={handlePortraitUpload} />
          </label>
          {character.portraitUrl ? (
            <button
              type="button"
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900"
              onClick={() => {
                onChange({ portraitUrl: null });
                setUploadError(null);
              }}
            >
              Clear
            </button>
          ) : null}
          {uploadError ? <span className="text-xs text-red-400">{uploadError}</span> : null}
        </div>
        {character.portraitUrl ? (
          <img
            src={character.portraitUrl}
            alt="Hero portrait preview"
            className="mt-3 h-24 w-24 rounded-md border border-zinc-700 object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
