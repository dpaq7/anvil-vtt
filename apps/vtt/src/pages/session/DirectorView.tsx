import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Minimize2 } from "lucide-react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts.js";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@anvil/ui";
import type { SceneType } from "@anvil/ui";
import type {
  SessionState,
  AbilityResult,
  MontageLiveState,
  NegotiationLiveState,
} from "../../types/protocol.js";
import type { ClientMessage } from "../../types/protocol.js";
import type { ConnectionStatus } from "../../hooks/useSessionSocket.js";
import {
  loadMonsters,
  isMonsterStatblock,
  FORGESTEEL_MONSTERS,
  isMinion,
} from "@anvil/data";
import type { CompendiumMonster } from "@anvil/data";
import {
  useAssetsStore,
  getMonsterPortraitUrl,
} from "../../stores/assetsStore.js";
import {
  parseMontageData,
  parseNegotiationData,
  parseRespiteData,
  parseBattleData,
} from "../../lib/scene-data.js";
import type {
  MontageStageData,
  NegotiationStageData,
} from "../../lib/scene-data.js";
import { DirectorFilmStrip } from "../../components/session/DirectorFilmStrip.js";
import { ParticipantStatusBar } from "../../components/session/ParticipantStatusBar.js";
import { PlayerCharactersPanel } from "../../components/session/PlayerCharactersPanel.js";
import { getJoinedPlayerCharacters } from "../../components/session/player-characters.js";
import { CreatureTracker } from "../../components/session/CreatureTracker.js";
import { CombatTracker } from "../../components/session/CombatTracker.js";
import { NowCard } from "../../components/session/battle/NowCard.js";
import { RailLog } from "../../components/session/battle/RailLog.js";
import { hiddenEntities } from "../../lib/fog-visibility.js";
import { DamageDialog } from "../../components/session/DamageDialog.js";
import { ActionLogPanel } from "../../components/session/ActionLogPanel.js";
import { AssetPanel } from "../../components/session/AssetPanel.js";
import { SceneAudioPanel } from "../../components/session/SceneAudioPanel.js";
import { SessionThemeToggle } from "../../components/session/SessionThemeToggle.js";
import { SessionShell } from "../../components/session/shell/SessionShell.js";
import { useSessionConnection } from "../../components/session/shell/connection-context.js";
import { EndSessionButton } from "../../components/session/EndSessionDialog.js";
import { StoryStage } from "../../components/stages/StoryStage.js";
import { MontageStage } from "../../components/stages/MontageStage.js";
import { NegotiationStage } from "../../components/stages/NegotiationStage.js";
import { RespiteStage } from "../../components/stages/RespiteStage.js";
import { BattleStage } from "../../components/stages/BattleStage.js";
import { OpportunityAttackPrompt } from "../../components/session/OpportunityAttackPrompt.js";
import { useTargetingResolution } from "../../hooks/useTargetingResolution.js";
import type { PendingTargetedAction } from "../../lib/targeting.js";
import { useSessionStore } from "../../stores/sessionStore.js";
import { toast } from "sonner";
import { SceneBackdrop } from "../../components/stages/SceneBackdrop.js";
import { getSceneBackgroundUrl } from "../../lib/scene-backgrounds.js";
import { buildVillainCombatGroups } from "../../lib/combat-groups.js";
import { CANVAS_THEME, GRID_DEFAULT_ALPHA } from "../../canvas/theme.js";

// Grid color presets (shared with BattleWorkspace)
const GRID_COLORS = [
  { color: CANVAS_THEME.dark.gridDefaultHex, label: "Ink" },
  { color: "#444444", label: "Gray" },
  { color: "#ffffff", label: "White" },
  { color: "#000000", label: "Black" },
  { color: "#eab308", label: "Yellow" },
  { color: "#ef4444", label: "Red" },
  { color: "#3b82f6", label: "Blue" },
];
const GRID_CELL_SIZE_MIN = 16;
const GRID_CELL_SIZE_MAX = 256;

function clampGridCellSize(value: number): number {
  if (!Number.isFinite(value)) return 48;
  return Math.max(
    GRID_CELL_SIZE_MIN,
    Math.min(GRID_CELL_SIZE_MAX, Math.round(value)),
  );
}

function clampGridOffset(value: number, cellSize: number): number {
  return Math.max(-cellSize, Math.min(cellSize, Math.round(value)));
}

type LeftRailTab = "combat" | "heroes" | "creatures" | "tracking" | "log";
type RightRailTab = "audio" | "combat" | "grid" | "assets";

// Rail tabs take the shell's look (session-shell.css, `.sb-rail [role=tab]`).
const RAIL_TABS_LIST_CLASS = "";
const RAIL_TAB_TRIGGER_CLASS = "";
const RAIL_TAB_CONTENT_CLASS =
  "mt-0 min-h-0 flex-1 overflow-hidden focus-visible:ring-0";

interface DirectorViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
  /** The give-up window passed: the shell shows "Can't reach the table". */
  lost?: boolean;
  onRetry: () => void;
}

