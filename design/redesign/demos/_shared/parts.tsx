import {
  ArrowDownToLine, ArrowDown, Droplet, Ghost, Grab, Link2, Megaphone, Orbit, Snail,
  Feather, Flag, Flame, Moon, Music, PawPrint, Scale, type LucideIcon,
} from 'lucide-react';
import { heroes, monsters, scene, spline, terrain } from './battle';

export const conditionIcon: Record<string, LucideIcon> = {
  dazed: Orbit, bleeding: Droplet, weakened: ArrowDown, frightened: Ghost, slowed: Snail,
  prone: ArrowDownToLine, taunted: Megaphone, grabbed: Grab, restrained: Link2,
};
export const classIcon: Record<string, LucideIcon> = {
  Beastheart: PawPrint, Tactician: Flag, Conduit: Feather, Shadow: Moon,
  Censor: Scale, Elementalist: Flame, Troubadour: Music,
};

// The whole map at a glance, with the current view marked. "Show all" lives beside it,
// so the way out of a zoomed view is always on screen. Audit problem 1.
export function MiniMap({ width, top, rows, c, label }: {
  width: number; top: number; rows: number; label?: string;
  c: { ground: string; water: string; trail: string; hero: string; foe: string; fog: string; view: string };
}) {
  const k = width / scene.gridCols;
  const h = k * scene.gridRows;
  const fog = scene.fogZones[0];
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} overflow="hidden" role="img" aria-label={label ?? 'Whole map, current view marked'} style={{ display: 'block' }}>
      <rect width={width} height={h} fill={c.ground} />
      <path d={spline(terrain.pond, k)} fill={c.water} />
      <path d={spline(terrain.pool, k)} fill={c.water} />
      <path d={spline(terrain.trail.map(([x, y]) => [x, Math.min(y, scene.gridRows)] as [number, number]), k, false)} fill="none" stroke={c.trail} strokeWidth={k * 0.7} />
      <rect x={fog.x * k} y={fog.y * k} width={fog.w * k} height={fog.h * k} fill={c.fog} />
      {monsters.map((m) => <rect key={m.id} x={m.x * k} y={m.y * k} width={k * m.size} height={k * m.size} fill={c.foe} />)}
      {heroes.map((m) => <circle key={m.id} cx={(m.x + 0.5) * k} cy={(m.y + 0.5) * k} r={k * 0.55} fill={c.hero} />)}
      <rect x={1} y={top * k} width={width - 2} height={Math.min(rows * k, h - top * k) - 1} fill="none" stroke={c.view} strokeWidth={2} />
    </svg>
  );
}

