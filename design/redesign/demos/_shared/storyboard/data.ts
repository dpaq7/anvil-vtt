// What each role may see. Everything a Player view draws goes through these helpers, so
// a fogged monster cannot reach the map, the tracker, the mini-map, a count or the log.
import { directorUnits, heroes, inView, logEntries, monsters, scene, type Hero, type Monster, type Unit } from '../battle';

export type Role = 'director' | 'player';
export type Size = 1440 | 1280;

export const isFogged = (m: { x: number; y: number; size: number }) =>
  scene.fogZones.some((f) => m.x >= f.x && m.y >= f.y && m.x + m.size <= f.x + f.w && m.y + m.size <= f.y + f.h);

export const fogged = monsters.filter(isFogged);
export const visibleMonsters = (role: Role) => (role === 'director' ? monsters : monsters.filter((m) => !isFogged(m)));
export const foesInView = (role: Role, top: number) => inView(top).filter((m) => role === 'director' || !isFogged(m));

const fold = (name: string, list: Unit[]): Unit => ({
  name, count: list.length, cur: list.reduce((s, u) => s + u.cur, 0), max: list.reduce((s, u) => s + u.max, 0),
  conditions: list.flatMap((u) => u.conditions), family: list[0].family,
});
const isHiddenUnit = (u: Unit) => fogged.some((m) => m.label === u.name);

// Units that act. Director's total is 14, a Player's is 14 less the hidden ones.
export const unitCount = (role: Role) => (role === 'director' ? directorUnits : directorUnits.filter((u) => !isHiddenUnit(u))).length;

export const directorRows: Unit[] = [
  directorUnits[0], directorUnits[1], fold('Scrappers, 3 squads', directorUnits.slice(2, 5)),
  fold('Angulotl, 5', directorUnits.slice(5, 10)), ...directorUnits.slice(10),
];

const seen = directorUnits.filter((u) => !isHiddenUnit(u));
const short = (n: string) => n.replace('Angulotl ', '');
export const playerRows = (size: Size): Unit[] => {
  const named = seen.map((u) => ({ ...u, name: short(u.name) }));
  if (size === 1440) return named;
  const squads = named.filter((u) => u.name.startsWith('Scrappers'));
  return [named[0], named[1], fold('Scrappers, 3 squads', squads), ...named.filter((u, i) => i > 1 && !u.name.startsWith('Scrappers'))];
};

// A hidden creature's name never reaches a Player's log: the app writes "Something".
const entries = [...logEntries,
  { time: '12:20 PM', text: 'Pip Underbough took 30 damage' },
  { time: '12:20 PM', text: 'Wren Halloway took 15 damage' },
  { time: '12:19 PM', text: 'Dovrin Ashgrove ended their turn' },
  { time: '12:19 PM', text: 'Heroes go first, rolled 7' },
];
export const logFor = (role: Role) => (role === 'director' ? entries
  : entries.map((e) => fogged.reduce((t, m) => ({ ...t, text: t.text.replace(m.label, 'Something') }), e)));

export const fullName = (m: Monster) => m.name;

// Geometry for one screen size. Rails keep their width and the map takes what is left.
export type Geo = {
  w: number; h: number; top: number; bar: number; status: number; gap: number; pad: number;
  cell: number; mapW: number; mapH: number; first: number; rows: number;
  hero: number; foe: number; boss: number; nav: number; row: number; dying: number; unit: number;
};
export function geoFor(size: Size, role: Role): Geo {
  const big = size === 1440;
  const [w, h] = big ? [1440, 900] : [1280, 720];
  const top = big ? 62 : 52, bar = big ? 46 : 42, status = big ? 26 : 24, gap = 8, pad = 12;
  const mapW = w - pad * 2 - 304 - 294 - gap * 2 - 6;
  const mapH = h - 12 - top - gap - status - gap - gap - bar - 6;
  const cell = mapW / 17;
  const rows = mapH / cell;
  // The Director opens on the fight. A Player opens with their own token and the party in view.
  const first = role === 'director' ? 22 - rows : (big ? 21.7 : 21.95) - rows;
  return {
    w, h, top, bar, status, gap, pad, cell, mapW, mapH, first, rows,
    hero: Math.round(cell), foe: Math.round(cell * 0.87), boss: Math.round(cell * 1.9),
    nav: big ? 112 : 84, row: big ? 48 : 40, dying: big ? 64 : 52, unit: big ? (role === 'player' ? 33 : 34) : role === 'player' ? 24 : 22,
  };
}

// The state that changes during a turn. A still uses the fixture; the motion demo drives it.
export type BattleState = {
  activeId: string | null;
  acted: string[];
  pos: Record<string, [number, number]>;
  cur: Record<string, number>;
  move: number;
};
export const fixtureState = (activeId: string | null, acted: string[]): BattleState => ({ activeId, acted, pos: {}, cur: {}, move: 6 });
export const curOf = (s: BattleState, e: Hero | Monster) => s.cur[e.id] ?? e.cur;
export const posOf = (s: BattleState, e: Hero | Monster): [number, number] => s.pos[e.id] ?? [e.x, e.y];
