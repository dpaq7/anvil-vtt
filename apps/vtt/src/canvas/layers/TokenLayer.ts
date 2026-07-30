import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import type { Quadtree } from '../systems/Quadtree.js';
import type { EntityData } from '../../types/protocol.js';
import {
  mediaElementCrossOrigin,
  resolveApiBackedMediaUrl,
} from '../../lib/api-url.js';
import { conditionNames } from '../../lib/conditions.js';

/** Condition ID → emoji for badge display */
const CONDITION_EMOJI: Record<string, string> = {
  bleeding: '\u{1FA78}',
  dazed: '\u{1F4AB}',
  frightened: '\u{1F628}',
  grabbed: '\u{270A}',
  prone: '\u{1F53B}',
  restrained: '\u26D3',
  slowed: '\u{1F40C}',
  taunted: '\u{1F624}',
  weakened: '\u{1F494}',
};

/** Entity type → fill color */
const TYPE_COLORS: Record<string, number> = {
  hero: 0x3b82f6,
  monster: 0xef4444,
  npc: 0x8b5cf6,
};

/** Entity type → center glyph */
const TYPE_GLYPHS: Record<string, string> = {
  hero: '\u{1F6E1}',     // shield
  monster: '\u2694',       // crossed swords
  npc: '\u{1F464}',       // bust in silhouette
};

export interface TokenStyle {
  size: number; // grid cells
  color: number;
  selected: boolean;
  /** Combatant is currently taking its turn (amber active-turn ring). */
  active?: boolean;
  /** Combatant has already acted this round (dimmed + done badge). */
  acted?: boolean;
}

interface TokenSprite {
  container: Container;
  entityId: string;
  entity: EntityData;
  gridX: number;
  gridY: number;
  size: number;
  conditionBadge: Text | null;
  selected: boolean;
  active: boolean;
  acted: boolean;
}

export class TokenLayer extends Container {
  private tokens = new Map<string, TokenSprite>();
  private cellSize = 64;
  private selectionRect: Graphics | null = null;
  private distanceLabel: Container | null = null;
  // Per-token portrait image and GPU texture. Pixi v8 does not destroy
  // dynamically created textures when a container is destroyed, so they are
  // tracked here and released explicitly on token removal.
  private portraitResources = new Map<string, { img: HTMLImageElement; texture: Texture | null }>();

  setCellSize(size: number): void {
    if (this.cellSize === size) return;
    const existingTokens = [...this.tokens.values()].map((token) => ({
      entity: token.entity,
      size: token.size,
      selected: token.selected,
      active: token.active,
      acted: token.acted,
    }));
    this.cellSize = size;
    if (existingTokens.length === 0) return;
    this.clear();
    for (const { entity, size: tokenSize, selected, active, acted } of existingTokens) {
      this.addToken(entity, {
        size: tokenSize,
        color: TYPE_COLORS[entity.type] ?? 0x8b5cf6,
        selected,
        active,
        acted,
      });
    }
  }

  addToken(entity: EntityData, style: TokenStyle): void {
    if (this.tokens.has(entity.id)) this.removeToken(entity.id);

    const container = new Container();
    const size = style.size * this.cellSize;
    const radius = size / 2 - 2;
    const cx = size / 2;
    const cy = size / 2;

    const typeColor = TYPE_COLORS[entity.type] ?? 0x8b5cf6;

    // Black ring border
    const ring = new Graphics();
    ring.circle(cx, cy, radius);
    ring.fill({ color: typeColor, alpha: 0.25 });
    ring.circle(cx, cy, radius);
    ring.stroke({ width: 3, color: 0x000000 });
    container.addChild(ring);

    // Inner color ring (thinner, entity-type colored)
    const innerRing = new Graphics();
    innerRing.circle(cx, cy, radius - 2);
    innerRing.stroke({ width: 2, color: typeColor, alpha: 0.8 });
    container.addChild(innerRing);

    // Portrait image or center glyph fallback
    const portraitUrl = entity['portraitUrl'] as string | undefined;
    if (portraitUrl) {
      this.loadPortraitSprite(container, entity.id, portraitUrl, cx, cy, radius - 3);
    } else {
      const glyph = TYPE_GLYPHS[entity.type] ?? entity.name.slice(0, 2).toUpperCase();
      const label = new Text({
        text: glyph,
        style: {
          fontFamily: 'system-ui, sans-serif',
          fontSize: Math.max(10, size * 0.28),
          fill: 0xffffff,
        },
      });
      label.anchor.set(0.5);
      label.x = cx;
      label.y = cy;
      container.addChild(label);
    }

    // Name label below token
    const nameFontSize = Math.max(8, size * 0.18);
    const nameWrapWidth = Math.max(72, size * 1.6);
    const nameLabel = new Text({
      text: entity.name,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: nameFontSize,
        fill: 0xcccccc,
        align: 'center',
        breakWords: true,
        lineHeight: Math.ceil(nameFontSize * 1.08),
        wordWrap: true,
        wordWrapWidth: nameWrapWidth,
      },
    });
    nameLabel.anchor.set(0.5, 0);
    nameLabel.x = cx;
    nameLabel.y = size + 1;
    container.addChild(nameLabel);

