import { Container, Graphics, Text } from 'pixi.js';
import type { Quadtree } from '../systems/Quadtree.js';
import type { EntityData } from '../../types/protocol.js';

export interface TokenStyle {
  size: number; // grid cells (1, 2, or 3)
  color: number;
  selected: boolean;
}

interface TokenSprite {
  container: Container;
  entityId: string;
  gridX: number;
  gridY: number;
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

    // Color ring
    const ring = new Graphics();
    ring.circle(size / 2, size / 2, radius);
    ring.fill({ color: style.color, alpha: 0.3 });
    ring.circle(size / 2, size / 2, radius);
    ring.stroke({ width: 2, color: style.color });
    container.addChild(ring);

    // Initials
    const label = new Text({
      text: entity.name.slice(0, 2).toUpperCase(),
      style: {
        fontFamily: 'monospace',
        fontSize: Math.max(12, size * 0.3),
        fill: 0xffffff,
      },
    });
    label.anchor.set(0.5);
    label.x = size / 2;
    label.y = size / 2;
    container.addChild(label);

    // Selection highlight
    if (style.selected) {
      const sel = new Graphics();
      sel.circle(size / 2, size / 2, radius + 3);
      sel.stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      container.addChild(sel);
    }

    // HP arc (if entity has stamina data)
    const maxStamina = typeof entity['maxStamina'] === 'number' ? entity['maxStamina'] as number : 0;
    const currentStamina = typeof entity['currentStamina'] === 'number' ? entity['currentStamina'] as number : maxStamina;
    if (maxStamina > 0) {
      const pct = Math.max(0, Math.min(1, currentStamina / maxStamina));
      const arc = new Graphics();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + Math.PI * 2 * pct;
      arc.arc(size / 2, size / 2, radius + 1, startAngle, endAngle);
      arc.stroke({ width: 3, color: pct > 0.5 ? 0x22c55e : 0xf59e0b });
      container.addChild(arc);
    }

    container.x = entity.x * this.cellSize;
    container.y = entity.y * this.cellSize;
    container.eventMode = 'static';
    container.cursor = 'pointer';

    this.addChild(container);
    this.tokens.set(entity.id, {
      container,
      entityId: entity.id,
      gridX: entity.x,
      gridY: entity.y,
    });
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
