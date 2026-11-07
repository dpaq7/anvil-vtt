// Shared data and geometry for the Gate 1 direction stills. Everything here comes
// from fixtures/battle-dense.json or from the audit captures; nothing is invented
// except the placeholder terrain, which is drawn in code.
import raw from '../../fixtures/battle-dense.json';

export type Ent = {
  id: string; name: string; type: string; x: number; y: number; size: number;
  level: number; cur: number; max: number; conditions: string[];
};
export type Hero = Ent & {
  label: string; first: string; mono: string; state: 'healthy' | 'winded' | 'dying';
  heroClass: string; ancestry: string; resourceName: string; resource: number;
  recoveries: number; recoveriesMax: number; speed: number; active: boolean; acted: boolean;
};
export type Monster = Ent & { label: string; tiny: string; family: 'rat' | 'frog' | 'boss' | 'cicero' };

const any = raw as unknown as {
  scene: typeof raw.scene; combat: typeof raw.combat; turnActions: typeof raw.turnActions;
  entities: Array<Record<string, any>>;
};
const base = (e: Record<string, any>): Ent => ({
  id: e.id, name: e.name, type: e.type, x: e.x, y: e.y, size: e.size ?? 1, level: e.level,
  cur: e.stamina.current, max: e.stamina.max, conditions: e.conditions,
});
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const scene = any.scene;
export const combat = any.combat;
export const conditionName = cap;

export const heroes: Hero[] = combat.heroEntities.map((id) => {
  const e = any.entities.find((n) => n.id === id)!;
  // The seed hero carries a timestamp in its name in the fixture. Drop it for display.
  const label = (e.name as string).replace(/\s+\d{6,}$/, '');
  const [a, b] = label.split(' ');
  return {
    ...base(e), label, first: a, mono: (a[0] + b[0]).toUpperCase(), state: e.state,
    heroClass: cap(e.heroClass), ancestry: cap(e.ancestry), resourceName: e.heroicResourceName,
    resource: e.heroicResource, recoveries: e.recoveriesCurrent, recoveriesMax: e.recoveriesMax,
    speed: e.speed, active: id === combat.activeEntityId, acted: combat.actedThisRound.includes(id),
  };
});

export const monsters: Monster[] = combat.villainEntities.map((id) => {
  const e = any.entities.find((n) => n.id === id)!;
  const name = e.name as string;
  const num = name.match(/(\d+)$/)?.[1];
  const label = name.startsWith('Radenwight') ? name.replace('Radenwight ', '')
    : name.startsWith('Aeolyxria') ? 'Aeolyxria the Uncanny' : name;
  const family = name === 'Cicero' ? 'cicero' : name.startsWith('Radenwight') ? 'rat'
    : name.startsWith('Angulotl') ? 'frog' : 'boss';
  const tiny = num ?? (name.startsWith('Angulotl') ? name.split(' ')[1].slice(0, 2) : name.slice(0, 2));
  return { ...base(e), label, tiny, family };
});

export const hero = (first: string) => heroes.find((h) => h.first === first)!;
export const activeHero = heroes.find((h) => h.active)!;
export const dyingHero = heroes.find((h) => h.state === 'dying')!;
export const turn = (raw.turnActions as Record<string, { moveRemaining: number }>)[activeHero.id];

// The Director's 14 acting units: the audit's "0/14" is Cicero, one Ratcrobat squad,
// three Scrapper squads of four, five Angulotl and four solo creatures.
export type Unit = { name: string; note?: string; cur: number; max: number; count?: number; conditions: string[]; family: Monster['family'] };
const pick = (f: (m: Monster) => boolean) => monsters.filter(f);
const squad = (name: string, list: Monster[]): Unit => ({
  name, count: list.length, cur: list.reduce((s, m) => s + m.cur, 0), max: list.reduce((s, m) => s + m.max, 0),
  conditions: list.flatMap((m) => m.conditions), family: list[0].family,
});
const scrappers = pick((m) => m.label.startsWith('Scrapper'));
const solo = (m: Monster): Unit => ({ name: m.label, cur: m.cur, max: m.max, conditions: m.conditions, family: m.family });
export const directorUnits: Unit[] = [
  solo(monsters[0]),
  squad('Ratcrobats', pick((m) => m.label.startsWith('Ratcrobat'))),
  squad('Scrappers 1 to 4', scrappers.slice(0, 4)),
  squad('Scrappers 5 to 8', scrappers.slice(4, 8)),
  squad('Scrappers 9 to 12', scrappers.slice(8, 12)),
  ...pick((m) => m.family === 'frog').map(solo),
  ...pick((m) => m.family === 'boss').map(solo),
];

