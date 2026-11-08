import { conditionNames } from './conditions.js';

/*
 * Drawn token faces (DESIGN.md "Token face"; demos `battle-director`, `wizard`). Placeholder art
 * in the Storyboard's ink style: each head has its own silhouette and a 4-unit ink outline.
 *
 * One head per class. There are no heads per ancestry: ancestry does not change the face.
 * Fallbacks: a hero with no known class, and any NPC, gets `person`. A creature with no family
 * gets `boss` when it fills two or more squares, otherwise `foe`.
 *
 * Kept as strings, not React, because the Pixi map and the rails draw the same art.
 */
export type FaceKey =
  | 'beastheart' | 'censor' | 'conduit' | 'elementalist' | 'fury' | 'null' | 'shadow'
  | 'summoner' | 'tactician' | 'talent' | 'troubadour' | 'person'
  | 'rat' | 'ratcrobat' | 'frog' | 'piper' | 'boss' | 'foe';

const INK = '#15171c';
const L = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const L3 = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

function eyes(y: number, gap: number, out: boolean, color = INK): string {
  if (out) {
    return [32 - gap, 32 + gap]
      .map((x) => `<path stroke="${color}" stroke-width="3.6" stroke-linecap="round" fill="none" d="M${x - 3.6} ${y - 3.6}l7.2 7.2M${x + 3.6} ${y - 3.6}l-7.2 7.2"/>`)
      .join('');
  }
  return `<g fill="${color}"><circle cx="${32 - gap}" cy="${y}" r="3.2"/><circle cx="${32 + gap}" cy="${y}" r="3.2"/></g>`;
}

