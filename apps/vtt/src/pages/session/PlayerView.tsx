import { useCallback, useMemo, useState } from 'react';
import { AppShell } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SessionState, ClientMessage, AbilityResult } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { useAuthStore } from '../../stores/authStore.js';
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
  const heroAbilities = (heroEntity?.['abilities'] as { id: string; name: string; keywords: string[]; actionType: string; distance: string; damage: string; cost: string; tier1Effect: string; tier2Effect: string; tier3Effect: string }[]) ?? [];

  const handleUseAbility = useCallback(
    (abilityId: string) => {
      if (!heroEntity) return;
      const targetEntity = entities.find((e) => e.type !== 'hero');
      if (targetEntity) {
        send({ type: 'use_ability', sourceId: heroEntity.id, targetId: targetEntity.id, abilityId });
      }
    },
    [heroEntity, entities, send],
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
      case 'montage':
        return (
          <MontageStage
            goal={(sceneData['goal'] as string) ?? ''}
            currentSuccesses={0}
            successLimit={(sceneData['successesNeeded'] as number) ?? 5}
            currentFailures={0}
            failureLimit={(sceneData['failureLimit'] as number) ?? 3}
            outcome="pending"
            challenges={(sceneData['challenges'] as { id: string; name: string; completed: boolean }[]) ?? []}
            isDirector={false}
          />
        );
      case 'negotiation':
        return (
          <NegotiationStage
            npcName={(sceneData['npcName'] as string) ?? 'NPC'}
            npcAttitude={(sceneData['npcAttitude'] as string) ?? 'neutral'}
            interest={(sceneData['interest'] as number) ?? 0}
            patience={(sceneData['patience'] as number) ?? 3}
            maxPatience={(sceneData['maxPatience'] as number) ?? 5}
            phase={(sceneData['phase'] as 'active' | 'success' | 'failure') ?? 'active'}
            motivations={
              (sceneData['motivations'] as { id: string; type: string; description: string; revealed: boolean }[])?.map(
                (m) => ({ ...m, type: m.type as import('@anvil/types').MotivationType })
              ) ?? []
            }
            pitfalls={
              (sceneData['pitfalls'] as { id: string; type: string; description: string; revealed: boolean }[])?.map(
                (p) => ({ ...p, type: p.type as import('@anvil/types').MotivationType })
              ) ?? []
            }
            outcomes={(sceneData['outcomes'] as Record<number, string>) ?? {}}
            isDirector={false}
          />
        );
      case 'respite':
        return (
          <RespiteStage
            location={(sceneData['location'] as string) ?? ''}
            activities={(sceneData['activities'] as { heroName: string; activityType: string; completed: boolean }[]) ?? []}
            projects={(sceneData['projects'] as { id: string; name: string; currentPoints: number; goalPoints: number }[]) ?? []}
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
          name={(heroEntity?.name as string) ?? 'Hero'}
          heroClass={(heroEntity?.['heroClass'] as string) ?? null}
          level={(heroEntity?.['level'] as number) ?? 1}
          currentStamina={(heroEntity?.['currentStamina'] as number) ?? 20}
          maxStamina={(heroEntity?.['maxStamina'] as number) ?? 20}
        />
      }
      leftRail={
        <AbilityPanel
          abilities={heroAbilities}
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
