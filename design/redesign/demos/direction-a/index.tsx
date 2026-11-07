import '../_shared/still.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import '@fontsource-variable/archivo/wdth.css';
import { useMemo } from 'react';
import { ChevronDown, Minus, Plus, Scan, Volume2 } from 'lucide-react';
import { Stage } from '../../kit';
import {
  activeHero, combat, conditionName, directorUnits, dyingHero, heroes, leftTabs, logEntries, monsters,
  inView, offView, placeLabels, rightTabs, scene, scenes, spline, terrain, tools, turn, type Hero, type Monster,
} from '../_shared/battle';
import { MiniMap, conditionIcon } from '../_shared/parts';
import './call-sheet.css';

const CELL = 48;
const TOP = 7;
const ROWS = 15;
const W = CELL * 17;
const H = Math.round(CELL * ROWS);
const px = (v: number) => v * CELL;
const py = (v: number) => (v - TOP) * CELL;
const POP = { x: px(7.05), y: py(18.72), w: 200 };

function SurveyMap() {
  const t = terrain;
  return (
    <svg className="a-survey" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <defs>
        <pattern id="a-water" width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 3.5h4" stroke="var(--a-water-ink)" strokeWidth="1" />
        </pattern>
        <pattern id="a-rock" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 2.5h5" stroke="var(--a-map-ink)" strokeWidth="1.1" />
        </pattern>
        <pattern id="a-fog" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
          <path d="M0 5h10" stroke="var(--a-ink)" strokeWidth="1.2" />
        </pattern>
        <pattern id="a-stipple" width="11" height="11" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r=".9" fill="var(--a-map-ink)" /><circle cx="8" cy="8" r=".9" fill="var(--a-map-ink)" />
        </pattern>
      </defs>
      <g transform={`translate(0 ${-TOP * CELL})`}>
        {t.meadows.map((m, i) => (
          <g key={i}>
            <path d={spline(m, CELL)} fill="url(#a-stipple)" opacity=".55" />
            {[1, 1.14, 1.3].map((s) => <path key={s} d={spline(m, CELL, true, s)} fill="none" stroke="var(--a-contour)" strokeWidth="1" />)}
          </g>
        ))}
        {[t.pond, t.pool, t.bog].map((b, i) => (
          <g key={i}>
            {[1.34, 1.2, 1.09].map((s) => <path key={s} d={spline(b, CELL, true, s)} fill="none" stroke="var(--a-contour)" strokeWidth="1" />)}
            <path d={spline(b, CELL)} fill="var(--a-water)" />
            <path d={spline(b, CELL)} fill="url(#a-water)" stroke="var(--a-map-ink)" strokeWidth="1.5" />
          </g>
        ))}
        <path d={spline(t.trail, CELL, false)} fill="none" stroke="var(--a-map-ink)" strokeWidth="31" />
        <path d={spline(t.trail, CELL, false)} fill="none" stroke="var(--a-sheet)" strokeWidth="28" />
        <path d={spline(t.trail, CELL, false)} fill="none" stroke="var(--a-map-ink)" strokeWidth="1" strokeDasharray="5 8" />
        {t.rocks.map((r, i) => <path key={i} d={spline(r, CELL)} fill="url(#a-rock)" stroke="var(--a-map-ink)" strokeWidth="1.5" />)}
        {t.trees.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x * CELL} ${y * CELL})`}>
            <circle r={r * CELL * 0.72} fill="var(--a-sheet)" stroke="var(--a-map-ink)" strokeWidth="1.25" />
            <circle r={r * CELL * 0.72 - 4} fill="none" stroke="var(--a-map-ink)" strokeWidth="1" strokeDasharray="1.5 4" />
            <path d="M-3 0h6M0-3v6" stroke="var(--a-map-ink)" strokeWidth="1.25" />
          </g>
        ))}
        {scene.fogZones.map((f) => <rect key={f.x} x={f.x * CELL} y={f.y * CELL} width={f.w * CELL} height={f.h * CELL} fill="url(#a-fog)" opacity=".28" />)}
        {scene.fogZones.map((f) => <path key={f.x} d={`M${(f.x + f.w) * CELL} 0V${(f.y + f.h) * CELL}H0`} fill="none" stroke="var(--a-ink)" strokeWidth="1.5" strokeDasharray="7 4" />)}
      </g>
      <g stroke="var(--a-grid)" strokeWidth="1">
        {Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${i * CELL + 0.5} 0V${H}`} />)}
        {Array.from({ length: 17 }, (_, i) => <path key={i} d={`M0 ${i * CELL + 0.5}H${W}`} />)}
      </g>
    </svg>
  );
}

