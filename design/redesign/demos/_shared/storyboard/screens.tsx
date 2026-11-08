import '../still.css';
import { useMemo, type ReactNode } from 'react';
import { ChevronRight, CircleDot } from 'lucide-react';
import { Stage, type Theme } from '../../../kit';
import { activeHero, combat, conditionName, hero, heroes, monsters, scenes } from '../battle';
import { fixtureState, geoFor, type BattleState, type Geo, type Size } from './data';
import { BattleMap, HeroMark, type MapRect } from './map';
import { DirectorRail, LeftRail, Meter, PlayerRail, type Live } from './rails';
import { FilmCell, FilmStrip, RollBar, Shell, directorTools, playerTools } from './shell';

const smoke = heroes[0];
const longName = monsters.find((m) => m.name.startsWith('Aeolyxria'))!.name;

export const directorState = () => fixtureState(combat.activeEntityId, combat.actedThisRound);
// The moment after Ilsabet ends her turn: the Player's hero may claim the next one.
export const playerState = (): BattleState => fixtureState(smoke.id, [...combat.actedThisRound, activeHero.id]);

function Popover({ g, at }: { g: Geo; at: MapRect }) {
  return (
    <div className="sb-pop" style={{ left: at.x, top: at.y, width: at.w }}>
      <strong>{smoke.label}</strong>
      <div className="sb-pop__st"><span>Stamina</span><b>{smoke.cur} / {smoke.max}</b></div>
      <Meter cur={smoke.cur} max={smoke.max} />
      <ul><li>Actions<ChevronRight size={15} strokeWidth={3} /></li><li>Status<ChevronRight size={15} strokeWidth={3} /></li><li>Adjust HP<ChevronRight size={15} strokeWidth={3} /></li></ul>
    </div>
  );
}

// link: what the connection says, when it is not simply Connected (the states sheet).
export function StatusBar({ role, theme, link }: { role: 'director' | 'player'; theme: Theme; link?: ReactNode }) {
  const mode = theme === 'dark' ? 'Light' : 'Dark';
  return (
    <>
      {link ?? <span><CircleDot size={13} strokeWidth={3} />Connected</span>}
      {role === 'director' ? <><span>Dev Director, Director</span><span>Dev Player</span></> : <><span>Dev Player</span><span>Dev Director, Director</span></>}
      <span>1/1 players</span>
      <div><span>{mode}</span>{role === 'director' && <span>Display</span>}<span>Fullscreen</span>{role === 'director' && <span>Revert…</span>}</div>
    </>
  );
}

export function DirectorBoard({ size, theme, s, live = {}, target, amount, popover, overlay, under, logExtra, logCount, logShow, endLabel, wash, heroTag }: {
  size: Size; theme: Theme; s: BattleState; live?: Live; target?: ReactNode; amount?: ReactNode; popover?: boolean; overlay?: ReactNode; under?: ReactNode;
  logExtra?: ReactNode; logCount?: ReactNode; logShow?: number; endLabel?: ReactNode; wash?: ReactNode; heroTag?: { first: string; text: string };
}) {
  const g = useMemo(() => geoFor(size, 'director'), [size]);
  const pop = useMemo<MapRect | undefined>(() => (popover ? { x: 15 * g.cell - (size === 1440 ? 182 : 145), y: ((size === 1440 ? 13.45 : 13.9) - g.first) * g.cell, w: size === 1440 ? 178 : 148, h: 160 } : undefined), [g, popover, size]);
  return (
    <Shell g={g} role="director" wash={wash}
      top={<><div className="sb-word">Anvil</div><FilmStrip /><button className="sb-endsession">End session…</button></>}
      left={<LeftRail s={s} role="director" size={size} live={live} endLabel={endLabel} />}
      right={<DirectorRail s={s} size={size} live={live} target={target ?? longName} amount={amount} logExtra={logExtra} logCount={logCount} logShow={logShow} />}
      map={<BattleMap g={g} role="director" s={s} popoverAt={pop} popover={pop && <Popover g={g} at={pop} />} overlay={overlay} under={under} count={live.num} heroTag={heroTag} />}
      bar={<RollBar size={size} tools={directorTools} />}
      status={<StatusBar role="director" theme={theme} />}
    />
  );
}

// link, take and overlay change the board for the states sheet; a still leaves them out.
export function PlayerBoard({ size, theme, link, take, overlay }: { size: Size; theme: Theme; link?: ReactNode; take?: ReactNode; overlay?: ReactNode }) {
  const g = useMemo(() => geoFor(size, 'player'), [size]);
  const s = useMemo(playerState, []);
  const battle = scenes.find((c) => c.key === 'battle')!;
  return (
    <Shell g={g} role="player" turn
      top={<>
        <div className="sb-word">Anvil</div>
        <div className="sb-strip sb-strip--one"><FilmCell s={battle} /></div>
        <div className="sb-turn">
          <div className="sb-turn__f"><HeroMark h={smoke} size={size === 1440 ? 38 : 32} /></div>
          <strong>Your turn, {smoke.first}</strong>
          <small>{activeHero.first} has finished</small>
          {take ?? <button className="sb-take">Take my turn</button>}
        </div>
      </>}
      left={<LeftRail s={s} role="player" size={size} ownId={smoke.id} live={{}} />}
      right={<PlayerRail h={smoke} s={s} size={size} />}
      map={<BattleMap g={g} role="player" s={s} heroTag={{ first: smoke.first, text: 'You' }} overlay={overlay} />}
      bar={<RollBar size={size} tools={playerTools} />}
      status={<StatusBar role="player" theme={theme} link={link} />}
    />
  );
}

function Frame({ size, theme, children }: { size: Size; theme: Theme; children: ReactNode }) {
  return <Stage width={size} height={size === 1440 ? 900 : 720} theme={theme} unframed className="look-anvil">{() => children}</Stage>;
}

export function DirectorStill({ size = 1440, theme = 'light', confirm }: { size?: Size; theme?: Theme; confirm?: boolean }) {
  const s = useMemo(directorState, []);
  return (
    <Frame size={size} theme={theme}>
      <DirectorBoard size={size} theme={theme} s={s} popover
        wash={confirm && (
          <div className="sb-scrim">
            <div className="sb-confirm" role="alertdialog" aria-label="End session">
              <h2>End this session?</h2>
              <p>It ends for everyone at the table, not only for you.</p>
              <div><button className="sb-keep">Keep playing</button><button className="sb-stop">End session</button></div>
            </div>
          </div>
        )} />
    </Frame>
  );
}

export function PlayerStill({ size = 1440, theme = 'light' }: { size?: Size; theme?: Theme }) {
  return <Frame size={size} theme={theme}><PlayerBoard size={size} theme={theme} /></Frame>;
}

export { conditionName, hero };
