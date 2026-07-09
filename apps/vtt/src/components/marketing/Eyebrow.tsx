import type { ReactNode } from 'react';
import { cn } from '@anvil/ui';

/** Small uppercase section label used across the marketing pages. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-sm font-semibold uppercase tracking-[0.18em] text-anvil-ember-600',
        className,
      )}
    >
      {children}
    </p>
  );
}
