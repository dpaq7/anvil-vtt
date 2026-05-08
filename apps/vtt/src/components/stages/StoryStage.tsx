import { useEffect, useState } from 'react';
import { Button } from '@anvil/ui';

interface StoryStageProps {
  readAloudText?: string;
  directorNotes?: string;
  isDirector: boolean;
  onUpdateReadAloud?: (text: string) => void;
}

export function StoryStage({ readAloudText, directorNotes, isDirector, onUpdateReadAloud }: StoryStageProps) {
  const [draftText, setDraftText] = useState(readAloudText ?? '');

  useEffect(() => {
    setDraftText(readAloudText ?? '');
  }, [readAloudText]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 overflow-auto p-8">
      {readAloudText ? (
        <blockquote className="max-w-2xl whitespace-pre-wrap text-center text-2xl font-light italic leading-relaxed text-zinc-200">
          {readAloudText}
        </blockquote>
      ) : (
        <p className="text-zinc-500">No read-aloud text for this scene.</p>
      )}

      {isDirector && onUpdateReadAloud && (
        <div className="w-full max-w-2xl rounded border border-zinc-700 bg-zinc-900/80 p-4">
          <label className="mb-2 block text-xs font-medium uppercase text-zinc-500" htmlFor="story-read-aloud">
            Read-Aloud
          </label>
          <textarea
            id="story-read-aloud"
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={5}
            className="w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500"
          />
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={() => onUpdateReadAloud(draftText)}
              disabled={draftText === (readAloudText ?? '')}
            >
              Update
            </Button>
          </div>
        </div>
      )}

      {isDirector && directorNotes && (
        <div className="w-full max-w-2xl rounded border border-zinc-700 bg-zinc-900/80 p-4">
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Director Notes</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-400">{directorNotes}</p>
        </div>
      )}
    </div>
  );
}
