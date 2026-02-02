interface StoryStageProps {
  readAloudText?: string;
  directorNotes?: string;
  isDirector: boolean;
}

export function StoryStage({ readAloudText, directorNotes, isDirector }: StoryStageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      {/* Read-aloud text — cinematic display */}
      {readAloudText ? (
        <blockquote className="max-w-2xl text-center text-2xl font-light italic leading-relaxed text-zinc-200">
          {readAloudText}
        </blockquote>
      ) : (
        <p className="text-zinc-500">No read-aloud text for this scene.</p>
      )}

      {/* Director notes — hidden from players */}
      {isDirector && directorNotes && (
        <div className="w-full max-w-2xl rounded border border-zinc-700 bg-zinc-900/80 p-4">
          <p className="mb-1 text-xs font-medium uppercase text-zinc-500">Director Notes</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-400">{directorNotes}</p>
        </div>
      )}
    </div>
  );
}
