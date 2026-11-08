import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router.js';
import { useThemeStore } from './stores/themeStore.js';

export function AppRoot() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        theme={theme}
        toastOptions={{
          // A toast floats, so it takes the popover frame (DESIGN.md section 4).
          style: {
            background: 'var(--color-surface)',
            border: 'var(--shape-frame) solid var(--art-ink)',
            borderRadius: 0,
            boxShadow: 'var(--shape-hard-shadow) var(--art-ink)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-body)',
          },
        }}
      />
    </>
  );
}
