import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  Button,
  Input,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@anvil/ui';
import {
  CloudFog,
  Gauge,
  Grid3X3,
  HeartPulse,
  ImageIcon,
  Keyboard,
  Map,
  Mountain,
  Music,
  PanelRightClose,
  PanelRightOpen,
  PencilLine,
  ScrollText,
  ShieldAlert,
  Sword,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { BattleCanvas } from '../../canvas/BattleCanvas.js';
import { BattleToolbar } from './BattleToolbar.js';
import { ViewportControls } from './ViewportControls.js';
import { MapPickerDialog } from './MapPickerDialog.js';
import { SceneAudioPanel } from '../session/SceneAudioPanel.js';
import { AbilityBlock } from '../drawsteel/AbilityBlock.js';
import { drawSteelAbilityFromLike } from '../drawsteel/abilityData.js';
import type { BattleTool, FogBrushMode } from './BattleToolbar.js';
import type { ViewportSystem } from '../../canvas/systems/ViewportSystem.js';
import type { Scene } from './SceneWorkspace.js';
import type {
  CompendiumTerrain,
  MapAsset,
  TerrainCategory,
} from '@anvil/types';
import {
  ALL_TERRAINS,
  GameData,
  LORD_RELG_STATBLOCK,
  TERRAIN_CATEGORY_NAMES,
  getTerrainDescription,
} from '@anvil/data';
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
  monsterName?: string;
  level?: number;
  roles?: string[];
  maxStamina?: number;
  currentStamina?: number;
  speed?: number | string;
  notes?: string;
  features?: BuilderMonsterFeature[];
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

interface BuilderMonsterFeature {
  name?: string;
  feature_type?: string;
  ability_type?: string;
  cost?: string;
  usage?: string;
  distance?: string;
  target?: string;
  keywords?: string[];
  effects?: Array<{
    roll?: string;
    tier1?: string;
    tier2?: string;
    tier3?: string;
    effect?: string;
  }>;
}

interface BuilderMonsterDetails {
  name?: string;
  level?: number;
  stamina?: number | string;
  speed?: string | number;
  roles?: string[];
  features?: BuilderMonsterFeature[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTerrainDropSize(terrain: CompendiumTerrain): {
  w: number;
  h: number;
} {
  const areaText = [terrain.area, terrain.description]
    .filter(Boolean)
    .join(' ');
  const match = areaText.match(/(\d+)\s*(?:x|by|×)\s*(\d+)/i);
  if (!match) return { w: 1, h: 1 };

  const width = Math.max(1, Math.min(8, Math.ceil(Number(match[1]) / 5)));
  const height = Math.max(1, Math.min(8, Math.ceil(Number(match[2]) / 5)));
  return { w: width, h: height };
}

function splitFogZoneAroundCell(
  zone: FogZoneData,
  gridX: number,
  gridY: number,
): FogZoneData[] {
  const zoneRight = zone.x + zone.w;
  const zoneBottom = zone.y + zone.h;
  if (
    gridX < zone.x ||
    gridX >= zoneRight ||
    gridY < zone.y ||
    gridY >= zoneBottom
  ) {
    return [zone];
  }

  const pieces: FogZoneData[] = [];
  const addPiece = (x: number, y: number, w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    pieces.push({ id: generateId(), x, y, w, h });
  };

  addPiece(zone.x, zone.y, zone.w, gridY - zone.y);
  addPiece(zone.x, gridY + 1, zone.w, zoneBottom - gridY - 1);
  addPiece(zone.x, gridY, gridX - zone.x, 1);
  addPiece(gridX + 1, gridY, zoneRight - gridX - 1, 1);

  return pieces;
}

function stripTokenOrdinal(name: string): string {
  return name
    .replace(/\s+x\d+$/i, '')
    .replace(/\s+\d+$/, '')
    .trim();
}

function isLordRelgName(name: string): boolean {
  return name.trim().toLowerCase() === 'lord relg';
}

function getMonsterDetailsForToken(
  token: BattleToken,
): BuilderMonsterDetails | undefined {
  const lookupName = token.monsterName ?? stripTokenOrdinal(token.name);
  return (GameData.getMonster(lookupName) ??
    (isLordRelgName(lookupName) ? LORD_RELG_STATBLOCK : undefined)) as
    | BuilderMonsterDetails
    | undefined;
}

function extractSpeedFromNotes(notes?: string): string | null {
  const match = notes?.match(/\bspeed\s+(\d+(?:\s*\([^)]+\))?)/i);
  return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Undo stack
// ---------------------------------------------------------------------------

interface UndoEntry {
  data: Record<string, unknown>;
}

const MAX_UNDO = 50;
const RIGHT_RAIL_DEFAULT_WIDTH = 384;
const RIGHT_RAIL_MIN_WIDTH = 320;
const RAIL_TABS_LIST_CLASS =
  'grid h-auto w-full shrink-0 grid-cols-3 gap-1 rounded-none border-b border-zinc-800 bg-zinc-950/40 p-2';
const RAIL_TAB_TRIGGER_CLASS =
  'h-8 min-w-0 rounded-md border border-transparent px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 transition data-[state=active]:border-zinc-700 data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 data-[state=inactive]:hover:bg-zinc-800/50 data-[state=inactive]:hover:text-zinc-300';
const RAIL_TAB_CONTENT_CLASS =
  'mt-0 min-h-0 flex-1 overflow-y-auto p-3 focus-visible:ring-0';
const PANE_HANDLE_CLASS =
  'absolute top-1/2 z-40 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100';

type BuilderRightRailTab =
  | 'audio'
  | 'map'
  | 'grid'
  | 'tokens'
  | 'terrain'
  | 'notes';

function maxHalfViewportWidth(): number {
  return typeof window === 'undefined'
    ? 760
    : Math.floor(window.innerWidth * 0.5);
}

function clampRightRailWidth(width: number): number {
  return Math.min(
    maxHalfViewportWidth(),
    Math.max(RIGHT_RAIL_MIN_WIDTH, Math.round(width)),
  );
}

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

function terrainColorHex(terrain: CompendiumTerrain | undefined): string {
  const color = terrain
    ? (TERRAIN_ROLE_COLORS[terrain.role.terrainType] ?? 0x3b82f6)
    : 0x3b82f6;
  return `#${color.toString(16).padStart(6, '0')}`;
}

function RightRailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="mb-3 flex min-w-0 items-center gap-2 text-sm font-bold text-zinc-200">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="truncate">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function BuilderTokenContextMenu({
  token,
  x,
  y,
  onRemove,
  onClose,
}: {
  token: BattleToken;
  x: number;
  y: number;
  onRemove: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const monster = useMemo(() => getMonsterDetailsForToken(token), [token]);
  const maxStamina = token.maxStamina ?? monster?.stamina ?? null;
  const currentStamina = token.currentStamina ?? maxStamina;
  const speed =
    token.speed ?? monster?.speed ?? extractSpeedFromNotes(token.notes) ?? '-';
  const level = token.level ?? monster?.level ?? null;
  const roles = token.roles ?? monster?.roles ?? [];
  const actions = (token.features ?? monster?.features ?? [])
    .filter((feature) => feature.feature_type === 'ability')
    .slice(0, 8);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!menuRef.current?.contains(event.target as Node)) onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const timer = window.setTimeout(
      () => document.addEventListener('pointerdown', handlePointerDown),
      50,
    );
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuWidth = 320;
  const menuHeight = 420;
  const clampedX = Math.min(Math.max(8, x), window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(
    Math.max(8, y),
    window.innerHeight - menuHeight - 8,
  );

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-80 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="flex items-start gap-3 border-b border-zinc-800 px-3 py-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold uppercase text-white"
          style={{
            backgroundColor: `#${token.color.toString(16).padStart(6, '0')}`,
          }}
        >
          {token.portraitUrl ? (
            <img
              src={token.portraitUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            token.type.slice(0, 1)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {token.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {[token.type, level ? `Level ${level}` : null, roles.join(', ')]
              .filter(Boolean)
              .join(' • ')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Close token details"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="max-h-[360px]">
        <div className="space-y-3 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-zinc-500">
                <HeartPulse className="size-3" />
                Stamina
              </div>
              <p className="text-sm font-semibold text-zinc-100">
                {currentStamina !== null && maxStamina !== null
                  ? `${currentStamina} / ${maxStamina}`
                  : '-'}
              </p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-zinc-500">
                <Gauge className="size-3" />
                Speed
              </div>
              <p className="text-sm font-semibold text-zinc-100">{speed}</p>
            </div>
          </div>

          {token.notes ? (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase text-zinc-500">
                <ScrollText className="size-3" />
                Notes
              </div>
              <p className="text-xs leading-relaxed text-zinc-300">
                {token.notes}
              </p>
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase text-zinc-500">
              <Sword className="size-3" />
              Actions
            </div>
            {actions.length > 0 ? (
              <div className="space-y-1.5">
                {actions.map((action) => (
                  <AbilityBlock
                    key={action.name}
                    ability={drawSteelAbilityFromLike(action, 'Action')}
                    compact
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-zinc-800 bg-zinc-900/70 p-2 text-xs text-zinc-500">
                No action details found for this token.
              </p>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemove}
            className="w-full border-red-900/70 text-red-300 hover:bg-red-950/30 hover:text-red-200"
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Remove Token
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BattleWorkspace({
  data,
  onChange,
  campaignId,
  focusMode = false,
}: BattleWorkspaceProps) {
  // Tool state
  const [activeTool, setActiveTool] = useState<BattleTool>('select');
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(2);
  const [fogBrushMode, setFogBrushMode] = useState<FogBrushMode>('draw');
  const [fogBrushSize, setFogBrushSize] = useState(1);
  const [gridVisible, setGridVisible] = useState(true);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [selectedNpcId, setSelectedNpcId] = useState('');
  const [selectedTerrainId, setSelectedTerrainId] = useState(
    ALL_TERRAINS[0]?.id ?? 'terrain-brambles',
  );
  const [terrainCategoryFilter, setTerrainCategoryFilter] = useState<
    TerrainCategory | 'all'
  >('all');
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);
  const [rightRailWidth, setRightRailWidth] = useState(
    RIGHT_RAIL_DEFAULT_WIDTH,
  );
  const [rightRailTab, setRightRailTab] = useState<BuilderRightRailTab>('map');
  const [mapPreviewError, setMapPreviewError] = useState(false);
  const [tokenMenu, setTokenMenu] = useState<{
    tokenId: string;
    x: number;
    y: number;
  } | null>(null);

  // Viewport controls
  const [zoom, setZoom] = useState(1);
  const [bgNaturalSize, setBgNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const viewportRef = useRef<ViewportSystem | null>(null);
  const prevToolRef = useRef<BattleTool>('select');
  const stageRef = useRef<HTMLDivElement | null>(null);

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
    gridCols:
      (data['gridCols'] as number) ?? (data['gridSize'] as number) ?? 30,
    gridRows: (data['gridRows'] as number) ?? 20,
    gridCellSize: (data['gridCellSize'] as number) ?? 48,
    gridType: (data['gridType'] as 'square' | 'hex') ?? 'square',
    gridOpacity: (data['gridOpacity'] as number) ?? 0.4,
    gridColor: (data['gridColor'] as string) ?? '#444444',
    tokens: parseTokens(),
    drawings: parseDrawings(),
    terrain: parseTerrain(),
    fog: parseFog(),
    difficulty:
      (data['difficulty'] as BattleSceneData['difficulty']) ?? 'standard',
    notes: (data['notes'] as string) ?? '',
    creatureGroups: (data['creatureGroups'] as string) ?? '',
  };
  const sceneSfxAudioIds = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => {
        const rawList = data['audioSfx'];
        if (Array.isArray(rawList)) {
          const value = rawList[index];
          return typeof value === 'string' && value ? value : null;
        }

        const legacyValue = data[`audioSfx${index + 1}`];
        return typeof legacyValue === 'string' && legacyValue
          ? legacyValue
          : null;
      }),
    [data],
  );
  const rightRailTabs = useMemo<
    Array<{ value: BuilderRightRailTab; label: string; count?: number }>
  >(
    () => [
      { value: 'audio', label: 'Audio' },
      { value: 'map', label: 'Map' },
      { value: 'grid', label: 'Grid' },
      { value: 'tokens', label: 'Tokens', count: battleData.tokens.length },
      {
        value: 'terrain',
        label: 'Terrain',
        count:
          battleData.terrain.length +
          battleData.drawings.length +
          battleData.fog.length,
      },
      { value: 'notes', label: 'Notes' },
    ],
    [
      battleData.drawings.length,
      battleData.fog.length,
      battleData.terrain.length,
      battleData.tokens.length,
    ],
  );

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

  useEffect(() => {
    const handleResize = () =>
      setRightRailWidth((width) => clampRightRailWidth(width));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedMapName = useMemo(() => {
    if (!battleData.mapAssetId) return null;
    return maps.find((m) => m.id === battleData.mapAssetId)?.name ?? null;
  }, [battleData.mapAssetId, maps]);

  const selectedNpc = useMemo(() => {
    if (!selectedNpcId) return null;
    return npcs.find((npc) => npc.id === selectedNpcId) ?? null;
  }, [npcs, selectedNpcId]);

  const selectedTerrain = useMemo(() => {
    return (
      ALL_TERRAINS.find((terrain) => terrain.id === selectedTerrainId) ??
      ALL_TERRAINS[0]
    );
  }, [selectedTerrainId]);

  const filteredTerrains = useMemo(() => {
    if (terrainCategoryFilter === 'all') return ALL_TERRAINS;
    return ALL_TERRAINS.filter(
      (terrain) => terrain.category === terrainCategoryFilter,
    );
  }, [terrainCategoryFilter]);

  const selectTerrainForDrawing = useCallback((terrainId: string) => {
    setSelectedTerrainId(terrainId);
    setActiveTool('terrain');
  }, []);

  const updateField = <K extends keyof BattleSceneData>(
    field: K,
    value: BattleSceneData[K],
  ) => {
    onChange({ ...data, [field]: value });
  };

  // Token handlers
  const addToken = useCallback(
    (
      name: string,
      type: BattleToken['type'],
      extra: Partial<BattleToken> = {},
    ) => {
      const newToken: BattleToken = {
        id: generateId(),
        name,
        x: Math.floor(effectiveCols / 2),
        y: Math.floor(effectiveRows / 2),
        size: 1,
        color:
          type === 'hero' ? 0x3b82f6 : type === 'monster' ? 0xef4444 : 0x8b5cf6,
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
      changeWithUndo({
        ...data,
        tokens: battleData.tokens.filter((t) => t.id !== id),
      });
    },
    [data, battleData.tokens, changeWithUndo],
  );

  const updateToken = useCallback(
    (id: string, updates: Partial<BattleToken>) => {
      const updated = battleData.tokens.map((t) =>
        t.id === id ? { ...t, ...updates } : t,
      );
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

  const handleTokenRightClick = useCallback(
    (entityId: string | null, screenX: number, screenY: number) => {
      if (!entityId) {
        setTokenMenu(null);
        return;
      }
      const rect = stageRef.current?.getBoundingClientRect();
      setTokenMenu({
        tokenId: entityId,
        x: screenX - (rect?.left ?? 0),
        y: screenY - (rect?.top ?? 0),
      });
    },
    [],
  );

  const handleRightRailResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = rightRailWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setRightRailWidth(
          clampRightRailWidth(startWidth - (moveEvent.clientX - startX)),
        );
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [rightRailWidth],
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
      changeWithUndo({
        ...data,
        drawings: [...battleData.drawings, newDrawing],
      });
    },
    [data, battleData.drawings, changeWithUndo],
  );

  const handleDrawingRemove = useCallback(
    (drawingId: string) => {
      changeWithUndo({
        ...data,
        drawings: battleData.drawings.filter((d) => d.id !== drawingId),
      });
    },
    [data, battleData.drawings, changeWithUndo],
  );

  const createTerrainZone = useCallback(
    (
      terrain: CompendiumTerrain | undefined,
      gridX: number,
      gridY: number,
      w: number,
      h: number,
    ): TerrainZoneData => ({
      id: generateId(),
      terrainId: terrain?.id ?? 'terrain-brambles',
      name: terrain?.name ?? 'Terrain',
      x: gridX,
      y: gridY,
      w,
      h,
      color: terrain
        ? (TERRAIN_ROLE_COLORS[terrain.role.terrainType] ?? 0x3b82f6)
        : 0x3b82f6,
    }),
    [],
  );

  const handleTerrainAdd = useCallback(
    (gridX: number, gridY: number, w: number, h: number) => {
      const newZone = createTerrainZone(selectedTerrain, gridX, gridY, w, h);
      changeWithUndo({ ...data, terrain: [...battleData.terrain, newZone] });
    },
    [
      data,
      battleData.terrain,
      selectedTerrain,
      createTerrainZone,
      changeWithUndo,
    ],
  );

  const handleTerrainDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const terrainId = event.dataTransfer.getData(
        'application/x-anvil-terrain',
      );
      if (!terrainId) return;

      event.preventDefault();
      const terrain = ALL_TERRAINS.find((item) => item.id === terrainId);
      if (!terrain) return;

      const gridPoint = viewportRef.current?.screenToGrid(
        event.clientX,
        event.clientY,
        effectiveCellSize,
      );
      if (!gridPoint) return;

      const { w, h } = getTerrainDropSize(terrain);
      const x = Math.max(
        0,
        Math.min(
          Math.max(0, effectiveCols - w),
          gridPoint.gridX - Math.floor(w / 2),
        ),
      );
      const y = Math.max(
        0,
        Math.min(
          Math.max(0, effectiveRows - h),
          gridPoint.gridY - Math.floor(h / 2),
        ),
      );
      const newZone = createTerrainZone(terrain, x, y, w, h);

      setSelectedTerrainId(terrain.id);
      setActiveTool('terrain');
      changeWithUndo({ ...data, terrain: [...battleData.terrain, newZone] });
    },
    [
      data,
      battleData.terrain,
      effectiveCellSize,
      effectiveCols,
      effectiveRows,
      createTerrainZone,
      changeWithUndo,
    ],
  );

  const handleTerrainDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (event.dataTransfer.types.includes('application/x-anvil-terrain')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }
    },
    [],
  );

  const handleTerrainRemove = useCallback(
    (terrainId: string) => {
      changeWithUndo({
        ...data,
        terrain: battleData.terrain.filter((t) => t.id !== terrainId),
      });
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
      changeWithUndo({
        ...data,
        fog: battleData.fog.filter((f) => f.id !== fogId),
      });
    },
    [data, battleData.fog, changeWithUndo],
  );

  const handleFogRevealCell = useCallback(
    (gridX: number, gridY: number) => {
      let changed = false;
      const nextFog = battleData.fog.flatMap((zone) => {
        const pieces = splitFogZoneAroundCell(zone, gridX, gridY);
        if (pieces.length !== 1 || pieces[0] !== zone) changed = true;
        return pieces;
      });
      if (changed) changeWithUndo({ ...data, fog: nextFog });
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
      monsterName: t.monsterName,
      level: t.level,
      roles: t.roles,
      maxStamina: t.maxStamina,
      currentStamina: t.currentStamina,
      speed: t.speed,
      notes: t.notes,
      features: t.features,
      hp: 100,
      maxHp: 100,
      conditions: [],
    }));
  }, [battleData.tokens]);

  const tokenMenuToken = tokenMenu
    ? (battleData.tokens.find((token) => token.id === tokenMenu.tokenId) ??
      null)
    : null;

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
        ref={stageRef}
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
          fogBrushMode={fogBrushMode}
          onFogBrushModeChange={setFogBrushMode}
          fogBrushSize={fogBrushSize}
          onFogBrushSizeChange={setFogBrushSize}
          onClearFog={() => changeWithUndo({ ...data, fog: [] })}
          viewportControls={
            <ViewportControls
              zoom={zoom}
              orientation="horizontal"
              onZoomIn={() => viewportRef.current?.zoomIn()}
              onZoomOut={() => viewportRef.current?.zoomOut()}
              onFitToMap={() =>
                viewportRef.current?.fitToRect(
                  effectiveCols * effectiveCellSize,
                  effectiveRows * effectiveCellSize,
                )
              }
            />
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
          onTokenRightClick={handleTokenRightClick}
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
          onFogRevealCell={handleFogRevealCell}
          fogBrushMode={fogBrushMode}
          fogBrushSize={fogBrushSize}
          gridVisible={gridVisible}
          gridOpacity={battleData.gridOpacity}
          gridColor={battleData.gridColor}
          onZoomChange={setZoom}
          onBackgroundLoaded={(info) =>
            setBgNaturalSize({
              width: info.naturalWidth,
              height: info.naturalHeight,
            })
          }
          viewportRef={viewportRef}
        />

        {tokenMenu && tokenMenuToken ? (
          <BuilderTokenContextMenu
            token={tokenMenuToken}
            x={tokenMenu.x}
            y={tokenMenu.y}
            onClose={() => setTokenMenu(null)}
            onRemove={() => {
              removeToken(tokenMenuToken.id);
              setTokenMenu(null);
            }}
          />
        ) : null}

        {/* Empty state hint */}
        {!battleData.mapUrl &&
          entities.length === 0 &&
          battleData.drawings.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center text-zinc-600">
                <p className="text-lg font-medium">Battle Scene</p>
                <p className="mt-1 text-sm">
                  Add a map and tokens in the sidebar, or draw on the canvas
                </p>
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
          className={`${PANE_HANDLE_CLASS} right-0 -translate-x-1/2`}
        >
          <PanelRightOpen className="size-3.5" />
        </button>
      )}

      {/* Right sidebar: Editor fields */}
      {!focusMode && !rightRailCollapsed && (
        <div
          className="relative flex min-h-0 shrink-0 flex-col overflow-visible border-l border-zinc-800 bg-zinc-900/80"
          style={{ width: rightRailWidth, maxWidth: '50vw' }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize editor pane"
            title="Resize editor pane"
            onMouseDown={handleRightRailResizeStart}
            className="group absolute inset-y-0 left-0 z-10 flex w-2 cursor-ew-resize items-center justify-center hover:bg-zinc-800/70"
          >
            <div className="h-12 w-px bg-zinc-700 opacity-0 transition group-hover:opacity-100" />
          </div>
          <button
            type="button"
            title="Collapse editor pane"
            aria-label="Collapse editor pane"
            onClick={() => setRightRailCollapsed(true)}
            className={`${PANE_HANDLE_CLASS} left-0 -translate-x-1/2`}
          >
            <PanelRightClose className="size-3.5" />
          </button>
          <Tabs
            value={rightRailTab}
            onValueChange={(value) =>
              setRightRailTab(value as BuilderRightRailTab)
            }
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
                  {tab.count !== undefined && tab.count > 0 ? (
                    <span className="ml-1 rounded bg-zinc-800 px-1 text-[9px] font-semibold text-zinc-400">
                      {tab.count}
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="audio" className={RAIL_TAB_CONTENT_CLASS}>
              <div className="flex flex-col gap-3">
                <RightRailSection
                  title="Scene Audio"
                  icon={<Music className="size-4" />}
                >
                  <SceneAudioPanel
                    campaignId={campaignId}
                    multitrack
                    musicAudioId={(data['audioMusic'] as string) ?? null}
                    ambientAudioId={(data['audioAmbient'] as string) ?? null}
                    sfxAudioIds={sceneSfxAudioIds}
                    onMusicAudioChange={(id) =>
                      onChange({ ...data, audioMusic: id ?? undefined })
                    }
                    onAmbientAudioChange={(id) =>
                      onChange({ ...data, audioAmbient: id ?? undefined })
                    }
                    onSfxAudioChange={(slotIndex, id) => {
                      const nextSfxIds = [...sceneSfxAudioIds];
                      nextSfxIds[slotIndex] = id;
                      onChange({ ...data, audioSfx: nextSfxIds });
                    }}
                    hideLabel
                  />
                </RightRailSection>
              </div>
            </TabsContent>

            <TabsContent value="map" className={RAIL_TAB_CONTENT_CLASS}>
              <div className="flex flex-col gap-3">
                <RightRailSection
                  title="Battle Map"
                  icon={<Map className="size-4" />}
                >
                  <div className="flex flex-col gap-3">
                    {battleData.mapUrl && (
                      <div className="relative aspect-video overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
                        <img
                          key={battleData.mapUrl}
                          src={battleData.mapUrl}
                          alt="Battle map preview"
                          className={`h-full w-full object-cover ${mapPreviewError ? 'opacity-0' : 'opacity-100'}`}
                          onLoad={() => setMapPreviewError(false)}
                          onError={() => setMapPreviewError(true)}
                        />
                        {mapPreviewError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
                            <ImageIcon className="size-5 text-zinc-500" />
                            <p className="text-xs font-medium text-zinc-300">
                              Map image did not load
                            </p>
                            <p className="max-w-full truncate text-[10px] text-zinc-500">
                              {battleData.mapUrl}
                            </p>
                          </div>
                        )}
                        {selectedMapName && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
                            <p className="truncate text-xs text-zinc-300">
                              {selectedMapName}
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleClearMap}
                          className="absolute right-1.5 top-1.5 rounded bg-black/60 p-1 text-zinc-400 hover:bg-black/80 hover:text-zinc-200"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    )}

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

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-zinc-500">
                        External URL
                      </span>
                      <Input
                        value={battleData.mapAssetId ? '' : battleData.mapUrl}
                        onChange={(e) =>
                          handleExternalUrlChange(e.target.value)
                        }
                        placeholder="https://... (battle map image)"
                        className="text-sm"
                      />
                    </label>
                  </div>
                </RightRailSection>
              </div>
            </TabsContent>

            <TabsContent value="grid" className={RAIL_TAB_CONTENT_CLASS}>
              <div className="flex flex-col gap-3">
                <RightRailSection
                  title="Grid"
                  icon={<Grid3X3 className="size-4" />}
                >
                  <div className="flex flex-col gap-4">
                    {hasBackground ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-300">
                            Cell Size
                          </span>
                          <span className="text-xs text-zinc-500">
                            {effectiveCols} x {effectiveRows} cells
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={16}
                            max={200}
                            step={1}
                            value={battleData.gridCellSize}
                            onChange={(e) =>
                              updateField(
                                'gridCellSize',
                                Number(e.target.value),
                              )
                            }
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
                          <span className="text-sm font-medium text-zinc-300">
                            Grid Columns
                          </span>
                          <Input
                            type="number"
                            min={5}
                            max={100}
                            value={battleData.gridCols}
                            onChange={(e) =>
                              updateField('gridCols', Number(e.target.value))
                            }
                            className="text-sm"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-sm font-medium text-zinc-300">
                            Grid Rows
                          </span>
                          <Input
                            type="number"
                            min={5}
                            max={100}
                            value={battleData.gridRows}
                            onChange={(e) =>
                              updateField('gridRows', Number(e.target.value))
                            }
                            className="text-sm"
                          />
                        </label>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">
                          Grid Overlay
                        </span>
                        <button
                          type="button"
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
                              onChange={(e) =>
                                updateField(
                                  'gridOpacity',
                                  Number(e.target.value) / 100,
                                )
                              }
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
                  </div>
                </RightRailSection>

                <RightRailSection
                  title="Encounter Difficulty"
                  icon={<ShieldAlert className="size-4" />}
                >
                  <select
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-red-500 focus:outline-none"
                    value={battleData.difficulty}
                    onChange={(e) =>
                      updateField(
                        'difficulty',
                        e.target.value as BattleSceneData['difficulty'],
                      )
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="standard">Standard</option>
                    <option value="hard">Hard</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </RightRailSection>
              </div>
            </TabsContent>

            <TabsContent value="tokens" className={RAIL_TAB_CONTENT_CLASS}>
              <div className="flex flex-col gap-3">
                <RightRailSection
                  title={`Tokens (${battleData.tokens.length})`}
                  icon={<Users className="size-4" />}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToken('Monster', 'monster')}
                        className="text-red-400"
                      >
                        + Monster
                      </Button>
                      <div className="flex min-w-0 flex-1 gap-2">
                        <select
                          className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
                          value={selectedNpcId}
                          onChange={(e) => setSelectedNpcId(e.target.value)}
                        >
                          <option value="">Generic NPC</option>
                          {npcs.map((npc) => (
                            <option key={npc.id} value={npc.id}>
                              {npc.name}
                            </option>
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
                    </div>
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
                          style={{
                            backgroundColor: `#${t.color.toString(16).padStart(6, '0')}`,
                          }}
                        >
                          {t.portraitUrl ? (
                            <img
                              src={t.portraitUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-semibold uppercase text-white/80">
                              {t.type.slice(0, 1)}
                            </span>
                          )}
                        </div>
                        <Input
                          value={t.name}
                          onChange={(e) =>
                            updateToken(t.id, { name: e.target.value })
                          }
                          placeholder="Token name"
                          className="min-w-0 flex-1 text-sm"
                        />
                        <span className="shrink-0 text-xs text-zinc-500">
                          ({t.x}, {t.y})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeToken(t.id)}
                          className="shrink-0 text-red-400 hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </RightRailSection>
              </div>
            </TabsContent>

            <TabsContent value="terrain" className={RAIL_TAB_CONTENT_CLASS}>
              <div className="flex flex-col gap-3">
                <RightRailSection
                  title="Terrain Tools"
                  icon={<Mountain className="size-4" />}
                >
                  <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-500">
                    {activeTool === 'terrain' ? (
                      <span>
                        Drawing {selectedTerrain?.name ?? 'terrain'} zones. Drag
                        on the map to create a grid-fitted box.
                      </span>
                    ) : (
                      <span>
                        Choose a terrain asset below to make it active and start
                        drawing grid-fitted boxes.
                      </span>
                    )}
                  </div>
                </RightRailSection>

                <RightRailSection
                  title={`Active Terrain Zones (${battleData.terrain.length})`}
                  icon={<Mountain className="size-4" />}
                >
                  <div className="rounded-md border border-zinc-700 bg-zinc-800/50">
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-700/70 px-3 py-2">
                      <span className="text-sm text-zinc-300">
                        {battleData.terrain.length} terrain zone
                        {battleData.terrain.length !== 1 ? 's' : ''}
                      </span>
                      {battleData.terrain.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            changeWithUndo({ ...data, terrain: [] })
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          Clear All
                        </Button>
                      ) : null}
                    </div>
                    {battleData.terrain.length > 0 ? (
                      <div className="divide-y divide-zinc-800">
                        {battleData.terrain.map((zone) => (
                          <div
                            key={zone.id}
                            className="flex items-center gap-2 px-3 py-2"
                          >
                            <span
                              className="size-3 shrink-0 rounded-sm ring-1 ring-white/10"
                              style={{
                                backgroundColor: `#${(zone.color ?? 0x3b82f6).toString(16).padStart(6, '0')}`,
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-zinc-300">
                                {zone.name}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                ({zone.x}, {zone.y}) - {zone.w} x {zone.h}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTerrainRemove(zone.id)}
                              className="shrink-0 text-red-400 hover:text-red-300"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-3 text-xs text-zinc-500">
                        No terrain zones on this map yet.
                      </p>
                    )}
                  </div>
                </RightRailSection>

                <RightRailSection
                  title="Terrain Assets"
                  icon={<Mountain className="size-4" />}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold uppercase text-zinc-500">
                        Select to draw
                      </span>
                      <span className="text-xs text-zinc-500">
                        Select an asset to draw on the game map
                      </span>
                    </div>
                    <select
                      className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100 focus:border-red-500 focus:outline-none"
                      value={terrainCategoryFilter}
                      onChange={(e) =>
                        setTerrainCategoryFilter(
                          e.target.value as TerrainCategory | 'all',
                        )
                      }
                    >
                      {TERRAIN_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category === 'all'
                            ? 'All terrain'
                            : TERRAIN_CATEGORY_NAMES[category]}
                        </option>
                      ))}
                    </select>
                    <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                      {filteredTerrains.map((terrain) => {
                        const active = terrain.id === selectedTerrainId;
                        return (
                          <button
                            key={terrain.id}
                            type="button"
                            draggable
                            onClick={() => selectTerrainForDrawing(terrain.id)}
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                'application/x-anvil-terrain',
                                terrain.id,
                              );
                              event.dataTransfer.effectAllowed = 'copy';
                              selectTerrainForDrawing(terrain.id);
                            }}
                            className={`w-full cursor-grab rounded-md border p-3 text-left transition-colors active:cursor-grabbing ${
                              active
                                ? 'border-red-400 bg-red-500/10 text-zinc-100 ring-1 ring-red-400/40'
                                : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="size-3 shrink-0 rounded-sm ring-1 ring-white/15"
                                  style={{
                                    backgroundColor: terrainColorHex(terrain),
                                  }}
                                />
                                <span className="truncate text-sm font-medium">
                                  {terrain.name}
                                </span>
                              </div>
                              <span className="shrink-0 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                                {active ? 'Active' : `Lv ${terrain.level}`}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">
                              {getTerrainDescription(terrain)}
                            </p>
                            <p className="mt-2 line-clamp-2 text-xs text-zinc-400">
                              {terrain.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </RightRailSection>

                {battleData.drawings.length > 0 && (
                  <RightRailSection
                    title={`Drawings (${battleData.drawings.length})`}
                    icon={<PencilLine className="size-4" />}
                    defaultOpen={false}
                  >
                    <div className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                      <span className="text-sm text-zinc-300">
                        {battleData.drawings.length} drawing
                        {battleData.drawings.length !== 1 ? 's' : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          changeWithUndo({ ...data, drawings: [] })
                        }
                        className="text-red-400 hover:text-red-300"
                      >
                        Clear All
                      </Button>
                    </div>
                  </RightRailSection>
                )}

                {battleData.fog.length > 0 && (
                  <RightRailSection
                    title={`Fog (${battleData.fog.length})`}
                    icon={<CloudFog className="size-4" />}
                    defaultOpen={false}
                  >
                    <div className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                      <span className="text-sm text-zinc-300">
                        {battleData.fog.length} fog zone
                        {battleData.fog.length !== 1 ? 's' : ''}
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
                  </RightRailSection>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className={RAIL_TAB_CONTENT_CLASS}>
              <div className="flex flex-col gap-3">
                <RightRailSection
                  title="Creature Notes"
                  icon={<ScrollText className="size-4" />}
                  defaultOpen={false}
                >
                  <label className="flex flex-col gap-1.5">
                    <textarea
                      className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      value={battleData.creatureGroups}
                      onChange={(e) =>
                        updateField('creatureGroups', e.target.value)
                      }
                      placeholder="Goblin x3&#10;Goblin Cursespitter x1"
                    />
                    <p className="text-xs text-zinc-500">
                      Quick reference for creatures in this encounter.
                    </p>
                  </label>
                </RightRailSection>

                <RightRailSection
                  title="Director Notes"
                  icon={<PencilLine className="size-4" />}
                >
                  <textarea
                    className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    value={battleData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Tactical notes for running this encounter..."
                  />
                </RightRailSection>

                <RightRailSection
                  title="Shortcuts"
                  icon={<Keyboard className="size-4" />}
                  defaultOpen={false}
                >
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">H</kbd> Pan
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">V</kbd> Select
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">D</kbd> Draw
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">F</kbd> Fog
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">T</kbd> Terrain
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">E</kbd> Eraser
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">G</kbd> Grid
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">Space</kbd> Hold
                      to pan
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">Ctrl+Z</kbd>{' '}
                      Undo
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">
                        Ctrl+Shift+Z
                      </kbd>{' '}
                      Redo
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">Ctrl+=/-</kbd>{' '}
                      Zoom
                    </span>
                    <span>
                      <kbd className="rounded bg-zinc-800 px-1">Ctrl+0</kbd> Fit
                      map
                    </span>
                  </div>
                </RightRailSection>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
