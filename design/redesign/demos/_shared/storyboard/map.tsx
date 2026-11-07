import { useMemo, type ReactNode } from 'react';
import { Check, EyeOff, Minus, Plus, Scan } from 'lucide-react';
import { combat, dyingHero, heroes, monsters, offView, placeLabels, scene, spline, terrain, type Hero, type Monster, type Slot } from '../battle';
import { conditionIcon } from '../parts';
import { curOf, foesInView, isFogged, posOf, unitCount, visibleMonsters, type BattleState, type Geo, type Role } from './data';
import { FoeFace, HeroFace } from './faces';
import { Portrait } from './portraits';

const INK = '#15171c';

// Which tokens use uploaded art in this fixture. The rest use drawn heads.
export const uploaded = { hero: 'Torvald', foe: 'Cicero' };
export function HeroMark({ h, out, size }: { h: Hero; out?: boolean; size: number }) {
  return h.first === uploaded.hero ? <Portrait who="hero" size={size} /> : <HeroFace who={h.first} out={out} size={size} />;
}
export function FoeMark({ family, rank, size }: { family: Monster['family']; rank?: 'ratcrobat'; size: number }) {
  return family === 'cicero' ? <Portrait who="foe" size={size} /> : <FoeFace family={family} rank={rank} size={size} />;
}

function InkMap({ g, role }: { g: Geo; role: Role }) {
  const t = terrain;
  const c = g.cell;
  const k = c / 46;
  const s = { stroke: INK, strokeWidth: 3 * k + 0.4, strokeLinejoin: 'round' as const };
  const y0 = g.first * c;
  return (
    <svg className="sb-art" width={g.mapW} height={g.mapH} viewBox={`0 0 ${g.mapW} ${g.mapH}`} aria-hidden>
      <defs>
        <pattern id={`sb-fog-${role}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill="#2a2e38" fillOpacity=".42" /><path d="M0 6h12" stroke={INK} strokeWidth="3" />
        </pattern>
      </defs>
      <rect width={g.mapW} height={g.mapH} fill="#a9c56c" />
      <g transform={`translate(0 ${-y0})`}>
        {t.meadows.map((m, i) => <path key={i} d={spline(m, c)} fill="#c2d98a" />)}
        {[t.pond, t.pool, t.bog].map((b, i) => (
          <g key={i}><path d={spline(b, c)} fill="#67c1d3" {...s} /><path d={spline(b, c, true, 0.72)} fill="#8ad6e2" /></g>
        ))}
        <path d={spline(t.trail, c, false)} fill="none" stroke={INK} strokeWidth={38 * k} />
        <path d={spline(t.trail, c, false)} fill="none" stroke="#efcd85" strokeWidth={31 * k} />
        {t.rocks.slice(0, 3).map((r, i) => <g key={i}><path d={spline(r, c)} fill="#b7b4ab" {...s} /><path d={spline(r, c, true, 0.5)} fill="#d6d3ca" transform="translate(-3 -4)" /></g>)}
        {t.trees.map(([x, y, r0], i) => {
          const r = r0 * k;
          return (
            <g key={i} transform={`translate(${x * c} ${y * c})`}>
              <path d={`M${-r * 34} ${r * 8}q${-r * 8} ${-r * 30} ${r * 22} ${-r * 30}q${r * 12} ${-r * 16} ${r * 28} 0q${r * 26} ${r * 2} ${r * 18} ${r * 30}q${r * 2} ${r * 26} ${-r * 26} ${r * 22}q${-r * 22} ${r * 12} ${-r * 34} ${-r * 4}q${-r * 16} ${-r * 4} ${-r * 8} ${-r * 18}Z`} fill="#4c8f4f" {...s} />
              <circle cx={-r * 8} cy={-r * 10} r={r * 8} fill="#6bb06a" />
            </g>
          );
        })}
      </g>
      <g stroke={INK} strokeOpacity=".2" strokeWidth="1.25" strokeDasharray="2 6">
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${(i + 1) * c} 0V${g.mapH}`} />)}
        {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M0 ${(Math.ceil(g.first) - g.first + i) * c}H${g.mapW}`} />)}
      </g>
      <g transform={`translate(0 ${-y0})`}>
        {scene.fogZones.map((f) => (role === 'director'
          ? <rect key={f.x} x={f.x * c} y={f.y * c} width={f.w * c} height={f.h * c} fill={`url(#sb-fog-${role})`} stroke={INK} strokeWidth="3" />
          : <rect key={f.x} x={f.x * c} y={f.y * c} width={f.w * c} height={f.h * c} fill={INK} stroke={INK} strokeWidth="3" />))}
      </g>
    </svg>
  );
}

