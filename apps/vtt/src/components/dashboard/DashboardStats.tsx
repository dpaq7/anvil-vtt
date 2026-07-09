import { cn } from '@anvil/ui';
import type { StatConfig } from './types.js';

function StatStripItem({ stat, index }: { stat: StatConfig; index: number }) {
  const Icon = stat.icon;
  const toneClass = {
    cyan: 'dashboard-tone-cyan',
    amber: 'dashboard-tone-amber',
    green: 'dashboard-tone-green',
    rose: 'dashboard-tone-rose',
  }[stat.tone];

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-800/75 bg-zinc-950/65 px-3 py-2 shadow-sm shadow-black/20 backdrop-blur-sm motion-safe:animate-pop-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-chip border', toneClass)}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="shrink-0 font-display text-lg font-semibold leading-none text-zinc-50">{stat.value}</p>
          <p className="truncate text-xs font-medium text-zinc-300">{stat.label}</p>
        </div>
        <p className="mt-0.5 truncate text-[11px] leading-none text-zinc-500">{stat.detail}</p>
      </div>
    </div>
  );
}

export function DashboardStatsRow({ stats }: { stats: StatConfig[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard stats" data-onboarding="dashboard-stats">
      {stats.map((stat, index) => (
        <StatStripItem key={stat.id} stat={stat} index={index} />
      ))}
    </div>
  );
}
