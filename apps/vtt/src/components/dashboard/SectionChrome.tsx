import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@anvil/ui';

export function EmptyState({ icon: Icon, title, detail, action }: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: { label: string; to: string; icon: LucideIcon };
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-card border border-dashed border-zinc-700/80 bg-zinc-950/70 px-4 py-6 text-center shadow-lg shadow-black/20 backdrop-blur-sm">
      <span className="flex size-11 items-center justify-center rounded-chip bg-anvil-ember-400/15 text-anvil-ember-400 motion-safe:animate-float">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-sm font-semibold text-zinc-200">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{detail}</p>
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-3 rounded-chip">
          <Link to={action.to}>
            <action.icon size={14} />
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

export function SectionHeader({
  title,
  eyebrow,
  to,
}: {
  title: string;
  eyebrow: string;
  to?: string;
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
        <h2 className="mt-1 font-display text-base font-semibold text-zinc-100">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="dashboard-accent-link inline-flex items-center gap-1 text-xs font-semibold">
          Open
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