// The Player's own copy has no monsters under fog and no see-through fog.
function MiniMap({ g, role, c }: { g: Geo; role: Role; c: { ground: string; water: string; trail: string } }) {
  const width = g.nav;
  const k = width / scene.gridCols;
  const h = k * scene.gridRows;
  const fog = scene.fogZones[0];
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} role="img" aria-label="Whole map, current view marked" style={{ display: 'block' }}>
      <rect width={width} height={h} fill={c.ground} />
      <path d={spline(terrain.pond, k)} fill={c.water} />
      <path d={spline(terrain.pool, k)} fill={c.water} />
      <path d={spline(terrain.trail.map(([x, y]) => [x, Math.min(y, scene.gridRows)] as [number, number]), k, false)} fill="none" stroke={c.trail} strokeWidth={k * 0.7} />
      <rect x={fog.x * k} y={fog.y * k} width={fog.w * k} height={fog.h * k} fill={INK} fillOpacity={role === 'director' ? 0.4 : 1} />
      {visibleMonsters(role).map((m) => <rect key={m.id} x={m.x * k} y={m.y * k} width={k * m.size} height={k * m.size} fill="#d6372c" />)}
      {heroes.map((m) => <circle key={m.id} cx={(m.x + 0.5) * k} cy={(m.y + 0.5) * k} r={k * 0.55} fill={INK} />)}
      <rect x={1} y={g.first * k} width={width - 2} height={Math.min(g.rows * k, h - g.first * k) - 1} fill="none" stroke={INK} strokeWidth={2} />
    </svg>
  );
}

export function Burst({ size }: { size: number }) {
  const pts = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const r = i % 2 ? 0.66 : 1;
    return `${(50 + Math.cos(a) * 49 * r).toFixed(1)},${(50 + Math.sin(a) * 49 * r).toFixed(1)}`;
  }).join(' ');
  return <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden><polygon points={pts} fill="#ffd21f" stroke={INK} strokeWidth="4" strokeLinejoin="round" /></svg>;
}

function HeroTok({ h, g, s, tag }: { h: Hero; g: Geo; s: BattleState; tag?: string }) {
  const dying = h.state === 'dying';
  const [x, y] = posOf(s, h);
  const active = s.activeId === h.id;
  const done = s.acted.includes(h.id);
  const Cond = conditionIcon[h.conditions[0]];
  const z = g.hero;
  return (
    <div className="sb-tok" data-target={`tok-${h.first}`} data-active={active || undefined} data-dying={dying || undefined}
      style={{ left: (x + 0.5) * g.cell - z / 2, top: (y + 0.5 - g.first) * g.cell - z / 2, width: z, height: z }}>
      <div className="sb-tok__ring" />
      <div className="sb-head"><HeroMark h={h} out={dying} size={z} /></div>
      <em className="sb-badge sb-badge--done" data-on={done || undefined} style={{ left: -3, top: -3 }}><Check size={14} strokeWidth={3.5} /></em>
      {Cond && <em className="sb-badge" style={{ right: -3, bottom: -3 }}><Cond size={14} strokeWidth={2.5} /></em>}
      {tag && <div className="sb-label sb-tok__tag" data-hero data-active={active || undefined}>{tag}</div>}
    </div>
  );
}