function HeroMark({ h }: { h: Hero }) {
  const r = 20;
  return (
    <div className="a-mark" data-hero data-active={h.active || undefined} data-done={h.acted || undefined}
      data-dying={h.state === 'dying' || undefined} data-winded={h.state === 'winded' || undefined}
      style={{ left: px(h.x + 0.5) - r, top: py(h.y + 0.5) - r }}>
      <span>{h.mono}</span>
      {h.state === 'dying' && <svg className="a-mark__x" viewBox="0 0 40 40" aria-hidden><path d="M7 7l26 26M33 7L7 33" /></svg>}
      <i className="a-mark__bar"><b style={{ width: `${(h.cur / h.max) * 100}%` }} /></i>
    </div>
  );
}

function FoeMark({ m }: { m: Monster }) {
  const s = m.size > 1 ? 84 : 34;
  const Cond = conditionIcon[m.conditions[0]];
  return (
    <div className="a-mark" data-foe data-big={m.size > 1 || undefined} style={{ left: px(m.x + m.size / 2) - s / 2, top: py(m.y + m.size / 2) - s / 2, width: s, height: s }}>
      <span>{m.family === 'cicero' ? 'Ci' : m.tiny}</span>
      {Cond && <em><Cond size={13} strokeWidth={2.5} /></em>}
    </div>
  );
}

function MapLabels() {
  const visible = inView(TOP);
  const labels = useMemo(() => {
    const blockers = [
      ...visible.map((m) => ({ x: px(m.x + m.size / 2) - 17 * m.size - 8 * (m.size - 1), y: py(m.y + m.size / 2) - 17 * m.size - 8 * (m.size - 1), w: 34 * m.size + 16 * (m.size - 1), h: 34 * m.size + 16 * (m.size - 1) })),
      ...heroes.map((h) => ({ x: px(h.x + 0.5) - 20, y: py(h.y + 0.5) - 20, w: 40, h: 40 })),
      { x: 0, y: py(18.9), w: px(3.9), h: H }, // the leader key
      { x: POP.x, y: POP.y, w: POP.w, h: 150 }, // the popover
      { x: W - 214, y: H - 50, w: 214, h: 50 }, // the title block
      { x: W - 124, y: 0, w: 124, h: 186 }, // the mini-map
    ];
    return placeLabels(
      visible.map((m) => ({ id: m.id, cx: px(m.x + m.size / 2), cy: py(m.y + m.size / 2), r: m.size > 1 ? 42 : 17, w: m.label.length * 7 + 10, priority: m.family === 'rat' ? 1 : 2 })),
      blockers, { x: 4, y: 4, w: W - 8, h: H - 8 },
    );
  }, [visible]);
  const smoke = heroes[0];
  return (
    <>
      {visible.map((m) => {
        const l = labels[m.id];
        return l && <div key={m.id} className="a-label" style={{ left: l.x, top: l.y, width: l.w }}>{m.label}</div>;
      })}
      <div className="a-label a-label--hero" style={{ left: px(smoke.x + 0.5) - 60, top: py(smoke.y + 0.5) + 22, width: 120 }}>{smoke.label}</div>
    </>
  );
}

// Six heroes stand in six touching squares, so their labels leave the cluster and
// stack in a key with leaders. Each name stays 13 px at every zoom.
function LeaderKey() {
  const group = heroes.slice(1);
  const x0 = 0;
  const y0 = py(19) + 2;
  const pitch = 21;
  const keyW = 160;
  return (
    <>
      <svg className="a-leaders" width={W} height={H} aria-hidden>
        {group.map((h, i) => {
          const y = y0 + i * pitch + 10;
          const tx = px(h.x + 0.5);
          const ty = py(h.y + 0.5);
          const bend = x0 + keyW + 8 + (group.length - i) * 3;
          return <path key={h.id} d={`M${x0 + keyW} ${y}H${bend}L${tx - 14} ${ty}`} data-dying={h.state === 'dying' || undefined} />;
        })}
      </svg>
      <div className="a-key" style={{ left: x0, top: y0, width: keyW }}>
        {group.map((h) => (
          <div key={h.id} data-active={h.active || undefined} data-dying={h.state === 'dying' || undefined}><b>{h.mono}</b>{h.label}</div>
        ))}
      </div>
    </>
  );
}