const ART: Record<FaceKey, (out: boolean) => string> = {
  beastheart: (o) => `<path ${L} fill="#9a6333" d="M12 32L7 4l19 11q6-2 12 0L57 4l-5 28q6 24-20 28Q6 56 12 32Z"/><circle ${L} cx="32" cy="37" r="14" fill="#f2c79a"/>${eyes(35, 6, o)}<path ${L3} fill="none" d="M27 44q5 3 10 0"/>`,
  tactician: (o) => `<path ${L} fill="#ffcf33" d="M24 16Q26-2 50 0q-10 6-10 16Z"/><path ${L} fill="#3b67d9" d="M9 42Q9 14 32 12q23 2 23 30v14Q32 66 9 56Z"/><rect ${L} x="17" y="30" width="30" height="13" rx="4" fill="#f2c79a"/>${eyes(36.5, 7, o)}<path ${L3} fill="none" d="M32 46v12"/>`,
  conduit: (o) => `<path ${L} fill="#e7b58c" d="M12 32Q12 8 32 8t20 24v8H12Z"/><path ${L} fill="#eef0ea" d="M5 28q3 8 11 9 8 1 16-3 8 4 16 3 8-1 11-9 4 16-3 26-7 8-14 7l-10 2-10-2q-7 1-14-7-7-10-3-26Z"/>${eyes(27, 8, o)}`,
  shadow: (o) => `<path ${L} fill="#7d4fc9" d="M32-1l20 26q8 22-4 35H16Q4 47 12 25Z"/><path ${L} fill="${INK}" d="M18 36q14-16 28 0 2 14-14 18-16-4-14-18Z"/>${o ? eyes(40, 8, true, '#fff') : '<path fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round" d="M23 37l7 2-7 3ZM41 37l-7 2 7 3Z"/>'}`,
  censor: (o) => `<path ${L} fill="#f4ecd8" d="M18 26Q2 22 4 0q8 14 24 15ZM46 26q16-4 14-26-8 14-24 15Z"/><circle ${L} cx="32" cy="36" r="23" fill="#d6372c"/><path stroke="${INK}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" fill="none" d="M18 28l9 4M46 28l-9 4M24 47h16"/>${eyes(36, 8, o)}`,
  elementalist: (o) => `<path ${L} fill="#f6d8bd" d="M18 34L-3 20l20 26ZM46 34l21-14-20 26Z"/><ellipse ${L} cx="32" cy="40" rx="17" ry="20" fill="#f6d8bd"/><path ${L} fill="#ff7a1a" d="M13 34q-3-18 8-17 0-13 11-18 2 10 11 11-1 7 8 8 3 8-1 16-11-11-19-7-10-4-18 7Z"/>${eyes(42, 7, o)}<path ${L3} fill="none" d="M28 52h8"/>`,
  troubadour: (o) => `<circle ${L} cx="32" cy="42" r="19" fill="${o ? '#c9cbc6' : '#c98a5e'}"/><path ${L} fill="#fff" d="M45 12Q57-4 66 3q-6 8-16 17Z"/><path ${L} fill="#d93f9b" d="M1 31Q32 16 63 31q-8 4-15 1Q48 6 30 6 18 8 17 32 9 35 1 31Z"/>${eyes(43, 7, o)}${o ? `<path ${L3} fill="#ff7a7a" d="M27 54q5-5 10 0-5 7-10 0Z"/>` : `<path ${L3} fill="none" d="M27 52q5 3 10 0"/>`}`,
  fury: (o) => `<path ${L} fill="#d6372c" d="M10 30L2 8l14 8L20-2l10 12L38-2l6 14 14-6-6 22Z"/><circle ${L} cx="32" cy="38" r="20" fill="#e7b58c"/><path stroke="${INK}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round" fill="none" d="M20 30l9 4M44 30l-9 4M25 49q7-5 14 0"/>${eyes(38, 8, o)}`,
  null: (o) => `<ellipse ${L} cx="32" cy="34" rx="21" ry="25" fill="#c9b6a0"/><circle cx="32" cy="18" r="3.5" fill="#2b6fe6" stroke="${INK}" stroke-width="2"/>${o ? eyes(33, 8, true) : `<path stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" fill="none" d="M20 34q5 3 9 0M35 34q5 3 9 0"/>`}<path stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none" d="M27 47h10"/>`,
  talent: (o) => `<path ${L} fill="#1f9d8a" d="M32 0Q60 6 58 40q-2 20-26 22Q6 60 6 40 4 6 32 0Z"/><circle ${L} cx="32" cy="38" r="15" fill="#f2c79a"/><path ${L3} fill="#ffd21f" d="M32 12l4 6-4 6-4-6Z"/>${eyes(37, 6, o)}<path ${L3} fill="none" d="M28 45h8"/>`,
  summoner: (o) => `<path ${L} fill="#3d4a7a" d="M32 2l22 24q6 24-6 34H16Q4 50 10 26Z"/><circle ${L} cx="32" cy="38" r="13" fill="#f6d8bd"/>${eyes(37, 5.5, o)}<circle ${L3} cx="56" cy="8" r="6" fill="#9db4ff"/>`,
  // Fallback, drawn for this wave in the same style: a plain round head with short hair.
  person: (o) => `<circle ${L} cx="32" cy="36" r="24" fill="#e7b58c"/><path ${L} fill="#5a4a3a" d="M9 32Q10 10 32 10t23 22q-10-9-23-9T9 32Z"/>${eyes(38, 8, o)}<path ${L3} fill="none" d="M26 49q6 3 12 0"/>`,
  rat: (o) => rat('#a39b90', o),
  ratcrobat: (o) => rat('#f28c28', o),
  frog: (o) => `<circle ${L} cx="17" cy="19" r="13" fill="#3fae72"/><circle ${L} cx="47" cy="19" r="13" fill="#3fae72"/><path ${L} fill="#3fae72" d="M3 40q0-16 29-16t29 16q0 20-29 20T3 40Z"/>${o ? eyes(19, 15, true) : `<circle cx="17" cy="19" r="4" fill="${INK}"/><circle cx="47" cy="19" r="4" fill="${INK}"/>`}<path ${L} fill="none" d="M13 44q19 11 38 0"/>`,
  piper: (o) => `<circle ${L} cx="15" cy="23" r="10" fill="#c7b199"/><circle ${L} cx="49" cy="23" r="10" fill="#c7b199"/><path ${L} fill="#c7b199" d="M10 38q0-18 22-18t22 18Q49 54 32 62 15 54 10 38Z"/><path ${L} fill="#ffcf33" d="M16 22L14 4l10 8 8-11 8 11 10-8-2 18Q32 16 16 22Z"/><path ${L} fill="${INK}" d="M28 52h8l-4 5Z"/>${eyes(38, 9, o)}`,
  boss: (o) => `<path ${L} fill="#6d4bb5" d="M32-2l8 12 14-6-2 16 13 6-11 10 8 13-15 1-5 14-10-10-10 10-5-14-15-1 8-13L-1 26l13-6-2-16 14 6Z"/><path ${L3} fill="none" d="M20 42q12 8 24 0"/>${eyes(30, 9, o)}`,
  // Fallback, drawn for this wave: an eight-sided scowl, because creatures read by shape.
  foe: (o) => `<polygon ${L} fill="#8d8a80" points="20,4 44,4 60,20 60,44 44,60 20,60 4,44 4,20"/><path stroke="${INK}" stroke-width="3.4" stroke-linecap="round" fill="none" d="M16 24l10 5M48 24l-10 5M23 47q9-5 18 0"/>${eyes(33, 9, o)}`,
};

function rat(fill: string, o: boolean): string {
  return `<circle ${L} cx="15" cy="17" r="12" fill="${fill}"/><circle ${L} cx="49" cy="17" r="12" fill="${fill}"/><path ${L} fill="${fill}" d="M9 34q0-20 23-20t23 20Q50 52 32 62 14 52 9 34Z"/><path ${L} fill="${INK}" d="M28 50h8l-4 5Z"/>${eyes(34, 9, o)}`;
}

const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const faceCache = new Map<string, string>();

/** The face as an image URL. Holds art only: no name reaches the DOM through it. */
export function faceUrl(key: FaceKey, out = false, pixels = 128): string {
  const id = `${key}:${out}:${pixels}`;
  let url = faceCache.get(id);
  if (!url) {
    url = svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="-7 -7 78 78">${ART[key](out)}</svg>`);
    faceCache.set(id, url);
  }
  return url;
}