function FoeTok({ m, g, s, role }: { m: Monster; g: Geo; s: BattleState; role: Role }) {
  const z = m.size > 1 ? g.boss : g.foe;
  const [x, y] = posOf(s, m);
  const Cond = conditionIcon[m.conditions[0]];
  return (
    <div className="sb-foe" data-target={`foe-${m.label.split(' ')[0]}`} style={{ left: (x + m.size / 2) * g.cell - z / 2, top: (y + m.size / 2 - g.first) * g.cell - z / 2, width: z, height: z }}>
      <FoeMark family={m.family} rank={m.label.startsWith('Ratcrobat') ? 'ratcrobat' : undefined} size={z} />
      {m.family === 'rat' && <b>{m.tiny}</b>}
      {Cond && <em className="sb-badge" style={{ right: -5, top: -5 }}><Cond size={14} strokeWidth={2.5} /></em>}
      {role === 'director' && isFogged(m) && <em className="sb-badge sb-badge--hidden" style={{ left: -5, bottom: -3 }}><EyeOff size={14} strokeWidth={2.5} /></em>}
    </div>
  );
}

// One label per squad; each member carries its number on its token. Named creatures and
// heroes take a short tag, pushed outward from the cluster's middle. Labels stay 13 px at
// every zoom, and a label with no free slot is dropped: the token's face and number remain.
const heroSlot: Record<string, Slot[]> = { Ilsabet: ['left'], Torvald: ['left'], Dovrin: ['above'], Ysolde: ['below'], Wren: ['right'] };
const tagOf = (m: Monster) => {
  if (m.label === 'Ratcrobat 1') return 'Ratcrobats';
  if (m.label === 'Scrapper 1') return 'Scrappers 1 to 4';
  if (m.label === 'Scrapper 5') return 'Scrappers 5 to 8';
  if (m.label === 'Scrapper 9') return 'Scrappers 9 to 12';
  return m.family === 'rat' ? null : m.label.replace('Angulotl ', '');
};

export type MapRect = { x: number; y: number; w: number; h: number };
function Labels({ g, role, s, blockers, riding }: { g: Geo; role: Role; s: BattleState; blockers: MapRect[]; riding?: string }) {
  const foes = foesInView(role, g.first);
  const labels = useMemo(() => {
    const px = (v: number) => v * g.cell;
    const py = (v: number) => (v - g.first) * g.cell;
    const tokens = [
      ...foes.map((m) => { const z = m.size > 1 ? g.boss : g.foe; return { x: px(m.x + m.size / 2) - z / 2, y: py(m.y + m.size / 2) - z / 2, w: z + 7, h: z + 5 }; }),
      ...heroes.map((h) => ({ x: px(h.x + 0.5) - g.hero / 2, y: py(h.y + 0.5) - g.hero / 2, w: g.hero, h: g.hero })),
    ];
    const list = [
      ...heroes.filter((h) => h.state !== 'dying' && h.first !== riding).map((h) => ({ id: h.id, cx: px(h.x + 0.5), cy: py(h.y + 0.5), r: g.hero / 2 + 2, w: h.first.length * 8 + 16, h: 22, priority: h.id === combat.activeEntityId ? 9 : 5, prefer: heroSlot[h.first] })),
      ...foes.filter((m) => tagOf(m)).map((m) => ({ id: m.id, cx: px(m.x + m.size / 2), cy: py(m.y + m.size / 2), r: m.size > 1 ? g.boss / 2 : g.foe / 2, w: tagOf(m)!.length * 7 + 12, h: 22, priority: 2 })),
    ];
    return placeLabels(list, [...tokens, ...blockers], { x: 4, y: 4, w: g.mapW - 8, h: g.mapH - 8 }, 1);
  }, [foes, g, blockers, riding]);
  return (
    <>
      {heroes.map((h) => { const l = labels[h.id]; return l && <div key={h.id} className="sb-label" data-hero data-active={s.activeId === h.id || undefined} style={{ left: l.x, top: l.y, width: l.w }}>{h.first}</div>; })}
      {foes.map((m) => { const l = labels[m.id]; return l && <div key={m.id} className="sb-label" style={{ left: l.x, top: l.y, width: l.w }}>{tagOf(m)}</div>; })}
    </>
  );
}

