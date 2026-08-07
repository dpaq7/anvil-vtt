import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function gameDataChunk(id: string): string | undefined {
  const normalizedId = id.replaceAll('\\', '/');
  if (
    !normalizedId.includes('/packages/data/') ||
    !normalizedId.includes('/game-data/generated/')
  ) {
    return undefined;
  }

  const fileName = normalizedId.slice(normalizedId.lastIndexOf('/') + 1).replace(/\.json$/, '');
  return `game-data-${fileName}`;
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // Override when the local worker runs on a non-default port.
        target: process.env['ANVIL_API_PROXY'] ?? 'http://localhost:8787',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Keep generated rules catalogs independently cacheable instead of folding
    // several megabytes of JSON into whichever shared UI chunk imports GameData.
    rollupOptions: {
      output: {
        manualChunks: gameDataChunk,
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
