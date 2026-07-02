import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Expand, Minimize2, RotateCcw } from "lucide-react";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts.js";
import {
  AppShell,
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
import {
  PlayerCharactersPanel,
  getJoinedPlayerCharacters,
} from "../../components/session/PlayerCharactersPanel.js";
import { CreatureTracker } from "../../components/session/CreatureTracker.js";
import { CombatTracker } from "../../components/session/CombatTracker.js";
import { DamageDialog } from "../../components/session/DamageDialog.js";
import { ActionLogPanel } from "../../components/session/ActionLogPanel.js";
import { AssetPanel } from "../../components/session/AssetPanel.js";
import { SceneAudioPanel } from "../../components/session/SceneAudioPanel.js";
import { SessionThemeToggle } from "../../components/session/SessionThemeToggle.js";
import { StoryStage } from "../../components/stages/StoryStage.js";
import { MontageStage } from "../../components/stages/MontageStage.js";
import { NegotiationStage } from "../../components/stages/NegotiationStage.js";
import { RespiteStage } from "../../components/stages/RespiteStage.js";
import { BattleStage } from "../../components/stages/BattleStage.js";
import { SceneBackdrop } from "../../components/stages/SceneBackdrop.js";
import { getSceneBackgroundUrl } from "../../lib/scene-backgrounds.js";
import { buildVillainCombatGroups } from "../../lib/combat-groups.js";

// Grid color presets (shared with BattleWorkspace)
const GRID_COLORS = [
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

const RAIL_TABS_LIST_CLASS =
  "flex h-9 w-full justify-start rounded-none border-b border-zinc-800 bg-zinc-950/40 p-0 px-2 pt-1";
const RAIL_TAB_TRIGGER_CLASS =
  "h-8 min-w-0 flex-1 rounded-b-none rounded-t-md border border-transparent border-b-0 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 transition data-[state=active]:border-zinc-700 data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 data-[state=inactive]:hover:bg-zinc-800/50 data-[state=inactive]:hover:text-zinc-300";
const RAIL_TAB_CONTENT_CLASS =
  "mt-0 min-h-0 flex-1 overflow-hidden focus-visible:ring-0";

interface DirectorViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
}

export function DirectorView({
  sessionState,
  connectionStatus,
  send,
  combatLog,
}: DirectorViewProps) {
  const navigate = useNavigate();
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

  const sceneData = activeScene?.data ?? {};

  const [showHelp, setShowHelp] = useState(false);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [leftRailTab, setLeftRailTab] = useState<LeftRailTab>("combat");
  const [rightRailTab, setRightRailTab] = useState<RightRailTab>("assets");
  const [focusMode, setFocusMode] = useState(false);
  const [focusEntityRequest, setFocusEntityRequest] = useState<{
    entityId: string;
    nonce: number;
  } | null>(null);
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
    gridOpacityOverride ?? battleData?.gridOpacity ?? 0.4;
  const currentGridColor =
    gridColorOverride ?? battleData?.gridColor ?? "#444444";
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

  useKeyboardShortcuts({
    onEscape: () => handleSelectEntity(null),
    onSpace: () => {
      if (combat && combat.activeEntityId)
        send({ type: "combat_action", action: { type: "END_TURN" } });
    },
    onHelp: () => setShowHelp((v) => !v),
  });

  useEffect(() => {
    handleSelectEntity(null);
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
        <div className="flex h-full items-center justify-center text-zinc-500">
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
            onSelectEntity={handleSelectEntity}
            onSelectEntities={handleSelectEntities}
            onRollInitiative={undefined}
            focusEntityRequest={focusEntityRequest}
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
          <div className="flex w-full items-center gap-3">
            {/* Film strip scene navigator fills most of the top bar */}
            <div className="min-w-0 flex-1">
              <DirectorFilmStrip
                scenes={scenes}
                activeSceneId={activeSceneId}
                onSelectScene={handleSelectScene}
              />
            </div>

            {/* Actions float right */}
            <div className="flex shrink-0 items-center gap-2">
              <SessionThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFocusMode(true)}
                title="Focus map"
                aria-label="Focus map"
              >
                <Expand className="size-4" />
              </Button>
              {activeSceneId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRevertActiveScene}
                  title="Revert active scene to prepared state"
                >
                  <RotateCcw className="mr-1 size-3.5" />
                  Revert
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleEndSession}>
                End
              </Button>
            </div>
          </div>
        )
      }
      leftRail={
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
                  <span className="truncate">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 rounded bg-zinc-800 px-1 text-[9px] font-semibold text-zinc-400">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {sceneType === "battle" && combat && (
              <TabsContent
                value="combat"
                className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto p-3`}
              >
                <CombatTracker
                  combat={combat}
                  entities={entities}
                  selectedEntityIds={selectedEntityIds}
                  isDirector
                  currentHeroEntityId={null}
                  onClaimTurn={() => {}}
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
      rightRail={
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
                  <span className="truncate">{tab.label}</span>
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
              <TabsContent
                value="combat"
                className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto p-4`}
              >
                {!combat ? (
                  <div className="rounded border border-zinc-800 bg-zinc-900/70 p-3">
                    <div className="mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Combat
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {heroCount} heroes · {creatureCount} villains
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={
                        entities.some((entity) => entity.type === "hero") ===
                          false ||
                        entities.some(
                          (entity) =>
                            entity.type === "monster" || entity.type === "npc",
                        ) === false
                      }
                      onClick={handleStartCombat}
                    >
                      Draw Steel!
                    </Button>
                  </div>
                ) : (
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
                )}
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
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="rounded-lg border border-zinc-700 bg-zinc-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-4 text-sm font-semibold text-zinc-200">
              Keyboard Shortcuts
            </p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between gap-8">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                  Esc
                </kbd>
                <span className="text-zinc-400">Deselect / Close</span>
              </div>
              <div className="flex justify-between gap-8">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                  Space
                </kbd>
                <span className="text-zinc-400">Next Turn</span>
              </div>
              <div className="flex justify-between gap-8">
                <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                  ?
                </kbd>
                <span className="text-zinc-400">Toggle Help</span>
              </div>
              {sceneType === "battle" && (
                <>
                  <div className="mt-2 border-t border-zinc-700 pt-2 text-[10px] text-zinc-500">
                    Battle Tools
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                      H/V/D/F/T/E
                    </kbd>
                    <span className="text-zinc-400">Tools</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                      G
                    </kbd>
                    <span className="text-zinc-400">Toggle Grid</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">
                      Hold Space
                    </kbd>
                    <span className="text-zinc-400">Temporary Pan</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
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
