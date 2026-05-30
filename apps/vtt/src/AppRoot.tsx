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
          style: {
            background: 'var(--color-zinc-900)',
            border: '1px solid var(--color-zinc-700)',
            color: 'var(--color-zinc-100)',
          },
        }}
      />
    </>
  );
}
