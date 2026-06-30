import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Expand, Minimize2, Package, RotateCcw } from 'lucide-react';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.js';
import { AppShell, Button } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SessionState, AbilityResult } from '../../types/protocol.js';
import type { ClientMessage } from '../../types/protocol.js';
import type { ConnectionStatus } from '../../hooks/useSessionSocket.js';
import { loadMonsters, isMonsterStatblock, FORGESTEEL_MONSTERS, isMinion } from '@anvil/data';
import type { CompendiumMonster } from '@anvil/data';
import { useAssetsStore, getMonsterPortraitUrl } from '../../stores/assetsStore.js';
import { parseMontageData, parseNegotiationData, parseRespiteData, parseBattleData } from '../../lib/scene-data.js';
import { DirectorFilmStrip } from '../../components/session/DirectorFilmStrip.js';
import { ParticipantStatusBar } from '../../components/session/ParticipantStatusBar.js';
import { CreatureTracker } from '../../components/session/CreatureTracker.js';
import { CombatTracker } from '../../components/session/CombatTracker.js';
import { DamageDialog } from '../../components/session/DamageDialog.js';
import { CombatLog } from '../../components/session/CombatLog.js';
import { ActionLogPanel } from '../../components/session/ActionLogPanel.js';
import { AssetPanel } from '../../components/session/AssetPanel.js';
import { SceneAudioPanel } from '../../components/session/SceneAudioPanel.js';
import { StoryStage } from '../../components/stages/StoryStage.js';
import { MontageStage } from '../../components/stages/MontageStage.js';
import { NegotiationStage } from '../../components/stages/NegotiationStage.js';
import { RespiteStage } from '../../components/stages/RespiteStage.js';
import { BattleStage } from '../../components/stages/BattleStage.js';
import { resolveApiUrl } from '../../lib/api.js';

