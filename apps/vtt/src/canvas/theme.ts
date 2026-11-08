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
  /** Director's fog preview fill (`--art-fog-hatch`). */
  fogPreview: number;
  fogPreviewAlpha: number;
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
  /** Text and glyphs on a token face. */
  tokenGlyph: number;
  /**
   * Side colours of the current token rings. The approved demo has no side
   * colours (side reads by shape); plan Task 14 removes these.
   */
  sideHero: number;
  sideMonster: number;
  sideNpc: number;
  /** Stamina arc and winded ring: recoloured only, removed in plan Task 14. */
  staminaArc: number;
  winded: number;
  /** Dying ring until Task 14 draws the burst. */
  dying: number;
  dyingEdge: number;

  /** Map labels: plate, its text and its keyline. */
  labelPlate: number;
  labelText: number;
  labelKeyline: number;
  /** Done badge: ink disc, white check, plate ring. */
  doneBadge: number;
  doneMark: number;
  doneRing: number;
  /** Scrim over a token that has acted. */
  doneScrim: number;
  /** Condition badge: plate disc, ink ring. */
  conditionBadge: number;
  conditionRing: number;

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
  tokenGlyph: PLATE,
  sideHero: 0x3b82f6,
  sideMonster: 0xef4444,
  sideNpc: 0x8b5cf6,
  staminaArc: INK,
  winded: HAZARD,
  dying: HAZARD,
  dyingEdge: INK,

  labelPlate: PLATE,
  labelText: INK,
  labelKeyline: INK,
  doneBadge: INK,
  doneMark: PLATE,
  doneRing: PLATE,
  doneScrim: INK,
  conditionBadge: PLATE,
  conditionRing: INK,

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
