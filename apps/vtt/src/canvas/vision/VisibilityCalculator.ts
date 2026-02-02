/**
 * Client-side fog of war using raycasting visibility.
 * Computes a visibility polygon from a point given wall segments.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Segment {
  a: Point;
  b: Point;
}

interface Ray {
  origin: Point;
  angle: number;
}

interface Intersection {
  point: Point;
  distance: number;
  angle: number;
}

/**
 * Compute visibility polygon from an origin given wall segments.
 * Returns polygon vertices sorted by angle.
 */
export function computeVisibility(
  origin: Point,
  walls: Segment[],
  mapBounds: { width: number; height: number },
): Point[] {
  // Add map boundary walls
  const allWalls: Segment[] = [
    ...walls,
    { a: { x: 0, y: 0 }, b: { x: mapBounds.width, y: 0 } },
    { a: { x: mapBounds.width, y: 0 }, b: { x: mapBounds.width, y: mapBounds.height } },
    { a: { x: mapBounds.width, y: mapBounds.height }, b: { x: 0, y: mapBounds.height } },
    { a: { x: 0, y: mapBounds.height }, b: { x: 0, y: 0 } },
  ];

  // Collect unique angles from all wall endpoints
  const angles: number[] = [];
  for (const wall of allWalls) {
    for (const point of [wall.a, wall.b]) {
      const angle = Math.atan2(point.y - origin.y, point.x - origin.x);
      // Cast 3 rays per endpoint: direct + slight offsets
      angles.push(angle - 0.0001, angle, angle + 0.0001);
    }
  }

  // Sort angles
  angles.sort((a, b) => a - b);

  // Cast rays and find closest intersections
  const points: Intersection[] = [];
  for (const angle of angles) {
    const ray: Ray = { origin, angle };
    let closest: Intersection | null = null;

    for (const wall of allWalls) {
      const hit = raySegmentIntersect(ray, wall);
      if (hit && (!closest || hit.distance < closest.distance)) {
        closest = hit;
      }
    }

    if (closest) {
      points.push({ ...closest, angle });
    }
  }

  // Sort by angle and return polygon
  points.sort((a, b) => a.angle - b.angle);
  return points.map((p) => p.point);
}

function raySegmentIntersect(ray: Ray, seg: Segment): Intersection | null {
  const dx = Math.cos(ray.angle);
  const dy = Math.sin(ray.angle);

  const sx = seg.b.x - seg.a.x;
  const sy = seg.b.y - seg.a.y;

  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-10) return null;

  const t2 = (dx * (seg.a.y - ray.origin.y) - dy * (seg.a.x - ray.origin.x)) / denom;
  const t1 = Math.abs(dx) > 1e-10
    ? (seg.a.x + sx * t2 - ray.origin.x) / dx
    : (seg.a.y + sy * t2 - ray.origin.y) / dy;

  if (t1 < 0 || t2 < 0 || t2 > 1) return null;

  return {
    point: {
      x: ray.origin.x + dx * t1,
      y: ray.origin.y + dy * t1,
    },
    distance: t1,
    angle: ray.angle,
  };
}