// Grid color presets (shared with BattleWorkspace)
const GRID_COLORS = [
  { color: '#444444', label: 'Gray' },
  { color: '#ffffff', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#ef4444', label: 'Red' },
  { color: '#3b82f6', label: 'Blue' },
];

interface DirectorViewProps {
  sessionState: SessionState;
  connectionStatus: ConnectionStatus;
  send: (msg: ClientMessage) => void;
  combatLog: AbilityResult[];
}

export function DirectorView({ sessionState, connectionStatus, send, combatLog }: DirectorViewProps) {
  const navigate = useNavigate();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const monsterPortraits = useAssetsStore((s) => s.monsterPortraits);
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

  const sceneData = activeScene?.data ?? {};

  const [showHelp, setShowHelp] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(
    (sceneData['audioMusic'] as string) ?? null,
  );

  // Grid controls (live override — defaults come from scene data)
  const [gridOpacityOverride, setGridOpacityOverride] = useState<number | null>(null);
  const [gridColorOverride, setGridColorOverride] = useState<string | null>(null);

  const heroCount = useMemo(
    () => entities.filter((e) => e.type === 'hero').length,
    [entities],
  );

  // ── Monster compendium (for "Add to Scene" entity creation) ──
  const monstersRef = useRef<CompendiumMonster[]>([]);
  useEffect(() => {
    loadMonsters()
      .then((data) => {
        const statblocks = data.items.filter(isMonsterStatblock) as CompendiumMonster[];
        const ids = new Set(statblocks.map((m) => m._id));
        const supplementary = FORGESTEEL_MONSTERS.filter((m) => !ids.has(m._id));
        monstersRef.current = [...statblocks, ...supplementary];
      })
      .catch(() => {});
  }, []);

  const handleEndSession = useCallback(() => {
    send({ type: 'end_session' });
    navigate('/app/live');
  }, [send, navigate]);

  const handleStartCombat = useCallback(() => {
    const heroEntityIds = entities
      .filter((entity) => entity.type === 'hero')
      .map((entity) => entity.id);
    const villainEntityIds = entities
      .filter((entity) => entity.type === 'monster' || entity.type === 'npc')
      .map((entity) => entity.id);

    send({
      type: 'combat_action',
      action: { type: 'START_COMBAT', heroEntityIds, villainEntityIds },
    });
  }, [entities, send]);

  const handleRollInitiative = useCallback(() => {
    send({ type: 'combat_action', action: { type: 'ROLL_INITIATIVE' } });
  }, [send]);

  const handleRevertActiveScene = useCallback(() => {
    if (!activeSceneId) return;
    const ok = window.confirm('Revert this scene to its prepared starting state? Current token positions, stamina, combat, and scene progress for this scene will be discarded.');
    if (!ok) return;
    send({ type: 'revert_scene', sceneId: activeSceneId });
  }, [activeSceneId, send]);

  // ── Audio sync: update local state AND broadcast to players ──
  const audioAssets = useAssetsStore((s) => s.audioAssets);
  const handleAudioChange = useCallback(
    (newAudioId: string | null) => {
      setActiveAudioId(newAudioId);
      if (newAudioId) {
        const asset = audioAssets.find((a) => a.id === newAudioId);
        const url = resolveApiUrl(asset?.audioUrl ?? (asset?.assetId ? `/api/assets/${asset.assetId}/data` : undefined));
        if (url) {
          send({ type: 'audio_play', audioAssetId: newAudioId, loop: true });
        }
      } else {
        send({ type: 'audio_stop' });
      }
    },
    [audioAssets, send],
  );

  useKeyboardShortcuts({
    onEscape: () => setSelectedEntityId(null),
    onSpace: () => {
      if (combat && combat.activeEntityId) send({ type: 'combat_action', action: { type: 'END_TURN' } });
    },
    onHelp: () => setShowHelp((v) => !v),
  });

  // Parse battle data for grid controls and stage props
  const battleData = sceneType === 'battle' ? parseBattleData(sceneData) : null;
  const currentGridOpacity = gridOpacityOverride ?? battleData?.gridOpacity ?? 0.4;
  const currentGridColor = gridColorOverride ?? battleData?.gridColor ?? '#444444';

  // ── Add monster to scene via WebSocket ──
  const handleAddMonsterToScene = useCallback(
    (monsterName: string, quantity: number) => {
      const monster = monstersRef.current.find(
        (m) => m.name.toLowerCase() === monsterName.toLowerCase(),
      );
      const maxStamina = monster?.stamina ? parseInt(String(monster.stamina), 10) || 0 : 0;

      // Place at map center with stagger for multiple creatures
      const bd = battleData ?? { cols: 30, rows: 20 };
      const centerX = Math.floor(bd.cols / 2);
      const centerY = Math.floor(bd.rows / 2);

      const minionFlag = monster ? isMinion(monster) : false;
      // For minion squads: shared stamina pool = quantity * per-minion stamina
      const squadId = minionFlag && quantity > 1
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
          type: 'monster' as const,
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
        send({ type: 'create_entity', entity });
      }
    },
    [send, battleData, monsterPortraits],
  );

  const handleAddTerrainToScene = useCallback(
    (terrain: { id: string; name: string; category?: string; gridWidth?: number; gridHeight?: number }) => {
      if (!battleData) return;
      const w = Math.max(1, terrain.gridWidth ?? 1);
      const h = Math.max(1, terrain.gridHeight ?? 1);
      const x = Math.max(0, Math.floor((battleData.cols - w) / 2));
      const y = Math.max(0, Math.floor((battleData.rows - h) / 2));
      send({
        type: 'scene_terrain_add',
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

    switch (sceneType) {
      case 'story':
        return (
          <StoryStage
            readAloudText={(sceneData['readAloud'] as string) ?? ''}
            directorNotes={(sceneData['notes'] as string) ?? ''}
            isDirector
            onUpdateReadAloud={(readAloudText) => send({ type: 'story_update', readAloudText })}
          />
        );
      case 'montage': {
        const montage = parseMontageData(sceneData);
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
            isDirector
            testLog={liveMontage?.testLog}
            onAdjustSuccesses={(delta) => send({ type: 'montage_adjust_successes', delta })}
            onAdjustFailures={(delta) => send({ type: 'montage_adjust_failures', delta })}
            onResetMontage={() => send({ type: 'montage_reset' })}
          />
        );
      }
      case 'negotiation': {
        const neg = parseNegotiationData(sceneData);
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
            isDirector
            argumentLog={liveNeg?.argumentLog}
            onInterestChange={(delta) => send({ type: 'negotiation_adjust_interest', delta })}
            onPatienceChange={(delta) => send({ type: 'negotiation_adjust_patience', delta })}
            onRevealMotivation={(id) => send({ type: 'negotiation_reveal_motivation', id })}
            onRevealPitfall={(id) => send({ type: 'negotiation_reveal_pitfall', id })}
            onEndNegotiation={() => send({ type: 'negotiation_end', phase: (liveNeg?.interest ?? neg.interest) >= 3 ? 'success' : 'failure' })}
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
            isDirector
            onCompleteActivity={(activityId) => send({ type: 'respite_complete_activity', activityId })}
          />
        );
      }
      case 'battle': {
        const battle = battleData!;
        return (
          <BattleStage
            entities={entities}
            combat={combat}
            selectedEntityId={selectedEntityId}
            isDirector
            cols={battle.cols}
            rows={battle.rows}
            cellSize={battle.cellSize}
            backgroundUrl={battle.backgroundUrl}
            drawings={battle.drawings}
            fogZones={battle.fogZones}
            terrain={battle.terrain}
            gridOpacity={currentGridOpacity}
            gridColor={currentGridColor}
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
          <Button variant="secondary" size="sm" onClick={() => setFocusMode(false)} title="Exit full screen">
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
              combat={sceneType === 'battle' ? combat : null}
              entities={entities}
              onSelectScene={handleSelectScene}
            />
          </div>

          {/* Actions float right */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFocusMode(true)}
              title="Focus map"
              aria-label="Focus map"
            >
              <Expand className="size-4" />
            </Button>
            <Button
              variant={showAssets ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setShowAssets((v) => !v);
                setRightRailCollapsed(false);
              }}
              title="Toggle Assets Panel"
            >
              <Package className="mr-1 size-3.5" />
              Assets
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
      )}
      leftRail={focusMode ? undefined : (
        <div className="flex h-full min-h-0 flex-col">
          {sceneType === 'battle' && combat && (
            <div className="shrink-0 border-b border-zinc-800 p-3">
              <CombatTracker
                combat={combat}
                entities={entities}
                isDirector
                currentHeroEntityId={null}
                onClaimTurn={() => {}}
                onSelectTurn={(entityId) => send({ type: 'combat_action', action: { type: 'SELECT_TURN', entityId } })}
                onEndTurn={() => send({ type: 'combat_action', action: { type: 'END_TURN' } })}
                onEndCombat={() => send({ type: 'combat_action', action: { type: 'END_COMBAT' } })}
                onAdjustMalice={(delta) => send({ type: 'combat_action', action: { type: 'ADJUST_MALICE', delta } })}
                onRollInitiative={handleRollInitiative}
              />
            </div>
          )}
          <div className="min-h-0 flex-1">
            <CreatureTracker
              entities={entities}
              combat={combat}
              send={send}
            />
          </div>
          <ActionLogPanel
            entries={sessionState.actionLog ?? []}
            sceneType={sceneType}
            send={send}
            className="max-h-[45%] shrink-0 border-t"
          />
        </div>
      )}
      rightRail={focusMode ? undefined : (
        <div className="flex h-full flex-col overflow-hidden">
          {/* Scene audio — always visible at top of right rail */}
          <div className="shrink-0 border-b border-zinc-800 p-3">
            <SceneAudioPanel
              campaignId={sessionState.campaignId}
              audioId={activeAudioId}
              onAudioChange={handleAudioChange}
              label="Now Playing"
            />
          </div>

          {showAssets && sceneType ? (
            <div className="flex-1 overflow-y-auto p-2">
              <AssetPanel
                sceneType={sceneType}
                sceneId={activeScene?.id ?? ''}
                campaignId={sessionState.campaignId}
                heroCount={heroCount}
                onAddMonsterToScene={handleAddMonsterToScene}
                onAddTerrainToScene={handleAddTerrainToScene}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {sceneType === 'battle' && !combat && (
                <div className="rounded border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Combat</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {entities.filter((entity) => entity.type === 'hero').length} heroes ·{' '}
                      {entities.filter((entity) => entity.type === 'monster' || entity.type === 'npc').length} villains
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={
                      entities.some((entity) => entity.type === 'hero') === false ||
                      entities.some((entity) => entity.type === 'monster' || entity.type === 'npc') === false
                    }
                    onClick={handleStartCombat}
                  >
                    Start Combat
                  </Button>
                </div>
              )}

              {combat && (
                <>
                  <DamageDialog
                    entities={entities}
                    onApplyDamage={(entityId, amount) => send({
                      type: 'token_action',
                      action: { kind: 'manual-damage', targetId: entityId, amount },
                    })}
                    onApplyHealing={(entityId, amount) => send({
                      type: 'token_action',
                      action: { kind: 'manual-heal', targetId: entityId, amount },
                    })}
                  />
                  <div className="h-48">
                    <CombatLog entries={combatLog} entityNames={entityNames} />
                  </div>
                </>
              )}

              {/* Grid controls — shown when in battle scene and not in assets view */}
              {sceneType === 'battle' && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-zinc-400">Grid Overlay</span>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs text-zinc-500">Opacity</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(currentGridOpacity * 100)}
                        onChange={(e) => setGridOpacityOverride(Number(e.target.value) / 100)}
                        className="h-1 flex-1 accent-zinc-400"
                      />
                      <span className="w-8 text-right text-xs text-zinc-500">
                        {Math.round(currentGridOpacity * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-12 text-xs text-zinc-500">Color</span>
                      {GRID_COLORS.map(({ color, label }) => (
                        <button
                          key={color}
                          type="button"
                          title={label}
                          className={`h-5 w-5 rounded-full border-2 transition-transform ${
                            currentGridColor === color
                              ? 'scale-125 border-white'
                              : 'border-zinc-600 hover:border-zinc-400'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setGridColorOverride(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
              {sceneType === 'battle' && (
                <>
                  <div className="mt-2 border-t border-zinc-700 pt-2 text-[10px] text-zinc-500">Battle Tools</div>
                  <div className="flex justify-between gap-8">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">H/V/D/F/T/E</kbd>
                    <span className="text-zinc-400">Tools</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">G</kbd>
                    <span className="text-zinc-400">Toggle Grid</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <kbd className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-zinc-300">Hold Space</kbd>
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
