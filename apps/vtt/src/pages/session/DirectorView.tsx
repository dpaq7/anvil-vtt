import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import { AppShell, Button } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SessionState, ParticipantInfo, AbilityResult } from '../../types/protocol.js';
import type { ClientMessage } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { FilmStrip } from '../../components/session/FilmStrip.js';
import { StatusBar } from '../../components/session/StatusBar.js';
import { CombatTracker } from '../../components/session/CombatTracker.js';
import { MalicePanel } from '../../components/session/MalicePanel.js';
import { DamageDialog } from '../../components/session/DamageDialog.js';
import { CombatLog } from '../../components/session/CombatLog.js';
import { AssetPanel } from '../../components/session/AssetPanel.js';
import { StoryStage } from '../../components/stages/StoryStage.js';
import { MontageStage } from '../../components/stages/MontageStage.js';
import { NegotiationStage } from '../../components/stages/NegotiationStage.js';
import { RespiteStage } from '../../components/stages/RespiteStage.js';
import { BattleStage } from '../../components/stages/BattleStage.js';

interface DirectorViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
}

export function DirectorView({ sessionState, connectionStatus, send, combatLog }: DirectorViewProps) {
  const navigate = useNavigate();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const { scenes, activeSceneId, participants, entities, combat } = sessionState;
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const sceneType = (activeScene?.type as SceneType) ?? null;
  const entityNames = new Map(entities.map((e) => [e.id, e.name]));

  const handleSelectScene = useCallback(
    (sceneId: string) => {
      send({ type: 'switch_scene', sceneId });
    },
    [send],
  );

  const [showHelp, setShowHelp] = useState(false);
  const [showAssets, setShowAssets] = useState(false);

  const heroCount = useMemo(
    () => entities.filter((e) => e.type === 'hero').length,
    [entities],
  );

  const handleEndSession = useCallback(() => {
    send({ type: 'end_session' });
    navigate('/app/campaigns');
  }, [send, navigate]);

  useKeyboardShortcuts({
    onEscape: () => setSelectedEntityId(null),
    onSpace: () => {
      if (combat) send({ type: 'combat_action', action: { type: 'NEXT_TURN' } });
    },
    onHelp: () => setShowHelp((v) => !v),
  });

  const sceneData = activeScene?.data ?? {};

  const renderStage = () => {
    if (!activeScene) {
      return (
        <div className="flex h-full items-center justify-center text-zinc-500">
          Select a scene from the film strip below.
        </div>
      );
    }

    switch (sceneType) {
      case 'story':
        return (
          <StoryStage
            readAloudText={(sceneData['readAloud'] as string) ?? ''}
            directorNotes={(sceneData['notes'] as string) ?? ''}
            isDirector
          />
        );
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
            isDirector
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
            isDirector
          />
        );
      case 'respite':
        return (
          <RespiteStage
            location={(sceneData['location'] as string) ?? ''}
            activities={(sceneData['activities'] as { heroName: string; activityType: string; completed: boolean }[]) ?? []}
            projects={(sceneData['projects'] as { id: string; name: string; currentPoints: number; goalPoints: number }[]) ?? []}
            completed={false}
            isDirector
          />
        );
      case 'battle':
        return (
          <BattleStage
            entities={entities}
            combat={combat}
            selectedEntityId={selectedEntityId}
            isDirector
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
        <div className="flex w-full items-center justify-between">
          <span className="text-sm font-semibold text-zinc-300">
            Session
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant={showAssets ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowAssets((v) => !v)}
              title="Toggle Assets Panel"
            >
              <Package className="mr-1 size-3.5" />
              Assets
            </Button>
            <Button variant="ghost" size="sm" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>
      }
      leftRail={
        <div className="flex flex-col gap-4 p-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-zinc-500">Participants</p>
            <div className="flex flex-col gap-1">
              {participants.map((p: ParticipantInfo) => (
                <div key={p.userId} className="flex items-center gap-2 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${p.connected ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                  />
                  <span className="text-zinc-300">{p.username}</span>
                  <span className="text-zinc-600">{p.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      rightRail={
        <div className="flex h-full flex-col overflow-hidden">
          {showAssets && sceneType ? (
            <div className="flex-1 overflow-y-auto p-2">
              <AssetPanel
                sceneType={sceneType}
                sceneId={activeScene?.id ?? ''}
                campaignId={sessionState.campaignId}
                heroCount={heroCount}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-4 p-4">
              {combat && (
                <>
                  <CombatTracker
                    combat={combat}
                    entities={entities}
                    isDirector
                    onNextTurn={() => send({ type: 'combat_action', action: { type: 'NEXT_TURN' } })}
                    onEndCombat={() => send({ type: 'combat_action', action: { type: 'END_COMBAT' } })}
                  />
                  <MalicePanel
                    malice={combat.malice}
                    isDirector
                    onAdjust={(delta) => send({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta } })}
                  />
                  <DamageDialog
                    entities={entities}
                    onApplyDamage={(entityId, amount) => send({ type: 'combat_action', action: { type: 'APPLY_DAMAGE', entityId, amount } })}
                    onApplyHealing={(entityId, amount) => send({ type: 'combat_action', action: { type: 'APPLY_HEALING', entityId, amount } })}
                  />
                  <div className="h-48">
                    <CombatLog entries={combatLog} entityNames={entityNames} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      }
      filmStrip={
        <FilmStrip
          scenes={scenes}
          activeSceneId={activeSceneId}
          onSelectScene={handleSelectScene}
        />
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
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80" onClick={() => setShowHelp(false)}>
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <p className="mb-4 text-sm font-semibold text-zinc-200">Keyboard Shortcuts</p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-8">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">Esc</kbd>
                <span className="text-zinc-400">Deselect / Close</span>
              </div>
              <div className="flex justify-between gap-8">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">Space</kbd>
                <span className="text-zinc-400">Next Turn</span>
              </div>
              <div className="flex justify-between gap-8">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">?</kbd>
                <span className="text-zinc-400">Toggle Help</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
