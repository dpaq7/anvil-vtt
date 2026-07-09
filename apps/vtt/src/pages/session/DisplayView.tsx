import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TooltipProvider } from '@anvil/ui';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.js';
import { ReconnectOverlay } from '../../components/ReconnectOverlay.js';
import { LoadingSkeleton } from '../../components/LoadingSkeleton.js';
import { BattleStage } from '../../components/stages/BattleStage.js';
import { parseBattleData } from '../../lib/scene-data.js';
import { filterVisibleEntities } from '../../lib/fog-visibility.js';
import type { ClientMessage } from '../../types/protocol.js';

const noop = () => {};
const noopSend = (_msg: ClientMessage) => {};

/**
 * Player-facing "pop-out" battle display for an external monitor.
 *
 * Opened in its own window (see the launch control in DirectorView), it holds
 * its own WebSocket connection to the same session — auth and the entity
 * broadcast are shared same-origin, so no extra server support is needed. It
 * renders only the map, with player-facing client-side fog of war (hidden
 * monsters filtered out, fog fully opaque) and no director chrome. Read-only:
 * pointer interactions never reach the server.
 */
export function DisplayView() {
  const { id } = useParams<{ id: string }>();
  const { state, status, error } = useSessionSocket(id ?? null);

  const activeScene = useMemo(
    () => state?.scenes.find((scene) => scene.id === state.activeSceneId),
    [state],
  );
  const entityNames = useMemo(
    () => new Map((state?.entities ?? []).map((e) => [e.id, e.name])),
    [state],
  );

  if (error && !state) {
    return (
      <div className="flex h-screen items-center justify-center bg-black" role="alert">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!state) {
    return <LoadingSkeleton variant="page" />;
  }

  const battle =
    activeScene?.type === 'battle' ? parseBattleData(activeScene.data ?? {}) : null;
  const visibleEntities = battle
    ? filterVisibleEntities(state.entities, battle.fogZones)
    : [];

  return (
    <TooltipProvider delayDuration={0}>
      <ErrorBoundary label="display">
        <div className="relative h-screen w-screen overflow-hidden bg-black">
          {status !== 'connected' && (
            <ReconnectOverlay status={status} error={error} />
          )}
          {battle ? (
            <BattleStage
              entities={visibleEntities}
              combat={state.combat}
              selectedEntityId={null}
              isDirector={false}
              cols={battle.cols}
              rows={battle.rows}
              cellSize={battle.cellSize}
              backgroundUrl={battle.backgroundUrl}
              drawings={battle.drawings}
              fogZones={battle.fogZones}
              terrain={battle.terrain}
              gridOpacity={battle.gridOpacity}
              gridColor={battle.gridColor}
              gridOffsetX={battle.gridOffsetX}
              gridOffsetY={battle.gridOffsetY}
              entityNames={entityNames}
              onSelectEntity={noop}
              send={noopSend}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Waiting for a battle scene…
            </div>
          )}
        </div>
      </ErrorBoundary>
    </TooltipProvider>
  );
}
