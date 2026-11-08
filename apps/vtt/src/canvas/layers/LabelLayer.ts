import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { mapIconUrl } from '../../lib/map-icons.js';
import { firstName, staminaState } from '../../lib/faces.js';
import { artTexture } from '../face-textures.js';
import { CANVAS_DISPLAY_FONT, CANVAS_FONT, getCanvasTheme, toCssHex } from '../theme.js';
import { placeLabels, type LabelInput, type Rect, type TokenLabel } from '../labels.js';
import type { FogZoneData } from './FogLayer.js';
import type { TokenLayer } from './TokenLayer.js';

/*
 * Everything drawn over the map at a fixed size in screen pixels: name labels, squad numbers,
 * the "is dying!" shout, the fog tag and the hit burst (DESIGN.md 3.3). Map labels are 13 px
 * whatever the zoom; a label with no free slot is dropped and never shrinks. The layer takes no
 * pointer events, so hit-testing, targeting and drags are not affected.
 */
interface LabelContext {
  labels: Map<string, TokenLabel>;
  ownEntityId: string | null;
  isDirector: boolean;
  fogZones: FogZoneData[];
  /** Holds the panels that float over the map (`data-map-panel`). Labels stay clear of them. */
  panelRoot: HTMLElement | null;
}

interface HitBurst {
  entityId: string;
  box: Container;
  start: number;
}

const LABEL_H = 22;
const HIT_HOLD_MS = 1500;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const resolution = () => Math.max(1, window.devicePixelRatio || 1);

export class LabelLayer extends Container {
  private context: LabelContext = { labels: new Map(), ownEntityId: null, isDirector: false, fogZones: [], panelRoot: null };
  private plates = new Map<string, Container>();
  private plateKeys = new Map<string, string>();
  private hits: HitBurst[] = [];
  private signature = '';

  constructor(
    private tokens: TokenLayer,
    private world: Container,
    private viewSize: () => { width: number; height: number },
  ) {
    super();
    this.eventMode = 'none';
    this.interactiveChildren = false;
    void document.fonts?.ready.then(() => {
      // Text is rasterised once, so a late font needs fresh plates.
      if (this.destroyed) return;
      this.plateKeys.clear();
      this.invalidate();
    });
  }

  setContext(next: Partial<LabelContext>): void {
    this.context = { ...this.context, ...next };
    this.invalidate();
  }

  private invalidate(): void {
    this.signature = '';
  }

