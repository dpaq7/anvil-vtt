import { useCallback, useMemo, useState } from 'react';
import { AppShell } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SessionState, ClientMessage, AbilityResult } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { VitalsBar } from '../../components/session/VitalsBar.js';
import { StatusBar } from '../../components/session/StatusBar.js';
import { CombatTracker } from '../../components/session/CombatTracker.js';
import { MalicePanel } from '../../components/session/MalicePanel.js';
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
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { scenes, activeSceneId, participants, entities, combat } = sessionState;
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const sceneType = (activeScene?.type as SceneType) ?? null;
  const entityNames = useMemo(() => new Map(entities.map((e) => [e.id, e.name])), [entities]);

  const handleUseAbility = useCallback(
    (abilityId: string) => {
      // For now, send use_ability with self as source and first enemy as target (placeholder)
      const heroEntity = entities.find((e) => e.type === 'hero');
      const targetEntity = entities.find((e) => e.type !== 'hero');
      if (heroEntity && targetEntity) {
        send({ type: 'use_ability', sourceId: heroEntity.id, targetId: targetEntity.id, abilityId });
      }
    },
    [entities, send],
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
        return <StoryStage readAloudText="" isDirector={false} />;
      case 'montage':
        return (
          <MontageStage
            goal=""
            currentSuccesses={0}
            successLimit={5}
            currentFailures={0}
            failureLimit={3}
            outcome="pending"
            challenges={[]}
            isDirector={false}
          />
        );
      case 'negotiation':
        return (
          <NegotiationStage
            npcName="NPC"
            interest={0}
            targetInterest={5}
            patience={3}
            maxPatience={3}
            phase="active"
            motivations={[]}
            arguments={[]}
            isDirector={false}
          />
        );
      case 'respite':
        return (
          <RespiteStage
            location=""
            activities={[]}
            projects={[]}
            completed={false}
            isDirector={false}
          />
        );
      case 'battle':
        return (
          <BattleStage
            entities={entities}
            combat={combat}
            selectedEntityId={selectedEntityId}
            isDirector={false}
            onSelectEntity={setSelectedEntityId}
            send={send}
          />
        );
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
        <VitalsBar
          name="Hero"
          heroClass={null}
          level={1}
          currentStamina={20}
          maxStamina={20}
        />
      }
      leftRail={
        <AbilityPanel
          abilities={[]}
          usedActionTypes={[]}
          onUseAbility={handleUseAbility}
        />
      }
      rightRail={
        combat ? (
          <div className="flex flex-col gap-4 p-4">
            <CombatTracker
              combat={combat}
              entities={entities}
              isDirector={false}
              onNextTurn={() => {}}
              onEndCombat={() => {}}
            />
            <MalicePanel
              malice={combat.malice}
              isDirector={false}
              onAdjust={() => {}}
            />
            <div className="h-48">
              <CombatLog entries={combatLog} entityNames={entityNames} />
            </div>
          </div>
        ) : undefined
      }
      statusBar={
        <StatusBar
          sceneType={sceneType}
          connectionStatus={connectionStatus}
          participantCount={participants.length}
        />
      }
    >
      {renderStage()}
    </AppShell>
  );
}
