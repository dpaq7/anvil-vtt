import type { ReactNode } from 'react';
import { Check, ChevronDown, Footprints, Minus, Plus, Shield, Swords, Zap } from 'lucide-react';
import { combat, conditionName, heroes, leftTabs, monsters, rightTabs, turn, type Hero, type Unit } from '../battle';
import { curOf, directorRows, logFor, playerRows, type BattleState, type Role, type Size } from './data';
import { FoeMark, HeroMark } from './map';

export type Live = {
  num?: (n: number) => ReactNode;              // a rolling number, for the motion demo
  text?: (t: string, key: string) => ReactNode; // rolling words, for the motion demo
};
const plainNum = (n: number) => n;
const plainText = (t: string) => t;

export function Meter({ cur, max, state }: { cur: number; max: number; state?: string }) {
  return <i className="sb-meter" data-winded={state === 'winded' || undefined}><u style={{ width: `${(cur / max) * 100}%` }} /></i>;
}

// sub: another mode's line under the name. Battle works it out from turn state and conditions.
export function HeroRow({ h, s, role, ownId, live, sub: modeSub }: { h: Hero; s: BattleState; role: Role; ownId?: string; live: Live; sub?: string }) {
  const num = live.num ?? plainNum;
  const txt = live.text ?? plainText;
  const cur = curOf(s, h);
  if (h.state === 'dying') {
    return (
      <div className="sb-dying">
        <div className="sb-dying__f"><HeroMark h={h} out size={38} /></div>
        <div className="sb-who"><strong>{h.label}</strong><span className="sb-dying__w">Dying</span></div>
        <b className="sb-dying__n">{cur}/{h.max}</b>
      </div>
    );
  }
  const active = s.activeId === h.id;
  const done = s.acted.includes(h.id);
  const own = h.id === ownId;
  const note = active ? (own ? 'Your turn' : 'Acting now') : done ? 'Done' : null;
  const sub = modeSub ?? ([note, ...h.conditions.map(conditionName)].filter(Boolean).join(', ') || (own ? `${h.heroClass}, you` : h.heroClass));
  return (
    <div className="sb-row" data-target={`row-${h.first}`} data-active={active || undefined} data-done={done || undefined}>
      <div className="sb-row__f"><HeroMark h={h} size={36} /><em className="sb-badge sb-badge--done" data-on={done || undefined}><Check size={10} strokeWidth={4} /></em></div>
      <div className="sb-who">
        <strong>{h.label}{h.state === 'winded' && <em className="sb-winded">Winded</em>}</strong>
        <small>{txt(sub, h.id)}</small>
      </div>
      <div className="sb-st"><b>{num(cur)}/{h.max}</b><Meter cur={cur} max={h.max} state={h.state} /></div>
    </div>
  );
}

export function UnitRow({ u, role, cur, target }: { u: Unit; role: Role; cur?: ReactNode; target?: string }) {
  const note = u.conditions.length === 1 && role === 'player' ? conditionName(u.conditions[0]) : null;
  return (
    <div className="sb-unit" data-target={target}>
      <FoeMark family={u.family} rank={u.name === 'Ratcrobats' ? 'ratcrobat' : undefined} size={22} />
      <span>{u.name}</span>
      {role === 'director' ? <b>{cur ?? u.cur}/{u.max}</b> : note ? <small>{note}</small> : null}
    </div>
  );
}

// The party, the same seven rows in every mode. Only the line under each name changes.
export function HeroList({ s, role, ownId, live, note, sub }: { s: BattleState; role: Role; ownId?: string; live: Live; note: ReactNode; sub?: (h: Hero) => string }) {
  return (
    <>
      <div className="sb-sub"><b>Heroes</b><span>{note}</span></div>
      {heroes.map((h) => <HeroRow key={h.id} h={h} s={s} role={role} ownId={ownId} live={live} sub={sub?.(h)} />)}
    </>
  );
}

export function LeftRail({ s, role, size, ownId, live, endLabel }: { s: BattleState; role: Role; size: Size; ownId?: string; live: Live; endLabel?: ReactNode }) {
  const num = live.num ?? plainNum;
  return (
    <section className="sb-frame sb-rail" aria-label="Rail">
      {role === 'director' && <LeftTabs />}
      <HeroList s={s} role={role} ownId={ownId} live={live} note={<>{num(s.acted.length)} of {heroes.length} acted</>} />
      <DirectorList s={s} role={role} size={size} live={live} endLabel={endLabel} />
    </section>
  );
}

export function LeftTabs() {
  return <nav className="sb-tabs" aria-label="Left rail">{leftTabs.map((t, i) => <span key={t.l} data-on={i === 0 || undefined}>{t.l}{t.n != null && <em>{t.n}</em>}</span>)}</nav>;
}

// Battle's lower left rail: the Director's side, Malice, and the turn's end.
export function DirectorList({ s, role, size, live, endLabel }: { s: BattleState; role: Role; size: Size; live: Live; endLabel?: ReactNode }) {
  const num = live.num ?? plainNum;
  const units = role === 'director' ? directorRows : playerRows(size);
  const cicero = monsters[0];
  return (
    <>
      <div className="sb-sub sb-sub--dir">
        <b>Director</b>
        {role === 'director' && <span className="sb-malice">Malice<button aria-label="Lower Malice"><Minus size={13} strokeWidth={3} /></button><strong>{combat.malice}</strong><button aria-label="Raise Malice"><Plus size={13} strokeWidth={3} /></button></span>}
      </div>
      <div className="sb-units">
        {units.map((u) => <UnitRow key={u.name} u={u} role={role} target={u.name === 'Cicero' ? 'unit-Cicero' : undefined} cur={u.name === 'Cicero' && role === 'director' ? num(curOf(s, cicero)) : undefined} />)}
      </div>
      {role === 'director' && (
        <div className="sb-foot">
          <button className="sb-end" data-target="end-turn">{endLabel ?? `End ${heroes.find((h) => h.id === s.activeId)?.first ?? 'hero'}’s turn`}</button>
          <button className="sb-link">End combat…</button>
        </div>
      )}
    </>
  );
}

