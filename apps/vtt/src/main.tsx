import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router.js';
import { installGlobalBugReporter } from './lib/bug-reporting.js';
import '@anvil/ui/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

installGlobalBugReporter();

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster
      position="bottom-right"
      theme="dark"
      toastOptions={{
        style: {
          background: 'rgb(39, 39, 42)',
          border: '1px solid rgb(63, 63, 70)',
          color: 'rgb(228, 228, 231)',
        },
      }}
    />
  </StrictMode>,
);
