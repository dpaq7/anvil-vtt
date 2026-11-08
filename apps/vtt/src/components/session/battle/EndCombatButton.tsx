import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@anvil/ui';
import { useSessionConnection } from '../shell/connection-context.js';

/* "End combat…" asks first, because it ends play for everyone (DESIGN.md section 4). Same step as End session. */
export function EndCombatButton({ onEnd }: { onEnd: () => void }) {
  const [open, setOpen] = useState(false);
  const { paused } = useSessionConnection();
  return (
    <>
      <button type="button" className="sb-link" disabled={paused} onClick={() => setOpen(true)}>
        End combat…
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent role="alertdialog" aria-label="End combat" className="flex max-w-[400px] flex-col gap-2.5">
          <DialogTitle>End this combat?</DialogTitle>
          <DialogDescription className="m-0 text-[15px] leading-[1.4] text-text">
            It ends the fight for everyone at the table.
          </DialogDescription>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="h-[42px] flex-1 border-[3px] border-art-ink bg-active font-display text-[15px] font-bold text-on-active shadow-[var(--shape-hard-shadow-small)_var(--color-shadow)] active:translate-x-px active:translate-y-px"
            >
              Keep fighting
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
              End combat
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
