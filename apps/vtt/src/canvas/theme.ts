import { useThemeStore, type ThemeMode } from '../stores/themeStore.js';

/**
 * Canvas palette (design/redesign/DESIGN.md section 11). Pixi takes numbers.
 *
 * Map colours are art tokens, so almost every key is the same in both themes:
 * the map must read the same in either theme and on any uploaded map. Only the
 * margin outside the map and the map dim change with theme.
 *
 * Colours only. Nothing here decides what fog hides, what can be targeted or
 * how the pointer behaves.
 */
export interface CanvasPalette {
  /** Margin outside the map (`--color-canvas`). */
  background: number;
  /** Map image brightness (`--map-dim`), applied as a grey tint. */
  mapDim: number;
  /** Ground of a map that has no image (derived: the light well). */
  mapBlank: number;

  /** Grid lines: ink at low alpha. */
  grid: number;
  gridAlpha: number;

  /** Player fog: solid ink. */
  fog: number;
  fogAlpha: number;
  /** Director's fog preview fill (`--art-fog-hatch`), its ink hatching, and every fog's edge. */
  fogPreview: number;
  fogPreviewAlpha: number;
  fogHatch: number;
  fogEdge: number;
  /** Fog being drawn (derived: as the Director preview) and its edge. */
  fogDraft: number;
  fogDraftAlpha: number;
  fogDraftEdge: number;

  /** Acting token: active-plate ring, then ink outside it. */
  turn: number;
  turnOuter: number;
  /** Selected token ring (derived from the label plate). */
  selection: number;
  /** Marquee selection (derived). */
  selectionRect: number;
  selectionRectFillAlpha: number;
  selectionRectEdgeAlpha: number;

  /** Valid target ring (derived from the hit burst), drawn over an ink edge. */
  targeting: number;
  targetingEdge: number;
  /** Out-of-range candidate outline (derived). */
  targetInvalid: number;
  targetInvalidAlpha: number;
  /** Area in range of the acting token (derived). */
  targetRange: number;
  targetRangeFillAlpha: number;
  targetRangeEdgeAlpha: number;
  /** Flanking and high-ground pips on a target (derived). */
  targetFlankPip: number;
  targetHighGroundPip: number;
  /** AoE template that can be placed, and one that cannot (derived). */
  aoeValid: number;
  aoeInvalid: number;
  /** Path over budget, opportunity attack (derived from `--art-hazard`), over an ink edge. */
  warning: number;
  warningEdge: number;
  /** Movement path within budget (`--art-active-plate`). */
  moveTrail: number;
  /** Measure ruler (derived). */
  ruler: number;

  /** Ink outline round every token, all sides. */
  tokenOutline: number;
  /** White keyline inside an upload's outline. */
  tokenKeyline: number;
  /** Small offset shadow under every head. */
  tokenShadowAlpha: number;
  /** White disc behind the acting token. */
  turnDisc: number;
  /** Hazard burst behind a dying hero (22-point star, ink edge). */
  dyingBurst: number;

  /** Map labels: plate, its text and its keyline. */
  labelPlate: number;
  labelText: number;
  labelKeyline: number;
  /** Done badge: ink disc, white check, plate ring. */
  doneBadge: number;
  doneMark: number;
  doneRing: number;
  /** Condition badge: plate disc, ink ring. */
  conditionBadge: number;
  conditionRing: number;
  /** Hidden badge, Director only: ink disc, white shut eye, plate ring. */
  hiddenBadge: number;
  hiddenMark: number;
  hiddenRing: number;
  /** Map labels on heroes and on the acting token. */
  heroLabelPlate: number;
  heroLabelText: number;
  activeLabelPlate: number;
  activeLabelText: number;
  /** Mini-map marks. */
  miniMapFoe: number;
  miniMapHero: number;
  /** Squad number plates. */
  squadNumberPlate: number;
  squadNumberText: number;

  /** Terrain zones without a colour of their own (scene data, kept). */
  terrainDefault: number;
  terrainDifficult: number;
  terrainHazardous: number;
  terrainImpassable: number;
  terrainConcealing: number;
  terrainElevated: number;
  /** Terrain resize handles and labels. */
  terrainHandle: number;

