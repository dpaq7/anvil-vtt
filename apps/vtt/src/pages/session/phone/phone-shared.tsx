import type { ComponentType, ReactNode } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '@anvil/ui';

export function PhoneButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm font-medium text-zinc-100 active:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MetricPanel({
  label,
  value,
  max,
  children,
}: {
  label: string;
  value: number;
  max?: number;
  children?: ReactNode;
}) {
  const pct = max && max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <section className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="mt-1 text-5xl font-semibold text-zinc-50">
          {value}
          {max !== undefined && <span className="text-2xl text-zinc-500">/{max}</span>}
        </p>
      </div>
      {max !== undefined && (
        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricMini({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="rounded-md bg-zinc-900 p-3 text-center">
      <p className="text-3xl font-semibold text-zinc-50">{value}<span className="text-base text-zinc-500">/{max}</span></p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

export function StatusBanner({
  status,
  anchored,
  error,
}: {
  status: string;
  anchored: boolean | null;
  error: string | null;
}) {
  if (status === 'connected' && anchored !== false && !error) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
      {anchored === false
        ? 'Open this session on desktop first. Phone controls are read-only until sync is active.'
        : status === 'connected'
          ? error
          : 'Connection interrupted. Showing the last synced state.'}
    </div>
  );
}

export function LockedPhone({ message }: { message: string }) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <div className="max-w-sm text-center">
        <Shield className="mx-auto mb-4 size-12 text-zinc-500" />
        <h1 className="text-xl font-semibold">Desktop Sync Required</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
      </div>
    </main>
  );
}

export interface PhoneTab<T extends string> {
  id: T;
  Icon: ComponentType<{ className?: string }>;
  label: string;
}

export function PhoneTabBar<T extends string>({
  tabs,
  active,
  onSelect,
}: {
  tabs: ReadonlyArray<PhoneTab<T>>;
  active: T;
  onSelect: (tab: T) => void;
}) {
  return (
    <nav
      className="grid border-t border-zinc-800 bg-zinc-900/95"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ id, Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className={cn(
            'flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]',
            active === id ? 'text-zinc-50' : 'text-zinc-500',
          )}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </nav>
  );
}