function SideTracker({ s, role, live }: { s: BattleState; role: Role; live?: (n: number) => ReactNode }) {
  const acted = s.acted.length;
  return (
    <div className="sb-side">
      <div><b>Round {combat.round}</b></div>
      <div data-on>
        <b>Heroes</b>
        <span>{live ? live(acted) : acted}/{heroes.length}</span>
        <i>{heroes.map((h) => <u key={h.id} data-s={s.activeId === h.id ? 'active' : s.acted.includes(h.id) ? 'done' : h.state === 'dying' ? 'dying' : undefined} />)}</i>
      </div>
      <div><b>Director</b><span>0/{unitCount(role)}</span></div>
    </div>
  );
}

function Nav({ g, role }: { g: Geo; role: Role }) {
  const above = offView(g.first + 0.3).filter((m) => role === 'director' || !isFogged(m)).length;
  return (
    <div className="sb-nav" style={{ width: g.nav + 16 }}>
      <MiniMap g={g} role={role} c={{ ground: '#a9c56c', water: '#67c1d3', trail: '#efcd85' }} />
      <div className="sb-nav__z"><button aria-label="Zoom out"><Minus size={15} strokeWidth={3} /></button><span>32%</span><button aria-label="Zoom in"><Plus size={15} strokeWidth={3} /></button></div>
      <button className="sb-all"><Scan size={15} strokeWidth={2.6} />Show all</button>
      {above > 0 && <small>{above} above view</small>}
    </div>
  );
}

export function BattleMap({ g, role, s, popover, popoverAt, heroTag, overlay, under, count }: {
  g: Geo; role: Role; s: BattleState; popover?: ReactNode; popoverAt?: MapRect;
  heroTag?: { first: string; text: string }; overlay?: ReactNode; under?: ReactNode; count?: (n: number) => ReactNode;
}) {
  const foes = foesInView(role, g.first);
  const shoutAt = { x: (dyingHero.x + 0.9) * g.cell, y: (21 - g.first) * g.cell - (g.w === 1440 ? 8 : role === 'director' ? -5 : -1) };
  const blockers = useMemo(() => {
    const list: MapRect[] = [
      { x: g.mapW - 330, y: 0, w: 330, h: 42 },
      { x: g.mapW - g.nav - 24, y: g.mapH - g.nav * 1.3 - 100, w: g.nav + 24, h: g.nav * 1.3 + 100 },
      { x: shoutAt.x, y: shoutAt.y, w: 130, h: 34 },
    ];
    if (popoverAt) list.push(popoverAt);
    return list;
  }, [g, popoverAt, shoutAt.x, shoutAt.y]);
  return (
    <div className="sb-map" style={{ width: g.mapW, height: g.mapH }}>
      <InkMap g={g} role={role} />
      {role === 'director' && <div className="sb-fogtag" style={{ left: 4.05 * g.cell, top: 2 }}><EyeOff size={14} strokeWidth={2.6} />{g.w === 1440 ? 'Hidden from players' : 'Hidden'}</div>}
      {role === 'player' && <div className="sb-fogtag sb-fogtag--player" style={{ left: 12, top: 12 }}>Fog. Not explored yet</div>}
      {under}
      {foes.map((m) => <FoeTok key={m.id} m={m} g={g} s={s} role={role} />)}
      <Labels g={g} role={role} s={s} blockers={blockers} riding={heroTag?.first ?? 'Smoke'} />
      <div className="sb-burst" style={{ left: (dyingHero.x + 0.5) * g.cell - g.hero * 0.92, top: (dyingHero.y + 0.5 - g.first) * g.cell - g.hero * 0.92 }}><Burst size={g.hero * 1.84} /></div>
      {heroes.map((h) => <HeroTok key={h.id} h={h} g={g} s={s} tag={heroTag?.first === h.first ? heroTag.text : undefined} />)}
      <div className="sb-shout" style={{ left: shoutAt.x, top: shoutAt.y }}>Pip is dying!</div>
      {popover}
      <SideTracker s={s} role={role} live={count} />
      <Nav g={g} role={role} />
      {overlay}
    </div>
  );
}

export const monsterById = (id: string) => monsters.find((m) => m.id === id)!;
export { curOf };