export function DirectorView({
  sessionState,
  connectionStatus,
  send,
  combatLog,
  lost = false,
  onRetry,
}: DirectorViewProps) {
  const navigate = useNavigate();
  // During a drop the table stays readable; actions that need the server wait.
  const { paused } = useSessionConnection();
  const [barTarget, setBarTarget] = useState<HTMLDivElement | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const monsterPortraits = useAssetsStore((s) => s.monsterPortraits);
  const { scenes, activeSceneId, participants, entities, combat } =
    sessionState;
  const activeScene = scenes.find((s) => s.id === activeSceneId);
  const sceneType = (activeScene?.type as SceneType) ?? null;
  const entityNames = new Map(entities.map((e) => [e.id, e.name]));

  const handleSelectScene = useCallback(
    (sceneId: string) => {
      send({ type: "switch_scene", sceneId });
    },
    [send],
  );

  const sceneData = useMemo(() => activeScene?.data ?? {}, [activeScene?.data]);

  const [showHelp, setShowHelp] = useState(false);
  const [leftRailTab, setLeftRailTab] = useState<LeftRailTab>("combat");
  const [rightRailTab, setRightRailTab] = useState<RightRailTab>(
    sceneType === "battle" ? "combat" : "assets",
  );
  const [focusMode, setFocusMode] = useState(false);
  const [focusEntityRequest, setFocusEntityRequest] = useState<{
    entityId: string;
    nonce: number;
  } | null>(null);
  // Director-broadcast focus (pulls everyone here); take whichever focus fired
  // most recently — the local tracker double-click or the broadcast.
  const broadcastFocus = useSessionStore((s) => s.focusRequest);
  const effectiveFocus =
    broadcastFocus && (!focusEntityRequest || broadcastFocus.nonce >= focusEntityRequest.nonce)
      ? broadcastFocus
      : focusEntityRequest;
  const [montageRoundsByScene, setMontageRoundsByScene] = useState<
    Record<string, boolean[]>
  >({});
  const [montageTrackingByScene, setMontageTrackingByScene] = useState<
    Record<string, string[]>
  >({});
  const [activeAudioId, setActiveAudioId] = useState<string | null>(
    (sceneData["audioMusic"] as string) ?? null,
  );

  // Grid controls (live override — defaults come from scene data)
  const [gridOpacityOverride, setGridOpacityOverride] = useState<number | null>(
    null,
  );
  const [gridColorOverride, setGridColorOverride] = useState<string | null>(
    null,
  );
  const [tokenScaleOverride, setTokenScaleOverride] = useState<number | null>(
    null,
  );
  const [gridSquareSizeOverride, setGridSquareSizeOverride] = useState<
    number | null
  >(null);
  const [gridOffsetXOverride, setGridOffsetXOverride] = useState<number | null>(
    null,
  );
  const [gridOffsetYOverride, setGridOffsetYOverride] = useState<number | null>(
    null,
  );

  const battleData = sceneType === "battle" ? parseBattleData(sceneData) : null;
  const montageData =
    sceneType === "montage" ? parseMontageData(sceneData) : null;
  const negotiationData =
    sceneType === "negotiation" ? parseNegotiationData(sceneData) : null;
  const currentGridOpacity =
    gridOpacityOverride ?? battleData?.gridOpacity ?? GRID_DEFAULT_ALPHA;
  const currentGridColor =
    gridColorOverride ?? battleData?.gridColor ?? CANVAS_THEME.dark.gridDefaultHex;
  const currentTokenScale = clampGridCellSize(
    tokenScaleOverride ?? battleData?.cellSize ?? 48,
  );
  const currentGridSquareSize = clampGridCellSize(
    gridSquareSizeOverride ?? battleData?.cellSize ?? 48,
  );
  const currentGridOffsetX = clampGridOffset(
    gridOffsetXOverride ?? battleData?.gridOffsetX ?? 0,
    currentGridSquareSize,
  );
  const currentGridOffsetY = clampGridOffset(
    gridOffsetYOverride ?? battleData?.gridOffsetY ?? 0,
    currentGridSquareSize,
  );

  // Director's view of who is under fog (the shut-eye marks). Fog logic stays in the helper.
  const hiddenIds = useMemo(
    () => new Set(hiddenEntities(entities, battleData?.fogZones ?? []).map((e) => e.id)),
    [entities, battleData?.fogZones],
  );

  const heroCount = useMemo(
    () => entities.filter((e) => e.type === "hero").length,
    [entities],
  );
  const joinedPlayerCharacterCount = useMemo(
    () => getJoinedPlayerCharacters(participants, entities).length,
    [entities, participants],
  );
  const creatureCount = useMemo(
    () =>
      entities.filter(
        (entity) => entity.type === "monster" || entity.type === "npc",
      ).length,
    [entities],
  );
  const actionLogCount = useMemo(() => {
    const entries = sessionState.actionLog ?? [];
    return entries.filter((entry) => {
      if (activeSceneId && entry.sceneId)
        return entry.sceneId === activeSceneId;
      return entry.sceneType === sceneType;
    }).length;
  }, [activeSceneId, sceneType, sessionState.actionLog]);
  const montageActors = useMemo(() => {
    const players = participants
      .filter((participant) => participant.role === "player")
      .map((participant) => ({
        id: participant.heroId ?? participant.userId,
        name: participant.username,
      }));
    if (players.length > 0) return players;
    return entities
      .filter((entity) => entity.type === "hero")
      .map((entity) => ({ id: entity.id, name: entity.name }));
  }, [entities, participants]);
  const activeMontageTracking = activeSceneId
    ? (montageTrackingByScene[activeSceneId] ?? [])
    : [];
  const activeMontageRounds = activeSceneId
    ? (montageRoundsByScene[activeSceneId] ?? [])
    : [];
  const leftRailTabs = useMemo<
    Array<{ value: LeftRailTab; label: string; count?: number }>
  >(() => {
    const tabs: Array<{ value: LeftRailTab; label: string; count?: number }> =
      [];
    if (sceneType === "battle" && combat)
      tabs.push({ value: "combat", label: "Combat" });
    tabs.push({
      value: "heroes",
      label: "Heroes",
      count: joinedPlayerCharacterCount,
    });
    if (sceneType === "negotiation") {
      tabs.push({ value: "creatures", label: "Target" });
    } else if (sceneType === "montage") {
      tabs.push({ value: "creatures", label: "Results" });
      tabs.push({
        value: "tracking",
        label: "Tracking",
        count: activeMontageTracking.length,
      });
    } else {
      tabs.push({
        value: "creatures",
        label: "Creatures",
        count: creatureCount,
      });
    }
    tabs.push({ value: "log", label: "Log", count: actionLogCount });
    return tabs;
  }, [
    actionLogCount,
    activeMontageTracking.length,
    combat,
    creatureCount,
    joinedPlayerCharacterCount,
    sceneType,
  ]);
  const rightRailTabs = useMemo<
    Array<{ value: RightRailTab; label: string }>
  >(() => {
    const tabs: Array<{ value: RightRailTab; label: string }> = [
      { value: "audio", label: "Audio" },
    ];
    if (sceneType === "battle") {
      tabs.push({ value: "combat", label: combat ? "Damage" : "Combat" });
      tabs.push({ value: "grid", label: "Grid" });
    }
    if (sceneType) tabs.push({ value: "assets", label: "Assets" });
    return tabs;
  }, [combat, sceneType]);

  // ── Monster compendium (for "Add to Scene" entity creation) ──
  const monstersRef = useRef<CompendiumMonster[]>([]);
  useEffect(() => {
    loadMonsters()
      .then((data) => {
        const statblocks = data.items.filter(
          isMonsterStatblock,
        ) as CompendiumMonster[];
        const ids = new Set(statblocks.map((m) => m._id));
        const supplementary = FORGESTEEL_MONSTERS.filter(
          (m) => !ids.has(m._id),
        );
        monstersRef.current = [...statblocks, ...supplementary];
      })
      .catch(() => {});
  }, []);

  const handleEndSession = useCallback(() => {
    send({ type: "end_session" });
    navigate("/app/live");
  }, [send, navigate]);

  const handleStartCombat = useCallback(() => {
    const heroEntityIds = entities
      .filter((entity) => entity.type === "hero")
      .map((entity) => entity.id);
    const villainEntityIds = entities
      .filter((entity) => entity.type === "monster" || entity.type === "npc")
      .map((entity) => entity.id);
    const villainGroups = buildVillainCombatGroups(entities, sceneData);

    send({
      type: "combat_action",
      action: {
        type: "START_COMBAT",
        heroEntityIds,
        villainEntityIds,
        villainGroups,
      },
    });
  }, [entities, sceneData, send]);

  const handleRevertActiveScene = useCallback(() => {
    if (!activeSceneId) return;
    const ok = window.confirm(
      "Revert this scene to its prepared starting state? Current token positions, stamina, combat, and scene progress for this scene will be discarded.",
    );
    if (!ok) return;
    send({ type: "revert_scene", sceneId: activeSceneId });
  }, [activeSceneId, send]);

  // ── Audio sync: update local state AND broadcast to players ──
  const audioAssets = useAssetsStore((s) => s.audioAssets);
  const handleAudioChange = useCallback(
    (newAudioId: string | null) => {
      setActiveAudioId(newAudioId);
      if (newAudioId) {
        const asset = audioAssets.find((a) => a.id === newAudioId);
        const url =
          asset?.audioUrl ??
          (asset?.assetId ? `/api/assets/${asset.assetId}/data` : undefined);
        if (url) {
          send({ type: "audio_play", audioAssetId: newAudioId, loop: true });
        }
      } else {
        send({ type: "audio_stop" });
      }
    },
    [audioAssets, send],
  );

  const handleSelectEntity = useCallback((entityId: string | null) => {
    setSelectedEntityId(entityId);
    setSelectedEntityIds(entityId ? [entityId] : []);
  }, []);

  const handleSelectEntities = useCallback((entityIds: string[]) => {
    setSelectedEntityIds(entityIds);
    setSelectedEntityId(entityIds[0] ?? null);
  }, []);

  // On-canvas targeting for token-menu actions (the Director acts for any token).
  const [pendingAction, setPendingAction] = useState<PendingTargetedAction | null>(
    null,
  );
  const targetingSource = pendingAction
    ? (entities.find((e) => e.id === pendingAction.sourceId) ?? null)
    : null;
  const targeting = useTargetingResolution({
    sourceEntity: targetingSource,
    entities,
    distance: pendingAction?.distance,
  });

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

  useKeyboardShortcuts({
    onEscape: () => handleSelectEntity(null),
    onSpace: () => {
      // The End turn button says it is waiting; nothing is queued.
      if (paused) return;
      if (combat && combat.activeEntityId)
        send({ type: "combat_action", action: { type: "END_TURN" } });
    },
    onHelp: () => setShowHelp((v) => !v),
  });

  // Leave targeting if the table drops: the click that confirms a target needs the server.
  useEffect(() => {
    if (paused) setPendingAction(null);
  }, [paused]);

  useEffect(() => {
    handleSelectEntity(null);
    setPendingAction(null);
    setGridOpacityOverride(null);
    setGridColorOverride(null);
    setTokenScaleOverride(null);
    setGridSquareSizeOverride(null);
    setGridOffsetXOverride(null);
    setGridOffsetYOverride(null);
  }, [activeSceneId, handleSelectEntity]);

  useEffect(() => {
    if (!leftRailTabs.some((tab) => tab.value === leftRailTab)) {
      setLeftRailTab(leftRailTabs[0]?.value ?? "creatures");
    }
  }, [leftRailTab, leftRailTabs]);

  useEffect(() => {
    if (!rightRailTabs.some((tab) => tab.value === rightRailTab)) {
      setRightRailTab(rightRailTabs[0]?.value ?? "audio");
    }
  }, [rightRailTab, rightRailTabs]);

  const handleFocusEntity = useCallback((entityId: string) => {
    setFocusEntityRequest({ entityId, nonce: Date.now() });
  }, []);

  const handleToggleMontageRound = useCallback(
    (roundIndex: number) => {
      if (!activeSceneId) return;
      setMontageRoundsByScene((prev) => {
        const next = [...(prev[activeSceneId] ?? [])];
        next[roundIndex] = !next[roundIndex];
        return { ...prev, [activeSceneId]: next };
      });
    },
    [activeSceneId],
  );

  const handleToggleMontageActor = useCallback(
    (actorId: string) => {
      if (!activeSceneId) return;
      setMontageTrackingByScene((prev) => {
        const current = new Set(prev[activeSceneId] ?? []);
        if (current.has(actorId)) current.delete(actorId);
        else current.add(actorId);
        return { ...prev, [activeSceneId]: [...current] };
      });
    },
    [activeSceneId],
  );

  const handleTokenScaleChange = useCallback((value: number) => {
    setTokenScaleOverride(clampGridCellSize(value));
  }, []);

  const handleGridSquareSizeChange = useCallback((value: number) => {
    const nextSize = clampGridCellSize(value);
    setGridSquareSizeOverride(nextSize);
    setGridOffsetXOverride((current) =>
      current === null ? null : clampGridOffset(current, nextSize),
    );
    setGridOffsetYOverride((current) =>
      current === null ? null : clampGridOffset(current, nextSize),
    );
  }, []);

  // ── Add monster to scene via WebSocket ──
  const handleAddMonsterToScene = useCallback(
    (monsterName: string, quantity: number) => {
      const monster = monstersRef.current.find(
        (m) => m.name.toLowerCase() === monsterName.toLowerCase(),
      );
      const maxStamina = monster?.stamina
        ? parseInt(String(monster.stamina), 10) || 0
        : 0;

      // Place at map center with stagger for multiple creatures
      const bd = battleData ?? { cols: 30, rows: 20 };
      const centerX = Math.floor(bd.cols / 2);
      const centerY = Math.floor(bd.rows / 2);

      const minionFlag = monster ? isMinion(monster) : false;
      // For minion squads: shared stamina pool = quantity * per-minion stamina
      const squadId =
        minionFlag && quantity > 1
          ? `squad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
          : undefined;

      // Look up custom portrait for this monster
      const portraitUrl = getMonsterPortraitUrl(monsterPortraits, monsterName);

      for (let i = 0; i < quantity; i++) {
        // Stagger in a horizontal row, wrapping to next row if needed
        const offsetX = i % 5;
        const offsetY = Math.floor(i / 5);
        const entity = {
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
          name: quantity > 1 ? `${monsterName} ${i + 1}` : monsterName,
          type: "monster" as const,
          x: centerX + offsetX,
          y: centerY + offsetY,
          maxStamina,
          currentStamina: maxStamina,
          monsterName,
          level: monster?.level ?? 1,
          conditions: [] as string[],
          roles: monster?.roles ?? [],
          isMinion: minionFlag,
          ...(squadId ? { squadId, squadSize: quantity } : {}),
          ...(monster?.features ? { features: monster.features } : {}),
          ...(portraitUrl ? { portraitUrl } : {}),
        };
        send({ type: "create_entity", entity });
      }
    },
    [send, battleData, monsterPortraits],
  );

  const handleAddTerrainToScene = useCallback(
    (terrain: {
      id: string;
      name: string;
      category?: string;
      gridWidth?: number;
      gridHeight?: number;
    }) => {
      if (!battleData) return;
      const w = Math.max(1, terrain.gridWidth ?? 1);
      const h = Math.max(1, terrain.gridHeight ?? 1);
      const x = Math.max(0, Math.floor((battleData.cols - w) / 2));
      const y = Math.max(0, Math.floor((battleData.rows - h) / 2));
      send({
        type: "scene_terrain_add",
        terrain: {
          id: `terrain-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          terrainId: terrain.id,
          name: terrain.name,
          x,
          y,
          w,
          h,
        },
      });
    },
    [battleData, send],
  );

  const renderStage = () => {
    if (!activeScene) {
      return (
        <div className="flex h-full items-center justify-center text-art-on-hero-plate">
          Select a scene from the film strip above.
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
            directorNotes={(sceneData["notes"] as string) ?? ""}
            isDirector
            onUpdateReadAloud={(readAloudText) =>
              send({ type: "story_update", readAloudText })
            }
          />,
        );
      case "montage": {
        const montage = montageData ?? parseMontageData(sceneData);
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
            isDirector
            testLog={liveMontage?.testLog}
            roundsCompleted={activeMontageRounds}
            onAdjustSuccesses={(delta) =>
              send({ type: "montage_adjust_successes", delta })
            }
            onAdjustFailures={(delta) =>
              send({ type: "montage_adjust_failures", delta })
            }
            onResetMontage={() => send({ type: "montage_reset" })}
            onToggleRound={handleToggleMontageRound}
          />,
        );
      }
      case "negotiation": {
        const neg = negotiationData ?? parseNegotiationData(sceneData);
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
            isDirector
            argumentLog={liveNeg?.argumentLog}
            onInterestChange={(delta) =>
              send({ type: "negotiation_adjust_interest", delta })
            }
            onPatienceChange={(delta) =>
              send({ type: "negotiation_adjust_patience", delta })
            }
            onRevealMotivation={(id) =>
              send({ type: "negotiation_reveal_motivation", id })
            }
            onRevealPitfall={(id) =>
              send({ type: "negotiation_reveal_pitfall", id })
            }
            onEndNegotiation={() =>
              send({
                type: "negotiation_end",
                phase:
                  (liveNeg?.interest ?? neg.interest) >= 3
                    ? "success"
                    : "failure",
              })
            }
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
            isDirector
            onCompleteActivity={(activityId) =>
              send({ type: "respite_complete_activity", activityId })
            }
          />,
        );
      }
      case "battle": {
        const battle = battleData!;
        return (
          <div className="relative h-full w-full">
            <BattleStage
              entities={entities}
              combat={combat}
              selectedEntityId={selectedEntityId}
              selectedEntityIds={selectedEntityIds}
              isDirector
              cols={battle.cols}
              rows={battle.rows}
              cellSize={currentTokenScale}
              backgroundUrl={battle.backgroundUrl}
              drawings={battle.drawings}
              fogZones={battle.fogZones}
              terrain={battle.terrain}
              gridOpacity={currentGridOpacity}
              gridColor={currentGridColor}
              gridCellSize={currentGridSquareSize}
              gridOffsetX={currentGridOffsetX}
              gridOffsetY={currentGridOffsetY}
              combatLog={combatLog}
              entityNames={entityNames}
              targetingContext={battleTargetingContext}
              onTargetConfirm={handleTargetConfirm}
              onTargetCancel={handleTargetCancel}
              onRequestTargeting={handleRequestTargeting}
              onSelectEntity={handleSelectEntity}
              onSelectEntities={handleSelectEntities}
              onRollInitiative={undefined}
              focusEntityRequest={effectiveFocus}
              sceneKey={activeSceneId}
              barTarget={barTarget}
              rollAnchorId={combat?.activeEntityId ?? null}
              send={send}
            />
            <OpportunityAttackPrompt send={send} />
          </div>
        );
      }
      default:
        return (
          <div className="flex h-full items-center justify-center text-art-on-hero-plate">
            Unknown scene type: {activeScene.type}
          </div>
        );
    }
  };

  const openDisplay = () =>
    window.open(
      `/app/session/${sessionState.sessionId}/display`,
      "anvil-display",
      "width=1280,height=800",
    );

  return (
    <SessionShell
      role="director"
      mode={sceneType}
      sceneName={activeScene?.name ?? ""}
      lost={lost}
      onRetry={onRetry}
      back={{
        label: "Back to campaign",
        onClick: () => navigate(`/app/campaigns/${sessionState.campaignId}`),
      }}
      top={
        focusMode ? (
          <div className="flex flex-1 items-center justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFocusMode(false)}
              title="Exit full screen"
            >
              <Minimize2 className="size-4" />
              Exit full screen
            </Button>
          </div>
        ) : (
          <>
            <DirectorFilmStrip
              scenes={scenes}
              activeSceneId={activeSceneId}
              onSelectScene={handleSelectScene}
            />
            <EndSessionButton onEnd={handleEndSession} />
          </>
        )
      }
      status={
        <ParticipantStatusBar
          participants={participants}
          connectionStatus={connectionStatus}
          viewerRole="director"
          actions={
            <DirectorStatusActions
              onOpenDisplay={openDisplay}
              focusMode={focusMode}
              onToggleFocus={() => setFocusMode((value) => !value)}
              canRevert={Boolean(activeSceneId)}
              onRevert={handleRevertActiveScene}
            />
          }
        />
      }
      left={
        focusMode ? undefined : (
          <Tabs
            value={leftRailTab}
            onValueChange={(value) => setLeftRailTab(value as LeftRailTab)}
            className="flex h-full min-h-0 flex-col overflow-hidden"
          >
            <TabsList className={RAIL_TABS_LIST_CLASS}>
              {leftRailTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={RAIL_TAB_TRIGGER_CLASS}
                >
                  {tab.label}
                  {tab.count !== undefined && <em>{tab.count}</em>}
                </TabsTrigger>
              ))}
            </TabsList>

            {sceneType === "battle" && combat && (
              <TabsContent
                value="combat"
                className={RAIL_TAB_CONTENT_CLASS}
              >
                <CombatTracker
                  combat={combat}
                  entities={entities}
                  selectedEntityIds={selectedEntityIds}
                  isDirector
                  currentHeroEntityId={null}
                  hiddenIds={hiddenIds}
                  onSelectEntities={handleSelectEntities}
                  onSelectTurn={(entityId) =>
                    send({
                      type: "combat_action",
                      action: { type: "SELECT_TURN", entityId },
                    })
                  }
                  onEndTurn={() =>
                    send({
                      type: "combat_action",
                      action: { type: "END_TURN" },
                    })
                  }
                  onEndCombat={() =>
                    send({
                      type: "combat_action",
                      action: { type: "END_COMBAT" },
                    })
                  }
                  onAdjustMalice={(delta) =>
                    send({
                      type: "combat_action",
                      action: { type: "ADJUST_MALICE", delta },
                    })
                  }
                  onRollInitiative={undefined}
                  onFocusEntity={handleFocusEntity}
                />
              </TabsContent>
            )}

            <TabsContent value="heroes" className={RAIL_TAB_CONTENT_CLASS}>
              <PlayerCharactersPanel
                participants={participants}
                entities={entities}
              />
            </TabsContent>

            <TabsContent value="creatures" className={RAIL_TAB_CONTENT_CLASS}>
              {sceneType === "negotiation" && negotiationData ? (
                <NegotiationTargetPanel
                  data={negotiationData}
                  live={sessionState.negotiation}
                />
              ) : sceneType === "montage" && montageData ? (
                <MontageResultsPanel
                  data={montageData}
                  live={sessionState.montage}
                />
              ) : (
                <CreatureTracker
                  entities={entities}
                  combat={combat}
                  selectedEntityIds={selectedEntityIds}
                  onSelectEntities={handleSelectEntities}
                  send={send}
                />
              )}
            </TabsContent>

            {sceneType === "montage" && (
              <TabsContent value="tracking" className={RAIL_TAB_CONTENT_CLASS}>
                <MontageTrackingPanel
                  actors={montageActors}
                  checkedIds={activeMontageTracking}
                  onToggle={handleToggleMontageActor}
                />
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
      right={
        focusMode ? undefined : (
          <Tabs
            value={rightRailTab}
            onValueChange={(value) => setRightRailTab(value as RightRailTab)}
            className="flex h-full min-h-0 flex-col overflow-hidden"
          >
            <TabsList className={RAIL_TABS_LIST_CLASS}>
              {rightRailTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={RAIL_TAB_TRIGGER_CLASS}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value="audio"
              className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto p-3`}
            >
              <SceneAudioPanel
                campaignId={sessionState.campaignId}
                audioId={activeAudioId}
                onAudioChange={handleAudioChange}
                label="Now Playing"
              />
            </TabsContent>

            {sceneType && (
              <TabsContent
                value="assets"
                className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto p-2`}
              >
                <AssetPanel
                  sceneType={sceneType}
                  sceneId={activeScene?.id ?? ""}
                  campaignId={sessionState.campaignId}
                  heroCount={heroCount}
                  onAddMonsterToScene={handleAddMonsterToScene}
                  onAddTerrainToScene={handleAddTerrainToScene}
                />
              </TabsContent>
            )}

            {sceneType === "battle" && (
              <TabsContent value="combat" className={RAIL_TAB_CONTENT_CLASS}>
                <div className="sb-rail-body h-full">
                  {!combat ? (
                    <section className="sb-sec">
                      <div className="sb-sub sb-sub--flat">
                        <b>Combat</b>
                        <span>{heroCount} heroes, {creatureCount} creatures</span>
                      </div>
                      <button
                        type="button"
                        className="sb-end"
                        data-wait={paused || undefined}
                        disabled={
                          paused ||
                          entities.some((entity) => entity.type === "hero") === false ||
                          entities.some(
                            (entity) =>
                              entity.type === "monster" || entity.type === "npc",
                          ) === false
                        }
                        onClick={handleStartCombat}
                      >
                        {paused ? "Draw Steel!, when back" : "Draw Steel!"}
                      </button>
                    </section>
                  ) : (
                    <>
                      <DamageDialog
                        entities={entities}
                        onApplyDamage={(entityId, amount) =>
                          send({
                            type: "token_action",
                            action: {
                              kind: "manual-damage",
                              targetId: entityId,
                              amount,
                            },
                          })
                        }
                        onApplyHealing={(entityId, amount) =>
                          send({
                            type: "token_action",
                            action: {
                              kind: "manual-heal",
                              targetId: entityId,
                              amount,
                            },
                          })
                        }
                      />
                      <NowCard combat={combat} entities={entities} />
                    </>
                  )}
                  <RailLog
                    entries={sessionState.actionLog ?? []}
                    sceneType={sceneType}
                    activeSceneId={activeSceneId}
                  />
                </div>
              </TabsContent>
            )}

            {sceneType === "battle" && battleData && (
              <TabsContent
                value="grid"
                className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto p-4`}
              >
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Grid Overlay
                  </span>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-zinc-500">
                        Opacity
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(currentGridOpacity * 100)}
                        onChange={(e) =>
                          setGridOpacityOverride(Number(e.target.value) / 100)
                        }
                        className="h-1 flex-1 accent-zinc-400"
                      />
                      <span className="w-8 text-right text-xs text-zinc-500">
                        {Math.round(currentGridOpacity * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-20 text-xs text-zinc-500">Color</span>
                      {GRID_COLORS.map(({ color, label }) => (
                        <button
                          key={color}
                          type="button"
                          title={label}
                          className={`h-5 w-5 rounded-full border-2 transition-transform ${
                            currentGridColor === color
                              ? "scale-125 border-white"
                              : "border-zinc-600 hover:border-zinc-400"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setGridColorOverride(color)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-zinc-500">
                        Token scale
                      </span>
                      <input
                        type="range"
                        min={GRID_CELL_SIZE_MIN}
                        max={GRID_CELL_SIZE_MAX}
                        step={1}
                        value={currentTokenScale}
                        onChange={(e) =>
                          handleTokenScaleChange(Number(e.target.value))
                        }
                        className="h-1 flex-1 accent-zinc-400"
                      />
                      <input
                        type="number"
                        min={GRID_CELL_SIZE_MIN}
                        max={GRID_CELL_SIZE_MAX}
                        step={1}
                        value={currentTokenScale}
                        aria-label="Token scale"
                        onChange={(e) =>
                          handleTokenScaleChange(Number(e.target.value))
                        }
                        className="h-7 w-14 rounded border border-zinc-700 bg-zinc-950 px-1.5 text-right text-xs text-zinc-300"
                      />
                      <span className="w-5 text-xs text-zinc-500">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-zinc-500">
                        Grid size
                      </span>
                      <input
                        type="range"
                        min={GRID_CELL_SIZE_MIN}
                        max={GRID_CELL_SIZE_MAX}
                        step={1}
                        value={currentGridSquareSize}
                        onChange={(e) =>
                          handleGridSquareSizeChange(Number(e.target.value))
                        }
                        className="h-1 flex-1 accent-zinc-400"
                      />
                      <input
                        type="number"
                        min={GRID_CELL_SIZE_MIN}
                        max={GRID_CELL_SIZE_MAX}
                        step={1}
                        value={currentGridSquareSize}
                        aria-label="Grid size"
                        onChange={(e) =>
                          handleGridSquareSizeChange(Number(e.target.value))
                        }
                        className="h-7 w-14 rounded border border-zinc-700 bg-zinc-950 px-1.5 text-right text-xs text-zinc-300"
                      />
                      <span className="w-5 text-xs text-zinc-500">px</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-zinc-500">
                        Offset X
                      </span>
                      <input
                        type="range"
                        min={-currentGridSquareSize}
                        max={currentGridSquareSize}
                        step={1}
                        value={currentGridOffsetX}
                        onChange={(e) =>
                          setGridOffsetXOverride(Number(e.target.value))
                        }
                        className="h-1 flex-1 accent-zinc-400"
                      />
                      <span className="w-10 text-right text-xs text-zinc-500">
                        {Math.round(currentGridOffsetX)}px
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-xs text-zinc-500">
                        Offset Y
                      </span>
                      <input
                        type="range"
                        min={-currentGridSquareSize}
                        max={currentGridSquareSize}
                        step={1}
                        value={currentGridOffsetY}
                        onChange={(e) =>
                          setGridOffsetYOverride(Number(e.target.value))
                        }
                        className="h-1 flex-1 accent-zinc-400"
                      />
                      <span className="w-10 text-right text-xs text-zinc-500">
                        {Math.round(currentGridOffsetY)}px
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tokenScaleOverride !== null && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-zinc-400"
                          onClick={() => setTokenScaleOverride(null)}
                        >
                          Reset token scale
                        </Button>
                      )}
                      {(gridSquareSizeOverride !== null ||
                        gridOffsetXOverride !== null ||
                        gridOffsetYOverride !== null) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-zinc-400"
                          onClick={() => {
                            setGridSquareSizeOverride(null);
                            setGridOffsetXOverride(null);
                            setGridOffsetYOverride(null);
                          }}
                        >
                          Reset grid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )
      }
      bar={
        sceneType === "battle" ? (
          <div ref={setBarTarget} className="flex h-full min-w-0 flex-1 items-center" />
        ) : undefined
      }
      screen={renderStage()}
    >
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--art-scrim)]"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="border-[3px] border-art-ink bg-surface p-6 text-text shadow-[var(--shape-hard-shadow-large)_var(--art-ink)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 font-display text-base font-extrabold text-text">
              Keyboard Shortcuts
            </p>
            <div className="flex flex-col gap-2 text-[13px]">
              <div className="flex justify-between gap-8">
                <kbd className="bg-well px-2 py-0.5 font-mono text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]">
                  Esc
                </kbd>
                <span className="text-text">Deselect / Close</span>
              </div>
              <div className="flex justify-between gap-8">
                <kbd className="bg-well px-2 py-0.5 font-mono text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]">
                  Space
                </kbd>
                <span className="text-text">Next Turn</span>
              </div>
              <div className="flex justify-between gap-8">
                <kbd className="bg-well px-2 py-0.5 font-mono text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]">
                  ?
                </kbd>
                <span className="text-text">Toggle Help</span>
              </div>
              {sceneType === "battle" && (
                <>
                  <div className="mt-2 border-t-[1.5px] border-line-quiet pt-2 text-[13px] font-bold text-text-soft">
                    Battle Tools
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="bg-well px-2 py-0.5 font-mono text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]">
                      H/V/D/F/T/E
                    </kbd>
                    <span className="text-text">Tools</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="bg-well px-2 py-0.5 font-mono text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]">
                      G
                    </kbd>
                    <span className="text-text">Toggle Grid</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="bg-well px-2 py-0.5 font-mono text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]">
                      Hold Space
                    </kbd>
                    <span className="text-text">Temporary Pan</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </SessionShell>
  );
}

/** Quiet actions at the right of the status bar (demo `battle-director`, `sb-status`). */
function DirectorStatusActions({
  onOpenDisplay,
  focusMode,
  onToggleFocus,
  canRevert,
  onRevert,
}: {
  onOpenDisplay: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  canRevert: boolean;
  onRevert: () => void;
}) {
  const { paused } = useSessionConnection();
  return (
    <>
      <SessionThemeToggle variant="status" />
      <button
        type="button"
        onClick={onOpenDisplay}
        title="Open player display (external monitor)"
        aria-label="Open player display in a new window"
      >
        Display
      </button>
      <button
        type="button"
        onClick={onToggleFocus}
        title={focusMode ? "Exit full screen" : "Focus map"}
        aria-label={focusMode ? "Exit full screen" : "Focus map"}
        aria-pressed={focusMode}
      >
        Fullscreen
      </button>
      {canRevert && (
        <button
          type="button"
          onClick={onRevert}
          disabled={paused}
          title="Revert active scene to prepared state"
        >
          {paused ? "Revert…, when back" : "Revert…"}
        </button>
      )}
    </>
  );
}

function NegotiationTargetPanel({
  data,
  live,
}: {
  data: NegotiationStageData;
  live: NegotiationLiveState | null;
}) {
  const interest = live?.interest ?? data.interest;
  const patience = live?.patience ?? data.patience;
  const maxPatience = live?.maxPatience ?? data.maxPatience;
  const phase = live?.phase ?? data.phase;
  const motivations = live?.motivations ?? data.motivations;
  const pitfalls = live?.pitfalls ?? data.pitfalls;
  const currentOutcome = data.outcomes[interest] ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <section className="rounded border border-zinc-800 bg-zinc-900/60 p-3">
        <div className="flex items-start gap-3">
          {data.npcPortrait ? (
            <img
              src={data.npcPortrait}
              alt=""
              className="size-14 rounded object-cover"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded bg-purple-500/20 text-lg font-semibold text-purple-200">
              {data.npcName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {data.npcName}
            </p>
            <p className="mt-1 text-xs capitalize text-zinc-400">
              {data.npcAttitude}
            </p>
            <span className="mt-2 inline-flex rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              {phase}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetricCard label="Interest" value={`${interest} / 5`} tone="purple" />
        <MetricCard
          label="Patience"
          value={`${patience} / ${maxPatience}`}
          tone="amber"
        />
      </div>

      {currentOutcome && (
        <section className="mt-3 rounded border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Current outcome
          </p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-300">
            {currentOutcome}
          </p>
        </section>
      )}

      <SecretList title="Motivations" items={motivations} tone="purple" />
      <SecretList title="Pitfalls" items={pitfalls} tone="red" />
    </div>
  );
}

function MontageResultsPanel({
  data,
  live,
}: {
  data: MontageStageData;
  live: MontageLiveState | null;
}) {
  const successes = live?.successes ?? 0;
  const failures = live?.failures ?? 0;
  const successLimit = live?.successLimit ?? data.successLimit;
  const failureLimit = live?.failureLimit ?? data.failureLimit;
  const outcome = live?.outcome ?? "pending";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <section className="rounded border border-zinc-800 bg-zinc-900/60 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          Montage goal
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-zinc-100">
          {data.goal || "No goal set"}
        </p>
        <span className="mt-3 inline-flex rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
          {outcome.replace(/_/g, " ")}
        </span>
      </section>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetricCard
          label="Successes"
          value={`${successes} / ${successLimit}`}
          tone="emerald"
        />
        <MetricCard
          label="Failures"
          value={`${failures} / ${failureLimit}`}
          tone="red"
        />
      </div>

      <OutcomeCard
        title="Total Success"
        text={data.totalSuccess}
        className="border-emerald-500/30"
      />
      <OutcomeCard
        title="Partial Success"
        text={data.partialSuccess}
        className="border-amber-500/30"
      />
      <OutcomeCard
        title="Total Failure"
        text={data.totalFailure}
        className="border-red-500/30"
      />
    </div>
  );
}

function MontageTrackingPanel({
  actors,
  checkedIds,
  onToggle,
}: {
  actors: Array<{ id: string; name: string }>;
  checkedIds: string[];
  onToggle: (actorId: string) => void;
}) {
  const checkedSet = new Set(checkedIds);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto p-3">
      <section className="rounded border border-zinc-800 bg-zinc-900/60">
        <div className="border-b border-zinc-800 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Tracking
          </p>
        </div>
        <div className="flex flex-col p-2">
          {actors.length === 0 ? (
            <p className="px-2 py-4 text-xs text-zinc-600">
              No players or heroes found.
            </p>
          ) : (
            actors.map((actor) => (
              <label
                key={actor.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/70"
              >
                <input
                  type="checkbox"
                  checked={checkedSet.has(actor.id)}
                  onChange={() => onToggle(actor.id)}
                  className="size-4 rounded border-zinc-700 accent-amber-500"
                />
                <span className="min-w-0 flex-1 truncate">{actor.name}</span>
              </label>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "emerald" | "purple" | "red";
}) {
  const toneClass = {
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    purple: "text-purple-300",
    red: "text-red-300",
  }[tone];

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SecretList({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{
    id: string;
    type: string;
    description: string;
    revealed: boolean;
  }>;
  tone: "purple" | "red";
}) {
  const titleClass = tone === "purple" ? "text-purple-300" : "text-red-300";

  return (
    <section className="mt-3 rounded border border-zinc-800 bg-zinc-900/60 p-3">
      <p className={`text-sm font-semibold ${titleClass}`}>{title}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-zinc-600">None set.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded bg-zinc-950/50 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                {item.type}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-300">
                {item.revealed ? item.description : "Hidden"}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function OutcomeCard({
  title,
  text,
  className,
}: {
  title: string;
  text: string;
  className: string;
}) {
  return (
    <section className={`mt-3 rounded border bg-zinc-900/60 p-3 ${className}`}>
      <p className="text-sm font-semibold text-zinc-100">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-300">
        {text || "No outcome set."}
      </p>
    </section>
  );
}
