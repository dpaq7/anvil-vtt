import { useEffect } from 'react';

interface ShortcutHandlers {
  onEscape?: () => void;
  onSpace?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts({ onEscape, onSpace, onHelp }: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

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
