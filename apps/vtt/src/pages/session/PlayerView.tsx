import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Expand, Minimize2 } from 'lucide-react';
import { AppShell } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SessionState, ClientMessage, AbilityResult } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { parseMontageData, parseNegotiationData, parseRespiteData, parseBattleData } from '../../lib/scene-data.js';
import { filterVisibleEntities } from '../../lib/fog-visibility.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useAudioSync } from '../../hooks/useAudioSync.js';
import { VitalsBar } from '../../components/session/VitalsBar.js';
import { ParticipantStatusBar } from '../../components/session/ParticipantStatusBar.js';
import { CombatTracker } from '../../components/session/CombatTracker.js';
import { BattleTurnTracker } from '../../components/session/BattleTurnTracker.js';
import { TurnActionBar } from '../../components/session/TurnActionBar.js';
import { AbilityPanel } from '../../components/session/AbilityPanel.js';
import { CombatLog } from '../../components/session/CombatLog.js';
import { ActionLogPanel } from '../../components/session/ActionLogPanel.js';
import { StoryStage } from '../../components/stages/StoryStage.js';
import { MontageStage } from '../../components/stages/MontageStage.js';
import { NegotiationStage } from '../../components/stages/NegotiationStage.js';
import { RespiteStage } from '../../components/stages/RespiteStage.js';
import { BattleStage } from '../../components/stages/BattleStage.js';

interface PlayerViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
}