// Newest first. These are the audit's Log entries, in the fixture's conditions.
export const logEntries = [
  { time: '12:22 PM', text: 'Weakened applied to Wren Halloway' },
  { time: '12:22 PM', text: 'Grabbed applied to Angulotl Slink' },
  { time: '12:22 PM', text: 'Taunted applied to Angulotl Hopper' },
  { time: '12:22 PM', text: 'Restrained applied to Arixx' },
  { time: '12:22 PM', text: 'Weakened applied to Ajax the Invincible' },
  { time: '12:21 PM', text: 'Prone applied to Cicero' },
  { time: '12:21 PM', text: 'Slowed applied to Ysolde Fennimore' },
  { time: '12:21 PM', text: 'Frightened applied to Torvald Brightmantle' },
  { time: '12:21 PM', text: 'Bleeding applied to Wren Halloway' },
  { time: '12:21 PM', text: 'Dazed applied to Ilsabet Corvane' },
];

export const scenes = [
  { name: 'Smoke Story Beat', mode: 'Story', key: 'story' },
  { name: 'A Chase Through a Trap Riddled Swamp', short: 'A Chase Through…', mode: 'Montage', key: 'montage' },
  { name: 'Negotiation with a Thief', mode: 'Negotiation', key: 'negotiation' },
  { name: scene.name, mode: 'Battle', key: 'battle', active: true },
  { name: 'Smoke Respite', mode: 'Respite', key: 'respite' },
] as const;

export const tools = ['Pan', 'Select', 'Draw', 'Fog', 'Terrain', 'Eraser', 'Measure'];
export const leftTabs = [{ l: 'Combat' }, { l: 'Heroes', n: 7 }, { l: 'Creatures', n: 25 }, { l: 'Log', n: 24 }];
export const rightTabs = ['Audio', 'Damage', 'Grid', 'Assets'];
export const offView = (top: number) => monsters.filter((m) => m.y + m.size <= top);
export const inView = (top: number) => monsters.filter((m) => m.y + m.size > top);

// ---- The label rule -------------------------------------------------------
// Labels are a fixed size at every zoom. Each token tries its slots in order; a
// slot that hits a token, the frame or a label already placed is refused. Priority
// decides who is placed first. A token with no free slot falls back to the
// direction's short form, so text never overprints.
export type Rect = { x: number; y: number; w: number; h: number };
export type Slot = 'below' | 'above' | 'right' | 'left';
export type LabelIn = { id: string; cx: number; cy: number; r: number; w: number; h?: number; priority: number; prefer?: Slot[] };
export type LabelOut = Rect & { slot: Slot };
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function placeLabels(items: LabelIn[], blockers: Rect[], bounds: Rect, gap = 2): Record<string, LabelOut | null> {
  const out: Record<string, LabelOut | null> = {};
  const taken: Rect[] = [...blockers];
  for (const it of [...items].sort((a, b) => b.priority - a.priority)) {
    const h = it.h ?? 20;
    const slots: LabelOut[] = [
      { slot: 'below', x: it.cx - it.w / 2, y: it.cy + it.r + gap, w: it.w, h },
      { slot: 'above', x: it.cx - it.w / 2, y: it.cy - it.r - gap - h, w: it.w, h },
      { slot: 'right', x: it.cx + it.r + gap + 2, y: it.cy - h / 2, w: it.w, h },
      { slot: 'left', x: it.cx - it.r - gap - 2 - it.w, y: it.cy - h / 2, w: it.w, h },
    ];
    // A token never blocks its own label.
    const isSelf = (t: Rect) => t.w <= 100 && t.x <= it.cx && it.cx <= t.x + t.w && t.y <= it.cy && it.cy <= t.y + t.h;
    if (it.prefer) slots.sort((a, b) => (it.prefer!.indexOf(a.slot) + 9) % 9 - (it.prefer!.indexOf(b.slot) + 9) % 9);
    const free = slots.find((s) =>
      s.x >= bounds.x && s.y >= bounds.y && s.x + s.w <= bounds.x + bounds.w && s.y + s.h <= bounds.y + bounds.h &&
      !taken.some((t) => !isSelf(t) && hit(s, t)));
    out[it.id] = free ?? null;
    if (free) taken.push(free);
  }
  return out;
}

