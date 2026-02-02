interface NegotiationStageProps {
  npcName: string;
  interest: number;
  targetInterest: number;
  patience: number;
  maxPatience: number;
  phase: string;
  motivations: { type: string; description: string }[];
  arguments: { hero: string; skill: string; tier: number; result: string }[];
  isDirector: boolean;
  pitfalls?: { description: string; revealed: boolean }[];
}

export function NegotiationStage({
  npcName,
  interest,
  targetInterest,
  patience,
  maxPatience,
  phase,
  motivations,
  arguments: args,
  isDirector,
  pitfalls,
}: NegotiationStageProps) {
  const interestPct = targetInterest > 0 ? (interest / targetInterest) * 100 : 0;
  const patiencePct = maxPatience > 0 ? (patience / maxPatience) * 100 : 0;

  return (
    <div className="flex h-full flex-col gap-6 p-8">
      {/* NPC */}
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-2xl">
          {npcName[0]?.toUpperCase() ?? '?'}
        </div>
        <p className="text-lg font-medium text-zinc-100">{npcName}</p>
        {phase !== 'active' && (
          <span className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
            phase === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {phase.toUpperCase()}
          </span>
        )}
      </div>

      {/* Meters */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        {/* Interest */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-purple-400">Interest</span>
            <span className="text-zinc-400">{interest} / {targetInterest}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, interestPct)}%` }}
            />
          </div>
        </div>

        {/* Patience */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-amber-400">Patience</span>
            <span className="text-zinc-400">{patience} / {maxPatience}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, patiencePct)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl gap-6">
        {/* Motivations */}
        <div className="flex-1">
          <p className="mb-2 text-sm font-medium text-zinc-300">Motivations</p>
          <div className="flex flex-col gap-1">
            {motivations.map((m, i) => (
              <div key={i} className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300">
                <span className="font-medium text-purple-400">{m.type}</span>: {m.description}
              </div>
            ))}
            {motivations.length === 0 && <p className="text-xs text-zinc-500">None revealed</p>}
          </div>
        </div>

        {/* Pitfalls (director only) */}
        {isDirector && pitfalls && (
          <div className="flex-1">
            <p className="mb-2 text-sm font-medium text-zinc-300">Pitfalls</p>
            <div className="flex flex-col gap-1">
              {pitfalls.map((p, i) => (
                <div key={i} className="rounded bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                  {p.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Argument log */}
      {args.length > 0 && (
        <div className="mx-auto w-full max-w-2xl">
          <p className="mb-2 text-sm font-medium text-zinc-300">Arguments</p>
          <div className="flex flex-col gap-1">
            {args.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded bg-zinc-800 px-3 py-1.5 text-xs">
                <span className="font-medium text-zinc-200">{a.hero}</span>
                <span className="text-zinc-500">used</span>
                <span className="text-zinc-300">{a.skill}</span>
                <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  a.tier >= 3 ? 'bg-emerald-500/20 text-emerald-400' :
                  a.tier >= 2 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  T{a.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
