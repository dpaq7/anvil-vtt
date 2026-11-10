import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@anvil/ui';
import { useSessionConnection } from '../shell/connection-context.js';

/*
 * A quiet link whose label ends "…" asks first (DESIGN.md section 4, Buttons and Dialog), as
 * End combat… does. Used for End negotiation… and Reset… in the mode rails.
 */
export function ConfirmLink({
  label,
  title,
  body,
  keep,
  confirm,
  onConfirm,
}: {
  label: string;
  title: string;
  body: string;
  keep: string;
  confirm: string;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { paused } = useSessionConnection();
  return (
    <>
      <button type="button" className="sb-link" disabled={paused} onClick={() => setOpen(true)}>
        {paused ? `${label}, when back` : label}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent role="alertdialog" aria-label={confirm} className="flex max-w-[400px] flex-col gap-2.5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="m-0 text-[15px] leading-[1.4] text-text">{body}</DialogDescription>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => setOpen(false)}
              className="h-[42px] flex-1 border-[3px] border-art-ink bg-active font-display text-[15px] font-bold text-on-active shadow-[var(--shape-hard-shadow-small)_var(--color-shadow)] active:translate-x-px active:translate-y-px"
            >
              {keep}
            </button>
            <button
              type="button"
              disabled={paused}
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
              className="h-[42px] border-2 border-dashed border-alert bg-surface px-3.5 font-bold text-alert hover:bg-well active:translate-x-px active:translate-y-px disabled:border-line-quiet disabled:text-text-soft"
            >
              {confirm}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
