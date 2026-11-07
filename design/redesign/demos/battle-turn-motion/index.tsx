import '../_shared/still.css';
import { useMemo } from 'react';
import { Collapse, Count, Roll, Stage, type Act } from '../../kit';
import { activeHero, combat, heroes, monsters } from '../_shared/battle';
import { geoFor, type BattleState } from '../_shared/storyboard/data';
import { Burst } from '../_shared/storyboard/map';
import { DirectorBoard } from '../_shared/storyboard/screens';
import './turn.css';

// One turn, seen by the Director. Ilsabet's turn ends and the tracker moves to Smoke.
// Smoke steps up to Cicero, the roll resolves, the Director applies the damage, and
// Cicero's stamina drops in the tracker, on the map and in the log.
const smoke = heroes[0];
const cicero = monsters[0];
const g = geoFor(1440, 'director');
const REST = { x: 262, y: 118 };

type S = {
  activeId: string; acted: string[]; at: [number, number]; move: number; trail: number;
  roll: boolean; dice: [number, number]; total: boolean; strike: boolean;
  amount: string; hit: boolean; hp: number; log: boolean; wipe: 'off' | 'in' | 'out';
};
const START: S = {
  activeId: activeHero.id, acted: combat.actedThisRound, at: [smoke.x, smoke.y], move: 6, trail: 0,
  roll: false, dice: [1, 1], total: false, strike: false, amount: '', hit: false, hp: cicero.cur, log: false, wipe: 'off',
};
const PAYOFF: S = { ...START, activeId: smoke.id, acted: [...combat.actedThisRound, activeHero.id], at: [14, 13], move: 4, trail: 2, roll: true, dice: [7, 5], total: true, amount: '8', hit: true, hp: 28, log: true };

async function script(a: Act<S>) {
  a.mark('open');
  await a.wait(500);
  await a.click('end-turn');
  a.mark('tracker');
  await a.set({ activeId: smoke.id, acted: [...combat.actedThisRound, activeHero.id] });
  const rest = a.move({ x: 1190, y: 700 }, { duration: 1100 });
  await a.wait(1100);
  a.mark('move');
  await a.set({ at: [14, 14], move: 5, trail: 1 });
  await a.wait(620);
  await a.set({ at: [14, 13], move: 4, trail: 2 });
  await rest;
  await a.wait(760);
  a.mark('roll');
  await a.set({ roll: true });
  await a.wait(320);
  await a.set({ dice: [4, 9] });
  await a.wait(300);
  await a.set({ dice: [2, 3] });
  await a.wait(300);
  await a.set({ dice: [7, 5] });
  await a.wait(420);
  await a.set({ total: true, strike: true });
  await a.wait(200);
  await a.set({ strike: false });
  await a.wait(800);
  a.mark('damage');
  await a.click('amount');
  await a.type('amount', '8', { interval: 60 });
  await a.wait(160);
  await a.click('apply');
  a.mark('payoff');
  await a.set({ hit: true, hp: 28, log: true });
  await a.wait(2600);
  await a.set({ wipe: 'in' });
  await a.wait(520);
  a.place(REST);
  await a.snap({ ...START, wipe: 'in' });
  await a.set({ wipe: 'out' });
  await a.wait(520);
  await a.snap({ wipe: 'off' });
}

const num = (n: number) => <Count value={n} duration={420} />;
const text = (t: string) => <Roll>{t}</Roll>;

function Trail({ n }: { n: number }) {
  const c = g.cell;
  const p = (x: number, y: number) => `${(x + 0.5) * c} ${(y + 0.5 - g.first) * c}`;
  return (
    <svg className="bt-trail" width={g.mapW} height={g.mapH} aria-hidden>
      <path d={`M${p(smoke.x, smoke.y)}L${p(14, 14)}`} pathLength={1} data-on={n >= 1 || undefined} />
      <path d={`M${p(14, 14)}L${p(14, 13)}`} pathLength={1} data-on={n >= 2 || undefined} />
    </svg>
  );
}

function RollCard({ s }: { s: S }) {
  return (
    <div className="bt-roll" data-on={s.roll || undefined} style={{ left: 9.65 * g.cell, top: (14.1 - g.first) * g.cell }}>
      <strong>{smoke.first} rolls power</strong>
      <div className="bt-dice">
        <span>{num(s.dice[0])}</span><span>{num(s.dice[1])}</span>
        <b data-on={s.total || undefined}>12</b>
        <em data-on={s.total || undefined}>Tier 2</em>
      </div>
    </div>
  );
}

function Hit({ on }: { on: boolean }) {
  const z = 76;
  return (
    <div className="bt-hit" data-on={on || undefined} style={{ left: 15.75 * g.cell - z / 2, top: (14.65 - g.first) * g.cell - z / 2, width: z, height: z }}>
      <Burst size={z} /><b>−8</b>
    </div>
  );
}

function Scene({ s }: { s: S }) {
  const view = useMemo<BattleState>(() => ({ activeId: s.activeId, acted: s.acted, pos: { [smoke.id]: s.at }, cur: { [cicero.id]: s.hp }, move: s.move }), [s]);
  const active = heroes.find((h) => h.id === s.activeId)!;
  return (
    <div data-hit={s.hit || undefined} data-strike={s.strike || undefined}>
      <DirectorBoard size={1440} theme="light" s={view} live={{ num, text }} heroTag={{ first: smoke.first, text: smoke.first }}
        target={cicero.label} amount={s.amount ? <span data-typing>{s.amount}</span> : undefined}
        endLabel={<Roll>{`End ${active.first}’s turn`}</Roll>} logCount={num(s.log ? 25 : 24)} logShow={10}
        under={<Trail n={s.trail} />}
        overlay={<><RollCard s={s} /><Hit on={s.hit} /></>}
        logExtra={<Collapse open={s.log}><div className="sb-log__e" data-new><span>Cicero took 8 damage</span><time>12:23 PM</time></div></Collapse>}
        wash={<div className="bt-wipe" data-s={s.wipe}><span>Anvil</span></div>} />
    </div>
  );
}

export default function BattleTurnMotion() {
  return (
    <Stage width={1440} height={900} theme="light" unframed className="look-anvil" initial={START} poster={PAYOFF} script={script} cursor={{ at: REST, idle: false }}>
      {(s) => <Scene s={s} />}
    </Stage>
  );
}
