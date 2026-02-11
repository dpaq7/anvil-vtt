import { Container, Graphics, Text } from 'pixi.js';
import type { Quadtree } from '../systems/Quadtree.js';
import type { EntityData } from '../../types/protocol.js';

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
  size: number; // grid cells (1, 2, or 3)
  color: number;
  selected: boolean;
}

interface TokenSprite {
  container: Container;
  entityId: string;
  entity: EntityData;
  gridX: number;
  gridY: number;
  conditionBadge: Text | null;
  selected: boolean;
}

export class TokenLayer extends Container {
  private tokens = new Map<string, TokenSprite>();
  private cellSize = 64;

  setCellSize(size: number): void {
    this.cellSize = size;
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

    // Center glyph
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

    // Name label below token
    const nameLabel = new Text({
      text: entity.name.length > 10 ? entity.name.slice(0, 9) + '\u2026' : entity.name,
      style: {
        fontFamily: 'system-ui, sans-serif',
        fontSize: Math.max(8, size * 0.18),
        fill: 0xcccccc,
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
    }

    // Condition emoji badge — top-right of token
    const conditions = Array.isArray(entity['conditions'])
      ? (entity['conditions'] as string[])
      : [];
    let conditionBadge: Text | null = null;
    if (conditions.length > 0) {
      const emojis = conditions
        .slice(0, 3)
        .map((c) => CONDITION_EMOJI[c] ?? '')
        .filter(Boolean)
        .join('');
      if (emojis) {
        conditionBadge = new Text({
          text: emojis,
          style: {
            fontFamily: 'system-ui, sans-serif',
            fontSize: Math.max(8, size * 0.2),
            fill: 0xffffff,
          },
        });
        conditionBadge.anchor.set(0, 0);
        conditionBadge.x = cx + radius * 0.4;
        conditionBadge.y = cy - radius - 2;
        container.addChild(conditionBadge);
      }
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
      conditionBadge,
      selected: style.selected,
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
    const nameChanged = oldEntity.name !== entity.name;

    if (!staminaChanged && !conditionsChanged && !selectionChanged && !nameChanged) {
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

  removeToken(entityId: string): void {
    const token = this.tokens.get(entityId);
    if (token) {
      this.removeChild(token.container);
      token.container.destroy({ children: true });
      this.tokens.delete(entityId);
    }
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
      if (token.gridX === gridX && token.gridY === gridY) return id;
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
          width: this.cellSize,
          height: this.cellSize,
        },
        data: id,
      });
    }
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
      token.container.visible = tx >= left && tx <= right && ty >= top && ty <= bottom;
    }
  }
}