function Popover() {
  const h = dyingHero;
  return (
    <div className="a-pop" style={{ left: POP.x, top: POP.y, width: POP.w }}>
      <header><strong>{h.label}</strong></header>
      <div className="a-pop__st"><span>Stamina</span><b>{h.cur} / {h.max}</b></div>
      <i className="a-track" />
      <ul>
        <li>Actions<ChevronDown size={14} /></li>
        <li>Status<ChevronDown size={14} /></li>
        <li>Adjust HP<ChevronDown size={14} /></li>
      </ul>
    </div>
  );
}

const stateWord = (h: Hero) => h.state === 'dying' ? 'Dying' : h.active ? 'Active' : h.acted ? 'Done' : h.state === 'winded' ? 'Winded' : 'Ready';

function HeroRow({ h, i }: { h: Hero; i: number }) {
  if (h.state === 'dying') {
    return (
      <div className="a-row a-row--dying">
        <span className="a-no">{i + 1}</span>
        <div className="a-who"><strong>{h.label}</strong><small>{h.heroClass}, 0 stamina</small></div>
        <span className="a-num">{h.cur}/{h.max}</span>
        <span className="a-stamp">Dying</span>
      </div>
    );
  }
  return (
    <div className="a-row a-row--hero" data-active={h.active || undefined} data-done={h.acted || undefined} data-winded={h.state === 'winded' || undefined}>
      <span className="a-no">{i + 1}</span>
      <div className="a-who">
        <strong>{h.label}</strong>
        <small>{h.conditions.length ? <em>{h.conditions.map(conditionName).join(', ')}</em> : h.heroClass}</small>
      </div>
      <div className="a-st">
        <span className="a-num">{h.cur}/{h.max}</span>
        <i className="a-bar"><b style={{ width: `${(h.cur / h.max) * 100}%` }} /></i>
      </div>
      <span className="a-state">{stateWord(h)}</span>
    </div>
  );
}

function Tracker() {
  return (
    <aside className="a-rail a-left">
      <nav className="a-tabs" aria-label="Left rail">
        {leftTabs.map((t, i) => <span key={t.l} data-on={i === 0 || undefined}>{t.l}{t.n != null && <em>{t.n}</em>}</span>)}
      </nav>
      <div className="a-slug">
        <span>Heroes are first</span>
        <button className="a-quiet">End combat…</button>
      </div>
      <div className="a-th"><span>No.</span><span>Heroes</span><span>Stamina</span><span>State</span></div>
      {heroes.map((h, i) => <HeroRow key={h.id} h={h} i={i} />)}
      <div className="a-th a-th--dir">
        <span /><span>Director</span>
        <span className="a-malice">Malice<button aria-label="Lower Malice"><Minus size={13} /></button><b>{combat.malice}</b><button aria-label="Raise Malice"><Plus size={13} /></button></span>
      </div>
      <div className="a-units">
        {directorUnits.map((u, i) => (
          <div className="a-unit" key={u.name}>
            <span className="a-no">{heroes.length + i + 1}</span>
            <span className="a-unit__n">{u.name}{u.conditions[0] && <small>{conditionName(u.conditions[0])}</small>}</span>
            <span className="a-num">{u.cur}/{u.max}</span>
          </div>
        ))}
      </div>
      <button className="a-endturn">End {activeHero.first}’s turn</button>
    </aside>
  );
}

function RightRail() {
  const h = activeHero;
  return (
    <aside className="a-rail a-right">
      <nav className="a-tabs" aria-label="Right rail">
        {rightTabs.map((t) => <span key={t} data-on={t === 'Damage' || undefined}>{t}</span>)}
      </nav>
      <section className="a-sec">
        <div className="a-seg"><span data-on>Damage</span><span>Heal</span></div>
        <label>Target<div className="a-input">{dyingHero.label}<ChevronDown size={14} /></div></label>
        <div className="a-amt">
          <label>Amount<div className="a-input a-input--empty">0</div></label>
          <button>Apply damage</button>
        </div>
      </section>
      <section className="a-sec a-now">
        <div className="a-h">Now acting</div>
        <div className="a-now__n"><strong>{h.label}</strong><span className="a-num">{h.cur}/{h.max}</span></div>
        <div className="a-now__c">{h.heroClass}, {h.conditions.map(conditionName).join(', ')}</div>
        <table><tbody>
          <tr><td>Main</td><td>Ready</td><td>Move</td><td>{turn.moveRemaining}/{h.speed}</td></tr>
          <tr><td>Maneuver</td><td>Ready</td><td>Triggered</td><td>Ready</td></tr>
          <tr><td>{h.resourceName}</td><td>{h.resource}</td><td>Recoveries</td><td>{h.recoveries}/{h.recoveriesMax}</td></tr>
        </tbody></table>
      </section>
      <section className="a-sec a-log">
        <div className="a-h">Log<span>24 entries</span></div>
        {logEntries.map((e) => <div key={e.text}><time>{e.time}</time>{e.text}</div>)}
      </section>
    </aside>
  );
}

