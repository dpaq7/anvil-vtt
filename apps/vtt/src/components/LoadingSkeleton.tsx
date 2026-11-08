import { CircleDashed } from 'lucide-react';
import { cn } from '@anvil/ui';

/*
 * Loading (DESIGN.md section 4; demo `states`: Loading is not empty). Loading is never drawn
 * as empty: the shape of what is coming, hatched like ink still going down, and words that
 * say what is loading. A session loads as the shell in outline with "Opening the table…".
 */
interface LoadingSkeletonProps {
  variant?: 'page' | 'card' | 'list' | 'canvas';
  /** What is loading, for list and card ("Loading your campaigns…"). */
  label?: string;
  className?: string;
}

const HATCH =
  'bg-[repeating-linear-gradient(135deg,var(--color-line-quiet)_0_3px,transparent_3px_9px)] shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]';

function Ghost({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('block', HATCH, className)} />;
}

function Heading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 pb-3 pt-4">
      <CircleDashed size={18} strokeWidth={2.6} aria-hidden="true" />
      <b className="font-display text-base font-extrabold leading-tight">{label}</b>
    </div>
  );
}

/** The session shell in outline: top row of boards, two rails, the ink screen. */
function SessionSkeleton() {
  return (
    <div
      role="status"
      aria-label="Opening the table"
      className="grid h-screen grid-rows-[var(--layout-top)_minmax(0,1fr)_var(--layout-status)] gap-2 bg-canvas px-3 pt-3 text-text"
    >
      <div className="flex items-center gap-3">
        <b className="font-display text-[32px] font-extrabold leading-none tracking-[-0.02em] text-on-canvas">Anvil</b>
        {[0, 1, 2, 3, 4].map((i) => (
          <Ghost key={i} className="h-11 flex-1" />
        ))}
      </div>
      <div className="grid min-h-0 grid-cols-[var(--shape-rail-left)_minmax(0,1fr)_var(--shape-rail-right)] gap-2">
        <div className="flex flex-col gap-2.5 border-[1.5px] border-line bg-surface p-2.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Ghost key={i} className="h-10" />
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-2 border-[3px] border-art-ink bg-art-ink text-center text-art-on-hero-plate">
          <CircleDashed size={26} strokeWidth={2.6} aria-hidden="true" />
          <b className="font-display text-[19px] font-extrabold leading-tight">Opening the table…</b>
          <span className="text-sm">Scenes, heroes and the map</span>
        </div>
        <div className="flex flex-col gap-2.5 border-[1.5px] border-line bg-surface p-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Ghost key={i} className={i === 1 ? 'h-24' : 'h-10'} />
          ))}
        </div>
      </div>
      <div />
    </div>
  );
}

function ListSkeleton({ label }: { label: string }) {
  const widths = ['62%', '48%', '70%', '54%'];
  return (
    <div role="status" className="flex flex-col">
      <Heading label={label} />
      {widths.map((w, i) => (
        <div key={i} className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3.5 border-t-[1.5px] border-line-quiet px-4 py-3.5">
          <Ghost className="size-12" />
          <div className="flex flex-col gap-2">
            <span aria-hidden="true" className={cn('block h-3.5', HATCH)} style={{ width: w }} />
            <Ghost className="h-3.5 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col gap-2 border-[1.5px] border-line-quiet p-4">
      <span className="sr-only">{label}</span>
      <Ghost className="h-4 w-2/3" />
      <Ghost className="h-3 w-full" />
      <Ghost className="h-3 w-4/5" />
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div role="status" className="flex h-full w-full flex-col items-center justify-center gap-2 bg-art-ink text-art-on-hero-plate">
      <CircleDashed size={26} strokeWidth={2.6} aria-hidden="true" />
      <b className="font-display text-[19px] font-extrabold">Loading the map…</b>
    </div>
  );
}

export function LoadingSkeleton({ variant = 'page', label = 'Loading…', className }: LoadingSkeletonProps) {
  const content = (() => {
    switch (variant) {
      case 'page':
        return <SessionSkeleton />;
      case 'card':
        return <CardSkeleton label={label} />;
      case 'list':
        return <ListSkeleton label={label} />;
      case 'canvas':
        return <CanvasSkeleton />;
    }
  })();

  return <div className={className}>{content}</div>;
}
