import { Loader2, type LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  detail,
  action,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 px-6 py-8 text-center">
      <Icon className="mb-3 size-8 text-zinc-600" />
      <p className="text-sm font-semibold text-zinc-200">{title}</p>
      {detail && <p className="mt-1 max-w-xs text-xs text-zinc-500">{detail}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingPanel() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-zinc-500" />
    </div>
  );
}

export function SectionHeader({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <Icon className="size-4 text-zinc-500" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
