import { useRouteError } from 'react-router-dom';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import {
  isChunkLoadError,
  refreshForChunkLoadError,
} from '../lib/chunk-reload.js';
import { StatePage, StateMessage } from './StateMessage.js';

/*
 * When a route fails (DESIGN.md section 4, Error; demo `states`: Anvil updated). The copy
 * says what happened and the one way on is a reload.
 */
export function RouteErrorFallback() {
  const error = useRouteError();
  const chunkLoadError = isChunkLoadError(error);
  const message =
    error instanceof Error
      ? error.message
      : 'An unexpected navigation error occurred.';

  const reload = () => {
    if (chunkLoadError) {
      refreshForChunkLoadError({ force: true });
      return;
    }
    window.location.reload();
  };

  return (
    <StatePage>
      {chunkLoadError ? (
        <StateMessage
          icon={<RefreshCw size={30} strokeWidth={2.4} />}
          title="A new version of Anvil is ready"
          body="Reload to load it. Your session is saved on the server."
          go={{ label: <><RefreshCw size={16} strokeWidth={3} aria-hidden="true" />Reload</>, onClick: reload }}
        />
      ) : (
        <StateMessage
          icon={<TriangleAlert size={30} strokeWidth={2.4} />}
          title="Something went wrong"
          body={message}
          go={{ label: <><RefreshCw size={16} strokeWidth={3} aria-hidden="true" />Reload</>, onClick: reload }}
        />
      )}
    </StatePage>
  );
}
