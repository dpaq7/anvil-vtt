import type { ReactNode } from 'react';
import { cn } from '@anvil/ui';

/*
 * Error (DESIGN.md section 4; demo `states`, `st-msg`): what happened in plain words and a
 * way forward. A 56 px hazard square tilted -4 deg holds the icon, then a 22 px title, one
 * 15 px sentence, a primary action and, if useful, a secondary one. No bare red text.
 */
export interface StateAction {
  label: ReactNode;
  onClick: () => void;
}

interface StateMessageProps {
  icon: ReactNode;
  title: ReactNode;
  body: ReactNode;
  go: StateAction;
  alt?: StateAction;
  className?: string;
  /** "alert" for failures a screen reader should hear at once. */
  role?: 'alert' | 'status';
}

export function StateMessage({ icon, title, body, go, alt, className, role = 'alert' }: StateMessageProps) {
  return (
    <div role={role} className={cn('flex flex-col items-start justify-center gap-2.5 text-text', className)}>
      <i
        aria-hidden="true"
        className="mb-1 grid size-14 -rotate-4 place-items-center border-[3px] border-art-ink bg-art-hazard text-art-on-hazard not-italic"
      >
        {icon}
      </i>
      <h1 className="m-0 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.01em]">{title}</h1>
      <p className="m-0 max-w-[36ch] text-[15px] leading-[1.4]">{body}</p>
      <div className="mt-2 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={go.onClick}
          className="inline-flex h-11 items-center gap-2 border-[3px] border-art-ink bg-active px-4 font-display text-base font-extrabold text-on-active shadow-[var(--shape-hard-shadow-small)_var(--color-shadow)] active:translate-x-px active:translate-y-px"
        >
          {go.label}
        </button>
        {alt && (
          <button
            type="button"
            onClick={alt.onClick}
            className="inline-flex h-11 items-center gap-1.5 bg-raised px-3.5 font-bold text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:bg-well active:translate-x-px active:translate-y-px"
          >
            {alt.label}
          </button>
        )}
      </div>
    </div>
  );
}

/*
 * A whole page that holds one state: the canvas ground, the wordmark, and the message in a
 * framed panel. Used where the failure is the page (bad link, bad address, bad invite).
 */
export function StatePage({ children, wordmark = true }: { children: ReactNode; wordmark?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas p-3 text-text">
      {wordmark && (
        <div className="flex h-[62px] items-center px-1.5 font-display text-[32px] font-extrabold leading-none tracking-[-0.02em] text-on-canvas">
          Anvil
        </div>
      )}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[460px] border-[3px] border-line bg-surface px-6 py-8 shadow-[var(--shape-hard-shadow-page)_var(--color-shadow)]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* The same framed panel inside the app frame, where the app rail stays in view. */
export function StatePanel({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-full items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[460px] border-[3px] border-line bg-surface px-6 py-8 shadow-[var(--shape-hard-shadow-page)_var(--color-shadow)]">
        {children}
      </div>
    </div>
  );
}
