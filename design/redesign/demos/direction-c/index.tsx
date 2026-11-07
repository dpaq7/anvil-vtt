import '../_shared/still.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import { useMemo } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, Footprints, Handshake, Minus, Plus, Scan, Swords, Tent } from 'lucide-react';
import { Stage } from '../../kit';
import {
  activeHero, combat, conditionName, directorUnits, dyingHero, heroes, inView, leftTabs, logEntries, monsters, offView,
  placeLabels, rightTabs, scene, scenes, spline, terrain, tools, turn, type Hero, type Monster, type Slot, type Unit,
} from '../_shared/battle';
import { MiniMap, conditionIcon } from '../_shared/parts';
import { FoeFace, HeroFace } from '../_shared/storyboard/faces';
import './storyboard.css';

const CELL = 46;
const TOP = 6.8;
const ROWS = 15.2;
const W = CELL * 17;
const H = Math.round(CELL * ROWS);
const px = (v: number) => v * CELL;
const py = (v: number) => (v - TOP) * CELL;
const INK = '#15171c';
const smoke = heroes[0];
const POP = { x: px(10.95), y: py(13.2), w: 178, h: 160 };

function InkMap() {
  const t = terrain;
  const s = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: 'round' as const };
  return (
    <svg className="c-art" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <defs>
        <pattern id="c-fog" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#2a2e38" fillOpacity=".42" /><path d="M0 6h12" stroke={INK} strokeWidth="3" /></pattern>
      </defs>
      <rect width={W} height={H} fill="#a9c56c" />
      <g transform={`translate(0 ${-TOP * CELL})`}>
        {t.meadows.map((m, i) => <path key={i} d={spline(m, CELL)} fill="#c2d98a" />)}
        {[t.pond, t.pool, t.bog].map((b, i) => (
          <g key={i}><path d={spline(b, CELL)} fill="#67c1d3" {...s} /><path d={spline(b, CELL, true, 0.72)} fill="#8ad6e2" /></g>
        ))}
        <path d={spline(t.trail, CELL, false)} fill="none" stroke={INK} strokeWidth="38" />
        <path d={spline(t.trail, CELL, false)} fill="none" stroke="#efcd85" strokeWidth="31" />
        {t.rocks.map((r, i) => <g key={i}><path d={spline(r, CELL)} fill="#b7b4ab" {...s} /><path d={spline(r, CELL, true, 0.5)} fill="#d6d3ca" transform="translate(-3 -4)" /></g>)}
        {t.trees.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x * CELL} ${y * CELL})`}>
            <path d={`M${-r * 34} ${r * 8}q${-r * 8} ${-r * 30} ${r * 22} ${-r * 30}q${r * 12} ${-r * 16} ${r * 28} 0q${r * 26} ${r * 2} ${r * 18} ${r * 30}q${r * 2} ${r * 26} ${-r * 26} ${r * 22}q${-r * 22} ${r * 12} ${-r * 34} ${-r * 4}q${-r * 16} ${-r * 4} ${-r * 8} ${-r * 18}Z`} fill="#4c8f4f" {...s} />
            <circle cx={-r * 8} cy={-r * 10} r={r * 8} fill="#6bb06a" />
          </g>
        ))}
        {scene.fogZones.map((f) => <rect key={f.x} x={f.x * CELL} y={f.y * CELL} width={f.w * CELL} height={f.h * CELL} fill="url(#c-fog)" stroke={INK} strokeWidth="3" />)}
      </g>
      <g stroke={INK} strokeOpacity=".24" strokeWidth="1.5" strokeDasharray="2 6">
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${(i + 1) * CELL} 0V${H}`} />)}
        {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M0 ${Math.round((Math.ceil(TOP) - TOP) * CELL) + i * CELL}H${W}`} />)}
      </g>
    </svg>
  );
}

function Burst({ size }: { size: number }) {
  const pts = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const r = i % 2 ? 0.66 : 1;
    return `${(50 + Math.cos(a) * 49 * r).toFixed(1)},${(50 + Math.sin(a) * 49 * r).toFixed(1)}`;
  }).join(' ');
  return <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden><polygon points={pts} fill="#ffd21f" stroke={INK} strokeWidth="4" strokeLinejoin="round" /></svg>;
}

function HeroTok({ h }: { h: Hero }) {
  const dying = h.state === 'dying';
  return (
    <div className="c-tok" data-active={h.active || undefined} data-dying={dying || undefined} data-done={h.acted || undefined}
      style={{ left: px(h.x + 0.5) - 23, top: py(h.y + 0.5) - 23 }}>
      <div className="c-head"><HeroFace who={h.first} out={dying} size={46} /></div>
    </div>
  );
}
function HeroBadge({ h }: { h: Hero }) {
  const Cond = conditionIcon[h.conditions[0]];
  return (
    <>
      {h.acted && <em className="c-badge c-badge--done" style={{ left: px(h.x + 0.5) - 25, top: py(h.y + 0.5) - 25 }}><Check size={13} strokeWidth={3.5} /></em>}
      {Cond && <em className="c-badge" style={{ left: px(h.x + 0.5) + 7, top: py(h.y + 0.5) + 7 }}><Cond size={13} strokeWidth={2.5} /></em>}
    </>
  );
}

function FoeTok({ m }: { m: Monster }) {
  const s = m.size > 1 ? 88 : 40;
  const Cond = conditionIcon[m.conditions[0]];
  const showNum = m.family === 'rat';
  return (
    <div className="c-foe" style={{ left: px(m.x + m.size / 2) - s / 2, top: py(m.y + m.size / 2) - s / 2, width: s, height: s }}>
      <FoeFace family={m.family} rank={m.label.startsWith('Ratcrobat') ? 'ratcrobat' : undefined} size={s} />
      {showNum && <b>{m.tiny}</b>}
      {Cond && <em className="c-badge c-badge--foe"><Cond size={13} strokeWidth={2.5} /></em>}
    </div>
  );
}

// One label per squad; each member carries its number on its token. Named creatures
// and heroes take a short tag, pushed outward from the cluster's middle.
const heroSlot: Record<string, Slot[]> = { Ilsabet: ['left'], Torvald: ['left'], Dovrin: ['above'], Ysolde: ['below'], Wren: ['right'], Smoke: ['below'] };
const tag = (m: Monster) => {
  if (m.label === 'Ratcrobat 1') return 'Ratcrobats';
  if (m.label === 'Scrapper 1') return 'Scrappers 1 to 4';
  if (m.label === 'Scrapper 5') return 'Scrappers 5 to 8';
  if (m.label === 'Scrapper 9') return 'Scrappers 9 to 12';
  return m.family === 'rat' ? null : m.label.replace('Angulotl ', '');
};
function Labels() {
  const foes = inView(TOP);
  const out = useMemo(() => {
    const blockers = [
      ...foes.map((m) => { const s = m.size > 1 ? 88 : 40; return { x: px(m.x + m.size / 2) - s / 2, y: py(m.y + m.size / 2) - s / 2, w: s + 7, h: s + 5 }; }),
      ...heroes.map((h) => ({ x: px(h.x + 0.5) - 23, y: py(h.y + 0.5) - 23, w: 46, h: 46 })),
      { x: POP.x, y: POP.y, w: POP.w, h: POP.h },
      { x: W - 390, y: 0, w: 390, h: 46 },
      { x: W - 132, y: H - 214, w: 132, h: 214 },
      { x: px(6.5), y: py(21) + 8, w: 140, h: 34 },
    ];
    const list = [
      ...heroes.filter((h) => h.state !== 'dying' && h !== smoke).map((h) => ({ id: h.id, cx: px(h.x + 0.5), cy: py(h.y + 0.5), r: 25, w: h.first.length * 8 + 16, h: 22, priority: h.active ? 9 : 5, prefer: heroSlot[h.first] })),
      ...foes.filter((m) => tag(m)).map((m) => ({ id: m.id, cx: px(m.x + m.size / 2), cy: py(m.y + m.size / 2), r: m.size > 1 ? 44 : 20, w: tag(m)!.length * 7 + 12, h: 22, priority: 2 })),
    ];
    return placeLabels(list, blockers, { x: 4, y: 4, w: W - 8, h: H - 8 }, 1);
  }, [foes]);
  return (
    <>
      {heroes.map((h) => { const l = out[h.id]; return l && <div key={h.id} className="c-label" data-hero data-active={h.active || undefined} style={{ left: l.x, top: l.y, width: l.w }}>{h.first}</div>; })}
      {foes.map((m) => { const l = out[m.id]; return l && <div key={m.id} className="c-label" style={{ left: l.x, top: l.y, width: l.w }}>{tag(m)}</div>; })}
    </>
  );
}

function Popover() {
  const h = smoke;
  return (
    <div className="c-pop" style={{ left: POP.x, top: POP.y, width: POP.w }}>
      <strong>{h.label}</strong>
      <div className="c-pop__st"><span>Stamina</span><b>{h.cur} / {h.max}</b></div>
      <Meter h={h} />
      <ul><li>Actions<ChevronRight size={15} strokeWidth={3} /></li><li>Status<ChevronRight size={15} strokeWidth={3} /></li><li>Adjust HP<ChevronRight size={15} strokeWidth={3} /></li></ul>
    </div>
  );
}

function Meter({ h }: { h: { cur: number; max: number; state?: string } }) {
  const n = 10;
  const on = Math.ceil((h.cur / h.max) * n);
  return <i className="c-meter" data-winded={h.state === 'winded' || undefined}>{Array.from({ length: n }, (_, i) => <u key={i} data-on={i < on || undefined} />)}</i>;
}

function HeroRow({ h }: { h: Hero }) {
  if (h.state === 'dying') {
    return (
      <div className="c-dying">
        <div className="c-dying__f"><HeroFace who={h.first} out size={50} /></div>
        <div className="c-who"><strong>{h.label}</strong><span className="c-dying__w">Dying</span></div>
        <b className="c-dying__n">{h.cur}/{h.max}</b>
      </div>
    );
  }
  const note = h.active ? 'Acting now' : h.acted ? 'Done' : h.state === 'winded' ? 'Winded' : null;
  return (
    <div className="c-row" data-active={h.active || undefined} data-done={h.acted || undefined}>
      <div className="c-row__f"><HeroFace who={h.first} size={36} /></div>
      <div className="c-who">
        <strong>{h.label}{h.state === 'winded' && <em className="c-winded">Winded</em>}</strong>
        <small>{[h.state === 'winded' ? null : note, ...h.conditions.map(conditionName)].filter(Boolean).join(', ') || h.heroClass}</small>
      </div>
      <div className="c-st"><b>{h.cur}/{h.max}</b><Meter h={h} /></div>
    </div>
  );
}

const fold = (name: string, list: Unit[]): Unit => ({
  name, cur: list.reduce((s, u) => s + u.cur, 0), max: list.reduce((s, u) => s + u.max, 0),
  conditions: list.flatMap((u) => u.conditions), family: list[0].family,
});
const units: Unit[] = [directorUnits[0], directorUnits[1], fold('Scrappers, 3 squads', directorUnits.slice(2, 5)), fold('Angulotl, 5', directorUnits.slice(5, 10)), ...directorUnits.slice(10)];

function Tracker() {
  return (
    <aside className="c-frame c-left">
      <nav className="c-tabs" aria-label="Left rail">{leftTabs.map((t, i) => <span key={t.l} data-on={i === 0 || undefined}>{t.l}{t.n != null && <em>{t.n}</em>}</span>)}</nav>
      <div className="c-sub"><b>Heroes</b><span>1 of 7 acted</span></div>
      {heroes.map((h) => <HeroRow key={h.id} h={h} />)}
      <div className="c-sub c-sub--dir"><b>Director</b><span className="c-malice">Malice<button aria-label="Lower Malice"><Minus size={14} strokeWidth={3} /></button><strong>{combat.malice}</strong><button aria-label="Raise Malice"><Plus size={14} strokeWidth={3} /></button></span></div>
      <div className="c-units">
        {units.map((u) => (
          <div className="c-unit" key={u.name}>
            <FoeFace family={u.family} rank={u.name === 'Ratcrobats' ? 'ratcrobat' : undefined} size={22} />
            <span>{u.name}</span><b>{u.cur}/{u.max}</b>
          </div>
        ))}
      </div>
      <div className="c-foot"><button className="c-end">End Ilsabet’s turn</button><button className="c-link">End combat…</button></div>
    </aside>
  );
}

function RightRail() {
  const h = activeHero;
  return (
    <aside className="c-frame c-right">
      <nav className="c-tabs" aria-label="Right rail">{rightTabs.map((t) => <span key={t} data-on={t === 'Damage' || undefined}>{t}</span>)}</nav>
      <section className="c-sec">
        <div className="c-seg"><span data-on>Damage</span><span>Heal</span></div>
        <div className="c-input">{dyingHero.label}<ChevronDown size={16} strokeWidth={3} /></div>
        <div className="c-amt"><div className="c-input">Amount</div><button>Apply damage</button></div>
      </section>
      <section className="c-sec c-now">
        <div className="c-now__h"><HeroFace who={h.first} size={52} /><div><strong>{h.label}</strong><small>{h.heroClass}, {h.conditions.map(conditionName).join(', ')}</small></div></div>
        <div className="c-acts"><span>Main</span><span>Maneuver</span><span>Move {turn.moveRemaining}</span><span>Triggered</span></div>
        <div className="c-stats"><span>{h.resourceName} <b>{h.resource}</b></span><span>Recoveries <b>{h.recoveries}/{h.recoveriesMax}</b></span><span>Speed <b>{h.speed}</b></span></div>
      </section>
      <section className="c-sec c-log">
        <div className="c-sub c-sub--flat"><b>Log</b><span>24 entries</span></div>
        {logEntries.slice(0, 8).map((e) => <div key={e.text}><span>{e.text}</span><time>{e.time}</time></div>)}
      </section>
    </aside>
  );
}

const modeIcon = { story: BookOpen, montage: Footprints, negotiation: Handshake, battle: Swords, respite: Tent };

function Board() {
  const hidden = offView(TOP + 0.3);
  return (
    <div className="c-app">
      <header className="c-top">
        <div className="c-word">Anvil</div>
        <nav className="c-strip" aria-label="Film strip">
          {scenes.map((s, i) => {
            const I = modeIcon[s.key];
            return (
              <div className="c-cell" key={s.name}>
                <button className="c-board" data-mode={s.key} data-on={('active' in s && s.active) || undefined}>
                  <i><I size={22} strokeWidth={2.6} /></i>
                  <span><b>{'short' in s ? s.short : s.name}</b><small>{s.mode}</small></span>
                </button>
                {i < scenes.length - 1 && <ArrowRight className="c-arrow" size={18} strokeWidth={3.5} />}
              </div>
            );
          })}
        </nav>
        <button className="c-endsession">End session…</button>
      </header>
      <div className="c-mid">
        <Tracker />
        <main className="c-centre">
          <div className="c-frame c-screen" style={{ width: W + 8, height: H + 8 }}>
            <div className="c-map" style={{ width: W, height: H }}>
              <InkMap />
              {inView(TOP).map((m) => <FoeTok key={m.id} m={m} />)}
              <Labels />
              <div className="c-burst" style={{ left: px(dyingHero.x + 0.5) - 42, top: py(dyingHero.y + 0.5) - 42 }}><Burst size={84} /></div>
              {heroes.map((h) => <HeroTok key={h.id} h={h} />)}
              {heroes.map((h) => <HeroBadge key={h.id} h={h} />)}
              <div className="c-shout" style={{ left: px(6.5), top: py(21) + 8 }}>Pip is dying!</div>
              <Popover />
              <div className="c-side">
                <div><b>Round {combat.round}</b></div>
                <div data-on><b>Heroes</b><span>1/7</span><i>{heroes.map((h) => <u key={h.id} data-s={h.active ? 'active' : h.acted ? 'done' : h.state === 'dying' ? 'dying' : ''} />)}</i></div>
                <div><b>Director</b><span>0/14</span></div>
              </div>
              <div className="c-nav">
                <MiniMap width={112} top={TOP} rows={ROWS} c={{ ground: '#a9c56c', water: '#67c1d3', trail: '#efcd85', hero: INK, foe: '#d6372c', fog: 'rgb(21 23 28 / .4)', view: INK }} />
                <div className="c-nav__z"><button aria-label="Zoom out"><Minus size={15} strokeWidth={3} /></button><span>32%</span><button aria-label="Zoom in"><Plus size={15} strokeWidth={3} /></button></div>
                <button className="c-all"><Scan size={15} strokeWidth={2.6} />Show all</button>
                <small>{hidden.length} above view</small>
              </div>
            </div>
          </div>
          <div className="c-frame c-bar">
            <div className="c-tools">{tools.map((t) => <span key={t} data-on={t === 'Select' || undefined}>{t}</span>)}</div>
            <div className="c-roll"><span data-on>Power</span><span>Resource</span><span>d6</span><span>Mod <b>0</b></span><span data-on>None</span><span>E</span><span>B</span><span>2E</span><span>2B</span></div>
          </div>
        </main>
        <RightRail />
      </div>
      <footer className="c-status">
        <span>Connected</span><span>Dev Director, Director</span><span>Dev Player</span><span>1/1 players</span>
        <div><span>Dark</span><span>Display</span><span>Fullscreen</span><span>Revert…</span></div>
      </footer>
    </div>
  );
}

export default function DirectionC() {
  return (
    <Stage width={1440} height={900} theme="light" unframed className="dir-c">
      {() => <Board />}
    </Stage>
  );
}
