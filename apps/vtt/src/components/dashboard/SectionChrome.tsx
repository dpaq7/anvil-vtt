import type { ReactNode } from 'react';
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
    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/70 px-4 py-5 text-center shadow-lg shadow-black/20 backdrop-blur-sm">
      <Icon className="size-6 text-zinc-500" />
      <p className="mt-2 text-sm font-semibold text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{detail}</p>
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-3">
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
  dragHandle,
}: {
  title: string;
  eyebrow: string;
  to?: string;
  dragHandle?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
          {dragHandle}
        </div>
        <h2 className="mt-1 text-sm font-semibold text-zinc-100">{title}</h2>
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
