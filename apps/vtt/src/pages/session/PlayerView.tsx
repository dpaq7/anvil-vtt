import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { Expand, Minimize2 } from 'lucide-react';
import { AppShell, Tabs, TabsContent, TabsList, TabsTrigger } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import { findSkillByName } from '@anvil/data';
import type {
  SessionState,
  ClientMessage,
  AbilityResult,
} from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import {
  parseMontageData,
  parseNegotiationData,
  parseRespiteData,
  parseBattleData,
} from '../../lib/scene-data.js';
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
import { NegotiationArgumentPanel, NegotiationStage } from '../../components/stages/NegotiationStage.js';
import { RespiteStage } from '../../components/stages/RespiteStage.js';
import { BattleStage } from '../../components/stages/BattleStage.js';
import { SceneBackdrop } from '../../components/stages/SceneBackdrop.js';
import { getSceneBackgroundUrl } from '../../lib/scene-backgrounds.js';
import { ActivePlayersPanel } from '../../components/session/ActivePlayersPanel.js';
import { LiveAudioPanel } from '../../components/session/LiveAudioPanel.js';

interface PlayerViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
}

export function PlayerView({
  sessionState,
  connectionStatus,
  send,
  combatLog,
}: PlayerViewProps) {
  const user = useAuthStore((s) => s.user);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.4);
  const [audioMuted, setAudioMuted] = useState(false);
  const initiativePromptedRef = useRef(false);
  const audioSync = useAudioSync(sessionState.audio, { volume: audioVolume, muted: audioMuted });
  const { scenes, activeSceneId, participants, entities, combat } =
    sessionState;
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const sceneType = (activeScene?.type as SceneType) ?? null;
  const sceneData = activeScene?.data ?? {};
  const entityNames = useMemo(
    () => new Map(entities.map((e) => [e.id, e.name])),
    [entities],
  );

  // Find this player's hero entity
  const me = participants.find((p) => p.userId === user?.id);
  const heroEntity =
    entities.find((e) => e.id === me?.heroId) ??
    entities.find((e) => e.type === 'hero');
  const heroEntityId = heroEntity?.id ?? null;
  const heroSkillIds = useMemo(() => getHeroSkillIds(heroEntity), [heroEntity]);

  // Hero combat state
  const isMyTurn = combat?.activeEntityId === heroEntityId;
  const turnActions = heroEntityId
    ? (combat?.turnActions?.[heroEntityId] ?? null)
    : null;
  const heroAbilities =
    (heroEntity?.['abilities'] as {
      id: string;
      name: string;
      keywords: string[];
      actionType: string;
      distance: string;
      damage: string;
      cost: string;
      tier1Effect: string;
      tier2Effect: string;
      tier3Effect: string;
    }[]) ?? [];
  const heroConditions = Array.isArray(heroEntity?.['conditions'])
    ? (heroEntity['conditions'] as string[])
    : [];
  const heroSpeed =
    typeof heroEntity?.['speed'] === 'number'
      ? (heroEntity['speed'] as number)
      : 5;
  const heroicResource =
    typeof heroEntity?.['heroicResource'] === 'number'
      ? (heroEntity['heroicResource'] as number)
      : 0;
  const resourceName =
    (heroEntity?.['heroicResourceName'] as string) ?? 'Resource';
  const initiativePending =
    sceneType === 'battle' && combat?.initiativeRoll === null;

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
    if (turnActions.mainActionUsed || turnActions.mainConvertedTo !== null)
      used.push('action', 'main');
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
        ? entities.find(
            (e) =>
              e.id === selectedEntityId &&
              (e.type === 'monster' || e.type === 'npc'),
          )
        : null;
      const targetEntity =
        selectedTarget ??
        entities.find((e) => e.type === 'monster' || e.type === 'npc');

      if (!targetEntity) {
        toast.error(
          'No enemy target selected. Click an enemy on the map first.',
        );
        return;
      }

      send({
        type: 'token_action',
        action: {
          kind: 'ability',
          sourceId: heroEntity.id,
          targetId: targetEntity.id,
          abilityId,
        },
      });
      toast.info(`Using ability on ${targetEntity.name}...`);
    },
    [combat, heroEntity, entities, isMyTurn, selectedEntityId, send],
  );

  const handleCatchBreath = useCallback(() => {
    if (!heroEntity) return;
    send({
      type: 'token_action',
      action: {
        kind: 'catch-breath',
        sourceId: heroEntity.id,
        targetId: heroEntity.id,
      },
    });
    toast.success('Caught breath! Recovering stamina...');
  }, [heroEntity, send]);

  const handleDefend = useCallback(() => {
    if (!heroEntity) return;
    send({
      type: 'token_action',
      action: {
        kind: 'defend',
        sourceId: heroEntity.id,
        targetId: heroEntity.id,
      },
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

    const renderWithBackground = (children: ReactNode) => (
      <SceneBackdrop
        backgroundUrl={getSceneBackgroundUrl(
          sceneData,
          sceneType,
          activeScene.order_index,
        )}
      >
        {children}
      </SceneBackdrop>
    );

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
        // Use live state from server if available
        const liveMontage = sessionState.montage;
        return renderWithBackground(
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
          />,
        );
      }
      case 'negotiation': {
        const neg = parseNegotiationData(sceneData);
        // Use live state from server if available
        const liveNeg = sessionState.negotiation;
        return renderWithBackground(
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
            availableSkillIds={heroSkillIds}
            showPlayerArgumentPanel={false}
          />,
        );
      }
      case 'respite': {
        const respite = parseRespiteData(sceneData);
        const liveRespite = sessionState.respite;
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
            currentUserId={user?.id}
            onClaimActivity={handleRespiteClaimActivity}
            onCompleteActivity={handleRespiteCompleteActivity}
          />,
        );
      }
      case 'battle': {
        const battle = parseBattleData(sceneData);
        // Client-side fog of war: hide monsters inside fog zones
        const visibleEntities = filterVisibleEntities(
          entities,
          battle.fogZones,
        );
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
            heroPosition={
              heroEntity ? { x: heroEntity.x, y: heroEntity.y } : null
            }
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
        focusMode ? (
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
                currentStamina={
                  (heroEntity?.['currentStamina'] as number) ?? 20
                }
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
        )
      }
      leftRail={
        focusMode || !sceneType || sceneType === 'story' ? undefined : (
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
              className={
                sceneType === 'battle' && combat
                  ? 'max-h-[45%] shrink-0 border-t'
                  : 'h-full'
              }
            />
          </div>
        )
      }
      rightRail={
        focusMode || !sceneType ? undefined : (
          <Tabs
            key={`${activeSceneId ?? 'none'}-${sceneType}`}
            defaultValue={sceneType === 'negotiation' ? 'skills' : 'sheet'}
            className="flex h-full flex-col overflow-hidden"
          >
            <TabsList
              className={`m-3 mb-0 grid h-8 shrink-0 ${sceneType === 'negotiation' ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
              {sceneType === 'negotiation' && (
                <TabsTrigger value="skills" className="px-2 py-1 text-xs">
                  Skills
                </TabsTrigger>
              )}
              <TabsTrigger value="sheet" className="px-2 py-1 text-xs">
                Sheet
              </TabsTrigger>
              <TabsTrigger value="players" className="px-2 py-1 text-xs">
                Players
              </TabsTrigger>
              <TabsTrigger value="audio" className="px-2 py-1 text-xs">
                Audio
              </TabsTrigger>
            </TabsList>

            {sceneType === 'negotiation' && (
              <TabsContent value="skills" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
                <NegotiationArgumentPanel
                  availableSkillIds={heroSkillIds}
                  onMakeArgument={handleNegotiationArgument}
                  className="border-zinc-800 bg-zinc-900/70"
                />
              </TabsContent>
            )}

            <TabsContent value="sheet" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
              {combat ? (
                <div className="flex flex-col gap-3">
                  <TurnActionBar
                    turnActions={turnActions}
                    isMyTurn={isMyTurn}
                    baseSpeed={heroSpeed}
                    heroicResource={heroicResource}
                    resourceName={resourceName}
                    conditions={heroConditions}
                    onCatchBreath={handleCatchBreath}
                    onDefend={handleDefend}
                    onEndTurn={() =>
                      send({ type: 'combat_action', action: { type: 'END_TURN' } })
                    }
                  />
                  <CombatTracker
                    combat={combat}
                    entities={entities}
                    isDirector={false}
                    currentHeroEntityId={heroEntityId}
                    onClaimTurn={(entityId) =>
                      send({
                        type: 'combat_action',
                        action: { type: 'CLAIM_TURN', entityId },
                      })
                    }
                    onSelectTurn={() => {}}
                    onEndTurn={() =>
                      send({ type: 'combat_action', action: { type: 'END_TURN' } })
                    }
                    onEndCombat={() => {}}
                    onAdjustMalice={() => {}}
                    onRollInitiative={handleRollInitiative}
                  />
                  <div className="h-40">
                    <CombatLog entries={combatLog} entityNames={entityNames} />
                  </div>
                </div>
              ) : (
                <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3">
                  <p className="text-sm font-medium text-zinc-200">{heroEntity?.name ?? 'Hero'}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {(heroEntity?.['heroClass'] as string) ?? 'Hero'} · Level {(heroEntity?.['level'] as number) ?? 1}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <StatPill label="Stamina" value={`${(heroEntity?.['currentStamina'] as number) ?? 0}/${(heroEntity?.['maxStamina'] as number) ?? 0}`} />
                    <StatPill label={resourceName} value={heroicResource} />
                    <StatPill label="Speed" value={heroSpeed} />
                    <StatPill label="Skills" value={heroSkillIds.length} />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="players" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
              <ActivePlayersPanel participants={participants} entities={entities} currentUserId={user?.id} />
            </TabsContent>

            <TabsContent value="audio" className="mt-0 min-h-0 flex-1 overflow-y-auto p-3">
              <LiveAudioPanel
                audio={sessionState.audio}
                volume={audioVolume}
                muted={audioMuted}
                playing={audioSync.playing}
                blocked={audioSync.blocked}
                onVolumeChange={setAudioVolume}
                onMutedChange={setAudioMuted}
                onRetry={audioSync.retry}
              />
            </TabsContent>
          </Tabs>
        )
      }
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

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-zinc-950 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

function getHeroSkillIds(heroEntity: SessionState['entities'][number] | undefined): string[] {
  const rawSkills = heroEntity?.['skills'];
  if (!Array.isArray(rawSkills)) return [];
  const seen = new Set<string>();
  for (const value of rawSkills) {
    if (typeof value !== 'string') continue;
    const skill = findSkillByName(value);
    if (skill) seen.add(skill.id);
  }
  return [...seen];
}
