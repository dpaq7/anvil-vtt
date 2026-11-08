// The in-session phone, in the Storyboard language, at 375 × 812. Same parts as the
// laptop (hero rows, the dying row, Film Strip boards, secret cards), sized for a thumb:
// every control is at least 44 px, and the one action that matters sits at the bottom,
// above the tab bar, where a thumb already is. Tabs are the app's own: Sheet, Actions,
// Trackers, Notes for a Player; Live, Initiative, Audio, Notes for the Director.
import '../still.css';
import { useMemo, type ReactNode } from 'react';
import { BookOpen, Check, ChevronDown, Eye, EyeOff, Gauge, Hourglass, ListOrdered, MessageSquareQuote, Minus, Music, Plus, ScrollText, Swords, User } from 'lucide-react';
import { Stage, type Theme } from '../../../kit';
import { activeHero, combat, conditionName, directorUnits, heroes, scenes, type Hero, type Unit } from '../battle';
import { curOf, fogged, type BattleState, type Role } from './data';
import { FoeMark, HeroMark } from './map';
import { HeroRow, Meter, TurnActions } from './rails';
import { FilmCell, type ModeKey } from './shell';
import { directorState, playerState } from './screens';
import { negotiation as n, steps } from './mode-data';
import { themeFor } from './modes';
import { SecretCard } from './negotiation';
import { MaudreyFace } from './scene-art';
import './modes.css';
import './phone.css';

export const PHONE = { w: 375, h: 812 };
const smoke = heroes[0];

const playerTabs = [{ l: 'Sheet', I: User }, { l: 'Actions', I: Swords }, { l: 'Trackers', I: Gauge }, { l: 'Notes', I: BookOpen }];
const directorTabs = [{ l: 'Live', I: ScrollText }, { l: 'Initiative', I: ListOrdered }, { l: 'Audio', I: Music }, { l: 'Notes', I: BookOpen }];

function TabBar({ role, on }: { role: Role; on: string }) {
  const list = role === 'director' ? directorTabs : playerTabs;
  return (
    <nav className="ph-tabs" aria-label="Phone tabs">
      {list.map(({ l, I }) => <button key={l} data-on={l === on || undefined}><I size={20} strokeWidth={2.4} /><span>{l}</span></button>)}
    </nav>
  );
}

// The board of the scene that is live, the same board the laptop's Film Strip raises.
function Top({ mode, right }: { mode: ModeKey; right?: ReactNode }) {
  const s = scenes.find((c) => c.key === mode)!;
  return (
    <header className="ph-top">
      <div className="sb-word">Anvil</div>
      <div className="sb-strip sb-strip--one ph-board"><FilmCell s={s} on={mode} /></div>
      {right}
    </header>
  );
}

function PhoneApp({ role, mode, children }: { role: Role; mode: ModeKey; children: ReactNode }) {
  return <div className="ph-app" data-role={role} data-mode={mode}>{children}</div>;
}

