export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface QuadtreeItem<T = unknown> {
  bounds: Rect;
  data: T;
}

const MAX_ITEMS = 8;
const MAX_DEPTH = 6;

export class Quadtree<T = unknown> {
  private items: QuadtreeItem<T>[] = [];
  private children: Quadtree<T>[] | null = null;

  constructor(
    private bounds: Rect,
    private depth = 0,
  ) {}

  clear(): void {
    this.items = [];
    if (this.children) {
      for (const child of this.children) child.clear();
      this.children = null;
    }
  }

  insert(item: QuadtreeItem<T>): void {
    if (this.children) {
      const idx = this.getIndex(item.bounds);
      if (idx !== -1) {
        this.children[idx]!.insert(item);
        return;
      }
    }

    this.items.push(item);

    if (this.items.length > MAX_ITEMS && this.depth < MAX_DEPTH && !this.children) {
      this.subdivide();
      const remaining: QuadtreeItem<T>[] = [];
      for (const it of this.items) {
        const idx = this.getIndex(it.bounds);
        if (idx !== -1) {
          this.children![idx]!.insert(it);
        } else {
          remaining.push(it);
        }
      }
      this.items = remaining;
    }
  }

  query(area: Rect): QuadtreeItem<T>[] {
    const found: QuadtreeItem<T>[] = [];
    if (!this.intersects(this.bounds, area)) return found;

    for (const item of this.items) {
      if (this.intersects(item.bounds, area)) {
        found.push(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        found.push(...child.query(area));
      }
    }

    return found;
  }

  /** Find all items at a point */
  queryPoint(x: number, y: number): QuadtreeItem<T>[] {
    return this.query({ x, y, width: 1, height: 1 });
  }

  private subdivide(): void {
    const { x, y, width, height } = this.bounds;
    const hw = width / 2;
    const hh = height / 2;
    const d = this.depth + 1;
    this.children = [
      new Quadtree<T>({ x: x + hw, y, width: hw, height: hh }, d),      // NE
      new Quadtree<T>({ x, y, width: hw, height: hh }, d),               // NW
      new Quadtree<T>({ x, y: y + hh, width: hw, height: hh }, d),       // SW
      new Quadtree<T>({ x: x + hw, y: y + hh, width: hw, height: hh }, d), // SE
    ];
  }

  private getIndex(rect: Rect): number {
    const midX = this.bounds.x + this.bounds.width / 2;
    const midY = this.bounds.y + this.bounds.height / 2;

    const top = rect.y + rect.height <= midY;
    const bottom = rect.y >= midY;
    const left = rect.x + rect.width <= midX;
    const right = rect.x >= midX;

    if (top && right) return 0;
    if (top && left) return 1;
    if (bottom && left) return 2;
    if (bottom && right) return 3;
    return -1;
  }

  private intersects(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