export function PlayerView({ sessionState, connectionStatus, send, combatLog }: PlayerViewProps) {
  const user = useAuthStore((s) => s.user);

  // Sync server audio commands to local HTML5 Audio playback
  useAudioSync(sessionState.audio);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const initiativePromptedRef = useRef(false);
  const { scenes, activeSceneId, participants, entities, combat } = sessionState;
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const sceneType = (activeScene?.type as SceneType) ?? null;
  const sceneData = activeScene?.data ?? {};
  const entityNames = useMemo(() => new Map(entities.map((e) => [e.id, e.name])), [entities]);

  // Find this player's hero entity
  const me = participants.find((p) => p.userId === user?.id);
  const heroEntity = entities.find((e) => e.id === me?.heroId) ?? entities.find((e) => e.type === 'hero');
  const heroEntityId = heroEntity?.id ?? null;

  // Hero combat state
  const isMyTurn = combat?.activeEntityId === heroEntityId;
  const turnActions = heroEntityId ? (combat?.turnActions?.[heroEntityId] ?? null) : null;
  const heroAbilities = (heroEntity?.['abilities'] as { id: string; name: string; keywords: string[]; actionType: string; distance: string; damage: string; cost: string; tier1Effect: string; tier2Effect: string; tier3Effect: string }[]) ?? [];
  const heroConditions = Array.isArray(heroEntity?.['conditions']) ? (heroEntity['conditions'] as string[]) : [];
  const heroSpeed = typeof heroEntity?.['speed'] === 'number' ? (heroEntity['speed'] as number) : 5;
  const heroicResource = typeof heroEntity?.['heroicResource'] === 'number' ? (heroEntity['heroicResource'] as number) : 0;
  const resourceName = (heroEntity?.['heroicResourceName'] as string) ?? 'Resource';
  const initiativePending = sceneType === 'battle' && combat?.initiativeRoll === null;

  useEffect(() => {
    if (initiativePending && !initiativePromptedRef.current) {
      initiativePromptedRef.current = true;
      toast.info('Combat started. Roll initiative d10.');
    } else if (!initiativePending) {
      initiativePromptedRef.current = false;
    }
  }, [initiativePending]);

  // Determine which action types have been used (for ability panel greying out)
  const usedActionTypes = useMemo(() => {
    if (!turnActions) return [];
    const used: string[] = [];
    if (turnActions.mainActionUsed || turnActions.mainConvertedTo !== null) used.push('action', 'main');
    if (turnActions.maneuverUsed) used.push('maneuver');
    if (turnActions.triggeredUsedThisRound) used.push('triggered');
    return used;
  }, [turnActions]);

  const handleUseAbility = useCallback(
    (abilityId: string) => {
      if (!heroEntity) return;
      if (!combat || !isMyTurn) {
        toast.error('Wait until you take your turn.');
        return;
      }

      const selectedTarget = selectedEntityId
        ? entities.find((e) => e.id === selectedEntityId && (e.type === 'monster' || e.type === 'npc'))
        : null;
      const targetEntity = selectedTarget ?? entities.find((e) => e.type === 'monster' || e.type === 'npc');

      if (!targetEntity) {
        toast.error('No enemy target selected. Click an enemy on the map first.');
        return;
      }

      send({
        type: 'token_action',
        action: { kind: 'ability', sourceId: heroEntity.id, targetId: targetEntity.id, abilityId },
      });
      toast.info(`Using ability on ${targetEntity.name}...`);
    },
    [combat, heroEntity, entities, isMyTurn, selectedEntityId, send],
  );

  const handleCatchBreath = useCallback(() => {
    if (!heroEntity) return;
    send({
      type: 'token_action',
      action: { kind: 'catch-breath', sourceId: heroEntity.id, targetId: heroEntity.id },
    });
    toast.success('Caught breath! Recovering stamina...');
  }, [heroEntity, send]);

  const handleDefend = useCallback(() => {
    if (!heroEntity) return;
    send({
      type: 'token_action',
      action: { kind: 'defend', sourceId: heroEntity.id, targetId: heroEntity.id },
    });
    toast.info('Defending until your next turn.');
  }, [heroEntity, send]);

  const handleRollInitiative = useCallback(() => {
    send({ type: 'combat_action', action: { type: 'ROLL_INITIATIVE' } });
  }, [send]);

  // ── Non-battle scene handlers ──

  const handleMontageRoll = useCallback(
    (skillId: string, characteristicId: string) => {
      send({ type: 'montage_roll', skillId, characteristicId });
      toast.info('Rolling montage test...');
    },
    [send],
  );

  const handleNegotiationArgument = useCallback(
    (skillId: string, approachText: string) => {
      send({ type: 'negotiation_argument', skillId, approachText });
      toast.info('Making your argument...');
    },
    [send],
  );

  const handleRespiteClaimActivity = useCallback(
    (activityId: string) => {
      send({ type: 'respite_choose_activity', activityId });
      toast.info('Claiming activity...');
    },
    [send],
  );

  const handleRespiteCompleteActivity = useCallback(
    (activityId: string) => {
      send({ type: 'respite_complete_activity', activityId });
      toast.success('Activity completed!');
    },
    [send],
  );

  const renderStage = () => {
    if (!activeScene) {
      return (
        <div className="flex h-full items-center justify-center text-zinc-500">
          Waiting for the Director to set a scene...
        </div>
      );
    }

    switch (sceneType) {
      case 'story':
        return <StoryStage readAloudText={(sceneData['readAloud'] as string) ?? ''} isDirector={false} />;
      case 'montage': {
        const montage = parseMontageData(sceneData);
        // Use live state from server if available
        const liveMontage = sessionState.montage;
        return (
          <MontageStage
            goal={montage.goal}
            currentSuccesses={liveMontage?.successes ?? 0}
            successLimit={liveMontage?.successLimit ?? montage.successLimit}
            currentFailures={liveMontage?.failures ?? 0}
            failureLimit={liveMontage?.failureLimit ?? montage.failureLimit}
            outcome={liveMontage?.outcome ?? 'pending'}
            challenges={montage.challenges}
            isDirector={false}
            testLog={liveMontage?.testLog}
            onMontageRoll={handleMontageRoll}
          />
        );
      }
      case 'negotiation': {
        const neg = parseNegotiationData(sceneData);
        // Use live state from server if available
        const liveNeg = sessionState.negotiation;
        return (
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
            onMakeArgument={handleNegotiationArgument}
          />
        );
      }
      case 'respite': {
        const respite = parseRespiteData(sceneData);
        const liveRespite = sessionState.respite;
        return (
          <RespiteStage
            location={respite.location}
            activities={respite.activities}
            liveActivities={liveRespite?.activities}
            projects={respite.projects}
            completed={liveRespite?.activities.every((activity) => activity.completed) ?? false}
            isDirector={false}
            currentUserId={user?.id}
            onClaimActivity={handleRespiteClaimActivity}
            onCompleteActivity={handleRespiteCompleteActivity}
          />
        );
      }
      case 'battle': {
        const battle = parseBattleData(sceneData);
        // Client-side fog of war: hide monsters inside fog zones
        const visibleEntities = filterVisibleEntities(entities, battle.fogZones);
        return (
          <BattleStage
            entities={visibleEntities}
            combat={combat}
            selectedEntityId={selectedEntityId}
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
            heroPosition={heroEntity ? { x: heroEntity.x, y: heroEntity.y } : null}
            combatLog={combatLog}
            entityNames={entityNames}
            onSelectEntity={setSelectedEntityId}
            send={send}
          />
        );
      }
      default:
        return (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Unknown scene type: {activeScene.type}
          </div>
        );
    }
  };

  return (
    <AppShell
      topBar={focusMode ? (
        <div className="flex w-full justify-end">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-zinc-800 px-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700"
            onClick={() => setFocusMode(false)}
            title="Exit full screen"
          >
            <Minimize2 className="size-4" />
            Exit full screen
          </button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-2">
          <div className="flex-1">
            <VitalsBar
              name={(heroEntity?.name as string) ?? 'Hero'}
              heroClass={(heroEntity?.['heroClass'] as string) ?? null}
              level={(heroEntity?.['level'] as number) ?? 1}
              currentStamina={(heroEntity?.['currentStamina'] as number) ?? 20}
              maxStamina={(heroEntity?.['maxStamina'] as number) ?? 20}
              heroicResource={heroicResource}
            />
          </div>
          {sceneType === 'battle' && combat && (
            <BattleTurnTracker
              combat={combat}
              entities={entities}
              onRollInitiative={handleRollInitiative}
              className="max-w-[420px]"
            />
          )}
          {/* Audio now-playing indicator */}
          {sessionState.audio?.playing && sessionState.audio.assetName && (
            <span className="mr-1 flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-purple-400" />
              {sessionState.audio.assetName}
            </span>
          )}
          {/* Scene type indicator */}
          {sceneType && (
            <span className="mr-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {sceneType}
            </span>
          )}
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => setFocusMode(true)}
            title="Focus map"
            aria-label="Focus map"
          >
            <Expand className="size-4" />
          </button>
        </div>
      )}
      leftRail={focusMode || !sceneType || sceneType === 'story' ? undefined : (
        <div className="flex h-full min-h-0 flex-col">
          {sceneType === 'battle' && combat && (
            <div className="min-h-0 flex-1">
              <AbilityPanel
                abilities={heroAbilities}
                usedActionTypes={usedActionTypes}
                onUseAbility={handleUseAbility}
              />
            </div>
          )}
          <ActionLogPanel
            entries={sessionState.actionLog ?? []}
            sceneType={sceneType}
            send={send}
            className={sceneType === 'battle' && combat ? 'max-h-[45%] shrink-0 border-t' : 'h-full'}
          />
        </div>
      )}
      rightRail={focusMode ? undefined : (
        combat ? (
          <div className="flex flex-col gap-3 overflow-y-auto p-3">
            {/* Turn action bar — shows action economy during player's turn */}
            <TurnActionBar
              turnActions={turnActions}
              isMyTurn={isMyTurn}
              baseSpeed={heroSpeed}
              heroicResource={heroicResource}
              resourceName={resourceName}
              conditions={heroConditions}
              onCatchBreath={handleCatchBreath}
              onDefend={handleDefend}
              onEndTurn={() => send({ type: 'combat_action', action: { type: 'END_TURN' } })}
            />

            {/* Combat tracker */}
            <CombatTracker
              combat={combat}
              entities={entities}
              isDirector={false}
              currentHeroEntityId={heroEntityId}
              onClaimTurn={(entityId) => send({ type: 'combat_action', action: { type: 'CLAIM_TURN', entityId } })}
              onSelectTurn={() => {}}
              onEndTurn={() => send({ type: 'combat_action', action: { type: 'END_TURN' } })}
              onEndCombat={() => {}}
              onAdjustMalice={() => {}}
              onRollInitiative={handleRollInitiative}
            />

            {/* Combat log */}
            <div className="h-40">
              <CombatLog entries={combatLog} entityNames={entityNames} />
            </div>
          </div>
        ) : undefined
      )}
      leftRailCollapsed={leftRailCollapsed}
      rightRailCollapsed={rightRailCollapsed}
      onToggleLeftRail={() => setLeftRailCollapsed((value) => !value)}
      onToggleRightRail={() => setRightRailCollapsed((value) => !value)}
      statusBar={
        <ParticipantStatusBar
          participants={participants}
          connectionStatus={connectionStatus}
        />
      }
    >
      {renderStage()}
    </AppShell>
  );
}
