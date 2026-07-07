import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Expand, Minimize2, Volume2, VolumeX } from "lucide-react";
import { AppShell, Tabs, TabsContent, TabsList, TabsTrigger } from "@anvil/ui";
import type { SceneType } from "@anvil/ui";
import type {
  SessionState,
  ClientMessage,
  AbilityResult,
} from "../../types/protocol.js";
import type { ConnectionStatus } from "../../hooks/useSessionSocket.js";
import {
  parseMontageData,
  parseNegotiationData,
  parseRespiteData,
  parseBattleData,
} from "../../lib/scene-data.js";
import { filterVisibleEntities } from "../../lib/fog-visibility.js";
import { useAuthStore } from "../../stores/authStore.js";
import { useAudioSync } from "../../hooks/useAudioSync.js";
import { ParticipantStatusBar } from "../../components/session/ParticipantStatusBar.js";
import { CombatTracker } from "../../components/session/CombatTracker.js";
import { TurnActionBar } from "../../components/session/TurnActionBar.js";
import { AbilityPanel } from "../../components/session/AbilityPanel.js";
import type { AbilityInfo } from "../../components/session/AbilityCard.js";
import { ActionLogPanel } from "../../components/session/ActionLogPanel.js";
import { useTargetingResolution } from "../../hooks/useTargetingResolution.js";
import type { PendingTargetedAction } from "../../lib/targeting.js";
import { conditionNames } from "../../lib/conditions.js";
import {
  PlayerHeroCommandBar,
  PlayerHeroSheetPanel,
} from "../../components/session/PlayerHeroLiveSheet.js";
import { SessionThemeToggle } from "../../components/session/SessionThemeToggle.js";
import type { CharacterInventoryItem } from "../../lib/inventory.js";
import { StoryStage } from "../../components/stages/StoryStage.js";
import { MontageStage } from "../../components/stages/MontageStage.js";
import { NegotiationStage } from "../../components/stages/NegotiationStage.js";
import { RespiteStage } from "../../components/stages/RespiteStage.js";
import { BattleStage } from "../../components/stages/BattleStage.js";
import { SceneBackdrop } from "../../components/stages/SceneBackdrop.js";
import { getSceneBackgroundUrl } from "../../lib/scene-backgrounds.js";

interface PlayerViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
}

type RightRailTab = "sheet" | "abilities" | "turn" | "combat" | "log";

const RAIL_TABS_LIST_CLASS =
  "flex h-9 w-full justify-start overflow-x-auto rounded-none border-b border-zinc-800 bg-zinc-950/40 p-0 px-2 pt-1";
const RAIL_TAB_TRIGGER_CLASS =
  "h-8 min-w-16 shrink-0 whitespace-nowrap rounded-b-none rounded-t-md border border-transparent border-b-0 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 transition data-[state=active]:border-zinc-700 data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 data-[state=inactive]:hover:bg-zinc-800/50 data-[state=inactive]:hover:text-zinc-300";
const RAIL_TAB_CONTENT_CLASS =
  "mt-0 min-h-0 flex-1 overflow-hidden focus-visible:ring-0";

