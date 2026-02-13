import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppShell } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SessionState, ClientMessage, AbilityResult } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { parseMontageData, parseNegotiationData, parseRespiteData, parseBattleData } from '../../lib/scene-data.js';
import { useAuthStore } from '../../stores/authStore.js';
import { VitalsBar } from '../../components/session/VitalsBar.js';
import { ParticipantStatusBar } from '../../components/session/ParticipantStatusBar.js';
import { CombatTracker } from '../../components/session/CombatTracker.js';
import { TurnActionBar } from '../../components/session/TurnActionBar.js';
import { AbilityPanel } from '../../components/session/AbilityPanel.js';
import { CombatLog } from '../../components/session/CombatLog.js';
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
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
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
      // Find the first enemy entity as default target
      const targetEntity = selectedEntityId
        ? entities.find((e) => e.id === selectedEntityId)
        : entities.find((e) => e.type === 'monster' || e.type === 'npc');

      if (!targetEntity) {
        toast.error('No target selected. Click an enemy on the map first.');
        return;
      }

      send({ type: 'use_ability', sourceId: heroEntity.id, targetId: targetEntity.id, abilityId });
      toast.info(`Using ability on ${targetEntity.name}...`);
    },
    [heroEntity, entities, selectedEntityId, send],
  );

  const handleCatchBreath = useCallback(() => {
    if (!heroEntity) return;
    const maxStamina = typeof heroEntity['maxStamina'] === 'number' ? (heroEntity['maxStamina'] as number) : 20;
    const recovery = Math.floor(maxStamina / 3);
    // Apply healing via combat action
    send({ type: 'combat_action', action: { type: 'APPLY_HEALING', entityId: heroEntity.id, amount: recovery } });
    toast.success(`Caught breath! Recovered ${recovery} stamina.`);
  }, [heroEntity, send]);

  const handleDefend = useCallback(() => {
    if (!heroEntity) return;
    // Apply defending condition
    send({ type: 'combat_action', action: { type: 'APPLY_CONDITION', entityId: heroEntity.id, condition: 'Defending' } });
    toast.info('Defending until your next turn.');
  }, [heroEntity, send]);

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
            phase={neg.phase}
            motivations={neg.motivations}
            pitfalls={neg.pitfalls}
            outcomes={neg.outcomes}
            isDirector={false}
          />
        );
      }
      case 'respite': {
        const respite = parseRespiteData(sceneData);
        return (
          <RespiteStage
            location={respite.location}
            activities={respite.activities}
            projects={respite.projects}
            completed={false}
            isDirector={false}
          />
        );
      }
      case 'battle': {
        const battle = parseBattleData(sceneData);
        return (
          <BattleStage
            entities={entities}
            combat={combat}
            selectedEntityId={selectedEntityId}
            isDirector={false}
            cols={battle.cols}
            rows={battle.rows}
            backgroundUrl={battle.backgroundUrl}
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
      topBar={
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
          {/* Scene type indicator */}
          {sceneType && (
            <span className="mr-2 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {sceneType}
            </span>
          )}
        </div>
      }
      leftRail={
        combat ? (
          <AbilityPanel
            abilities={heroAbilities}
            usedActionTypes={usedActionTypes}
            onUseAbility={handleUseAbility}
          />
        ) : undefined
      }
      rightRail={
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
            />

            {/* Combat log */}
            <div className="h-40">
              <CombatLog entries={combatLog} entityNames={entityNames} />
            </div>
          </div>
        ) : undefined
      }
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
