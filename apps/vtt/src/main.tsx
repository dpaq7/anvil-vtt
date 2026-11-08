import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRoot } from './AppRoot.js';
import { installGlobalBugReporter } from './lib/bug-reporting.js';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@anvil/ui/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

installGlobalBugReporter();

createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);