export function PlayerView({
  sessionState,
  connectionStatus,
  send,
  combatLog,
}: PlayerViewProps) {
  const user = useAuthStore((s) => s.user);

  // Sync server audio commands to local HTML5 Audio playback
  const audioPlayback = useAudioSync(sessionState.audio);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingTargetedAction | null>(
    null,
  );
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [rightRailTab, setRightRailTab] = useState<RightRailTab>("sheet");
  const [focusMode, setFocusMode] = useState(false);
  const initiativePromptedRef = useRef(false);
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
    entities.find((e) => e.type === "hero");
  const heroEntityId = heroEntity?.id ?? null;

  // Hero combat state
  const isMyTurn = combat?.activeEntityId === heroEntityId;
  const turnActions = heroEntityId
    ? (combat?.turnActions?.[heroEntityId] ?? null)
    : null;
  const heroAbilities = useMemo(
    () => (heroEntity?.["abilities"] as AbilityInfo[] | undefined) ?? [],
    [heroEntity],
  );
  const heroConditions = conditionNames(heroEntity) as string[];
  const heroSpeed =
    typeof heroEntity?.["speed"] === "number"
      ? (heroEntity["speed"] as number)
      : 5;
  const heroicResource =
    typeof heroEntity?.["heroicResource"] === "number"
      ? (heroEntity["heroicResource"] as number)
      : 0;
  const resourceName =
    (heroEntity?.["heroicResourceName"] as string) ?? "Resource";
  const initiativePending =
    sceneType === "battle" && combat?.initiativeRoll === null;

  // Resolve targeting for the pending action (range / flanking / high ground).
  const targetingSource = pendingAction
    ? (entities.find((e) => e.id === pendingAction.sourceId) ?? null)
    : null;
  const targeting = useTargetingResolution({
    sourceEntity: targetingSource,
    entities,
    distance: pendingAction?.distance,
  });

  const handleSelectEntity = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId);
    setSelectedEntityIds(entityId ? [entityId] : []);
  }, []);

  const handleSelectEntities = useCallback((entityIds: string[]) => {
    setSelectedEntityIds(entityIds);
    setSelectedEntityId(entityIds[0] ?? null);
  }, []);

  useEffect(() => {
    if (initiativePending && !initiativePromptedRef.current) {
      initiativePromptedRef.current = true;
      toast.info("Combat started. Roll initiative d10.");
    } else if (!initiativePending) {
      initiativePromptedRef.current = false;
    }
  }, [initiativePending]);

  useEffect(() => {
    handleSelectEntity(null);
    setPendingAction(null);
  }, [activeSceneId, handleSelectEntity]);

  // Leave targeting mode if the turn ends while an action is pending.
  useEffect(() => {
    if (!isMyTurn) setPendingAction(null);
  }, [isMyTurn]);

  // Determine which action types have been used (for ability panel greying out)
  const usedActionTypes = useMemo(() => {
    if (!turnActions) return [];
    const used: string[] = [];
    if (turnActions.mainActionUsed || turnActions.mainConvertedTo !== null)
      used.push("action", "main");
    if (turnActions.maneuverUsed) used.push("maneuver");
    if (turnActions.triggeredUsedThisRound) used.push("triggered");
    return used;
  }, [turnActions]);

  const rightRailTabs = useMemo<RightRailTab[]>(() => {
    const tabs: RightRailTab[] = ["sheet"];
    if (heroAbilities.length > 0) tabs.push("abilities");
    if (combat) tabs.push("turn", "combat");
    if (sceneType) tabs.push("log");
    return tabs;
  }, [combat, heroAbilities.length, sceneType]);

  useEffect(() => {
    if (!rightRailTabs.includes(rightRailTab)) {
      setRightRailTab(rightRailTabs[0] ?? "sheet");
    }
  }, [rightRailTab, rightRailTabs]);

  const openRightRailTab = useCallback((tab: RightRailTab) => {
    setRightRailCollapsed(false);
    setRightRailTab(tab);
  }, []);

  // Tapping an ability enters on-canvas targeting mode rather than firing
  // immediately; the confirmed target sends the existing token_action.
  const handleUseAbility = useCallback(
    (abilityId: string) => {
      if (!heroEntity) return;
      if (!combat || !isMyTurn) {
        toast.error("Wait until you take your turn.");
        return;
      }
      const ability = heroAbilities.find((item) => item.id === abilityId);
      if (!ability) return;
      const hasEnemy = entities.some(
        (e) => e.type === "monster" || e.type === "npc",
      );
      if (!hasEnemy) {
        toast.error("No enemy targets available.");
        return;
      }
      setPendingAction({
        sourceId: heroEntity.id,
        kind: "ability",
        abilityId: ability.id,
        label: ability.name,
        distance: ability.distance,
      });
    },
    [combat, heroEntity, heroAbilities, entities, isMyTurn],
  );

  // The token context menu requests targeting for an arbitrary action.
  const handleRequestTargeting = useCallback((action: PendingTargetedAction) => {
    setPendingAction(action);
  }, []);

  const handleTargetConfirm = useCallback(
    (targetId: string) => {
      if (!pendingAction) return;
      const target = entities.find((e) => e.id === targetId);
      if (!target) return;
      const { sourceId, kind, abilityId, label } = pendingAction;
      send({
        type: "token_action",
        action: {
          kind,
          sourceId,
          targetId: target.id,
          ...(abilityId ? { abilityId } : {}),
        },
      });
      toast.info(`${label} → ${target.name}...`);
      setPendingAction(null);
    },
    [entities, pendingAction, send],
  );

  const handleTargetCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  const battleTargetingContext = useMemo(
    () =>
      pendingAction && targetingSource
        ? {
            sourceId: pendingAction.sourceId,
            abilityName: pendingAction.label,
            parsedDistance: targeting.parsedDistance,
            rangeSquares: targeting.rangeSquares,
            inRangeById: targeting.inRangeById,
            flankingByTargetId: targeting.flankingByTargetId,
            highGroundByTargetId: targeting.highGroundByTargetId,
          }
        : null,
    [pendingAction, targetingSource, targeting],
  );

  const handleRollCharacteristic = useCallback(
    (label: string, modifier: number) => {
      if (!heroEntity) return;
      send({
        type: "draw_steel_roll",
        roll: {
          kind: "power",
          label,
          modifier,
          sourceId: heroEntity.id,
        },
      });
      toast.info(`Rolling ${label}...`);
    },
    [heroEntity, send],
  );

  const handleRollResource = useCallback(() => {
    if (!heroEntity) return;
    send({
      type: "draw_steel_roll",
      roll: {
        kind: "heroic-resource",
        label: resourceName,
        sourceId: heroEntity.id,
      },
    });
    toast.info(`Rolling ${resourceName}...`);
  }, [heroEntity, resourceName, send]);

  const handleCatchBreath = useCallback(() => {
    if (!heroEntity) return;
    if (!combat || !isMyTurn) {
      toast.info("Catch Breath is available on your turn.");
      return;
    }
    send({
      type: "token_action",
      action: {
        kind: "catch-breath",
        sourceId: heroEntity.id,
        targetId: heroEntity.id,
      },
    });
    toast.success("Caught breath! Recovering stamina...");
  }, [combat, heroEntity, isMyTurn, send]);

  const handleDefend = useCallback(() => {
    if (!heroEntity) return;
    if (!combat || !isMyTurn) {
      toast.info("Defend is available on your turn.");
      return;
    }
    send({
      type: "token_action",
      action: {
        kind: "defend",
        sourceId: heroEntity.id,
        targetId: heroEntity.id,
      },
    });
    toast.info("Defending until your next turn.");
  }, [combat, heroEntity, isMyTurn, send]);

  const handleStandUp = useCallback(() => {
    if (!heroEntity) return;
    if (!combat || !isMyTurn) {
      toast.info("Stand Up is available on your turn.");
      return;
    }
    send({
      type: "token_action",
      action: {
        kind: "stand-up",
        sourceId: heroEntity.id,
        targetId: heroEntity.id,
      },
    });
    toast.info("Standing up...");
  }, [combat, heroEntity, isMyTurn, send]);

  const handleEscapeGrab = useCallback(() => {
    if (!heroEntity) return;
    if (!combat || !isMyTurn) {
      toast.info("Escape is available on your turn.");
      return;
    }
    send({
      type: "token_action",
      action: {
        kind: "escape-grab",
        sourceId: heroEntity.id,
        targetId: heroEntity.id,
      },
    });
    toast.info("Escaping grab...");
  }, [combat, heroEntity, isMyTurn, send]);

  const handleInventoryChange = useCallback(
    (inventory: CharacterInventoryItem[]) => {
      if (!heroEntity) return;
      send({ type: "update_inventory", heroId: heroEntity.id, inventory });
    },
    [heroEntity, send],
  );

  const handleRollInitiative = useCallback(() => {
    send({ type: "combat_action", action: { type: "ROLL_INITIATIVE" } });
  }, [send]);

  // ── Non-battle scene handlers ──

  const handleMontageRoll = useCallback(
    (skillId: string, characteristicId: string) => {
      send({ type: "montage_roll", skillId, characteristicId });
      toast.info("Rolling montage test...");
    },
    [send],
  );

  const handleNegotiationArgument = useCallback(
    (skillId: string, approachText: string) => {
      send({ type: "negotiation_argument", skillId, approachText });
      toast.info("Making your argument...");
    },
    [send],
  );

  const handleRespiteClaimActivity = useCallback(
    (activityId: string) => {
      send({ type: "respite_choose_activity", activityId });
      toast.info("Claiming activity...");
    },
    [send],
  );

  const handleRespiteCompleteActivity = useCallback(
    (activityId: string) => {
      send({ type: "respite_complete_activity", activityId });
      toast.success("Activity completed!");
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
      case "story":
        return renderWithBackground(
          <StoryStage
            readAloudText={(sceneData["readAloud"] as string) ?? ""}
            isDirector={false}
          />,
        );
      case "montage": {
        const montage = parseMontageData(sceneData);
        // Use live state from server if available
        const liveMontage = sessionState.montage;
        return renderWithBackground(
          <MontageStage
            goal={montage.goal}
            roundLimit={montage.roundLimit}
            heroCount={montage.heroCount}
            currentSuccesses={liveMontage?.successes ?? 0}
            successLimit={liveMontage?.successLimit ?? montage.successLimit}
            currentFailures={liveMontage?.failures ?? 0}
            failureLimit={liveMontage?.failureLimit ?? montage.failureLimit}
            outcome={liveMontage?.outcome ?? "pending"}
            totalSuccess={montage.totalSuccess}
            partialSuccess={montage.partialSuccess}
            totalFailure={montage.totalFailure}
            challenges={montage.challenges}
            isDirector={false}
            testLog={liveMontage?.testLog}
            onMontageRoll={handleMontageRoll}
          />,
        );
      }
      case "negotiation": {
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
          />,
        );
      }
      case "respite": {
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
      case "battle": {
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
            selectedEntityIds={selectedEntityIds}
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
            heroPosition={
              heroEntity ? { x: heroEntity.x, y: heroEntity.y } : null
            }
            combatLog={combatLog}
            entityNames={entityNames}
            targetingContext={battleTargetingContext}
            onTargetConfirm={handleTargetConfirm}
            onTargetCancel={handleTargetCancel}
            onRequestTargeting={handleRequestTargeting}
            ownHeroEntityId={heroEntityId}
            onSelectEntity={handleSelectEntity}
            onSelectEntities={handleSelectEntities}
            onRollInitiative={handleRollInitiative}
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
          <div className="flex w-full min-w-0 items-center gap-2">
            <PlayerHeroCommandBar
              hero={heroEntity ?? null}
              combatActive={Boolean(combat)}
              onCatchBreath={handleCatchBreath}
              onRollCharacteristic={handleRollCharacteristic}
              onRollResource={handleRollResource}
              onOpenSheet={() => openRightRailTab("sheet")}
            />
            {/* Audio now-playing indicator */}
            {sessionState.audio?.playing &&
              sessionState.audio.assetName &&
              (audioPlayback.needsUserGesture ? (
                <button
                  type="button"
                  className="mr-1 inline-flex shrink-0 items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20"
                  onClick={() => {
                    void audioPlayback.retryPlayback();
                  }}
                  title={audioPlayback.error ?? "Click to enable scene audio"}
                >
                  <VolumeX className="size-3" />
                  Enable audio
                </button>
              ) : audioPlayback.status === "error" ? (
                <span
                  className="mr-1 inline-flex shrink-0 items-center gap-1 rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300"
                  title={
                    audioPlayback.error ?? "Scene audio could not be played"
                  }
                >
                  <VolumeX className="size-3" />
                  Audio unavailable
                </span>
              ) : (
                <span className="mr-1 flex shrink-0 items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-purple-400" />
                  <Volume2 className="size-3" />
                  {sessionState.audio.assetName}
                </span>
              ))}
            {/* Scene type indicator */}
            {sceneType && (
              <span className="mr-2 shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                {sceneType}
              </span>
            )}
            <SessionThemeToggle />
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
      rightRail={
        focusMode ? undefined : (
          <Tabs
            value={rightRailTab}
            onValueChange={(value) => setRightRailTab(value as RightRailTab)}
            className="flex h-full min-h-0 flex-col overflow-hidden"
          >
            <TabsList className={RAIL_TABS_LIST_CLASS}>
              {rightRailTabs.includes("sheet") && (
                <TabsTrigger value="sheet" className={RAIL_TAB_TRIGGER_CLASS}>
                  Sheet
                </TabsTrigger>
              )}
              {rightRailTabs.includes("abilities") && (
                <TabsTrigger
                  value="abilities"
                  className={RAIL_TAB_TRIGGER_CLASS}
                >
                  Abilities
                </TabsTrigger>
              )}
              {rightRailTabs.includes("turn") && (
                <TabsTrigger value="turn" className={RAIL_TAB_TRIGGER_CLASS}>
                  Turn
                </TabsTrigger>
              )}
              {rightRailTabs.includes("combat") && (
                <TabsTrigger value="combat" className={RAIL_TAB_TRIGGER_CLASS}>
                  Combat
                </TabsTrigger>
              )}
              {rightRailTabs.includes("log") && (
                <TabsTrigger value="log" className={RAIL_TAB_TRIGGER_CLASS}>
                  Log
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="sheet" className={RAIL_TAB_CONTENT_CLASS}>
              <PlayerHeroSheetPanel
                hero={heroEntity ?? null}
                combatActive={Boolean(combat)}
                isMyTurn={isMyTurn}
                abilityCount={heroAbilities.length}
                onRollCharacteristic={handleRollCharacteristic}
                onRollResource={handleRollResource}
                onCatchBreath={handleCatchBreath}
                onDefend={handleDefend}
                onStandUp={handleStandUp}
                onEscapeGrab={handleEscapeGrab}
                onOpenAbilities={() => openRightRailTab("abilities")}
                onInventoryChange={handleInventoryChange}
              />
            </TabsContent>

            <TabsContent value="abilities" className={RAIL_TAB_CONTENT_CLASS}>
              <AbilityPanel
                abilities={heroAbilities}
                usedActionTypes={usedActionTypes}
                onUseAbility={handleUseAbility}
              />
            </TabsContent>

            {combat && (
              <TabsContent value="turn" className={RAIL_TAB_CONTENT_CLASS}>
                <div className="h-full overflow-y-auto p-3">
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
                      send({
                        type: "combat_action",
                        action: { type: "END_TURN" },
                      })
                    }
                  />
                </div>
              </TabsContent>
            )}

            {combat && (
              <TabsContent value="combat" className={RAIL_TAB_CONTENT_CLASS}>
                <div className="h-full overflow-y-auto p-3">
                  <CombatTracker
                    combat={combat}
                    entities={entities}
                    selectedEntityIds={selectedEntityIds}
                    isDirector={false}
                    currentHeroEntityId={heroEntityId}
                    onClaimTurn={(entityId) =>
                      send({
                        type: "combat_action",
                        action: { type: "CLAIM_TURN", entityId },
                      })
                    }
                    onSelectEntities={handleSelectEntities}
                    onSelectTurn={() => {}}
                    onEndTurn={() =>
                      send({
                        type: "combat_action",
                        action: { type: "END_TURN" },
                      })
                    }
                    onEndCombat={() => {}}
                    onAdjustMalice={() => {}}
                    onRollInitiative={handleRollInitiative}
                  />
                </div>
              </TabsContent>
            )}

            <TabsContent value="log" className={RAIL_TAB_CONTENT_CLASS}>
              <ActionLogPanel
                entries={sessionState.actionLog ?? []}
                sceneType={sceneType}
                activeSceneId={activeSceneId}
                send={send}
                showDiceControls={sceneType !== "battle"}
                className="h-full border-0"
              />
            </TabsContent>
          </Tabs>
        )
      }
      rightRailCollapsed={rightRailCollapsed}
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