// ---- Battle, Player ---------------------------------------------------------------
// The page says it is your turn: a blue band at the top, the screen edged in blue, and
// "Take my turn" in the thumb's reach. The party below is heads only, so the dying
// hero still shouts without taking the screen.
function Party({ s }: { s: BattleState }) {
  return (
    <section className="ph-sec ph-party">
      <div className="ph-h"><b>Heroes</b><span>{s.acted.length} of {heroes.length} acted</span><p className="ph-shout">Pip is dying</p></div>
      <ol>
        {heroes.map((h) => {
          const st = s.activeId === h.id ? 'active' : s.acted.includes(h.id) ? 'done' : h.state === 'dying' ? 'dying' : undefined;
          return (
            <li key={h.id} data-s={st} aria-label={h.label}>
              <i><HeroMark h={h} out={h.state === 'dying'} size={34} />{st === 'done' && <em className="sb-badge sb-badge--done" data-on><Check size={10} strokeWidth={4} /></em>}</i>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const traits: [string, string][] = [['MIG', '+2'], ['AGI', '+2'], ['REA', '−1'], ['INT', '+2'], ['PRE', '−1']];

// drop: a short connection drop. The page stays readable; only the action waits.
export function PlayerBattle({ drop }: { drop?: ReactNode } = {}) {
  const s = useMemo(playerState, []);
  const cur = curOf(s, smoke);
  return (
    <PhoneApp role="player" mode="battle">
      <Top mode="battle" right={<span className="ph-round">Round {combat.round}</span>} />
      <section className="ph-turn" aria-live="polite">
        <i><HeroMark h={smoke} size={40} /></i>
        <div><strong>Your turn, {smoke.first}</strong><small>{activeHero.first} has finished</small></div>
      </section>
      <div className="ph-body">
        {drop}
        <section className="ph-sec ph-me">
          <div className="ph-h"><b>{smoke.label}</b><span>Level {smoke.level} {smoke.heroClass}</span></div>
          <div className="sb-vital"><span>Stamina</span><b>{cur}/{smoke.max}</b><Meter cur={cur} max={smoke.max} /></div>
          <div className="sb-stats"><span>{smoke.resourceName} <b>{smoke.resource}</b></span><span>Recoveries <b>{smoke.recoveries}/{smoke.recoveriesMax}</b></span><span>Speed <b>{smoke.speed}</b></span></div>
        </section>
        <section className="ph-sec ph-acts">
          <div className="ph-h"><b>This turn</b><span>Ready when you take it</span></div>
          <TurnActions moveLeft={s.move} states />
          <div className="ph-free"><button>Catch Breath</button><button>Defend</button></div>
        </section>
        {!drop && (
          <section className="ph-sec ph-traits">
            <div className="sb-traits">{traits.map(([k, v]) => <button key={k}><small>{k}</small><b>{v}</b></button>)}</div>
          </section>
        )}
        <Party s={s} />
      </div>
      {drop
        ? <button className="ph-go ph-go--take" data-wait disabled>Take my turn, when back</button>
        : <button className="ph-go ph-go--take" data-target="take-turn">Take my turn</button>}
      <TabBar role="player" on="Actions" />
    </PhoneApp>
  );
}

// ---- Battle, Director -------------------------------------------------------------
// Grouped by side, danger first: dying, then winded, then whoever is acting, then the
// rest by how hurt they are. The Director's side sorts the same way, lowest first.
const ratio = (c: number, m: number) => c / m;
const heroRank = (h: Hero, s: BattleState) => (h.state === 'dying' ? 0 : h.state === 'winded' ? 1 : s.activeId === h.id ? 2 : s.acted.includes(h.id) ? 4 : 3);
const isHidden = (u: Unit) => fogged.some((m) => m.label === u.name);

function FoeRow({ u }: { u: Unit }) {
  const hurt = u.cur < u.max;
  const sub = [u.count ? `${u.count} in the squad` : null, ...u.conditions.map(conditionName)].filter(Boolean).join(', ');
  return (
    <div className="ph-foe" data-hurt={hurt || undefined}>
      <FoeMark family={u.family} rank={u.name === 'Ratcrobats' ? 'ratcrobat' : undefined} size={30} />
      <div className="sb-who"><strong>{u.name.replace('Angulotl ', '')}</strong>{sub && <small>{sub}</small>}</div>
      {isHidden(u) ? <em className="ph-hid" aria-label="Hidden from players"><EyeOff size={14} strokeWidth={2.6} /></em> : <span />}
      <div className="sb-st"><b>{u.cur}/{u.max}</b><Meter cur={u.cur} max={u.max} /></div>
    </div>
  );
}

export function DirectorBattle() {
  const s = useMemo(directorState, []);
  const party = useMemo(() => [...heroes].sort((a, b) => heroRank(a, s) - heroRank(b, s) || ratio(curOf(s, a), a.max) - ratio(curOf(s, b), b.max)), [s]);
  const foes = useMemo(() => [...directorUnits].sort((a, b) => ratio(a.cur, a.max) - ratio(b.cur, b.max)), []);
  const acting = heroes.find((h) => h.id === s.activeId)!;
  return (
    <PhoneApp role="director" mode="battle">
      <Top mode="battle" />
      <div className="ph-body ph-body--list">
        <div className="ph-track">
          <span><b>Round {combat.round}</b></span>
          <span data-on><b>Heroes</b> {s.acted.length}/{heroes.length}</span>
          <span><b>Director</b> 0/{directorUnits.length}</span>
        </div>
        <div className="ph-h ph-h--side"><b>Heroes</b><span>Danger first</span></div>
        {party.map((h) => <HeroRow key={h.id} h={h} s={s} role="director" live={{}} />)}
        <div className="ph-h ph-h--side ph-h--dir"><b>Director’s side</b><span className="ph-malice">Malice<button aria-label="Lower Malice"><Minus size={16} strokeWidth={3} /></button><strong>{combat.malice}</strong><button aria-label="Raise Malice"><Plus size={16} strokeWidth={3} /></button></span></div>
        {foes.map((u) => <FoeRow key={u.name} u={u} />)}
      </div>
      <button className="ph-go" data-target="end-turn">End {acting.first}’s turn</button>
      <TabBar role="director" on="Live" />
    </PhoneApp>
  );
}

// ---- Negotiation ------------------------------------------------------------------
function Npc() {
  return (
    <section className="ph-npc">
      <i><MaudreyFace size={58} /></i>
      <div><strong>{n.npc}</strong><small>{n.attitude}</small></div>
    </section>
  );
}

function Interest() {
  return (
    <section className="ph-sec ph-interest">
      <div className="ph-h"><b>Interest</b><span>{n.interest} of 5. {steps[n.interest]}</span></div>
      <ol className="md-stairs">
        {steps.map((label, i) => (
          <li key={label} data-s={i < n.interest ? 'past' : i === n.interest ? 'now' : undefined}><i style={{ height: 26 + i * 4 }}>{i}</i></li>
        ))}
      </ol>
    </section>
  );
}

// Patience is how many arguments are left, so it rides on the argument's own heading.
function Patience() {
  return (
    <span className="ph-glass" aria-label={`Patience ${n.patience} of ${n.maxPatience}`}>
      {Array.from({ length: n.maxPatience }, (_, i) => <i key={i} data-on={i < n.patience || undefined}><Hourglass size={14} strokeWidth={2.6} /></i>)}
      <span>{n.patience} left</span>
    </span>
  );
}

// The Director's phone reads every secret. Reveal sits on the card's own heading row,
// a full thumb target; the hatched edge and shut eye are the fog preview's language.
function Secret({ s }: { s: (typeof n.motivations)[number] }) {
  return (
    <div className="md-secret ph-secret" data-state={s.revealed ? 'known' : 'hidden'}>
      <div className="md-secret__h">
        <b>{s.type}</b>
        {s.revealed
          ? <span><Eye size={14} strokeWidth={2.6} />Players know</span>
          : <><em className="ph-hidtag"><EyeOff size={13} strokeWidth={2.6} />Hidden</em><button className="md-reveal">Reveal</button></>}
      </div>
      <p>{s.text}</p>
    </div>
  );
}

export function PlayerNegotiation() {
  const known = n.motivations.filter((m) => m.revealed);
  const hidden = [...n.motivations, ...n.pitfalls].filter((m) => !m.revealed);
  const pits = n.pitfalls.filter((m) => !m.revealed).length;
  return (
    <PhoneApp role="player" mode="negotiation">
      <Top mode="negotiation" />
      <section className="md-band ph-band" data-mode="negotiation"><strong>{n.goal}</strong></section>
      <div className="ph-body">
        <Npc />
        <Interest />
        <section className="ph-sec ph-know">
          <div className="ph-h"><b>What you know</b><span>{known.length} of {hidden.length + known.length} found</span></div>
          {known.map((m) => <SecretCard key={m.id} s={m} role="player" kind="motivation" />)}
          <div className="md-secret ph-dark" data-state="dark"><EyeOff size={16} strokeWidth={2.6} /><span>Not found yet: 1 motivation, {pits} pitfalls</span></div>
        </section>
        <section className="ph-sec ph-arg">
          <div className="ph-h"><b>Make an argument</b><Patience /></div>
          <div className="sb-input ph-input"><span><small>Skill</small> Persuade</span><ChevronDown size={18} strokeWidth={3} /></div>
          <div className="md-say"><MessageSquareQuote size={16} strokeWidth={2.6} /><span>{n.approach}</span></div>
        </section>
      </div>
      <button className="ph-go" data-target="argue">Make argument</button>
      <TabBar role="player" on="Actions" />
    </PhoneApp>
  );
}

function Step({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="ph-step">
      <div><b>{label}</b><small>{note}</small></div>
      <button aria-label={`Lower ${label}`}><Minus size={18} strokeWidth={3} /></button>
      <strong>{value}</strong>
      <button aria-label={`Raise ${label}`}><Plus size={18} strokeWidth={3} /></button>
    </div>
  );
}

export function DirectorNegotiation() {
  return (
    <PhoneApp role="director" mode="negotiation">
      <Top mode="negotiation" />
      <div className="ph-body">
        <Npc />
        <section className="ph-sec ph-secrets">
          <div className="ph-h"><b>Motivations</b><span>1 of 2 known</span></div>
          {n.motivations.map((m) => <Secret key={m.id} s={m} />)}
          <div className="ph-h"><b>Pitfalls</b><span>None known</span></div>
          {n.pitfalls.map((m) => <Secret key={m.id} s={m} />)}
        </section>
      </div>
      <div className="ph-dock ph-dock--steps">
        <Step label="Interest" value={`${n.interest}`} note={steps[n.interest]} />
        <Step label="Patience" value={`${n.patience}/${n.maxPatience}`} note={`${n.patience} arguments left`} />
      </div>
      <TabBar role="director" on="Live" />
    </PhoneApp>
  );
}

// ---- Stills -----------------------------------------------------------------------
export { PhoneApp, TabBar, Top };

export function PhoneFrame({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <Stage width={PHONE.w} height={PHONE.h} theme={theme} unframed className="look-anvil">{() => children}</Stage>;
}

const boards = {
  'player-battle': PlayerBattle, 'director-battle': DirectorBattle,
  'player-negotiation': PlayerNegotiation, 'director-negotiation': DirectorNegotiation,
};
// Each mode keeps its desktop lead theme: Battle light, Negotiation dark. ?theme= films the other.
export function PhoneStill({ role, mode }: { role: Role; mode: 'battle' | 'negotiation' }) {
  const theme = themeFor(mode === 'battle' ? 'light' : 'dark');
  const B = boards[`${role}-${mode}`];
  return <PhoneFrame theme={theme}><B /></PhoneFrame>;
}
