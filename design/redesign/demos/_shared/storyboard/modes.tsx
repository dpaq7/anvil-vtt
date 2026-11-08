// The four other modes on the Battle shell. The frame is the same in every mode: Film Strip
// on top, the party down the left rail, a screen with a tracker in its top-right corner,
// a bar under the screen, mode tools at the top of the right rail and the log under them.
// What a mode changes is the screen's shape, the line under each hero's name, the rail
// tools and the board raised in the Film Strip.
import '../still.css';
import { useMemo, type ReactNode } from 'react';
import { EyeOff } from 'lucide-react';
import { Stage, type Theme } from '../../../kit';
import { heroes, scenes, type Hero } from '../battle';
import { curOf, fixtureState, geoFor, type BattleState, type Geo, type Role, type Size } from './data';
import { HeroMark } from './map';
import { HeroList, Meter } from './rails';
import { FilmCell, FilmStrip, RollBar, Shell, type ModeKey } from './shell';
import { StatusBar } from './screens';
import type { ModeLog } from './mode-data';
import './modes.css';

export type Mode = Exclude<ModeKey, 'battle'>;
export const smoke = heroes[0];
// Stamina and dying carry across scenes in the app, so every mode shows the dense
// fixture's party: Pip at 0 and dying, Wren winded. Outside Battle nobody has a turn.
export const partyState = (): BattleState => fixtureState(null, []);

// Director-only things wear the fog preview's mark: ink hatching and an eye that is shut.
export function OnlyYou({ children = 'Only you' }: { children?: ReactNode }) {
  return <em className="md-only"><EyeOff size={13} strokeWidth={2.6} />{children}</em>;
}

export function Head({ title, note }: { title: ReactNode; note?: ReactNode }) {
  return <div className="sb-sub sb-sub--dir"><b>{title}</b>{typeof note === 'string' ? <span>{note}</span> : note}</div>;
}

export function Tabs({ list, on, mid }: { list: string[]; on: string; mid?: boolean }) {
  return (
    <nav className={mid ? 'sb-tabs sb-tabs--mid' : 'sb-tabs'} aria-label="Rail tabs">
      {list.map((t) => { const [l, n] = t.split('|'); return <span key={t} data-on={l === on || undefined}>{l}{n && <em>{n}</em>}</span>; })}
    </nav>
  );
}

export function ModeLogList({ log, show }: { log: ModeLog; show: number }) {
  return (
    <section className="sb-sec sb-log md-log">
      <div className="sb-sub sb-sub--flat"><b>Log</b><span>{log.length + 14} entries</span></div>
      {log.slice(0, show).map((e) => <div className="sb-log__e" key={e.text + e.time}><span>{e.text}</span><time>{e.time}</time></div>)}
    </section>
  );
}

// A Player's own hero, without the turn actions Battle adds.
export function HeroCard({ h, s }: { h: Hero; s: BattleState }) {
  return (
    <section className="sb-sec md-hero">
      <div className="sb-now__h">
        <div className="sb-now__f"><div data-on><HeroMark h={h} size={46} /></div></div>
        <div><strong>{h.label}</strong><small>Level {h.level} {h.heroClass}</small></div>
      </div>
      <div className="sb-vital"><span>Stamina</span><b>{curOf(s, h)}/{h.max}</b><Meter cur={curOf(s, h)} max={h.max} state={h.state} /></div>
      <div className="sb-stats"><span>{h.resourceName} <b>{h.resource}</b></span><span>Recoveries <b>{h.recoveries}/{h.recoveriesMax}</b></span><span>Speed <b>{h.speed}</b></span></div>
    </section>
  );
}

// The corner tracker on the screen, Battle's Round / Heroes / Director in each mode's terms.
export function Side({ items }: { items: { label: ReactNode; value?: ReactNode; on?: boolean }[] }) {
  return (
    <div className="sb-side">
      {items.map((it, i) => <div key={i} data-on={it.on || undefined}><b>{it.label}</b>{it.value != null && <span>{it.value}</span>}</div>)}
    </div>
  );
}

export type ModeParts = {
  goal: string; sub: string;                      // the Player's band
  leftTabs: string[]; rightTabs: string[]; rightOn: string;
  heroNote: string; heroSub: (h: Hero) => string; // the line under each hero, this mode's way
  lower: ReactNode;                               // the rest of the left rail
  tools: ReactNode;                               // top of the right rail: Director tools or the Player's main action
  log: ModeLog; logShow: number;
  screen: ReactNode;
  bar: string[]; barOn?: string;
};

export function ModeBoard({ mode, role, size, theme, parts, wash }: { mode: Mode; role: Role; size: Size; theme: Theme; parts: ModeParts; wash?: ReactNode }) {
  const g = useMemo(() => geoFor(size, role), [size, role]);
  const s = useMemo(partyState, []);
  const sceneOf = scenes.find((c) => c.key === mode)!;
  const dir = role === 'director';
  const sub = (h: Hero) => (!dir && h.id === smoke.id ? `${parts.heroSub(h)}, you` : parts.heroSub(h));
  return (
    <Shell g={g} role={role} mode={mode} wash={wash}
      top={dir
        ? <><div className="sb-word">Anvil</div><FilmStrip on={mode} /><button className="sb-endsession">End session…</button></>
        : <>
          <div className="sb-word">Anvil</div>
          <div className="sb-strip sb-strip--one"><FilmCell s={sceneOf} on={mode} /></div>
          <div className="md-band" data-mode={mode}><strong>{parts.goal}</strong><small>{parts.sub}</small></div>
        </>}
      left={
        <section className="sb-frame sb-rail" aria-label="Rail">
          {dir && <Tabs list={parts.leftTabs} on={parts.leftTabs[0]} />}
          <HeroList s={s} role={role} ownId={smoke.id} live={{}} note={parts.heroNote} sub={sub} />
          {parts.lower}
        </section>
      }
      right={
        <section className="sb-frame sb-rail" aria-label="Rail">
          {dir && <Tabs list={parts.rightTabs} on={parts.rightOn} />}
          {parts.tools}
          {!dir && <HeroCard h={smoke} s={s} />}
          {!dir && <Tabs list={['Abilities', 'Sheet', 'Log']} on="Log" mid />}
          <ModeLogList log={parts.log} show={parts.logShow} />
        </section>
      }
      map={<div className="md-screen" data-mode={mode} style={{ width: g.mapW, height: g.mapH }}>{parts.screen}</div>}
      bar={<RollBar size={size} tools={parts.bar} on={parts.barOn ?? '—'} fold={size === 1280 && dir} />}
      status={<StatusBar role={role} theme={theme} />}
    />
  );
}

// A gate still is drawn in its mode's lead theme. ?theme=light|dark films the other one,
// so contrast on scene art can be measured in both.
export function themeFor(lead: Theme): Theme {
  const q = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('theme');
  return q === 'light' || q === 'dark' ? q : lead;
}

export function ModeFrame({ size, theme, children }: { size: Size; theme: Theme; children: ReactNode }) {
  return <Stage width={size} height={size === 1440 ? 900 : 720} theme={theme} unframed className="look-anvil">{() => children}</Stage>;
}

export type { Geo, Role, Size };