  /** First colour of the draw tool: Battle red. */
  drawDefault: string;
  /** Grid colour and opacity a new scene starts with. */
  gridDefaultHex: string;
}

/** Body font for text drawn on the map (DESIGN.md 3.1). */
export const CANVAS_FONT = '"Atkinson Hyperlegible", system-ui, sans-serif';
/** Display font for hero labels, the shout and the hit number. */
export const CANVAS_DISPLAY_FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif';

const INK = 0x15171c;
const PLATE = 0xffffff;
const ACTIVE_PLATE = 0x2348c9;
const HAZARD = 0xffd21f;
const FOG_HATCH = 0x2a2e38;

const SHARED: Omit<CanvasPalette, 'background' | 'mapDim'> = {
  mapBlank: 0xe2e6e1,

  grid: INK,
  gridAlpha: 0.2,

  fog: INK,
  fogAlpha: 1,
  fogPreview: FOG_HATCH,
  fogPreviewAlpha: 0.42,
  fogHatch: INK,
  fogEdge: INK,
  fogDraft: FOG_HATCH,
  fogDraftAlpha: 0.42,
  fogDraftEdge: INK,

  turn: ACTIVE_PLATE,
  turnOuter: INK,
  selection: PLATE,
  selectionRect: ACTIVE_PLATE,
  selectionRectFillAlpha: 0.12,
  selectionRectEdgeAlpha: 1,

  targeting: HAZARD,
  targetingEdge: INK,
  targetInvalid: INK,
  targetInvalidAlpha: 0.55,
  targetRange: ACTIVE_PLATE,
  targetRangeFillAlpha: 0.13,
  targetRangeEdgeAlpha: 0.5,
  targetFlankPip: ACTIVE_PLATE,
  targetHighGroundPip: INK,
  aoeValid: HAZARD,
  aoeInvalid: INK,
  warning: HAZARD,
  warningEdge: INK,
  moveTrail: ACTIVE_PLATE,
  ruler: INK,

  tokenOutline: INK,
  tokenKeyline: PLATE,
  tokenShadowAlpha: 0.9,
  turnDisc: PLATE,
  dyingBurst: HAZARD,

  labelPlate: PLATE,
  labelText: INK,
  labelKeyline: INK,
  doneBadge: INK,
  doneMark: PLATE,
  doneRing: PLATE,
  conditionBadge: PLATE,
  conditionRing: INK,
  hiddenBadge: INK,
  hiddenMark: PLATE,
  hiddenRing: PLATE,
  heroLabelPlate: INK,
  heroLabelText: PLATE,
  activeLabelPlate: ACTIVE_PLATE,
  activeLabelText: PLATE,
  miniMapFoe: 0xd6372c,
  miniMapHero: INK,
  squadNumberPlate: PLATE,
  squadNumberText: INK,

  terrainDefault: 0x3b82f6,
  terrainDifficult: 0xf59e0b,
  terrainHazardous: 0xef4444,
  terrainImpassable: 0x6b7280,
  terrainConcealing: 0x22c55e,
  terrainElevated: 0x8b5cf6,
  terrainHandle: PLATE,

  drawDefault: '#cf2a20',
  gridDefaultHex: '#15171c',
};

export const CANVAS_THEME: Record<ThemeMode, CanvasPalette> = {
  light: { ...SHARED, background: 0x8fa6ab, mapDim: 1 },
  dark: { ...SHARED, background: 0x46565b, mapDim: 0.86 },
};

/** Grid opacity a new scene starts with (`--art-grid-alpha`). */
export const GRID_DEFAULT_ALPHA = SHARED.gridAlpha;

/** The palette for the current theme, read from `themeStore` at draw time. */
export function getCanvasTheme(): CanvasPalette {
  return CANVAS_THEME[useThemeStore.getState().theme];
}

/** The palette for the current theme, as a React hook that follows theme changes. */
export function useCanvasTheme(): CanvasPalette {
  return CANVAS_THEME[useThemeStore((s) => s.theme)];
}

/** `0x15171c` to `'#15171c'`, for DOM fallbacks. */
export function toCssHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/** Multiply a colour's channels by a brightness factor (for the map dim). */
export function dimColor(color: number, factor: number): number {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
