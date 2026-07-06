import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-creator-border bg-creator-bg pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-creator-border" />
        {title && (
          <p className="shrink-0 px-4 pt-2 text-sm font-semibold text-creator-text">{title}</p>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
