import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@anvil/ui';
import { useSessionConnection } from './shell/connection-context.js';

/*
 * End session asks first (DESIGN.md sections 4 and 9; demo `battle-director-end`). The
 * label ends "…" because it opens this step. The safe action is primary and first; the
 * danger action is the dashed session-danger button.
 */
export function EndSessionButton({ onEnd }: { onEnd: () => void }) {
  const [open, setOpen] = useState(false);
  const { paused } = useSessionConnection();
  return (
    <>
      <button
        type="button"
        className="sb-endsession"
        data-wait={paused || undefined}
        disabled={paused}
        onClick={() => setOpen(true)}
      >
        {paused ? 'End session…, when back' : 'End session…'}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent role="alertdialog" aria-label="End session" className="flex max-w-[400px] flex-col gap-2.5">
          <DialogTitle>End this session?</DialogTitle>
          <DialogDescription className="m-0 text-[15px] leading-[1.4] text-text">
            It ends for everyone at the table, not only for you.
          </DialogDescription>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="h-[42px] flex-1 border-[3px] border-art-ink bg-active font-display text-[15px] font-bold text-on-active shadow-[var(--shape-hard-shadow-small)_var(--color-shadow)] active:translate-x-px active:translate-y-px"
            >
              Keep playing
            </button>
            <button
              type="button"
              disabled={paused}
              onClick={() => {
                setOpen(false);
                onEnd();
              }}
              className="h-[42px] border-2 border-dashed border-alert bg-surface px-3.5 font-bold text-alert hover:bg-well active:translate-x-px active:translate-y-px disabled:border-line-quiet disabled:text-text-soft"
            >
              End session
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