  /** Pop the burst on a target. `amount` is null when this viewer may not read it. */
  showHit(entityId: string, amount: number | null): void {
    const palette = getCanvasTheme();
    const box = new Container();
    const r = 38;
    const points: number[] = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const k = i % 2 ? 0.66 : 1;
      points.push(Math.cos(a) * r * k, Math.sin(a) * r * k);
    }
    box.addChild(new Graphics().poly(points).fill({ color: palette.dyingBurst }).stroke({ width: 3, color: palette.tokenOutline, join: 'round' }));
    if (amount !== null) {
      const text = new Text({
        text: `−${amount}`,
        resolution: resolution(),
        style: { fontFamily: CANVAS_DISPLAY_FONT, fontSize: 22, fontWeight: '800', fill: palette.labelText },
      });
      text.anchor.set(0.5);
      box.addChild(text);
    }
    box.rotation = (-6 * Math.PI) / 180;
    box.zIndex = 5;
    this.addChild(box);
    this.hits.push({ entityId, box, start: performance.now() });
  }

  /** Called every frame. Does nothing unless the view or a token moved. */
  tick(): void {
    this.stepHits();
    const view = this.viewSize();
    const placements = this.tokens.getPlacements();
    let sum = 0;
    for (const p of placements) sum += p.x * 3 + p.y * 7 + (p.active ? 1 : 0) + Number(p.entity['currentStamina'] ?? 0) * 13;
    const signature = `${this.world.x}|${this.world.y}|${this.world.scale.x}|${view.width}|${view.height}|${placements.length}|${sum}`;
    if (signature === this.signature) return;
    this.signature = signature;
    this.layout(view);
  }

  private stepHits(): void {
    const now = performance.now();
    const zoom = this.world.scale.x;
    const still = reducedMotion();
    this.hits = this.hits.filter((hit) => {
      const t = now - hit.start;
      if (t > HIT_HOLD_MS + 200) {
        this.removeChild(hit.box);
        hit.box.destroy({ children: true });
        return false;
      }
      const token = this.tokens.getPlacements().find((p) => p.entity.id === hit.entityId);
      if (token) {
        hit.box.position.set(this.world.x + (token.x + token.px / 2) * zoom, this.world.y + (token.y + token.px / 2) * zoom);
      }
      // Pop: scale up with a small overshoot over 0.32 s. Reduced motion shows the end state.
      const p = Math.min(1, t / 320);
      const scale = still ? 1 : 0.5 + 0.5 * (1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2));
      hit.box.scale.set(scale);
      hit.box.alpha = t > HIT_HOLD_MS ? Math.max(0, 1 - (t - HIT_HOLD_MS) / 200) : 1;
      return true;
    });
  }

  private layout({ width, height }: { width: number; height: number }): void {
    const zoom = this.world.scale.x;
    const { labels, ownEntityId } = this.context;
    const bounds: Rect = { x: 4, y: 4, w: width - 8, h: height - 8 };
    const placed = new Map<string, { x: number; y: number }>();
    const used = new Set<string>();

    const tokens = this.tokens.getPlacements().map((p) => ({
      ...p,
      sx: this.world.x + p.x * zoom,
      sy: this.world.y + p.y * zoom,
      sz: p.px * zoom,
    })).filter((t) => t.sx + t.sz > 0 && t.sy + t.sz > 0 && t.sx < width && t.sy < height);

    const blockers: Rect[] = [...this.panelRects()];

    // The shout goes first: it is the one thing the map must say.
    for (const t of tokens) {
      if (staminaState(t.entity, t.entity.type) !== 'dying') continue;
      const id = `shout:${t.entity.id}`;
      const plate = this.shoutPlate(id, `${firstName(t.entity.name)} is dying!`);
      used.add(id);
      const x = Math.max(4, Math.min(width - plate.width - 8, t.sx + t.sz * 0.9));
      const y = Math.max(4, Math.min(height - plate.height - 8, t.sy + t.sz * 0.55));
      plate.position.set(x, y);
      blockers.push({ x, y, w: plate.width, h: plate.height });
    }

    this.layoutFogTag(width, height, blockers, used);

    const items: LabelInput[] = [];
    const tokenRects: Rect[] = tokens.map((t) => ({ x: t.sx, y: t.sy, w: t.sz, h: t.sz }));
    for (const t of tokens) {
      const label = labels.get(t.entity.id);
      const hero = t.entity.type === 'hero';
      const dying = staminaState(t.entity, t.entity.type) === 'dying';
      const text = label?.text ?? (hero ? firstName(t.entity.name) : null);
      if (!text || dying) continue;
      const shown = t.entity.id === ownEntityId && t.active ? text : t.entity.id === ownEntityId ? 'You' : text;
      const plate = this.labelPlate(`label:${t.entity.id}`, shown, hero, t.active);
      const near = tokens.filter((o) => o !== t && Math.hypot(o.sx - t.sx, o.sy - t.sy) < t.sz * 2.6);
      const out = near.length >= 2
        ? { x: t.sx - near.reduce((n, o) => n + o.sx, 0) / near.length, y: t.sy - near.reduce((n, o) => n + o.sy, 0) / near.length }
        : undefined;
      items.push({
        out,
        id: t.entity.id,
        cx: t.sx + t.sz / 2,
        cy: t.sy + t.sz / 2,
        r: t.sz / 2 + 2,
        w: plate.width,
        h: LABEL_H,
        priority: t.active ? 9 : hero ? 5 : 2,
      });
    }
    const free = placeLabels(items, [...blockers, ...tokenRects], bounds);
    for (const item of items) {
      const spot = free[item.id];
      if (spot) placed.set(item.id, spot);
    }
    for (const [id, spot] of placed) {
      const plate = this.plates.get(`label:${id}`);
      if (!plate) continue;
      plate.position.set(spot.x, spot.y);
      used.add(`label:${id}`);
    }

    // Each squad member shows its number on a plate at its bottom-right corner.
    for (const t of tokens) {
      const number = labels.get(t.entity.id)?.number;
      if (!number || t.sz < 20) continue;
      const id = `num:${t.entity.id}`;
      const plate = this.numberPlate(id, number);
      plate.position.set(t.sx + t.sz + 6 - plate.width, t.sy + t.sz + 4 - plate.height);
      used.add(id);
    }

    for (const [id, plate] of this.plates) plate.visible = used.has(id);
  }

  private panelRects(): Rect[] {
    const root = this.context.panelRoot;
    if (!root) return [];
    const origin = root.getBoundingClientRect();
    return [...root.querySelectorAll<HTMLElement>('[data-map-panel]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
    });
  }

  /** "Hidden from players" for the Director, "Fog. Not explored yet" for a Player. */
  private layoutFogTag(width: number, height: number, blockers: Rect[], used: Set<string>): void {
    const { fogZones, isDirector } = this.context;
    const zoom = this.world.scale.x;
    const cell = this.tokens.cell();
    let best: Rect | null = null;
    for (const zone of fogZones) {
      const x0 = Math.max(0, this.world.x + zone.x * cell * zoom);
      const y0 = Math.max(0, this.world.y + zone.y * cell * zoom);
      const x1 = Math.min(width, this.world.x + (zone.x + zone.w) * cell * zoom);
      const y1 = Math.min(height, this.world.y + (zone.y + zone.h) * cell * zoom);
      const w = x1 - x0;
      const h = y1 - y0;
      if (w > 0 && h > 0 && (!best || w * h > best.w * best.h)) best = { x: x0, y: y0, w, h };
    }
    if (!best) return;
    const text = isDirector ? (width < 700 ? 'Hidden' : 'Hidden from players') : 'Fog. Not explored yet';
    const plate = this.fogPlate('fog', text);
    if (plate.width + 16 > best.w || plate.height + 16 > best.h) return;
    const x = best.x + 8;
    const y = best.y + 8;
    const rect = { x, y, w: plate.width, h: plate.height };
    if (blockers.some((b) => overlaps(rect, b))) return;
    plate.position.set(x, y);
    used.add('fog');
    blockers.push(rect);
  }

  private keyed(id: string, key: string, build: () => Container): Container {
    const old = this.plates.get(id);
    if (old && this.plateKeys.get(id) === key) return old;
    if (old) {
      this.removeChild(old);
      old.destroy({ children: true });
    }
    const plate = build();
    this.plates.set(id, plate);
    this.plateKeys.set(id, key);
    this.addChild(plate);
    return plate;
  }

  private labelPlate(id: string, text: string, hero: boolean, active: boolean): Container {
    return this.keyed(id, `${text}|${hero}|${active}`, () => {
      const palette = getCanvasTheme();
      const fill = active ? palette.activeLabelPlate : hero ? palette.heroLabelPlate : palette.labelPlate;
      const ink = active ? palette.activeLabelText : hero ? palette.heroLabelText : palette.labelText;
      const label = new Text({
        text,
        resolution: resolution(),
        style: { fontFamily: hero ? CANVAS_DISPLAY_FONT : CANVAS_FONT, fontSize: 13, fontWeight: '700', fill: ink },
      });
      const w = Math.ceil(label.width) + (hero ? 16 : 12);
      const box = new Container();
      box.addChild(new Graphics().rect(0, 0, w, LABEL_H).fill({ color: fill }).stroke({ width: 1.5, color: palette.labelKeyline, alignment: 1 }));
      label.anchor.set(0.5);
      label.position.set(w / 2, LABEL_H / 2);
      box.addChild(label);
      return box;
    });
  }

  private numberPlate(id: string, text: string): Container {
    return this.keyed(id, text, () => {
      const palette = getCanvasTheme();
      const label = new Text({
        text,
        resolution: resolution(),
        style: { fontFamily: CANVAS_FONT, fontSize: 13, fontWeight: '700', fill: palette.squadNumberText },
      });
      const w = Math.max(18, Math.ceil(label.width) + 6);
      const box = new Container();
      box.addChild(new Graphics().rect(1, 1, w - 2, 16).fill({ color: palette.squadNumberPlate }).stroke({ width: 2, color: palette.labelKeyline }));
      label.anchor.set(0.5);
      label.position.set(w / 2, 9);
      box.addChild(label);
      return box;
    });
  }

  private shoutPlate(id: string, text: string): Container {
    return this.keyed(id, text, () => {
      const palette = getCanvasTheme();
      const label = new Text({
        text,
        resolution: resolution(),
        style: { fontFamily: CANVAS_DISPLAY_FONT, fontSize: 16, fontWeight: '800', fill: palette.labelText },
      });
      const w = Math.ceil(label.width) + 18;
      const h = Math.ceil(label.height) + 8;
      const box = new Container();
      box.addChild(new Graphics().rect(3, 3, w, h).fill({ color: palette.tokenOutline }));
      box.addChild(new Graphics().rect(0, 0, w, h).fill({ color: palette.dyingBurst }).stroke({ width: 3, color: palette.tokenOutline }));
      label.anchor.set(0.5);
      label.position.set(w / 2, h / 2);
      box.addChild(label);
      box.rotation = (-3 * Math.PI) / 180;
      box.zIndex = 4;
      return box;
    });
  }

  private fogPlate(id: string, text: string): Container {
    return this.keyed(id, text, () => {
      const palette = getCanvasTheme();
      const director = this.context.isDirector;
      const label = new Text({
        text,
        resolution: resolution(),
        style: { fontFamily: CANVAS_FONT, fontSize: 13, fontWeight: '700', fill: palette.hiddenMark },
      });
      const box = new Container();
      if (director) {
        const w = Math.ceil(label.width) + 36;
        box.addChild(new Graphics().rect(0, 0, w, LABEL_H).fill({ color: palette.hiddenBadge }));
        const holder = new Container();
        box.addChild(holder);
        artTexture(mapIconUrl('hidden', toCssHex(palette.hiddenMark), 2.6), (texture) => {
          if (holder.destroyed) return;
          const sprite = new Sprite(texture);
          sprite.width = 14;
          sprite.height = 14;
          sprite.position.set(8, 4);
          holder.addChild(sprite);
        });
        label.anchor.set(0, 0.5);
        label.position.set(28, LABEL_H / 2);
      } else {
        label.anchor.set(0, 0.5);
        label.position.set(0, LABEL_H / 2);
      }
      box.addChild(label);
      return box;
    });
  }

  clearAll(): void {
    for (const plate of this.plates.values()) plate.destroy({ children: true });
    this.plates.clear();
    this.plateKeys.clear();
    for (const hit of this.hits) hit.box.destroy({ children: true });
    this.hits = [];
    this.signature = '';
  }
}

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
