import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { TooltipProvider } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { ClientMessage } from '../../types/protocol.js';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
import { parseBattleData, parseMontageData, parseNegotiationData, parseRespiteData } from '../../lib/scene-data.js';
import { filterVisibleEntities } from '../../lib/fog-visibility.js';
import { getSceneBackgroundUrl } from '../../lib/scene-backgrounds.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.js';
import { LoadingSkeleton } from '../../components/LoadingSkeleton.js';
import { ReconnectOverlay } from '../../components/ReconnectOverlay.js';
import { BattleStage } from '../../components/stages/BattleStage.js';
import { MontageStage } from '../../components/stages/MontageStage.js';
import { NegotiationStage } from '../../components/stages/NegotiationStage.js';
import { RespiteStage } from '../../components/stages/RespiteStage.js';
import { SceneBackdrop } from '../../components/stages/SceneBackdrop.js';
import { StoryStage } from '../../components/stages/StoryStage.js';

export function StageDisplayPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { state, status, error, send, combatLog } = useSessionSocket(id ?? null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);

  const activeScene = state?.scenes.find((scene) => scene.id === state.activeSceneId);
  const sceneType = (activeScene?.type as SceneType | undefined) ?? null;
  const sceneData = useMemo(() => activeScene?.data ?? {}, [activeScene?.data]);
  const me = state?.participants.find((participant) => participant.userId === user?.id);
  const isDirector = me?.role === 'director';
  const entityNames = useMemo(
    () => new Map((state?.entities ?? []).map((entity) => [entity.id, entity.name])),
    [state?.entities],
  );

  useEffect(() => {
    document.title = activeScene ? `${activeScene.name} - Anvil Stage` : 'Anvil Stage';
  }, [activeScene]);

  useEffect(() => {
    setSelectedEntityId(null);
    setSelectedEntityIds([]);
  }, [state?.activeSceneId]);

  const handleSelectEntity = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId);
    setSelectedEntityIds(entityId ? [entityId] : []);
  }, []);

  const handleSelectEntities = useCallback((entityIds: string[]) => {
    setSelectedEntityIds(entityIds);
    setSelectedEntityId(entityIds[0] ?? null);
  }, []);

  const ignoreDisplayMutation = useCallback((_msg: ClientMessage) => {}, []);

  const renderWithBackground = useCallback(
    (children: ReactNode) => (
      <SceneBackdrop
        backgroundUrl={getSceneBackgroundUrl(
          sceneData,
          sceneType,
          activeScene?.order_index,
        )}
      >
        {children}
      </SceneBackdrop>
    ),
    [activeScene?.order_index, sceneData, sceneType],
  );

  const renderStage = () => {
    if (!state) return null;
    if (!activeScene) {
      return (
        <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-500">
          Waiting for the Director to set a scene...
        </div>
      );
    }

    switch (sceneType) {
      case 'story':
        return renderWithBackground(
          <StoryStage
            readAloudText={(sceneData['readAloud'] as string) ?? ''}
            isDirector={false}
          />,
        );
      case 'montage': {
        const montage = parseMontageData(sceneData);
        const liveMontage = state.montage;
        return renderWithBackground(
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
        const negotiation = parseNegotiationData(sceneData);
        const liveNegotiation = state.negotiation;
        return renderWithBackground(
          <NegotiationStage
            npcName={negotiation.npcName}
            npcPortrait={negotiation.npcPortrait}
            npcAttitude={negotiation.npcAttitude}
            interest={liveNegotiation?.interest ?? negotiation.interest}
            patience={liveNegotiation?.patience ?? negotiation.patience}
            maxPatience={liveNegotiation?.maxPatience ?? negotiation.maxPatience}
            phase={liveNegotiation?.phase ?? negotiation.phase}
            motivations={liveNegotiation?.motivations ?? negotiation.motivations}
            pitfalls={liveNegotiation?.pitfalls ?? negotiation.pitfalls}
            outcomes={negotiation.outcomes}
            isDirector={false}
            argumentLog={liveNegotiation?.argumentLog}
            showPlayerArgumentPanel={false}
          />,
        );
      }
      case 'respite': {
        const respite = parseRespiteData(sceneData);
        const liveRespite = state.respite;
        return renderWithBackground(
          <RespiteStage
            location={respite.location}
            activities={respite.activities}
            liveActivities={liveRespite?.activities}
            projects={respite.projects}
            completed={
              liveRespite?.activities.every((activity) => activity.completed) ??
              false
            }
            isDirector={false}
          />,
        );
      }
      case 'battle': {
        const battle = parseBattleData(sceneData);
        const battleEntities = isDirector
          ? state.entities
          : filterVisibleEntities(state.entities, battle.fogZones);
        return (
          <BattleStage
            entities={battleEntities}
            combat={state.combat}
            selectedEntityId={selectedEntityId}
            selectedEntityIds={selectedEntityIds}
            isDirector={isDirector}
            cols={battle.cols}
            rows={battle.rows}
            cellSize={battle.cellSize}
            backgroundUrl={battle.backgroundUrl}
            drawings={battle.drawings}
            fogZones={battle.fogZones}
            terrain={battle.terrain}
            gridOpacity={battle.gridOpacity}
            gridColor={battle.gridColor}
            gridCellSize={battle.cellSize}
            gridOffsetX={battle.gridOffsetX}
            gridOffsetY={battle.gridOffsetY}
            combatLog={combatLog}
            entityNames={entityNames}
            onSelectEntity={handleSelectEntity}
            onSelectEntities={handleSelectEntities}
            send={isDirector ? send : ignoreDisplayMutation}
          />
        );
      }
      default:
        return (
          <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-500">
            Unknown scene type: {activeScene.type}
          </div>
        );
    }
  };

  if (error && !state) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950" role="alert">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!state) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ErrorBoundary label="stage-display">
        <main className="h-screen overflow-hidden bg-zinc-950 text-zinc-100">
          {status !== 'connected' && (
            <ReconnectOverlay status={status} error={error} />
          )}
          {renderStage()}
        </main>
      </ErrorBoundary>
    </TooltipProvider>
  );
}
