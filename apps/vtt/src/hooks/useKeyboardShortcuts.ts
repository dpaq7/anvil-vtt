import { useEffect } from 'react';

interface ShortcutHandlers {
  onEscape?: () => void;
  onSpace?: () => void;
  onHelp?: () => void;
}

/** Focus is in a dialog or menu: nothing behind it should react to the keyboard. */
export function isInOverlay(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]') !== null;
}

/**
 * Focus is on something that takes the key itself: typing, a button Space should press, a select
 * Space should open, or anything in a dialog. On the map or the page body the shortcuts still run.
 */
export function isKeyOwner(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || isInOverlay(target)) return true;
  return target.closest('input, textarea, select, button, a[href], [role="button"], [role="tab"], [role="menuitem"]') !== null;
}

export function useKeyboardShortcuts({ onEscape, onSpace, onHelp }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isKeyOwner(e.target)) return;

      switch (e.key) {
        case 'Escape':
          onEscape?.();
          break;
        case ' ':
          if (onSpace) {
            e.preventDefault();
            onSpace();
          }
          break;
        case '?':
          onHelp?.();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onEscape, onSpace, onHelp]);
}
