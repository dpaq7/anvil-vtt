import { useRouteError } from 'react-router-dom';
import {
  isChunkLoadError,
  refreshForChunkLoadError,
} from '../lib/chunk-reload.js';

export function RouteErrorFallback() {
  const error = useRouteError();
  const message =
    error instanceof Error
      ? error.message
      : 'An unexpected navigation error occurred.';
  const chunkLoadError = isChunkLoadError(error);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-6 text-center text-zinc-100">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
        !
      </div>
      <div>
        <h1 className="text-lg font-semibold">
          {chunkLoadError ? 'Update needed' : 'Something went wrong'}
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-400">
          {chunkLoadError
            ? 'The app was updated while this tab was open. Reload to continue with the latest version.'
            : message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          if (chunkLoadError) {
            refreshForChunkLoadError({ force: true });
            return;
          }
          window.location.reload();
        }}
        className="rounded bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white"
      >
        {chunkLoadError ? 'Refresh App' : 'Reload'}
      </button>
    </div>
  );
}
