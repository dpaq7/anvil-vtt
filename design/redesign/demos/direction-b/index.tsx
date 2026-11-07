import '../_shared/still.css';
import '@fontsource-variable/hanken-grotesk/wght.css';
import '@fontsource-variable/big-shoulders-display';
import { useMemo } from 'react';
import { BookOpen, Check, ChevronDown, ChevronRight, Footprints, Handshake, HeartCrack, Minus, Plus, Scan, Swords, Tent } from 'lucide-react';
import { Stage } from '../../kit';
import {
  activeHero, combat, conditionName, dyingHero, heroes, inView, leftTabs, logEntries, monsters, offView,
  placeLabels, rightTabs, scene, scenes, spline, terrain, tools, turn, type Hero, type Monster, type Slot, type Unit, directorUnits,
} from '../_shared/battle';
import { MiniMap, classIcon, conditionIcon } from '../_shared/parts';
import './booth.css';

const CELL = 46;
const TOP = 7.1;
const ROWS = 14.9;
const W = CELL * 17;
const H = Math.round(CELL * ROWS);
const px = (v: number) => v * CELL;
const py = (v: number) => (v - TOP) * CELL;
const POP = { x: px(10.95), y: py(13.35), w: 180, h: 158 };
const ALERT = { x: px(8.5), y: 10, w: 206, h: 34 };
const heroHue: Record<string, string> = {
  Smoke: '#b4530a', Ilsabet: '#1d6fb8', Dovrin: '#0f7f74', Wren: '#6b3fb5', Torvald: '#b3241d', Ysolde: '#c2410c', Pip: '#a21caf',
};
const cicero = monsters[0];