    // Selection highlight — white circle outline
    if (style.selected) {
      const sel = new Graphics();
      sel.circle(cx, cy, radius + 3);
      sel.stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
      container.addChild(sel);
    }

    // HP arc — color gradient based on stamina %
    const maxStamina = typeof entity['maxStamina'] === 'number' ? entity['maxStamina'] as number : 0;
    const currentStamina = typeof entity['currentStamina'] === 'number' ? entity['currentStamina'] as number : maxStamina;
    if (maxStamina > 0) {
      const pct = Math.max(0, Math.min(1, currentStamina / maxStamina));
      const arc = new Graphics();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * pct;
      // Color gradient: green > amber > red
      let arcColor = 0x22c55e; // green
      if (pct <= 0.25) arcColor = 0xef4444; // red
      else if (pct <= 0.5) arcColor = 0xf59e0b; // amber
      arc.arc(cx, cy, radius + 1, startAngle, endAngle);
      arc.stroke({ width: 3, color: arcColor });
      container.addChild(arc);

      // Stamina-state status ring (matches the context-menu badges): dying at
      // ≤ 0 (red), winded at ≤ half (orange). Sits outside the HP arc.
      if (currentStamina <= 0) {
        const dyingRing = new Graphics();
        dyingRing.circle(cx, cy, radius + 2);
        dyingRing.stroke({ width: 3.5, color: 0xdc2626, alpha: 0.95 });
        container.addChild(dyingRing);
      } else if (currentStamina <= maxStamina / 2) {
        const windedRing = new Graphics();
        windedRing.circle(cx, cy, radius + 2);
        windedRing.stroke({ width: 2.5, color: 0xfb923c, alpha: 0.9 });
        container.addChild(windedRing);
      }
    }

    // Condition emoji tags — positioned around the token ring starting at ~2 o'clock
    const conditions = conditionNames(entity);
    const conditionBadge: Text | null = null;
    if (conditions.length > 0) {
      // Start at ~1:30 (about -60°) and space each tag 30° clockwise
      const startAngle = -Math.PI / 3; // -60° ≈ 2 o'clock
      const angleStep = Math.PI / 6;   // 30° between tags
      const tagRadius = radius + 8;    // Just outside the ring
      const tagFontSize = Math.max(10, size * 0.24);

      conditions.forEach((conditionId, i) => {
        const emoji = CONDITION_EMOJI[conditionId];
        if (!emoji) return;

        const angle = startAngle + i * angleStep;
        const tx = cx + Math.cos(angle) * tagRadius;
        const ty = cy + Math.sin(angle) * tagRadius;

        // Dark circle background
        const bg = new Graphics();
        const bgRadius = tagFontSize * 0.65;
        bg.circle(tx, ty, bgRadius);
        bg.fill({ color: 0x18181b, alpha: 0.9 });
        bg.circle(tx, ty, bgRadius);
        bg.stroke({ width: 1, color: 0x3f3f46, alpha: 0.7 });
        container.addChild(bg);

        const tag = new Text({
          text: emoji,
          style: {
            fontFamily: 'system-ui, sans-serif',
            fontSize: tagFontSize,
            fill: 0xffffff,
          },
        });
        tag.anchor.set(0.5);
        tag.x = tx;
        tag.y = ty;
        container.addChild(tag);
      });
    }

    // Combat turn cues (tied to the initiative tracker's state).
    // Acted this round → dim the token face + a "done" check badge. The active
    // combatant is never dimmed and instead gets a bright amber turn ring.
    if (style.acted && !style.active) {
      const scrim = new Graphics();
      scrim.circle(cx, cy, radius);
      scrim.fill({ color: 0x09090b, alpha: 0.55 });
      container.addChild(scrim);

      const bR = Math.max(7, size * 0.14);
      const bx = cx - radius * 0.68;
      const by = cy - radius * 0.68;
      const badge = new Graphics();
      badge.circle(bx, by, bR);
      badge.fill({ color: 0x18181b, alpha: 0.95 });
      badge.circle(bx, by, bR);
      badge.stroke({ width: 1.5, color: 0x71717a, alpha: 0.95 });
      container.addChild(badge);
      const check = new Text({
        text: '✓',
        style: {
          fontFamily: 'system-ui, sans-serif',
          fontSize: bR * 1.4,
          fill: 0xd4d4d8,
          fontWeight: 'bold',
        },
      });
      check.anchor.set(0.5);
      check.x = bx;
      check.y = by;
      container.addChild(check);
    }

