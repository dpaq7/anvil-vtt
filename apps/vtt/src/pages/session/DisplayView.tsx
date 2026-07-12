import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { TooltipProvider } from '@anvil/ui';
import type { SceneType } from '@anvil/types';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.js';
import { ReconnectOverlay } from '../../components/ReconnectOverlay.js';
import { LoadingSkeleton } from '../../components/LoadingSkeleton.js';
import { BattleStage } from '../../components/stages/BattleStage.js';
import { StoryStage } from '../../components/stages/StoryStage.js';
import { MontageStage } from '../../components/stages/MontageStage.js';
import { NegotiationStage } from '../../components/stages/NegotiationStage.js';
import { RespiteStage } from '../../components/stages/RespiteStage.js';
import { SceneBackdrop } from '../../components/stages/SceneBackdrop.js';
import { getSceneBackgroundUrl } from '../../lib/scene-backgrounds.js';
import {
  parseBattleData,
  parseMontageData,
  parseNegotiationData,
  parseRespiteData,
} from '../../lib/scene-data.js';
import { filterVisibleEntities } from '../../lib/fog-visibility.js';
import type { ClientMessage, SceneRef, SessionState } from '../../types/protocol.js';

const noop = () => {};
const noopSend = (_msg: ClientMessage) => {};

/**
 * Player-facing "pop-out" scene display for an external monitor.
 *
 * Opened in its own window (see the launch control in DirectorView), it holds
 * its own WebSocket connection to the same session — auth and the entity
 * broadcast are shared same-origin, so no extra server support is needed. It
 * renders the active scene for every scene type with player-facing rules
 * (client-side fog of war for battles, hidden motivations/pitfalls for
 * negotiations) and no director chrome. Read-only: no interactive panels and
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

  return (
    <TooltipProvider delayDuration={0}>
      <ErrorBoundary label="display">
        <div className="relative h-screen w-screen overflow-hidden bg-black">
          {status !== 'connected' && (
            <ReconnectOverlay status={status} error={error} />
          )}
          {activeScene ? (
            <SceneDisplay scene={activeScene} state={state} entityNames={entityNames} />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Waiting for the Director to set a scene…
            </div>
          )}
        </div>
      </ErrorBoundary>
    </TooltipProvider>
  );
}

function SceneDisplay({
  scene,
  state,
  entityNames,
}: {
  scene: SceneRef;
  state: SessionState;
  entityNames: Map<string, string>;
}) {
  const sceneType = scene.type as SceneType;
  const sceneData = scene.data ?? {};

  const withBackdrop = (children: React.ReactNode) => (
    <SceneBackdrop backgroundUrl={getSceneBackgroundUrl(sceneData, sceneType, scene.order_index)}>
      {children}
    </SceneBackdrop>
  );

  switch (sceneType) {
    case 'story':
      return withBackdrop(
        <StoryStage readAloudText={(sceneData['readAloud'] as string) ?? ''} isDirector={false} />,
      );
    case 'montage': {
      const montage = parseMontageData(sceneData);
      const liveMontage = state.montage;
      return withBackdrop(
        <MontageStage
          goal={montage.goal}
          roundLimit={montage.roundLimit}
          heroCount={montage.heroCount}
          currentSuccesses={liveMontage?.successes ?? 0}
          successLimit={liveMontage?.successLimit ?? montage.successLimit}
          currentFailures={liveMontage?.failures ?? 0}
          failureLimit={liveMontage?.failureLimit ?? montage.failureLimit}
          outcome={liveMontage?.outcome ?? 'pending'}
          totalSuccess={montage.totalSuccess}
          partialSuccess={montage.partialSuccess}
          totalFailure={montage.totalFailure}
          challenges={montage.challenges}
          isDirector={false}
          testLog={liveMontage?.testLog}
        />,
      );
    }
    case 'negotiation': {
      const neg = parseNegotiationData(sceneData);
      const liveNeg = state.negotiation;
      return withBackdrop(
        <NegotiationStage
          npcName={neg.npcName}
          npcPortrait={neg.npcPortrait}
          npcAttitude={neg.npcAttitude}
          interest={liveNeg?.interest ?? neg.interest}
          patience={liveNeg?.patience ?? neg.patience}
          maxPatience={liveNeg?.maxPatience ?? neg.maxPatience}
          phase={liveNeg?.phase ?? neg.phase}
          motivations={liveNeg?.motivations ?? neg.motivations}
          pitfalls={liveNeg?.pitfalls ?? neg.pitfalls}
          outcomes={neg.outcomes}
          isDirector={false}
          argumentLog={liveNeg?.argumentLog}
        />,
      );
    }
    case 'respite': {
      const respite = parseRespiteData(sceneData);
      const liveRespite = state.respite;
      return withBackdrop(
        <RespiteStage
          location={respite.location}
          activities={respite.activities}
          liveActivities={liveRespite?.activities}
          projects={respite.projects}
          completed={liveRespite?.activities.every((activity) => activity.completed) ?? false}
          isDirector={false}
        />,
      );
    }
    case 'battle': {
      const battle = parseBattleData(sceneData);
      // Client-side fog of war: hide monsters inside fog zones
      const visibleEntities = filterVisibleEntities(state.entities, battle.fogZones);
      return (
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
          showDiceControls={false}
        />
      );
    }
    default:
      return (
        <div className="flex h-full items-center justify-center text-zinc-500">
          Unknown scene type: {scene.type}
        </div>
      );
  }
}