// ---- Placeholder terrain, in grid cells. Drawn differently by each direction. ----
type P = [number, number];
export const terrain = {
  pond: [[5.2, 2.2], [8, 0.9], [11.6, 1.4], [13.2, 3.6], [12.4, 6.2], [10.2, 7.1], [9, 8], [6.6, 7.4], [4.6, 5.2]] as P[],
  pool: [[13.6, 9.6], [15.2, 8.8], [16.4, 9.6], [16.6, 11.2], [15.2, 11.8], [13.9, 11]] as P[],
  bog: [[0.6, 11.4], [2.2, 10.9], [3.4, 11.9], [2.9, 13.6], [1.2, 13.8], [0.2, 12.8]] as P[],
  trail: [[8.2, 7.6], [8.8, 9.4], [8, 11.2], [8.6, 13], [7.7, 14.8], [8.7, 16.6], [8.1, 18.4], [7.2, 20], [7.8, 22.4]] as P[],
  meadows: [
    [[9.8, 9.8], [12.2, 9.4], [13.2, 11.2], [12.6, 13.6], [10.6, 14.2], [9.6, 12.2]],
    [[10.4, 16.4], [13.4, 15.6], [15.8, 16.6], [15.6, 19.2], [13, 20.6], [10.8, 19.6]],
    [[1.6, 14.6], [3.8, 14.4], [6.4, 15], [6.6, 17.6], [4, 18.2], [1.4, 17.2]],
  ] as P[][],
  rocks: [
    [[2.3, 14.9], [2.9, 14.4], [3.6, 14.6], [3.8, 15.2], [3.2, 15.7], [2.6, 15.5]],
    [[6.8, 11.5], [7.2, 11], [7.8, 11.3], [7.8, 11.9], [7.2, 12.2]],
    [[11.3, 20.8], [11.9, 20.3], [12.6, 20.5], [12.7, 21.1], [12, 21.5]],
    [[14, 13.4], [14.4, 13], [14.9, 13.2], [14.9, 13.8], [14.3, 14]],
  ] as P[][],
  trees: [
    [0.7, 8.4, 0.8], [2.2, 8.8, 0.6], [4.8, 9.2, 0.7], [6, 10.6, 0.55], [12, 8.2, 0.5], [15.9, 7.7, 0.8],
    [16.3, 13.4, 0.7], [11.6, 15.1, 0.5], [0.6, 15.3, 0.65], [0.7, 20.2, 0.9], [2.1, 21.2, 0.7],
    [3.2, 19.1, 0.5], [13.6, 18.2, 0.45], [15.7, 20.7, 0.95], [14, 21.4, 0.65], [10.4, 21.5, 0.55],
    [16.4, 17.6, 0.6], [6.6, 12.9, 0.5], [3.6, 12.2, 0.45], [11, 11.3, 0.45],
  ] as [number, number, number][],
};

// Closed or open Catmull-Rom spline through grid points, as an SVG path in pixels.
export function spline(pts: P[], cell: number, closed = true, scale = 1): string {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const q = pts.map(([x, y]) => [(cx + (x - cx) * scale) * cell, (cy + (y - cy) * scale) * cell]);
  const n = q.length;
  const at = (i: number) => (closed ? q[(i + n) % n] : q[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${q[0][0].toFixed(1)} ${q[0][1].toFixed(1)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}
export const poly = (pts: P[], cell: number) => 'M' + pts.map(([x, y]) => `${x * cell} ${y * cell}`).join('L') + 'Z';