function CallSheet() {
  const hidden = offView(TOP);
  return (
    <div className="a-app">
      <header className="a-top">
        <div className="a-word">Anvil</div>
        <nav className="a-strips" aria-label="Film strip">
          {scenes.map((s, i) => (
            <button key={s.name} className="a-strip" data-mode={s.key} data-on={('active' in s && s.active) || undefined}>
              <i>{i + 1}</i><span><b>{'short' in s ? s.short : s.name}</b><small>{s.mode}</small></span>
            </button>
          ))}
        </nav>
      </header>
      <div className="a-mid">
        <Tracker />
        <main className="a-stage">
          <div className="a-side">
            <div className="a-side__r"><b>Round {combat.round}</b><span>d10 {combat.initiativeRoll}</span></div>
            <div className="a-side__g" data-on>
              <b>Heroes</b><span>1/7</span>
              <i>{heroes.map((h) => <u key={h.id} data-s={h.active ? 'active' : h.acted ? 'done' : h.state === 'dying' ? 'dying' : ''} />)}</i>
            </div>
            <div className="a-side__g"><b>Director</b><span>0/14</span>
              <i>{directorUnits.map((u) => <u key={u.name} data-sq />)}</i>
            </div>
            <div className="a-zoom">
              <button aria-label="Zoom out"><Minus size={14} /></button><span>32%</span>
              <button aria-label="Zoom in"><Plus size={14} /></button>
              <button className="a-all"><Scan size={14} />Show all</button>
            </div>
          </div>
          <div className="a-map" style={{ width: W, height: H }}>
            <SurveyMap />
            <MapLabels />
            <LeaderKey />
            {inView(TOP).map((m) => <FoeMark key={m.id} m={m} />)}
            {heroes.map((h) => <HeroMark key={h.id} h={h} />)}
            <div className="a-dyingtag" style={{ left: px(dyingHero.x + 0.5) - 40, top: py(dyingHero.y + 0.5) + 25 }}>Dying</div>
            <Popover />
            <div className="a-mini">
              <MiniMap width={110} top={TOP} rows={ROWS} c={{ ground: 'var(--a-sheet)', water: 'var(--a-water)', trail: 'var(--a-contour)', hero: 'var(--a-ink)', foe: 'var(--a-red)', fog: 'rgb(30 27 22 / .16)', view: 'var(--a-ink)' }} />
              <div>{hidden.length} above view</div>
            </div>
            <div className="a-title"><b>{scene.name}</b><span>Grid {scene.gridCols} × {scene.gridRows}, fog shown</span></div>
          </div>
          <div className="a-bottom">
            <div className="a-tools">{tools.map((t) => <span key={t} data-on={t === 'Select' || undefined}>{t}</span>)}</div>
            <div className="a-roll">
              <span data-on>Power</span><span>Resource</span><span>d6</span>
              <span className="a-mod">Mod<b>0</b></span>
              <span className="a-eb"><u data-on>None</u><u>E</u><u>B</u><u>2E</u><u>2B</u></span>
            </div>
          </div>
        </main>
        <RightRail />
      </div>
      <footer className="a-status">
        <span><i data-on />Connected</span>
        <span><i data-on />Dev Director, Director</span>
        <span><i data-on />Dev Player</span>
        <span>1/1 players</span>
        <span className="a-audio"><Volume2 size={14} />Audio off</span>
        <div className="a-session">
          <span>Dark</span><span>Display</span><span>Fullscreen</span><span>Revert…</span>
          <button>End session…</button>
        </div>
      </footer>
    </div>
  );
}

export default function DirectionA() {
  return (
    <Stage width={1440} height={900} theme="light" unframed className="dir-a">
      {() => <CallSheet />}
    </Stage>
  );
}