const actionIcon = { Main: Swords, Maneuver: Shield, Move: Footprints, Triggered: Zap };

// A Player's card names each action's state; the Director only needs what is left of Move.
export function TurnActions({ moveLeft, states, move }: { moveLeft: number; states?: boolean; move?: ReactNode }) {
  const list: [keyof typeof actionIcon, string | null][] = [['Main', 'Ready'], ['Maneuver', 'Ready'], ['Move', `${moveLeft}/${turn.moveRemaining}`], ['Triggered', 'Ready']];
  return (
    <div className="sb-acts" data-states={states || undefined}>
      {list.map(([a, state]) => {
        const I = actionIcon[a];
        return <button key={a}><I size={17} strokeWidth={2.6} /><b>{a}</b>{(states || a === 'Move') && <span>{a === 'Move' && move ? move : state}</span>}</button>;
      })}
    </div>
  );
}

export function NowCard({ s, live }: { s: BattleState; live: Live }) {
  const h = heroes.find((e) => e.id === s.activeId) ?? heroes[1];
  const txt = live.text ?? plainText;
  const num = live.num ?? plainNum;
  const sub = [h.heroClass, ...h.conditions.map(conditionName)].join(', ');
  return (
    <section className="sb-sec sb-now">
      <div className="sb-now__h">
        <div className="sb-now__f">{heroes.map((e) => <div key={e.id} data-on={e === h || undefined}><HeroMark h={e} size={46} /></div>)}</div>
        <div><strong>{txt(h.label, 'now-name')}</strong><small>{txt(sub, 'now-sub')}</small></div>
      </div>
      <TurnActions moveLeft={s.move} move={live.num ? <>{live.num(s.move)}/{turn.moveRemaining}</> : undefined} />
      <div className="sb-stats"><span>{txt(h.resourceName, 'now-res')} <b>{num(h.resource)}</b></span><span>Recoveries <b>{num(h.recoveries)}/{num(h.recoveriesMax)}</b></span><span>Speed <b>{num(h.speed)}</b></span></div>
    </section>
  );
}

export function Log({ role, extra, count = 24, show }: { role: Role; extra?: ReactNode; count?: ReactNode; show: number }) {
  return (
    <section className="sb-sec sb-log">
      <div className="sb-sub sb-sub--flat"><b>Log</b><span>{count} entries</span></div>
      {extra}
      {logFor(role).slice(0, show).map((e) => <div className="sb-log__e" key={e.text}><span>{e.text}</span><time>{e.time}</time></div>)}
    </section>
  );
}

export function DirectorRail({ s, size, live, target, amount, logExtra, logCount, logShow }: { s: BattleState; size: Size; logShow?: number; live: Live; target: ReactNode; amount?: ReactNode; logExtra?: ReactNode; logCount?: ReactNode }) {
  return (
    <section className="sb-frame sb-rail" aria-label="Rail">
      <nav className="sb-tabs" aria-label="Right rail">{rightTabs.map((t) => <span key={t} data-on={t === 'Damage' || undefined}>{t}</span>)}</nav>
      <section className="sb-sec">
        <div className="sb-seg"><span data-on>Damage</span><span>Heal</span></div>
        <div className="sb-input sb-input--target" data-target="damage-target"><span>{target}</span><ChevronDown size={16} strokeWidth={3} /></div>
        <div className="sb-amt"><div className="sb-input" data-target="amount" data-cursor="ibeam">{amount ?? <span className="sb-ph">Amount</span>}</div><button data-target="apply">Apply damage</button></div>
      </section>
      <NowCard s={s} live={live} />
      <Log role="director" extra={logExtra} count={logCount} show={logShow ?? (size === 1440 ? 11 : 6)} />
    </section>
  );
}

const traits: [string, string][] = [['MIG', '+2'], ['AGI', '+2'], ['REA', '−1'], ['INT', '+2'], ['PRE', '−1']];

export function PlayerRail({ h, s, size }: { h: Hero; s: BattleState; size: Size }) {
  return (
    <section className="sb-frame sb-rail" aria-label="Rail">
      <section className="sb-sec sb-now" data-player>
        <div className="sb-now__h">
          <div className="sb-now__f"><div data-on><HeroMark h={h} size={46} /></div></div>
          <div><strong>{h.label}</strong><small>Level {h.level} {h.heroClass}</small></div>
        </div>
        <div className="sb-vital"><span>Stamina</span><b>{curOf(s, h)}/{h.max}</b><Meter cur={curOf(s, h)} max={h.max} state={h.state} /></div>
        <TurnActions moveLeft={s.move} states />
        <div className="sb-free"><button>Catch Breath</button><button>Defend</button></div>
      </section>
      <section className="sb-sec">
        <div className="sb-traits">{traits.map(([k, v]) => <span key={k}><small>{k}</small><b>{v}</b></span>)}</div>
        <div className="sb-stats"><span>{h.resourceName} <b>{h.resource}</b></span><span>Recoveries <b>{h.recoveries}/{h.recoveriesMax}</b></span><span>Speed <b>{h.speed}</b></span></div>
      </section>
      <nav className="sb-tabs sb-tabs--mid" aria-label="Right rail"><span>Abilities</span><span>Sheet</span><span data-on>Log</span></nav>
      <Log role="player" show={size === 1440 ? 11 : 5} />
    </section>
  );
}