function LitMap() {
  const t = terrain;
  return (
    <svg className="b-art" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <defs>
        <linearGradient id="b-grass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2f7a4f" /><stop offset=".55" stopColor="#5b9a45" /><stop offset="1" stopColor="#3a7f4b" /></linearGradient>
        <radialGradient id="b-water" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#7fd3df" /><stop offset=".6" stopColor="#2f93ad" /><stop offset="1" stopColor="#1b5f7c" /></radialGradient>
        <radialGradient id="b-tree" cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#4f9a4a" /><stop offset=".6" stopColor="#1f5c37" /><stop offset="1" stopColor="#0f3423" /></radialGradient>
        <radialGradient id="b-rock" cx=".38" cy=".3" r=".9"><stop offset="0" stopColor="#c5bba8" /><stop offset="1" stopColor="#5f564a" /></radialGradient>
        <radialGradient id="b-lamp" cx=".5" cy=".62" r=".75"><stop offset="0" stopColor="#fff" stopOpacity=".16" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset=".78" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></radialGradient>
        <filter id="b-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="4" /><feDisplacementMap in="SourceGraphic" scale="12" /></filter>
        <filter id="b-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".5 .9" numOctaves="3" seed="9" /><feColorMatrix values="0 0 0 0 .05  0 0 0 0 .1  0 0 0 0 .04  0 0 0 .55 -.12" /></filter>
        <filter id="b-soft"><feGaussianBlur stdDeviation="9" /></filter>
        <pattern id="b-fog" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#0a0c14" fillOpacity=".5" /><path d="M0 7h14" stroke="#c8d2ff" strokeOpacity=".25" strokeWidth="1" /></pattern>
      </defs>
      <rect width={W} height={H} fill="url(#b-grass)" />
      <g transform={`translate(0 ${-TOP * CELL})`}>
        <g filter="url(#b-soft)">{t.meadows.map((m, i) => <path key={i} d={spline(m, CELL)} fill="#a9c75a" opacity=".62" />)}</g>
        <g filter="url(#b-rough)">
          {[t.pond, t.pool, t.bog].map((b, i) => (
            <g key={i}>
              <path d={spline(b, CELL, true, 1.14)} fill="#6d5a34" />
              <path d={spline(b, CELL, true, 1.05)} fill="#d9c98e" />
              <path d={spline(b, CELL)} fill="url(#b-water)" />
            </g>
          ))}
          <path d={spline(t.trail, CELL, false)} fill="none" stroke="#5e3f1e" strokeWidth="36" strokeLinecap="round" />
          <path d={spline(t.trail, CELL, false)} fill="none" stroke="#d9a24f" strokeWidth="29" strokeLinecap="round" />
          <path d={spline(t.trail, CELL, false)} fill="none" stroke="#f0c67c" strokeWidth="9" strokeLinecap="round" strokeDasharray="14 22" />
          {t.rocks.map((r, i) => (
            <g key={i}><path d={spline(r, CELL)} fill="#1b2a1c" transform="translate(5 7)" opacity=".5" /><path d={spline(r, CELL)} fill="url(#b-rock)" /></g>
          ))}
        </g>
        {t.trees.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x * CELL} ${y * CELL})`}>
            <ellipse cx="6" cy="8" rx={r * CELL * 0.95} ry={r * CELL * 0.85} fill="#06140c" opacity=".45" />
            <circle r={r * CELL * 0.9} fill="url(#b-tree)" />
            {[[-.35, -.3], [.3, -.2], [0, .3]].map(([a, b], j) => <circle key={j} cx={a * r * CELL} cy={b * r * CELL} r={r * CELL * 0.42} fill="url(#b-tree)" />)}
          </g>
        ))}
        {scene.fogZones.map((f) => <rect key={f.x} x={f.x * CELL} y={f.y * CELL} width={f.w * CELL} height={f.h * CELL} fill="url(#b-fog)" />)}
      </g>
      <rect width={W} height={H} filter="url(#b-grain)" />
      <g stroke="#fff" strokeOpacity=".13">
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${i * CELL + 0.5} 0V${H}`} />)}
        {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M0 ${Math.round((Math.ceil(TOP) - TOP) * CELL) + i * CELL + 0.5}H${W}`} />)}
      </g>
      <rect width={W} height={H} fill="url(#b-lamp)" />
    </svg>
  );
}

function HeroToken({ h }: { h: Hero }) {
  const Icon = classIcon[h.heroClass];
  const r = 20;
  return (
    <div className="b-tok" data-hero data-active={h.active || undefined} data-done={h.acted || undefined} data-dying={h.state === 'dying' || undefined}
      style={{ left: px(h.x + 0.5) - r, top: py(h.y + 0.5) - r, background: h.state === 'dying' ? '#120a09' : heroHue[h.first] }}>
      {h.state === 'dying' ? <HeartCrack size={23} strokeWidth={2.4} /> : <Icon size={22} strokeWidth={2.3} />}
      {h.state !== 'dying' && <svg className="b-arc" viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="20.5" pathLength="100" strokeDasharray={`${(h.cur / h.max) * 100} 100`} /></svg>}
    </div>
  );
}

// Drawn after every token, so a neighbour's ring never covers a condition.
function HeroBadges({ h }: { h: Hero }) {
  const Cond = conditionIcon[h.conditions[0]];
  return (
    <>
      {h.acted && <em className="b-badge b-badge--done" style={{ left: px(h.x + 0.5) - 9, top: py(h.y + 0.5) + 11 }}><Check size={13} strokeWidth={3.5} /></em>}
      {Cond && <em className="b-badge" style={{ left: px(h.x + 0.5) + 8, top: py(h.y + 0.5) - 26 }}><Cond size={13} strokeWidth={2.5} /></em>}
    </>
  );
}

function FoeToken({ m }: { m: Monster }) {
  const s = m.size > 1 ? 80 : 34;
  const Cond = conditionIcon[m.conditions[0]];
  return (
    <div className="b-tok" data-foe data-big={m.size > 1 || undefined} data-sel={m.id === cicero.id || undefined}
      style={{ left: px(m.x + m.size / 2) - s / 2, top: py(m.y + m.size / 2) - s / 2, width: s, height: s }}>
      <span>{m.family === 'cicero' ? 'Ci' : m.tiny}</span>
      {Cond && <em className="b-tok__c"><Cond size={13} strokeWidth={2.5} /></em>}
    </div>
  );
}

// Labels push outward from the middle of a cluster, so six touching heroes keep
// full names. Active and dying are placed first; a label with no room is dropped
// to the token's own face, never overprinted.
const heroSlots: Record<string, Slot[]> = {
  Ilsabet: ['left'], Torvald: ['left'], Dovrin: ['above'], Ysolde: ['below'], Wren: ['right'], Smoke: ['below'],
};
function Labels() {
  const foes = inView(TOP);
  const placed = useMemo(() => {
    const tokens = [
      ...foes.map((m) => { const s = m.size > 1 ? 80 : 34; return { x: px(m.x + m.size / 2) - s / 2, y: py(m.y + m.size / 2) - s / 2, w: s, h: s }; }),
      ...heroes.map((h) => ({ x: px(h.x + 0.5) - 20, y: py(h.y + 0.5) - 20, w: 40, h: 40 })),
      { x: POP.x, y: POP.y, w: POP.w, h: POP.h },
      { x: W - 132, y: 0, w: 132, h: 208 },
      ALERT,
      { x: px(7), y: py(19.9), w: 88, h: 50 },
    ];
    const list = [
      ...heroes.filter((h) => h.state !== 'dying').map((h) => ({ id: h.id, cx: px(h.x + 0.5), cy: py(h.y + 0.5), r: 26, w: h.label.length * 7.2 + 14, priority: h.active ? 9 : 5, prefer: heroSlots[h.first] })),
      ...foes.filter((m) => m.id !== cicero.id).map((m) => ({ id: m.id, cx: px(m.x + m.size / 2), cy: py(m.y + m.size / 2), r: m.size > 1 ? 40 : 17, w: m.label.length * 7 + 14, priority: 1 })),
    ];
    return placeLabels(list, tokens, { x: 4, y: 4, w: W - 8, h: H - 8 }, 1);
  }, [foes]);
  return (
    <>
      {[...heroes, ...foes].map((e) => {
        const l = placed[e.id];
        return l && <div key={e.id} className="b-label" data-hero={e.type === 'hero' || undefined} data-active={e.id === activeHero.id || undefined} style={{ left: l.x, top: l.y, width: l.w }}>{(e as Hero | Monster).label}</div>;
      })}
    </>
  );
}

function Popover() {
  const m = cicero;
  return (
    <div className="b-pop" style={{ left: POP.x, top: POP.y, width: POP.w }}>
      <header><strong>{m.label}</strong><span>Level {m.level}, {conditionName(m.conditions[0])}</span></header>
      <div className="b-pop__st"><span>Stamina</span><b>{m.cur} / {m.max}</b></div>
      <i className="b-meter"><b style={{ width: `${(m.cur / m.max) * 100}%` }} /></i>
      <ul><li>Actions<ChevronRight size={15} /></li><li>Status<ChevronRight size={15} /></li><li>Adjust HP<ChevronRight size={15} /></li></ul>
    </div>
  );
}

function HeroRow({ h }: { h: Hero }) {
  const Icon = classIcon[h.heroClass];
  if (h.state === 'dying') {
    return (
      <div className="b-dying">
        <div className="b-dying__i"><HeartCrack size={25} strokeWidth={2.3} /></div>
        <div className="b-who"><strong>{h.label}</strong><small>{h.heroClass}</small></div>
        <div className="b-dying__s"><b>Dying</b><span>{h.cur}/{h.max}</span></div>
      </div>
    );
  }
  const pct = (h.cur / h.max) * 100;
  return (
    <div className="b-row" data-active={h.active || undefined} data-done={h.acted || undefined} data-winded={h.state === 'winded' || undefined}>
      <div className="b-disc" style={{ background: heroHue[h.first] }}><Icon size={15} strokeWidth={2.4} /></div>
      <div className="b-who">
        <strong>{h.label}</strong>
        <small>{h.active ? 'Acting now' : h.acted ? 'Done' : h.state === 'winded' ? 'Winded' : h.heroClass}{h.conditions.length > 0 && <>, {h.conditions.map(conditionName).join(', ')}</>}</small>
      </div>
      <div className="b-big">{h.cur}<span>/{h.max}</span></div>
      <i className="b-line"><b style={{ width: `${pct}%` }} /></i>
    </div>
  );
}

const fold = (name: string, list: Unit[], note: string): Unit & { note: string } => ({
  name, note, cur: list.reduce((s, u) => s + u.cur, 0), max: list.reduce((s, u) => s + u.max, 0),
  conditions: list.flatMap((u) => u.conditions), family: list[0].family,
});
const units = [
  directorUnits[0], directorUnits[1],
  fold('Scrappers', directorUnits.slice(2, 5), '3 squads'),
  fold('Angulotl', directorUnits.slice(5, 10), '5 creatures'),
  ...directorUnits.slice(10),
];

function Tracker() {
  return (
    <aside className="b-panel b-left">
      <nav className="b-tabs" aria-label="Left rail">
        {leftTabs.map((t, i) => <span key={t.l} data-on={i === 0 || undefined}>{t.l}{t.n != null && <em>{t.n}</em>}</span>)}
      </nav>
      <div className="b-head"><b>Heroes</b><span>1 of 7 acted</span></div>
      {heroes.map((h) => <HeroRow key={h.id} h={h} />)}
      <div className="b-head b-head--dir">
        <b>Director</b>
        <span className="b-malice">Malice<button aria-label="Lower Malice"><Minus size={13} /></button><strong>{combat.malice}</strong><button aria-label="Raise Malice"><Plus size={13} /></button></span>
      </div>
      <div className="b-units">
        {units.map((u) => (
          <div className="b-unit" key={u.name}>
            <span>{u.name}{u.conditions[0] && <small>{u.conditions.map(conditionName).join(', ')}</small>}{!u.conditions[0] && 'note' in u && u.note && <small>{u.note}</small>}{u.count && <small>{u.count} creatures</small>}</span>
            <b>{u.cur}/{u.max}</b>
          </div>
        ))}
      </div>
      <div className="b-turn">
        <button className="b-end">End Ilsabet’s turn</button>
        <button className="b-ghost">End combat…</button>
      </div>
    </aside>
  );
}

function RightRail() {
  const h = activeHero;
  return (
    <aside className="b-panel b-right">
      <nav className="b-tabs" aria-label="Right rail">{rightTabs.map((t) => <span key={t} data-on={t === 'Damage' || undefined}>{t}</span>)}</nav>
      <section className="b-sec">
        <div className="b-seg"><span data-on>Damage</span><span>Heal</span></div>
        <div className="b-input">{cicero.label}<ChevronDown size={15} /></div>
        <div className="b-amt"><div className="b-input">Amount</div><button>Apply damage</button></div>
      </section>
      <section className="b-sec b-now">
        <div className="b-now__h"><div className="b-disc" style={{ background: heroHue[h.first] }}>{(() => { const I = classIcon[h.heroClass]; return <I size={15} strokeWidth={2.4} />; })()}</div><div><strong>{h.label}</strong><small>{h.heroClass}, {h.conditions.map(conditionName).join(', ')}</small></div></div>
        <div className="b-acts">
          <span data-free>Main</span><span data-free>Maneuver</span><span data-free>Move {turn.moveRemaining}</span><span data-free>Triggered</span>
        </div>
        <div className="b-stats"><span>{h.resourceName}<b>{h.resource}</b></span><span>Recoveries<b>{h.recoveries}/{h.recoveriesMax}</b></span><span>Speed<b>{h.speed}</b></span></div>
      </section>
      <section className="b-sec b-log">
        <div className="b-head b-head--flat"><b>Log</b><span>24 entries</span></div>
        {logEntries.slice(0, 8).map((e) => <div key={e.text}><span>{e.text}</span><time>{e.time}</time></div>)}
      </section>
    </aside>
  );
}

const modeIcon = { story: BookOpen, montage: Footprints, negotiation: Handshake, battle: Swords, respite: Tent };

function FilmStrip() {
  return (
    <nav className="b-strip" aria-label="Film strip">
      {scenes.map((s) => {
        const I = modeIcon[s.key];
        return (
          <button key={s.name} className="b-frame" data-mode={s.key} data-on={('active' in s && s.active) || undefined}>
            <i><I size={19} strokeWidth={2.2} /></i>
            <span><b>{'short' in s ? s.short : s.name}</b><small>{s.mode}</small></span>
          </button>
        );
      })}
    </nav>
  );
}

function Booth() {
  const hidden = offView(TOP + 0.2);
  return (
    <div className="b-app">
      <div className="b-spill" />
      <header className="b-top">
        <div className="b-word">Anvil</div>
        <div className="b-side">
          <div className="b-side__r"><b>Round {combat.round}</b><span>d10 {combat.initiativeRoll}</span></div>
          <div className="b-side__g" data-on><b>Heroes</b><span>1/7</span><i>{heroes.map((h) => <u key={h.id} data-s={h.active ? 'active' : h.acted ? 'done' : h.state === 'dying' ? 'dying' : ''} />)}</i></div>
          <div className="b-side__g"><b>Director</b><span>0/14</span><i>{directorUnits.map((u) => <u key={u.name} data-f />)}</i></div>
        </div>
        <div className="b-session">
          <span>Light</span><span>Display</span><span>Fullscreen</span><span>Revert…</span>
          <button>End session…</button>
        </div>
      </header>
      <Tracker />
      <main className="b-centre">
        <div className="b-screen" style={{ width: W, height: H }}>
          <LitMap />
          {inView(TOP).map((m) => <FoeToken key={m.id} m={m} />)}
          <div className="b-iris" style={{ left: px(dyingHero.x + 0.5) - 37, top: py(dyingHero.y + 0.5) - 37 }} />
          <Labels />
          {heroes.map((h) => <HeroToken key={h.id} h={h} />)}
          {heroes.map((h) => <HeroBadges key={h.id} h={h} />)}
          <div className="b-pip" style={{ left: px(7.08), top: py(dyingHero.y + 0.5) - 23 }}>
            <strong>{dyingHero.first}</strong><span>Dying {dyingHero.cur}/{dyingHero.max}</span>
          </div>
          <Popover />
          <div className="b-alert" style={{ left: ALERT.x, top: ALERT.y, width: ALERT.w }}><HeartCrack size={18} strokeWidth={2.4} /><span><b>Pip Underbough is dying</b></span></div>
          <div className="b-nav">
            <MiniMap width={112} top={TOP} rows={ROWS} c={{ ground: '#2c5a3b', water: '#2f93ad', trail: '#d9a24f', hero: '#fff', foe: '#ff7a6b', fog: 'rgb(0 0 0 / .45)', view: '#ffe9c4' }} />
            <div className="b-nav__z"><button aria-label="Zoom out"><Minus size={14} /></button><span>32%</span><button aria-label="Zoom in"><Plus size={14} /></button></div>
            <button className="b-all"><Scan size={14} />Show all</button>
            <small>{hidden.length} above view</small>
          </div>
        </div>
        <div className="b-bar">
          <div className="b-tools">{tools.map((t) => <span key={t} data-on={t === 'Select' || undefined}>{t}</span>)}</div>
          <div className="b-roll">
            <span data-on>Power</span><span>Resource</span><span>d6</span><span className="b-mod">Mod<b>0</b></span>
            <span className="b-eb"><u data-on>None</u><u>E</u><u>B</u><u>2E</u><u>2B</u></span>
          </div>
        </div>
      </main>
      <RightRail />
      <FilmStrip />
      <footer className="b-status">
        <span><i />Connected</span><span><i data-d />Dev Director, Director</span><span><i />Dev Player</span><span>1/1 players</span>
      </footer>
    </div>
  );
}

export default function DirectionB() {
  return (
    <Stage width={1440} height={900} theme="dark" unframed className="dir-b">
      {() => <Booth />}
    </Stage>
  );
}
