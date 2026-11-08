import { ColorMatrixFilter, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { Quadtree } from '../systems/Quadtree.js';
import type { EntityData } from '../../types/protocol.js';
import {
  mediaElementCrossOrigin,
  resolveApiBackedMediaUrl,
} from '../../lib/api-url.js';
import { conditionNames } from '../../lib/conditions.js';
import {
  OCTAGON_POINTS,
  entityPortrait,
  faceKeyFor,
  faceUrl,
  isRoundToken,
  staminaState,
} from '../../lib/faces.js';
import { isMapIcon, mapIconUrl, type MapIcon } from '../../lib/map-icons.js';
import { artTexture } from '../face-textures.js';
import { CANVAS_FONT, getCanvasTheme, toCssHex } from '../theme.js';

export interface TokenStyle {
  size: number; // grid cells
  selected: boolean;
  /** Combatant is currently taking its turn (white disc, active-plate ring). */
  active?: boolean;
  /** Combatant has already acted this round (done badge). */
  acted?: boolean;
  /** Director's view only: this creature is under fog (shut-eye badge). */
  hidden?: boolean;
}

interface TokenSprite {
  container: Container;
  entityId: string;
  entity: EntityData;
  gridX: number;
  gridY: number;
  size: number;
  selected: boolean;
  active: boolean;
  acted: boolean;
  hidden: boolean;
}

/** What the label layer needs to know about a token. Positions are world pixels. */
export interface TokenPlacement {
  entity: EntityData;
  x: number;
  y: number;
  px: number;
  active: boolean;
  visible: boolean;
}

interface MoveTween {
  entityId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  start: number;
  trail: Graphics;
}

const TRAVEL_MS = 700;
/** The travel curve, cubic-bezier(.45, 0, .1, 1). */
function travelEase(t: number): number {
  let lo = 0;
  let hi = 1;
  let u = t;
  for (let i = 0; i < 12; i++) {
    u = (lo + hi) / 2;
    const x = 3 * (1 - u) * (1 - u) * u * 0.45 + 3 * (1 - u) * u * u * 0.1 + u * u * u;
    if (x < t) lo = u;
    else hi = u;
  }
  return 3 * (1 - u) * u * u + u * u * u;
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class TokenLayer extends Container {
  private tokens = new Map<string, TokenSprite>();
  private cellSize = 64;
  private selectionRect: Graphics | null = null;
  private distanceLabel: Container | null = null;
  // Per-token portrait image and GPU texture. Pixi v8 does not destroy
  // dynamically created textures when a container is destroyed, so they are
  // tracked here and released explicitly on token removal.
  private portraitResources = new Map<string, { img: HTMLImageElement; texture: Texture | null }>();
  private tweens = new Map<string, MoveTween>();
  private tweenFrame = 0;

  /** Stamina went down on an existing token. The label layer pops the hit burst. */
  onHit: ((entityId: string, amount: number) => void) | null = null;

  constructor() {
    super();
    this.sortableChildren = true;
  }

  setCellSize(size: number): void {
    if (this.cellSize === size) return;
    const existingTokens = [...this.tokens.values()].map((token) => ({
      entity: token.entity,
      size: token.size,
      selected: token.selected,
      active: token.active,
      acted: token.acted,
      hidden: token.hidden,
    }));
    this.cellSize = size;
    if (existingTokens.length === 0) return;
    this.clear();
    for (const { entity, size: tokenSize, selected, active, acted, hidden } of existingTokens) {
      this.addToken(entity, { size: tokenSize, selected, active, acted, hidden });
    }
  }

  addToken(entity: EntityData, style: TokenStyle): void {
    if (this.tokens.has(entity.id)) this.removeToken(entity.id);

    const container = new Container();
    const px = style.size * this.cellSize;
    const c = px / 2;
    const palette = getCanvasTheme();
    const round = isRoundToken(entity);
    const dying = staminaState(entity, entity.type) === 'dying';
    const portrait = entityPortrait(entity);

    // Dying: a hazard burst behind the head (22-point star, ink edge 4).
    if (dying) {
      const burst = new Graphics();
      const r = px * 0.92;
      const points: number[] = [];
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2;
        const k = i % 2 ? 0.66 : 1;
        points.push(c + Math.cos(a) * r * k, c + Math.sin(a) * r * k);
      }
      burst.poly(points).fill({ color: palette.dyingBurst }).stroke({ width: 4 * (px / 100), color: palette.tokenOutline, join: 'round' });
      container.addChild(burst);
    }

    // Acting: a white disc behind the face, a 3.5 px blue ring, then ink out to 6 px.
    if (style.active) {
      const disc = new Graphics();
      disc.circle(c, c, c).fill({ color: palette.turnDisc });
      disc.circle(c, c, c + 4.75).stroke({ width: 2.5, color: palette.turnOuter });
      disc.circle(c, c, c + 1.75).stroke({ width: 3.5, color: palette.turn });
      container.addChild(disc);
    }

    // Selected: a 3 px plate ring, then ink outside it. Sits outside the turn ring.
    if (style.selected) {
      const base = style.active ? c + 6 : c;
      const ring = new Graphics();
      ring.circle(c, c, base + 3.75).stroke({ width: 1.5, color: palette.tokenOutline });
      ring.circle(c, c, base + 1.5).stroke({ width: 3, color: palette.selection });
      container.addChild(ring);
    }

    // The head tilts when dying, so it gets its own pivoted box.
    const head = new Container();
    head.pivot.set(c, c);
    head.position.set(c, c);
    if (dying) head.rotation = (-14 * Math.PI) / 180;
    container.addChild(head);
    if (portrait) {
      this.drawSticker(head, entity.id, portrait, px, round, dying);
    } else {
      this.drawHead(head, entity, px, dying);
    }

    const badge = Math.max(7, px * 0.195);
    if (style.acted && !style.active) {
      this.drawBadge(container, 'check', 6, 6, badge, palette.doneBadge, palette.doneRing, palette.doneMark, 3.5);
    }

    // Condition badges. Heroes bottom-right, creatures top-right, as in the demo.
    const conditions = conditionNames(entity);
    conditions.forEach((condition, i) => {
      if (!isMapIcon(condition)) return;
      const step = i * (badge * 2 + 2);
      const x = round ? px - 6 - step : px - 4;
      const y = round ? px - 6 : 4 + step;
      this.drawBadge(container, condition, x, y, badge, palette.conditionBadge, palette.conditionRing, palette.tokenOutline, 2.5);
    });

    // Director's view of a creature under fog.
    if (style.hidden) {
      this.drawBadge(container, 'hidden', 4, px - 6, badge, palette.hiddenBadge, palette.hiddenRing, palette.hiddenMark, 2.5);
    }

    container.x = entity.x * this.cellSize;
    container.y = entity.y * this.cellSize;
    container.zIndex = style.active || dying ? 3 : 1;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    this.addChild(container);
    this.tokens.set(entity.id, {
      container,
      entityId: entity.id,
      entity,
      gridX: entity.x,
      gridY: entity.y,
      size: style.size,
      selected: style.selected,
      active: Boolean(style.active),
      acted: Boolean(style.acted),
      hidden: Boolean(style.hidden),
    });
  }

  /** A drawn head: the face plus the small offset shadow every head has on the map. */
  private drawHead(head: Container, entity: EntityData, px: number, dying: boolean): void {
    const palette = getCanvasTheme();
    const url = faceUrl(faceKeyFor(entity), dying, 192);
    artTexture(url, (texture) => {
      if (head.destroyed) return;
      const shadow = new Sprite(texture);
      shadow.width = px;
      shadow.height = px;
      shadow.position.set(1.5, 2);
      shadow.tint = palette.tokenOutline;
      shadow.alpha = palette.tokenShadowAlpha;
      const face = new Sprite(texture);
      face.width = px;
      face.height = px;
      head.addChild(shadow, face);
    });
  }

  /**
   * An uploaded portrait as a sticker: clipped to the side's shape, a white keyline, the same
   * 4-unit ink outline as a drawn head, and an offset ink shadow. Round for heroes and NPCs,
   * eight-sided for creatures. Dying: greyscale with an X overlay.
   */
  private drawSticker(head: Container, entityId: string, url: string, px: number, round: boolean, dying: boolean): void {
    const palette = getCanvasTheme();
    const unit = px / 76;
    const place = (scale: number, dx = 0, dy = 0) => (g: Graphics) => {
      const s = unit * scale;
      if (round) {
        g.circle(px / 2 + dx * unit, px / 2 + dy * unit, 30 * s);
      } else {
        g.poly(OCTAGON_POINTS.flatMap(([x, y]) => [px / 2 + (x - 32) * s + dx * unit, px / 2 + (y - 32) * s + dy * unit]));
      }
      return g;
    };
    const shadow = place(1, 2.2, 2.6)(new Graphics()).fill({ color: palette.tokenOutline });
    const outline = place(1)(new Graphics()).fill({ color: palette.tokenOutline }).stroke({ width: 4 * unit, color: palette.tokenOutline, join: 'round' });
    const keyline = place(0.97)(new Graphics()).fill({ color: palette.tokenKeyline });
    const holder = new Container();
    head.addChild(shadow, outline, keyline, holder);

    const resolvedUrl = resolveApiBackedMediaUrl(url);
    const img = new Image();
    const crossOrigin = mediaElementCrossOrigin(resolvedUrl);
    if (crossOrigin) img.crossOrigin = crossOrigin;
    // Track immediately so an in-flight load can be cancelled on removal.
    this.portraitResources.set(entityId, { img, texture: null });
    img.onload = () => {
      // Guard: the token may have been destroyed while loading
      if (holder.destroyed) return;
      const texture = Texture.from(img);
      const tracked = this.portraitResources.get(entityId);
      if (tracked) tracked.texture = texture;
      const sprite = new Sprite(texture);
      // Cover the shape, like CSS object-fit: cover.
      const side = px * (60 * 0.88) / 76;
      const scale = Math.max(side / texture.width, side / texture.height);
      sprite.width = texture.width * scale;
      sprite.height = texture.height * scale;
      sprite.anchor.set(0.5);
      sprite.position.set(px / 2, px / 2);
      if (dying) {
        const grey = new ColorMatrixFilter();
        grey.desaturate();
        sprite.filters = [grey];
      }
      const mask = place(0.88)(new Graphics()).fill({ color: 0xffffff });
      holder.addChild(mask, sprite);
      sprite.mask = mask;
    };
    img.src = resolvedUrl;

    if (dying) {
      const k = px * 0.2;
      const x = new Graphics();
      for (const [w, color] of [[7 * unit, palette.tokenKeyline], [4 * unit, palette.tokenOutline]] as const) {
        x.moveTo(px / 2 - k, px / 2 - k).lineTo(px / 2 + k, px / 2 + k);
        x.moveTo(px / 2 + k, px / 2 - k).lineTo(px / 2 - k, px / 2 + k);
        x.stroke({ width: w, color, cap: 'round' });
      }
      head.addChild(x);
    }
  }

  private drawBadge(container: Container, icon: MapIcon, x: number, y: number, r: number, fill: number, ring: number, mark: number, weight: number): void {
    const disc = new Graphics();
    disc.circle(x, y, r).fill({ color: fill }).stroke({ width: 2, color: ring });
    container.addChild(disc);
    const holder = new Container();
    container.addChild(holder);
    artTexture(mapIconUrl(icon, toCssHex(mark), weight), (texture) => {
      if (holder.destroyed) return;
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.position.set(x, y);
      sprite.width = r * 1.5;
      sprite.height = r * 1.5;
      holder.addChild(sprite);
    });
  }

  /**
   * Update an existing token in place. Only rebuilds the visual if entity data
   * has changed (stamina, conditions, selection). Does NOT reset position —
   * preserves the current grid position so active drags aren't interrupted.
   */
  updateToken(entity: EntityData, style: TokenStyle): void {
    const existing = this.tokens.get(entity.id);
    if (!existing) {
      // Token doesn't exist yet — fall through to addToken
      this.addToken(entity, style);
      return;
    }

    // Check if visual rebuild is needed
    const oldEntity = existing.entity;
    const staminaChanged =
      oldEntity['currentStamina'] !== entity['currentStamina'] ||
      oldEntity['maxStamina'] !== entity['maxStamina'];
    const conditionsChanged =
      JSON.stringify(oldEntity['conditions']) !== JSON.stringify(entity['conditions']);
    const selectionChanged = style.selected !== existing.selected;
    const sizeChanged = style.size !== existing.size;
    const nameChanged = oldEntity.name !== entity.name;
    const portraitChanged = oldEntity['portraitUrl'] !== entity['portraitUrl'];
    const activeChanged = Boolean(style.active) !== existing.active;
    const actedChanged = Boolean(style.acted) !== existing.acted;
    const hiddenChanged = Boolean(style.hidden) !== existing.hidden;

    const before = typeof oldEntity['currentStamina'] === 'number' ? oldEntity['currentStamina'] : null;
    const after = typeof entity['currentStamina'] === 'number' ? entity['currentStamina'] : null;
    if (before !== null && after !== null && after < before) this.onHit?.(entity.id, before - after);

    if (!staminaChanged && !conditionsChanged && !selectionChanged && !sizeChanged && !nameChanged && !portraitChanged && !activeChanged && !actedChanged && !hiddenChanged) {
      // Only position may have changed — sync from entity if not being dragged
      // (dragged tokens have their position updated by InteractionManager)
      if (existing.gridX !== entity.x || existing.gridY !== entity.y) {
        this.travelTo(existing, entity.x, entity.y);
      }
      existing.entity = entity;
      return;
    }

    // Preserve the current visual position (may differ from entity.x/y during drag)
    const preservedGridX = existing.gridX;
    const preservedGridY = existing.gridY;

    // Full rebuild of the visual
    this.removeToken(entity.id);
    this.addToken(entity, style);

    // Restore the preserved position
    const newToken = this.tokens.get(entity.id);
    if (newToken) {
      newToken.gridX = preservedGridX;
      newToken.gridY = preservedGridY;
      newToken.container.x = preservedGridX * this.cellSize;
      newToken.container.y = preservedGridY * this.cellSize;
    }
  }

  /**
   * A move the server reported: the token travels in 0.7 s and draws a 5 px blue trail behind it.
   * Under reduced motion it jumps and draws no trail. The grid position changes at once, so
   * hit-testing never waits for the picture.
   */
  private travelTo(token: TokenSprite, gridX: number, gridY: number): void {
    token.gridX = gridX;
    token.gridY = gridY;
    this.cancelTween(token.entityId);
    const toX = gridX * this.cellSize;
    const toY = gridY * this.cellSize;
    if (reducedMotion()) {
      token.container.x = toX;
      token.container.y = toY;
      return;
    }
    const trail = new Graphics();
    trail.zIndex = 0;
    this.addChild(trail);
    this.tweens.set(token.entityId, {
      entityId: token.entityId,
      fromX: token.container.x,
      fromY: token.container.y,
      toX,
      toY,
      start: performance.now(),
      trail,
    });
    if (!this.tweenFrame) this.tweenFrame = requestAnimationFrame(this.stepTweens);
  }

  private stepTweens = (now: number): void => {
    this.tweenFrame = 0;
    const palette = getCanvasTheme();
    for (const tween of [...this.tweens.values()]) {
      const token = this.tokens.get(tween.entityId);
      if (!token) {
        this.cancelTween(tween.entityId);
        continue;
      }
      const t = Math.min(1, (now - tween.start) / TRAVEL_MS);
      const e = travelEase(t);
      const half = (token.size * this.cellSize) / 2;
      token.container.x = tween.fromX + (tween.toX - tween.fromX) * e;
      token.container.y = tween.fromY + (tween.toY - tween.fromY) * e;
      tween.trail.clear();
      tween.trail
        .moveTo(tween.fromX + half, tween.fromY + half)
        .lineTo(token.container.x + half, token.container.y + half)
        .stroke({ width: 5, color: palette.moveTrail, cap: 'round' });
      // The trail stays briefly after the token lands, then goes.
      if (t >= 1) tween.trail.alpha = Math.max(0, 1 - (now - tween.start - TRAVEL_MS) / 300);
      if (now - tween.start >= TRAVEL_MS + 300) this.cancelTween(tween.entityId);
    }
    if (this.tweens.size > 0 && !this.destroyed) this.tweenFrame = requestAnimationFrame(this.stepTweens);
  };

  private cancelTween(entityId: string): void {
    const tween = this.tweens.get(entityId);
    if (!tween) return;
    this.tweens.delete(entityId);
    this.removeChild(tween.trail);
    tween.trail.destroy();
  }

  /** World pixels per grid square. */
  cell(): number {
    return this.cellSize;
  }

  /** Every token's place in world pixels, for the label layer. */
  getPlacements(): TokenPlacement[] {
    const out: TokenPlacement[] = [];
    for (const token of this.tokens.values()) {
      out.push({
        entity: token.entity,
        x: token.container.x,
        y: token.container.y,
        px: token.size * this.cellSize,
        active: token.active,
        visible: token.container.visible,
      });
    }
    return out;
  }

  clear(): void {
    for (const entityId of [...this.tweens.keys()]) this.cancelTween(entityId);
    for (const [, token] of this.tokens) {
      this.removeChild(token.container);
      token.container.destroy({ children: true });
    }
    for (const entityId of [...this.portraitResources.keys()]) {
      this.releasePortraitResources(entityId);
    }
    this.tokens.clear();
    this.clearSelectionRect();
    this.clearDistanceLabel();
  }

  removeToken(entityId: string): void {
    this.cancelTween(entityId);
    this.releasePortraitResources(entityId);
    const token = this.tokens.get(entityId);
    if (token) {
      this.removeChild(token.container);
      token.container.destroy({ children: true });
      this.tokens.delete(entityId);
    }
  }

  /** Cancel any in-flight portrait load and release its GPU texture. */
  private releasePortraitResources(entityId: string): void {
    const tracked = this.portraitResources.get(entityId);
    if (!tracked) return;
    tracked.img.onload = null;
    tracked.img.src = '';
    tracked.texture?.destroy(true);
    this.portraitResources.delete(entityId);
  }

  moveToken(entityId: string, gridX: number, gridY: number): void {
    const token = this.tokens.get(entityId);
    if (token) {
      this.cancelTween(entityId);
      token.gridX = gridX;
      token.gridY = gridY;
      token.container.x = gridX * this.cellSize;
      token.container.y = gridY * this.cellSize;
    }
  }

  getTokenAt(gridX: number, gridY: number): string | null {
    for (const [id, token] of this.tokens) {
      if (
        gridX >= token.gridX &&
        gridX < token.gridX + token.size &&
        gridY >= token.gridY &&
        gridY < token.gridY + token.size
      ) {
        return id;
      }
    }
    return null;
  }

  /** Look up stored entity data for a given token */
  getTokenEntity(entityId: string): EntityData | null {
    return this.tokens.get(entityId)?.entity ?? null;
  }

  /** Rebuild quadtree index from current tokens */
  buildIndex(quadtree: Quadtree<string>): void {
    quadtree.clear();
    for (const [id, token] of this.tokens) {
      quadtree.insert({
        bounds: {
          x: token.gridX * this.cellSize,
          y: token.gridY * this.cellSize,
          width: token.size * this.cellSize,
          height: token.size * this.cellSize,
        },
        data: id,
      });
    }
  }

  /** Show distance label near a token during drag. Chebyshev distance (diag = ortho in Draw Steel). */
  showDistanceLabel(entityId: string, originGridX: number, originGridY: number): void {
    const token = this.tokens.get(entityId);
    if (!token) return;

    const dx = Math.abs(token.gridX - originGridX);
    const dy = Math.abs(token.gridY - originGridY);
    const squares = Math.max(dx, dy); // Chebyshev distance
    if (squares === 0) {
      this.clearDistanceLabel();
      return;
    }

    const feet = squares * 5;
    const labelText = `${squares} sq / ${feet} ft`;

    if (!this.distanceLabel) {
      this.distanceLabel = new Container();
      this.distanceLabel.zIndex = 10;
      this.addChild(this.distanceLabel);
    }

    // Clear previous children
    this.distanceLabel.removeChildren();

    const palette = getCanvasTheme();
    const text = new Text({
      text: labelText,
      style: {
        fontFamily: CANVAS_FONT,
        fontSize: 13,
        fill: palette.labelText,
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);

    // Background pill
    const pad = 6;
    const bg = new Graphics();
    bg.rect(
      -text.width / 2 - pad,
      -text.height / 2 - pad / 2,
      text.width + pad * 2,
      text.height + pad,
    );
    bg.fill({ color: palette.labelPlate, alpha: 1 });
    bg.stroke({ width: 1.5, color: palette.labelKeyline, alpha: 1 });

    this.distanceLabel.addChild(bg);
    this.distanceLabel.addChild(text);
    // Map labels stay 13 px whatever the zoom.
    this.distanceLabel.scale.set(1 / (this.parent?.scale.x || 1));

    // Position below the token
    const size = token.size * this.cellSize;
    this.distanceLabel.x = token.container.x + size / 2;
    this.distanceLabel.y = token.container.y + size + 18;
  }

  /** Show distance label for group drag (uses the anchor token). */
  showGroupDistanceLabel(anchorGridX: number, anchorGridY: number, currentGridX: number, currentGridY: number): void {
    const dx = Math.abs(currentGridX - anchorGridX);
    const dy = Math.abs(currentGridY - anchorGridY);
    const squares = Math.max(dx, dy);
    if (squares === 0) {
      this.clearDistanceLabel();
      return;
    }

    const feet = squares * 5;
    const labelText = `${squares} sq / ${feet} ft`;

    if (!this.distanceLabel) {
      this.distanceLabel = new Container();
      this.distanceLabel.zIndex = 10;
      this.addChild(this.distanceLabel);
    }

    this.distanceLabel.removeChildren();

    const palette = getCanvasTheme();
    const text = new Text({
      text: labelText,
      style: {
        fontFamily: CANVAS_FONT,
        fontSize: 13,
        fill: palette.labelText,
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);

    const pad = 6;
    const bg = new Graphics();
    bg.rect(
      -text.width / 2 - pad,
      -text.height / 2 - pad / 2,
      text.width + pad * 2,
      text.height + pad,
    );
    bg.fill({ color: palette.labelPlate, alpha: 1 });
    bg.stroke({ width: 1.5, color: palette.labelKeyline, alpha: 1 });

    this.distanceLabel.addChild(bg);
    this.distanceLabel.addChild(text);
    // Map labels stay 13 px whatever the zoom.
    this.distanceLabel.scale.set(1 / (this.parent?.scale.x || 1));

    // Position at the current cursor grid cell
    this.distanceLabel.x = currentGridX * this.cellSize + this.cellSize / 2;
    this.distanceLabel.y = currentGridY * this.cellSize + this.cellSize + 18;
  }

  /** Remove the distance label. */
  clearDistanceLabel(): void {
    if (this.distanceLabel) {
      this.removeChild(this.distanceLabel);
      this.distanceLabel.destroy({ children: true });
      this.distanceLabel = null;
    }
  }

  /** Draw a selection marquee rectangle (world coordinates). */
  showSelectionRect(x: number, y: number, w: number, h: number): void {
    if (!this.selectionRect) {
      this.selectionRect = new Graphics();
      this.selectionRect.zIndex = 10;
      this.addChild(this.selectionRect);
    }
    this.selectionRect.clear();
    this.selectionRect.rect(x, y, w, h);
    const palette = getCanvasTheme();
    this.selectionRect.fill({ color: palette.selectionRect, alpha: palette.selectionRectFillAlpha });
    this.selectionRect.rect(x, y, w, h);
    this.selectionRect.stroke({ width: 1.5, color: palette.selectionRect, alpha: palette.selectionRectEdgeAlpha });
  }

  /** Remove the selection marquee rectangle. */
  clearSelectionRect(): void {
    if (this.selectionRect) {
      this.removeChild(this.selectionRect);
      this.selectionRect.destroy();
      this.selectionRect = null;
    }
  }

  /** Return IDs of all tokens whose grid position falls within the given world-space rect. */
  getTokensInRect(worldX: number, worldY: number, worldW: number, worldH: number): string[] {
    const ids: string[] = [];
    // Normalize rect (handle negative width/height from any drag direction)
    const left = Math.min(worldX, worldX + worldW);
    const right = Math.max(worldX, worldX + worldW);
    const top = Math.min(worldY, worldY + worldH);
    const bottom = Math.max(worldY, worldY + worldH);

    for (const [id, token] of this.tokens) {
      // Token center in world coords
      const tokenSize = token.size * this.cellSize;
      const cx = token.gridX * this.cellSize + tokenSize / 2;
      const cy = token.gridY * this.cellSize + tokenSize / 2;
      if (cx >= left && cx <= right && cy >= top && cy <= bottom) {
        ids.push(id);
      }
    }
    return ids;
  }

  /** Move multiple tokens by a grid-space delta. Returns array of {id, gridX, gridY}. */
  moveTokensByDelta(entityIds: string[], deltaX: number, deltaY: number): Array<{ id: string; gridX: number; gridY: number }> {
    const results: Array<{ id: string; gridX: number; gridY: number }> = [];
    for (const id of entityIds) {
      const token = this.tokens.get(id);
      if (token) {
        this.cancelTween(id);
        token.gridX += deltaX;
        token.gridY += deltaY;
        token.container.x = token.gridX * this.cellSize;
        token.container.y = token.gridY * this.cellSize;
        results.push({ id, gridX: token.gridX, gridY: token.gridY });
      }
    }
    return results;
  }

  /** Get the current grid position of a token. */
  getTokenPosition(entityId: string): { gridX: number; gridY: number } | null {
    const token = this.tokens.get(entityId);
    return token ? { gridX: token.gridX, gridY: token.gridY } : null;
  }

  /** Off-screen culling: hide tokens outside viewport for performance */
  cullToViewport(viewX: number, viewY: number, viewWidth: number, viewHeight: number, scale: number): void {
    const pad = this.cellSize * 2; // 2-cell padding
    const left = (viewX - pad) / scale;
    const top = (viewY - pad) / scale;
    const right = (viewX + viewWidth + pad) / scale;
    const bottom = (viewY + viewHeight + pad) / scale;

    for (const [, token] of this.tokens) {
      const tx = token.gridX * this.cellSize;
      const ty = token.gridY * this.cellSize;
      const tokenSize = token.size * this.cellSize;
      token.container.visible = tx + tokenSize >= left && tx <= right && ty + tokenSize >= top && ty <= bottom;
    }
  }
}