const CLASS_HEADS = new Set<string>(['beastheart', 'censor', 'conduit', 'elementalist', 'fury', 'null', 'shadow', 'summoner', 'tactician', 'talent', 'troubadour']);

type EntityLike = Record<string, unknown> & { name: string; type: string };

export function faceKeyFor(entity: EntityLike): FaceKey {
  if (entity.type === 'hero') {
    const heroClass = typeof entity['heroClass'] === 'string' ? entity['heroClass'].toLowerCase() : '';
    return CLASS_HEADS.has(heroClass) ? (heroClass as FaceKey) : 'person';
  }
  if (entity.type === 'npc') return 'person';
  const kind = `${typeof entity['monsterName'] === 'string' ? entity['monsterName'] : ''} ${entity.name}`.toLowerCase();
  if (kind.includes('radenwight')) {
    if (kind.includes('piper')) return 'piper';
    return kind.includes('ratcrobat') ? 'ratcrobat' : 'rat';
  }
  if (kind.includes('angulotl')) return 'frog';
  const size = Number(entity['size']);
  return Number.isFinite(size) && size >= 2 ? 'boss' : 'foe';
}

export const entityPortrait = (entity: Record<string, unknown>): string | null =>
  typeof entity['portraitUrl'] === 'string' && entity['portraitUrl'] ? entity['portraitUrl'] : null;

/** Side reads by shape: heroes and NPCs are round, creatures eight-sided. */
export const isRoundToken = (entity: { type: string }) => entity.type !== 'monster';

export const OCTAGON_POINTS: ReadonlyArray<readonly [number, number]> = [
  [20, 2], [44, 2], [62, 20], [62, 44], [44, 62], [20, 62], [2, 44], [2, 20],
];

/** Stamina state. Only heroes are dying: a Player never reads a creature's stamina. */
export function staminaState(entity: Record<string, unknown>, type: string): 'dying' | 'winded' | 'healthy' {
  const max = typeof entity['maxStamina'] === 'number' ? entity['maxStamina'] : 0;
  const cur = typeof entity['currentStamina'] === 'number' ? entity['currentStamina'] : max;
  if (max <= 0) return 'healthy';
  if (cur <= 0 && type === 'hero') return 'dying';
  return cur <= max / 2 ? 'winded' : 'healthy';
}

export const firstName = (name: string) => cleanName(name).split(/\s+/)[0] ?? name;
/** The seed hero carries a timestamp in its name. Drop it for display. */
export const cleanName = (name: string) => name.trim().replace(/\s+\d{6,}$/, '');
/** Tracker rows cut a long creature name at the comma (DESIGN.md rule 11). */
export const shortName = (name: string) => cleanName(name).split(',')[0] ?? name;
export const conditionLine = (entity: Record<string, unknown>) =>
  conditionNames(entity).map((c) => c.charAt(0).toUpperCase() + c.slice(1));

export const staminaOf = (entity: Record<string, unknown>) => {
  const max = typeof entity['maxStamina'] === 'number' ? entity['maxStamina'] : 0;
  const cur = typeof entity['currentStamina'] === 'number' ? entity['currentStamina'] : max;
  return { cur, max };
};

export const heroClassName = (hero: Record<string, unknown>) => {
  const heroClass = hero['heroClass'];
  return typeof heroClass === 'string' && heroClass ? heroClass.charAt(0).toUpperCase() + heroClass.slice(1) : 'Hero';
};
