import { useCallback, useMemo, useState, useEffect, useRef, type DragEvent } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@anvil/ui';
import { ChevronDown, ImageIcon, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { BattleCanvas } from '../../canvas/BattleCanvas.js';
import { BattleToolbar } from './BattleToolbar.js';
import { ViewportControls } from './ViewportControls.js';
import { MapPickerDialog } from './MapPickerDialog.js';
import { SceneAudioPanel } from '../session/SceneAudioPanel.js';
import type { BattleTool } from './BattleToolbar.js';
import type { ViewportSystem } from '../../canvas/systems/ViewportSystem.js';
import type { Scene } from './SceneWorkspace.js';
import type { CompendiumTerrain, MapAsset, TerrainCategory } from '@anvil/types';
import { ALL_TERRAINS, TERRAIN_CATEGORY_NAMES, getTerrainDescription } from '@anvil/data';
import type { EntityData } from '../../types/protocol.js';
import type { DrawingData } from '../../canvas/layers/DrawingLayer.js';
import type { TerrainZoneData } from '../../canvas/layers/TerrainLayer.js';
import type { FogZoneData } from '../../canvas/layers/FogLayer.js';
import { useAssetsStore } from '../../stores/assetsStore.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BattleWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
  focusMode?: boolean;
}

interface BattleToken {
  id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: number;
  type: 'monster' | 'hero' | 'npc';
  npcId?: string;
  portraitUrl?: string;
}

interface BattleSceneData {
  mapUrl: string;
  mapAssetId: string;
  gridCols: number;
  gridRows: number;
  gridCellSize: number;
  gridType: 'square' | 'hex';
  gridOpacity: number;
  gridColor: string;
  tokens: BattleToken[];
  drawings: DrawingData[];
  terrain: TerrainZoneData[];
  fog: FogZoneData[];
  difficulty: 'easy' | 'standard' | 'hard' | 'extreme';
  notes: string;
  creatureGroups: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTerrainDropSize(terrain: CompendiumTerrain): { w: number; h: number } {
  const areaText = [terrain.area, terrain.description].filter(Boolean).join(' ');
  const match = areaText.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/i);
  if (!match) return { w: 1, h: 1 };

  const width = Math.max(1, Math.min(8, Math.ceil(Number(match[1]) / 5)));
  const height = Math.max(1, Math.min(8, Math.ceil(Number(match[2]) / 5)));
  return { w: width, h: height };
}

// ---------------------------------------------------------------------------
// Undo stack
// ---------------------------------------------------------------------------

interface UndoEntry {
  data: Record<string, unknown>;
}

const MAX_UNDO = 50;

const TERRAIN_CATEGORIES: Array<TerrainCategory | 'all'> = [
  'all',
  'environmental',
  'fieldwork',
  'mechanism',
  'siege-engine',
  'power-fixture',
  'supernatural',
];