    if (style.active) {
      const activeRing = new Graphics();
      activeRing.circle(cx, cy, radius + 4);
      activeRing.stroke({ width: 3, color: 0xfbbf24, alpha: 0.95 });
      activeRing.circle(cx, cy, radius + 7);
      activeRing.stroke({ width: 2, color: 0xfbbf24, alpha: 0.35 });
      container.addChild(activeRing);
    }

    container.x = entity.x * this.cellSize;
    container.y = entity.y * this.cellSize;
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
      conditionBadge,
      selected: style.selected,
      active: Boolean(style.active),
      acted: Boolean(style.acted),
    });
  }

  /** Load a portrait image and add it as a circular-masked Sprite inside the token container. */
  private loadPortraitSprite(
    container: Container,
    entityId: string,
    url: string,
    cx: number,
    cy: number,
    radius: number,
  ): void {
    const resolvedUrl = resolveApiBackedMediaUrl(url);
    const img = new Image();
    const crossOrigin = mediaElementCrossOrigin(resolvedUrl);
    if (crossOrigin) img.crossOrigin = crossOrigin;
    // Track immediately so an in-flight load can be cancelled on removal.
    this.portraitResources.set(entityId, { img, texture: null });
    img.onload = () => {
      // Guard: container may have been destroyed while loading
      if (container.destroyed) return;

      const texture = Texture.from(img);
      const tracked = this.portraitResources.get(entityId);
      if (tracked) tracked.texture = texture;
      const sprite = new Sprite(texture);

      // Scale to cover the circle (like CSS object-fit: cover)
      const diameter = radius * 2;
      const scale = Math.max(diameter / texture.width, diameter / texture.height);
      sprite.width = texture.width * scale;
      sprite.height = texture.height * scale;
      sprite.anchor.set(0.5);
      sprite.x = cx;
      sprite.y = cy;

      // Circular mask
      const mask = new Graphics();
      mask.circle(cx, cy, radius);
      mask.fill({ color: 0xffffff });
      container.addChild(mask);
      sprite.mask = mask;

      // Insert after rings (index 2) so it's below name/conditions but above rings
      container.addChildAt(sprite, 2);
    };
    img.src = resolvedUrl;
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

    if (!staminaChanged && !conditionsChanged && !selectionChanged && !sizeChanged && !nameChanged && !portraitChanged && !activeChanged && !actedChanged) {
      // Only position may have changed — sync from entity if not being dragged
      // (dragged tokens have their position updated by InteractionManager)
      if (existing.gridX !== entity.x || existing.gridY !== entity.y) {
        existing.gridX = entity.x;
        existing.gridY = entity.y;
        existing.container.x = entity.x * this.cellSize;
        existing.container.y = entity.y * this.cellSize;
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

  clear(): void {
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
      this.addChild(this.distanceLabel);
    }

    // Clear previous children
    this.distanceLabel.removeChildren();

    const text = new Text({
      text: labelText,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);

    // Background pill
    const pad = 6;
    const bg = new Graphics();
    bg.roundRect(
      -text.width / 2 - pad,
      -text.height / 2 - pad / 2,
      text.width + pad * 2,
      text.height + pad,
      4,
    );
    bg.fill({ color: 0x000000, alpha: 0.75 });

    this.distanceLabel.addChild(bg);
    this.distanceLabel.addChild(text);

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
      this.addChild(this.distanceLabel);
    }

    this.distanceLabel.removeChildren();

    const text = new Text({
      text: labelText,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        fill: 0xffffff,
        fontWeight: 'bold',
      },
    });
    text.anchor.set(0.5);

    const pad = 6;
    const bg = new Graphics();
    bg.roundRect(
      -text.width / 2 - pad,
      -text.height / 2 - pad / 2,
      text.width + pad * 2,
      text.height + pad,
      4,
    );
    bg.fill({ color: 0x000000, alpha: 0.75 });

    this.distanceLabel.addChild(bg);
    this.distanceLabel.addChild(text);

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
      this.addChild(this.selectionRect);
    }
    this.selectionRect.clear();
    this.selectionRect.rect(x, y, w, h);
    this.selectionRect.fill({ color: 0x3b82f6, alpha: 0.12 });
    this.selectionRect.rect(x, y, w, h);
    this.selectionRect.stroke({ width: 1, color: 0x3b82f6, alpha: 0.6 });
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
