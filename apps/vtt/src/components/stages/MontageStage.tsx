interface MontageStageProps {
  goal: string;
  currentSuccesses: number;
  successLimit: number;
  currentFailures: number;
  failureLimit: number;
  outcome: string;
  challenges: { id: string; name: string; completed: boolean }[];
  isDirector: boolean;
}

export function MontageStage({
  goal,
  currentSuccesses,
  successLimit,
  currentFailures,
  failureLimit,
  outcome,
  challenges,
  isDirector,
}: MontageStageProps) {
  const successPct = successLimit > 0 ? (currentSuccesses / successLimit) * 100 : 0;
  const failurePct = failureLimit > 0 ? (currentFailures / failureLimit) * 100 : 0;

  return (
    <div className="flex h-full flex-col gap-6 p-8">
      {/* Goal */}
      <div className="text-center">
        <p className="text-xs uppercase text-zinc-500">Montage Goal</p>
        <p className="text-lg font-medium text-zinc-100">{goal || 'No goal set'}</p>
      </div>

      {/* Progress bars */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        {/* Successes */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-emerald-400">Successes</span>
            <span className="text-zinc-400">{currentSuccesses} / {successLimit}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, successPct)}%` }}
            />
          </div>
        </div>

        {/* Failures */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-red-400">Failures</span>
            <span className="text-zinc-400">{currentFailures} / {failureLimit}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${Math.min(100, failurePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Outcome */}
      {outcome !== 'pending' && (
        <div className="text-center">
          <span className={`rounded px-3 py-1 text-sm font-medium ${
            outcome === 'total_success' ? 'bg-emerald-500/20 text-emerald-400' :
            outcome === 'partial_success' ? 'bg-amber-500/20 text-amber-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {outcome.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      {/* Challenge cards */}
      {challenges.length > 0 && (
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-2 text-sm font-medium text-zinc-300">Challenges</p>
          <div className="grid grid-cols-2 gap-2">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`rounded border px-3 py-2 text-sm ${
                  c.completed
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                }`}
              >
                {c.name}
                {c.completed && <span className="ml-1 text-emerald-400">&check;</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