const TERRAIN_ROLE_COLORS: Record<string, number> = {
  fortification: 0x8b5cf6,
  hazard: 0xef4444,
  relic: 0xa855f7,
  'siege-engine': 0xf59e0b,
  trap: 0xf97316,
  trigger: 0x22c55e,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BattleWorkspace({ data, onChange, campaignId, focusMode = false }: BattleWorkspaceProps) {
  // Tool state
  const [activeTool, setActiveTool] = useState<BattleTool>('select');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(2);
  const [gridVisible, setGridVisible] = useState(true);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState('');
  const [selectedTerrainId, setSelectedTerrainId] = useState(ALL_TERRAINS[0]?.id ?? 'terrain-brambles');
  const [terrainCategoryFilter, setTerrainCategoryFilter] = useState<TerrainCategory | 'all'>('all');
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);

  // Viewport controls
  const [zoom, setZoom] = useState(1);
  const [bgNaturalSize, setBgNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const viewportRef = useRef<ViewportSystem | null>(null);
  const prevToolRef = useRef<BattleTool>('select');

  // Undo stack
  const undoStackRef = useRef<UndoEntry[]>([]);
  const redoStackRef = useRef<UndoEntry[]>([]);

  const pushUndo = useCallback((currentData: Record<string, unknown>) => {
    undoStackRef.current.push({ data: structuredClone(currentData) });
    if (undoStackRef.current.length > MAX_UNDO) {
      undoStackRef.current.shift();
    }
    // Clear redo on new action
    redoStackRef.current = [];
  }, []);

  const undo = useCallback(() => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    // Push current state to redo
    redoStackRef.current.push({ data: structuredClone(data) });
    onChange(entry.data);
  }, [data, onChange]);

  const redo = useCallback(() => {
    const entry = redoStackRef.current.pop();
    if (!entry) return;
    undoStackRef.current.push({ data: structuredClone(data) });
    onChange(entry.data);
  }, [data, onChange]);

  // Helper: onChange with undo tracking
  const changeWithUndo = useCallback(
    (newData: Record<string, unknown>) => {
      pushUndo(data);
      onChange(newData);
    },
    [data, onChange, pushUndo],
  );

  // Parse data helpers
  const parseTokens = (): BattleToken[] => {
    const raw = data['tokens'];
    if (Array.isArray(raw)) return raw as BattleToken[];
    return [];
  };

  const parseDrawings = (): DrawingData[] => {
    const raw = data['drawings'];
    if (Array.isArray(raw)) return raw as DrawingData[];
    return [];
  };

  const parseTerrain = (): TerrainZoneData[] => {
    const raw = data['terrain'];
    if (Array.isArray(raw)) return raw as TerrainZoneData[];
    return [];
  };

  const parseFog = (): FogZoneData[] => {
    const raw = data['fog'];
    if (Array.isArray(raw)) return raw as FogZoneData[];
    return [];
  };

  const battleData: BattleSceneData = {
    mapUrl: (data['mapUrl'] as string) ?? '',
    mapAssetId: (data['mapAssetId'] as string) ?? '',
    gridCols: (data['gridCols'] as number) ?? (data['gridSize'] as number) ?? 30,
    gridRows: (data['gridRows'] as number) ?? 20,
    gridCellSize: (data['gridCellSize'] as number) ?? 48,
    gridType: (data['gridType'] as 'square' | 'hex') ?? 'square',
    gridOpacity: (data['gridOpacity'] as number) ?? 0.4,
    gridColor: (data['gridColor'] as string) ?? '#444444',
    tokens: parseTokens(),
    drawings: parseDrawings(),
    terrain: parseTerrain(),
    fog: parseFog(),
    difficulty: (data['difficulty'] as BattleSceneData['difficulty']) ?? 'standard',
    notes: (data['notes'] as string) ?? '',
    creatureGroups: (data['creatureGroups'] as string) ?? '',
  };

  // When a background is loaded, derive grid cols/rows from image dimensions and cell size.
  // Otherwise use the manually-set gridCols/gridRows.
  const hasBackground = !!bgNaturalSize && !!battleData.mapUrl;
  const effectiveCellSize = battleData.gridCellSize;
  const effectiveCols = hasBackground
    ? Math.ceil(bgNaturalSize.width / effectiveCellSize)
    : battleData.gridCols;
  const effectiveRows = hasBackground
    ? Math.ceil(bgNaturalSize.height / effectiveCellSize)
    : battleData.gridRows;

  // Resolve the display name of the selected library map
  const maps = useAssetsStore((s) => s.maps);
  const npcs = useAssetsStore((s) => s.npcs);
  const loadNpcs = useAssetsStore((s) => s.loadNpcs);

  useEffect(() => {
    void loadNpcs(campaignId);
  }, [campaignId, loadNpcs]);

  const selectedMapName = useMemo(() => {
    if (!battleData.mapAssetId) return null;
    return maps.find((m) => m.id === battleData.mapAssetId)?.name ?? null;
  }, [battleData.mapAssetId, maps]);

  const selectedNpc = useMemo(() => {
    if (!selectedNpcId) return null;
    return npcs.find((npc) => npc.id === selectedNpcId) ?? null;
  }, [npcs, selectedNpcId]);

  const selectedTerrain = useMemo(() => {
    return ALL_TERRAINS.find((terrain) => terrain.id === selectedTerrainId) ?? ALL_TERRAINS[0];
  }, [selectedTerrainId]);

  const filteredTerrains = useMemo(() => {
    if (terrainCategoryFilter === 'all') return ALL_TERRAINS;
    return ALL_TERRAINS.filter((terrain) => terrain.category === terrainCategoryFilter);
  }, [terrainCategoryFilter]);

  const updateField = <K extends keyof BattleSceneData>(field: K, value: BattleSceneData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Token handlers
  const addToken = useCallback(
    (name: string, type: BattleToken['type'], extra: Partial<BattleToken> = {}) => {
      const newToken: BattleToken = {
        id: generateId(),
        name,
        x: Math.floor(effectiveCols / 2),
        y: Math.floor(effectiveRows / 2),
        size: 1,
        color: type === 'hero' ? 0x3b82f6 : type === 'monster' ? 0xef4444 : 0x8b5cf6,
        type,
        ...extra,
      };
      changeWithUndo({ ...data, tokens: [...battleData.tokens, newToken] });
    },
    [data, battleData.tokens, effectiveCols, effectiveRows, changeWithUndo],
  );

  const addSelectedNpcToken = useCallback(() => {
    if (selectedNpc) {
      addToken(selectedNpc.name, 'npc', {
        npcId: selectedNpc.id,
        portraitUrl: selectedNpc.portraitUrl,
      });
      return;
    }
    addToken('NPC', 'npc');
  }, [addToken, selectedNpc]);

  const removeToken = useCallback(
    (id: string) => {
      changeWithUndo({ ...data, tokens: battleData.tokens.filter((t) => t.id !== id) });
    },
    [data, battleData.tokens, changeWithUndo],
  );

  const updateToken = useCallback(
    (id: string, updates: Partial<BattleToken>) => {
      const updated = battleData.tokens.map((t) => (t.id === id ? { ...t, ...updates } : t));
      onChange({ ...data, tokens: updated });
    },
    [data, battleData.tokens, onChange],
  );

  // Canvas callbacks
  const handleSelectEntity = useCallback(() => {}, []);

  const handleMoveEntity = useCallback(
    (entityId: string, x: number, y: number) => {
      pushUndo(data);
      updateToken(entityId, { x, y });
    },
    [data, pushUndo, updateToken],
  );

  const handleDrawingAdd = useCallback(
    (points: number[], color: string, width: number) => {
      const newDrawing: DrawingData = {
        id: generateId(),
        type: 'freehand',
        points,
        color,
        width,
      };
      changeWithUndo({ ...data, drawings: [...battleData.drawings, newDrawing] });
    },
    [data, battleData.drawings, changeWithUndo],
  );

  const handleDrawingRemove = useCallback(
    (drawingId: string) => {
      changeWithUndo({ ...data, drawings: battleData.drawings.filter((d) => d.id !== drawingId) });
    },
    [data, battleData.drawings, changeWithUndo],
  );

  const createTerrainZone = useCallback(
    (terrain: CompendiumTerrain | undefined, gridX: number, gridY: number, w: number, h: number): TerrainZoneData => ({
      id: generateId(),
      terrainId: terrain?.id ?? 'terrain-brambles',
      name: terrain?.name ?? 'Terrain',
      x: gridX,
      y: gridY,
      w,
      h,
      color: terrain ? TERRAIN_ROLE_COLORS[terrain.role.terrainType] ?? 0x3b82f6 : 0x3b82f6,
    }),
    [],
  );

  const handleTerrainAdd = useCallback(
    (gridX: number, gridY: number, w: number, h: number) => {
      const newZone = createTerrainZone(selectedTerrain, gridX, gridY, w, h);
      changeWithUndo({ ...data, terrain: [...battleData.terrain, newZone] });
    },
    [data, battleData.terrain, selectedTerrain, createTerrainZone, changeWithUndo],
  );

  const handleTerrainDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const terrainId = event.dataTransfer.getData('application/x-anvil-terrain');
      if (!terrainId) return;

      event.preventDefault();
      const terrain = ALL_TERRAINS.find((item) => item.id === terrainId);
      if (!terrain) return;

      const gridPoint = viewportRef.current?.screenToGrid(event.clientX, event.clientY, effectiveCellSize);
      if (!gridPoint) return;

      const { w, h } = getTerrainDropSize(terrain);
      const x = Math.max(0, Math.min(Math.max(0, effectiveCols - w), gridPoint.gridX - Math.floor(w / 2)));
      const y = Math.max(0, Math.min(Math.max(0, effectiveRows - h), gridPoint.gridY - Math.floor(h / 2)));
      const newZone = createTerrainZone(terrain, x, y, w, h);

      setSelectedTerrainId(terrain.id);
      setActiveTool('terrain');
      changeWithUndo({ ...data, terrain: [...battleData.terrain, newZone] });
    },
    [data, battleData.terrain, effectiveCellSize, effectiveCols, effectiveRows, createTerrainZone, changeWithUndo],
  );

  const handleTerrainDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes('application/x-anvil-terrain')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleTerrainRemove = useCallback(
    (terrainId: string) => {
      changeWithUndo({ ...data, terrain: battleData.terrain.filter((t) => t.id !== terrainId) });
    },
    [data, battleData.terrain, changeWithUndo],
  );

  const handleFogAdd = useCallback(
    (gridX: number, gridY: number, w: number, h: number) => {
      const newZone: FogZoneData = {
        id: generateId(),
        x: gridX,
        y: gridY,
        w,
        h,
      };
      changeWithUndo({ ...data, fog: [...battleData.fog, newZone] });
    },
    [data, battleData.fog, changeWithUndo],
  );

  const handleFogRemove = useCallback(
    (fogId: string) => {
      changeWithUndo({ ...data, fog: battleData.fog.filter((f) => f.id !== fogId) });
    },
    [data, battleData.fog, changeWithUndo],
  );

  // Map selection handlers
  const handleLibraryMapSelect = useCallback(
    (map: MapAsset) => {
      const updates: Record<string, unknown> = {
        mapUrl: map.imageUrl ?? '',
        mapAssetId: map.id,
      };
      if (map.gridType === 'gridded') {
        updates['gridOpacity'] = 0;
      }
      changeWithUndo({ ...data, ...updates });
    },
    [data, changeWithUndo],
  );

  const handleExternalUrlChange = useCallback(
    (url: string) => {
      onChange({ ...data, mapUrl: url, mapAssetId: '' });
    },
    [data, onChange],
  );

  const handleClearMap = useCallback(() => {
    setBgNaturalSize(null);
    changeWithUndo({ ...data, mapUrl: '', mapAssetId: '' });
  }, [data, changeWithUndo]);

  // Convert tokens to EntityData for canvas
  const entities: EntityData[] = useMemo(() => {
    return battleData.tokens.map((t) => ({
      id: t.id,
      type: t.type,
      name: t.name,
      x: t.x,
      y: t.y,
      size: t.size,
      color: t.color,
      npcId: t.npcId,
      portraitUrl: t.portraitUrl,
      hp: 100,
      maxHp: 100,
      conditions: [],
    }));
  }, [battleData.tokens]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Space hold for temporary pan mode
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        prevToolRef.current = activeTool as BattleTool;
        setActiveTool('pan');
        return;
      }

      // Tool shortcuts
      switch (e.key.toLowerCase()) {
        case 'h':
          setActiveTool('pan');
          return;
        case 'v':
          setActiveTool('select');
          return;
        case 'd':
          setActiveTool('draw');
          return;
        case 'f':
          setActiveTool('fog');
          return;
        case 't':
          setActiveTool('terrain');
          return;
        case 'e':
          setActiveTool('eraser');
          return;
        case 'g':
          setGridVisible((v) => !v);
          return;
      }

      // Ctrl+Z / Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Zoom shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        viewportRef.current?.zoomIn();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        viewportRef.current?.zoomOut();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        viewportRef.current?.fitToRect(
          effectiveCols * effectiveCellSize,
          effectiveRows * effectiveCellSize,
        );
        return;
      }

      // Delete key removes selected (future: need selectedTokenId state)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // TODO: remove selected token/drawing when selection tracking is added
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Release Space to restore previous tool
      if (e.key === ' ') {
        setActiveTool(prevToolRef.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [undo, redo, activeTool, effectiveCols, effectiveRows, effectiveCellSize]);

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Main area: Battle canvas preview */}
      <div
        className="relative flex-1 overflow-hidden bg-zinc-950"
        onDragOver={handleTerrainDragOver}
        onDrop={handleTerrainDrop}
      >
        {/* Floating toolbar */}
        <BattleToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          drawColor={drawColor}
          onDrawColorChange={setDrawColor}
          drawWidth={drawWidth}
          onDrawWidthChange={setDrawWidth}
          gridVisible={gridVisible}
          onToggleGrid={() => setGridVisible((v) => !v)}
          fogZoneCount={battleData.fog.length}
          onClearFog={() => changeWithUndo({ ...data, fog: [] })}
        />

        {/* Viewport controls (zoom +/-, fit) */}
        <ViewportControls
          zoom={zoom}
          onZoomIn={() => viewportRef.current?.zoomIn()}
          onZoomOut={() => viewportRef.current?.zoomOut()}
          onFitToMap={() =>
            viewportRef.current?.fitToRect(
              effectiveCols * effectiveCellSize,
              effectiveRows * effectiveCellSize,
            )
          }
        />

        {/* BattleCanvas in builder mode */}
        <BattleCanvas
          cols={effectiveCols}
          rows={effectiveRows}
          cellSize={effectiveCellSize}
          entities={entities}
          selectedEntityId={null}
          backgroundUrl={battleData.mapUrl || null}
          isDirector={true}
          onSelectEntity={handleSelectEntity}
          onMoveEntity={handleMoveEntity}
          builderMode={true}
          activeTool={activeTool}
          drawColor={drawColor}
          drawWidth={drawWidth}
          drawings={battleData.drawings}
          terrain={battleData.terrain}
          onDrawingAdd={handleDrawingAdd}
          onDrawingRemove={handleDrawingRemove}
          onTerrainAdd={handleTerrainAdd}
          onTerrainRemove={handleTerrainRemove}
          fogZones={battleData.fog}
          onFogAdd={handleFogAdd}
          onFogRemove={handleFogRemove}
          gridVisible={gridVisible}
          gridOpacity={battleData.gridOpacity}
          gridColor={battleData.gridColor}
          onZoomChange={setZoom}
          onBackgroundLoaded={(info) =>
            setBgNaturalSize({ width: info.naturalWidth, height: info.naturalHeight })
          }
          viewportRef={viewportRef}
        />

        {/* Empty state hint */}
        {!battleData.mapUrl && entities.length === 0 && battleData.drawings.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-600">
              <p className="text-lg font-medium">Battle Scene</p>
              <p className="mt-1 text-sm">Add a map and tokens in the sidebar, or draw on the canvas</p>
            </div>
          </div>
        )}
      </div>

      {!focusMode && rightRailCollapsed && (
        <button
          type="button"
          title="Expand editor pane"
          aria-label="Expand editor pane"
          onClick={() => setRightRailCollapsed(false)}
          className="absolute right-2 top-3 z-30 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
        >
          <PanelRightOpen className="size-4" />
        </button>
      )}

      {/* Right sidebar: Editor fields */}
      {!focusMode && !rightRailCollapsed && (
        <div className="relative w-96 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/80 p-4 pl-10">
        <button
          type="button"
          title="Collapse editor pane"
          aria-label="Collapse editor pane"
          onClick={() => setRightRailCollapsed(true)}
          className="absolute left-2 top-3 z-20 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
        >
          <PanelRightClose className="size-4" />
        </button>
        <div className="flex flex-col gap-5">
          {/* Scene Audio */}
          <SceneAudioPanel
            campaignId={campaignId}
            audioId={(data['audioMusic'] as string) ?? null}
            onAudioChange={(id) => onChange({ ...data, audioMusic: id ?? undefined })}
          />

          {/* Battle Map */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-zinc-300">Battle Map</span>

            {/* Map preview */}
            {battleData.mapUrl && (
              <div className="relative aspect-video overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
                <img
                  src={battleData.mapUrl}
                  alt="Battle map preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {selectedMapName && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
                    <p className="truncate text-xs text-zinc-300">{selectedMapName}</p>
                  </div>
                )}
                <button
                  onClick={handleClearMap}
                  className="absolute right-1.5 top-1.5 rounded bg-black/60 p-1 text-zinc-400 hover:bg-black/80 hover:text-zinc-200"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            {/* Browse Maps button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapPickerOpen(true)}
              className="w-full"
            >
              <ImageIcon className="mr-1.5 size-3.5" />
              Browse Maps
            </Button>

            <MapPickerDialog
              campaignId={campaignId}
              open={mapPickerOpen}
              onOpenChange={setMapPickerOpen}
              onSelect={handleLibraryMapSelect}
              selectedMapId={battleData.mapAssetId || null}
            />

            {/* Paste URL fallback */}
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
                <ChevronDown className="size-3" />
                Or paste an external URL
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <Input
                  value={battleData.mapAssetId ? '' : battleData.mapUrl}
                  onChange={(e) => handleExternalUrlChange(e.target.value)}
                  placeholder="https://... (battle map image)"
                  className="text-sm"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Terrain selector */}
          {activeTool === 'terrain' && (
            <div className="flex flex-col gap-3 rounded-md border border-zinc-700 bg-zinc-900/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Terrain</span>
                <span className="text-xs text-zinc-500">Drag cards or draw boxes</span>
              </div>
              <select
                className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
                value={terrainCategoryFilter}
                onChange={(e) => setTerrainCategoryFilter(e.target.value as TerrainCategory | 'all')}
              >
                {TERRAIN_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All terrain' : TERRAIN_CATEGORY_NAMES[category]}
                  </option>
                ))}
              </select>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredTerrains.map((terrain) => {
                  const active = terrain.id === selectedTerrainId;
                  return (
                    <button
                      key={terrain.id}
                      type="button"
                      draggable
                      onClick={() => setSelectedTerrainId(terrain.id)}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('application/x-anvil-terrain', terrain.id);
                        event.dataTransfer.effectAllowed = 'copy';
                        setSelectedTerrainId(terrain.id);
                      }}
                      className={`w-full cursor-grab rounded-md border p-3 text-left transition-colors active:cursor-grabbing ${
                        active
                          ? 'border-red-400 bg-red-500/10 text-zinc-100'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{terrain.name}</span>
                        <span className="shrink-0 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                          Lv {terrain.level}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{getTerrainDescription(terrain)}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{terrain.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {/* Grid settings */}
          {hasBackground ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Cell Size</span>
                <span className="text-xs text-zinc-500">
                  {effectiveCols} × {effectiveRows} cells
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={16}
                  max={200}
                  step={1}
                  value={battleData.gridCellSize}
                  onChange={(e) => updateField('gridCellSize', Number(e.target.value))}
                  className="h-1 flex-1 accent-zinc-400"
                />
                <span className="w-10 text-right text-xs text-zinc-500">
                  {battleData.gridCellSize}px
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-300">Grid Columns</span>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={battleData.gridCols}
                  onChange={(e) => updateField('gridCols', Number(e.target.value))}
                  className="text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-300">Grid Rows</span>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={battleData.gridRows}
                  onChange={(e) => updateField('gridRows', Number(e.target.value))}
                  className="text-sm"
                />
              </label>
            </div>
          )}

          {/* Grid Opacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Grid Overlay</span>
              <button
                onClick={() => setGridVisible((v) => !v)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  gridVisible
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {gridVisible ? 'On' : 'Off'}
              </button>
            </div>
            {gridVisible && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(battleData.gridOpacity * 100)}
                    onChange={(e) => updateField('gridOpacity', Number(e.target.value) / 100)}
                    className="h-1 flex-1 accent-zinc-400"
                  />
                  <span className="w-8 text-right text-xs text-zinc-500">
                    {Math.round(battleData.gridOpacity * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-zinc-500">Color</span>
                  {[
                    { color: '#444444', label: 'Gray' },
                    { color: '#ffffff', label: 'White' },
                    { color: '#000000', label: 'Black' },
                    { color: '#eab308', label: 'Yellow' },
                    { color: '#ef4444', label: 'Red' },
                    { color: '#3b82f6', label: 'Blue' },
                  ].map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      className={`h-5 w-5 rounded-full border-2 transition-transform ${
                        battleData.gridColor === color
                          ? 'scale-125 border-white'
                          : 'border-zinc-600 hover:border-zinc-400'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateField('gridColor', color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Difficulty */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Encounter Difficulty</span>
            <select
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
              value={battleData.difficulty}
              onChange={(e) => updateField('difficulty', e.target.value as BattleSceneData['difficulty'])}
            >
              <option value="easy">Easy</option>
              <option value="standard">Standard</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </label>

          {/* Tokens */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">Tokens</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToken('Monster', 'monster')}
                  className="text-red-400"
                >
                  + Monster
                </Button>
              </div>
              <div className="mt-2 flex gap-2">
                <select
                  className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
                  value={selectedNpcId}
                  onChange={(e) => setSelectedNpcId(e.target.value)}
                >
                  <option value="">Generic NPC</option>
                  {npcs.map((npc) => (
                    <option key={npc.id} value={npc.id}>{npc.name}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSelectedNpcToken}
                  className="shrink-0 text-purple-400"
                >
                  + NPC
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {battleData.tokens.length === 0 && (
                <p className="text-xs text-zinc-500">
                  No tokens yet. Add monsters or NPCs to the battle.
                </p>
              )}
              {battleData.tokens.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                    style={{ backgroundColor: `#${t.color.toString(16).padStart(6, '0')}` }}
                  >
                    {t.portraitUrl ? (
                      <img src={t.portraitUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-semibold uppercase text-white/80">{t.type.slice(0, 1)}</span>
                    )}
                  </div>
                  <Input
                    value={t.name}
                    onChange={(e) => updateToken(t.id, { name: e.target.value })}
                    placeholder="Token name"
                    className="flex-1 text-sm"
                  />
                  <span className="text-xs text-zinc-500">
                    ({t.x}, {t.y})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeToken(t.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Drawings summary */}
          {battleData.drawings.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
              <span className="text-sm text-zinc-300">
                {battleData.drawings.length} drawing{battleData.drawings.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeWithUndo({ ...data, drawings: [] })}
                className="text-red-400 hover:text-red-300"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Terrain summary */}
          {battleData.terrain.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
              <span className="text-sm text-zinc-300">
                {battleData.terrain.length} terrain zone{battleData.terrain.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeWithUndo({ ...data, terrain: [] })}
                className="text-red-400 hover:text-red-300"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Fog summary */}
          {battleData.fog.length > 0 && (
            <div className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
              <span className="text-sm text-zinc-300">
                {battleData.fog.length} fog zone{battleData.fog.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => changeWithUndo({ ...data, fog: [] })}
                className="text-red-400 hover:text-red-300"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Creature groups (legacy compatibility) */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Creature Notes</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={battleData.creatureGroups}
              onChange={(e) => updateField('creatureGroups', e.target.value)}
              placeholder="Goblin x3&#10;Goblin Cursespitter x1"
            />
            <p className="text-xs text-zinc-500">
              Quick reference for creatures in this encounter.
            </p>
          </label>

          {/* Director Notes */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Director Notes</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={battleData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Tactical notes for running this encounter..."
            />
          </label>

          {/* Keyboard shortcuts hint */}
          <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
            <p className="mb-2 text-xs font-medium text-zinc-400">Shortcuts</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
              <span><kbd className="rounded bg-zinc-800 px-1">H</kbd> Pan</span>
              <span><kbd className="rounded bg-zinc-800 px-1">V</kbd> Select</span>
              <span><kbd className="rounded bg-zinc-800 px-1">D</kbd> Draw</span>
              <span><kbd className="rounded bg-zinc-800 px-1">F</kbd> Fog</span>
              <span><kbd className="rounded bg-zinc-800 px-1">T</kbd> Terrain</span>
              <span><kbd className="rounded bg-zinc-800 px-1">E</kbd> Eraser</span>
              <span><kbd className="rounded bg-zinc-800 px-1">G</kbd> Grid</span>
              <span><kbd className="rounded bg-zinc-800 px-1">Space</kbd> Hold to pan</span>
              <span><kbd className="rounded bg-zinc-800 px-1">Ctrl+Z</kbd> Undo</span>
              <span><kbd className="rounded bg-zinc-800 px-1">Ctrl+Shift+Z</kbd> Redo</span>
              <span><kbd className="rounded bg-zinc-800 px-1">Ctrl+=/-</kbd> Zoom</span>
              <span><kbd className="rounded bg-zinc-800 px-1">Ctrl+0</kbd> Fit map</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
