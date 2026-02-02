interface RespiteActivity {
  heroName: string;
  activityType: string;
  completed: boolean;
}

interface RespiteStageProps {
  location: string;
  activities: RespiteActivity[];
  projects: { id: string; name: string; currentPoints: number; goalPoints: number }[];
  completed: boolean;
  isDirector: boolean;
}

const ACTIVITY_LABELS: Record<string, string> = {
  recover: 'Recover',
  craft: 'Craft',
  research: 'Research',
  socialize: 'Socialize',
  change_kit: 'Change Kit',
  project: 'Project',
  custom: 'Custom',
};

export function RespiteStage({
  location,
  activities,
  projects,
  completed,
  isDirector,
}: RespiteStageProps) {
  const completedCount = activities.filter((a) => a.completed).length;

  return (
    <div className="flex h-full flex-col gap-6 p-8">
      {/* Location */}
      <div className="text-center">
        <p className="text-xs uppercase text-zinc-500">Respite at</p>
        <p className="text-lg font-medium text-zinc-100">{location || 'Unknown Location'}</p>
        {completed && (
          <span className="mt-1 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
            COMPLETED
          </span>
        )}
      </div>

      {/* Activity cards */}
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">Activities</p>
          <span className="text-xs text-zinc-500">{completedCount}/{activities.length} done</span>
        </div>
        <div className="flex flex-col gap-2">
          {activities.map((a, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded border px-4 py-3 ${
                a.completed
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-zinc-700 bg-zinc-800'
              }`}
            >
              <div>
                <p className="text-sm text-zinc-200">{a.heroName}</p>
                <p className="text-xs text-zinc-500">
                  {ACTIVITY_LABELS[a.activityType] ?? a.activityType}
                </p>
              </div>
              {a.completed && <span className="text-emerald-400">&check;</span>}
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-sm text-zinc-500">No activities assigned yet.</p>
          )}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-2 text-sm font-medium text-zinc-300">Projects</p>
          <div className="flex flex-col gap-2">
            {projects.map((p) => {
              const pct = p.goalPoints > 0 ? (p.currentPoints / p.goalPoints) * 100 : 0;
              return (
                <div key={p.id} className="rounded border border-zinc-700 bg-zinc-800 px-4 py-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-zinc-300">{p.name}</span>
                    <span className="text-zinc-500">{p.currentPoints}/{p.goalPoints}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
