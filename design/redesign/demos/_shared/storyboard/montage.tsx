import { ArrowRight, Check, ChevronDown, Dice5, Flag, Minus, Plus, X } from 'lucide-react';
import type { Theme } from '../../../kit';
import { geoFor } from './data';
import { montage } from './mode-data';
import { Head, ModeBoard, ModeFrame, OnlyYou, Side, themeFor, type ModeParts, type Role, type Size } from './modes';
import { ChallengeArt, MontageArt } from './scene-art';

const traits = ['MIG', 'AGI', 'REA', 'INT', 'PRE'];

// Successes and failures are two lanes of boxes against their limits, so the table sees
// how far there is to go, not just a count. A check fills in mode colour; a failure is ink.
function Lane({ kind, n, of }: { kind: 'ok' | 'fail'; n: number; of: number }) {
  return (
    <div className="md-lane" data-kind={kind}>
      <div className="md-lane__l"><b>{kind === 'ok' ? 'Successes' : 'Failures'}</b><span>{n} of {of}</span></div>
      <ol>
        {Array.from({ length: of }, (_, i) => (
          <li key={i} data-on={i < n || undefined} aria-label={i < n ? (kind === 'ok' ? 'Success' : 'Failure') : 'Not yet'}>
            {i < n ? (kind === 'ok' ? <Check size={22} strokeWidth={3.5} /> : <X size={22} strokeWidth={3.5} />) : i === of - 1 && kind === 'ok' ? <Flag size={18} strokeWidth={2.6} /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

const stateWord = { cleared: 'Cleared', now: 'Now', ahead: 'Ahead' } as const;

// prep: the Builder's Original state, before anyone has tested.
export function MontageScreen({ w, h, prep }: { w: number; h: number; prep?: boolean }) {
  return (
    <>
      <MontageArt w={w} h={h} />
      <Side items={prep ? [{ label: `${montage.rounds} rounds` }, { label: 'Heroes', value: '7' }]
        : [{ label: `Round ${montage.round}`, value: `of ${montage.rounds}` }, { label: 'Tested', value: '4 of 7', on: true }]} />
      <div className="md-stack">
        <div className="md-plate md-goal"><small>Goal</small><strong>{montage.goal}</strong></div>
        <div className="md-course">
          <Lane kind="ok" n={prep ? 0 : montage.successes} of={montage.successLimit} />
          <Lane kind="fail" n={prep ? 0 : montage.failures} of={montage.failureLimit} />
        </div>
        <div className="md-chs">
          {montage.challenges.map((c, i) => (
            <section key={c.name} className="md-ch" data-state={prep ? undefined : c.state}>
              <div className="md-ch__top"><ChallengeArt i={i} />{!prep && <em>{c.state === 'cleared' ? <Check size={13} strokeWidth={3.5} /> : c.state === 'now' ? <ArrowRight size={13} strokeWidth={3.5} /> : null}{stateWord[c.state]}</em>}</div>
              <div className="md-ch__b">
                <strong>{c.name}</strong>
                <p>{c.text}</p>
                <div className="md-chips">{c.skills.map((k) => <span key={k}>{k}</span>)}</div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function Stepper({ label, n, of }: { label: string; n: number; of?: number }) {
  return (
    <div className="md-step">
      <span>{label}</span>
      <button aria-label={`Lower ${label}`}><Minus size={14} strokeWidth={3} /></button>
      <b>{n}{of != null && <small>/{of}</small>}</b>
      <button aria-label={`Raise ${label}`}><Plus size={14} strokeWidth={3} /></button>
    </div>
  );
}

export function RecordTests() {
  return (
    <section className="sb-sec md-tools">
      <div className="md-tool__h"><b>Record a test</b><span>Round 1 of 2</span></div>
      <Stepper label="Successes" n={montage.successes} of={montage.successLimit} />
      <Stepper label="Failures" n={montage.failures} of={montage.failureLimit} />
      <div className="md-tool__f"><span className="md-rounds">Rounds<i data-on><Check size={12} strokeWidth={3.5} />1</i><i>2</i></span><button className="sb-link">Reset…</button></div>
    </section>
  );
}

// The Player's main action stays at the top of the right rail, never under the fold.
export function MakeTest() {
  return (
    <section className="sb-sec md-act">
      <div className="md-tool__h"><b>Make a test</b><span>You have not tested yet</span></div>
      <div className="sb-input"><span><small>Skill</small> Swim</span><ChevronDown size={16} strokeWidth={3} /></div>
      <div className="sb-seg md-traits">{traits.map((t) => <span key={t} data-on={t === 'MIG' || undefined}>{t}</span>)}</div>
      <button className="md-go"><Dice5 size={18} strokeWidth={2.6} />Roll test</button>
    </section>
  );
}

function Outcomes({ flat }: { flat?: boolean }) {
  return (
    <>
      {!flat && <Head title="Outcomes" note="When the montage ends" />}
      <div className="md-outs" data-flat={flat || undefined}>{montage.outcomes.map((o) => <div key={o.label}><b>{o.label}</b><span>{o.text}</span></div>)}</div>
    </>
  );
}

export function montageParts(role: Role, size: Size, w: number, h: number): ModeParts {
  const dir = role === 'director';
  const big = size === 1440;
  return {
    goal: montage.goal, sub: 'Round 1 of 2. Each hero makes one test.',
    leftTabs: ['Montage', 'Heroes|7', 'NPCs|0', 'Log|23'], rightTabs: ['Audio', 'Tests', 'Assets'], rightOn: 'Tests',
    heroNote: '4 of 7 tested',
    heroSub: (hh) => { const t = montage.tests[hh.id]; return t ? `${t.skill} ${t.roll}, ${t.ok ? 'success' : 'failure'}` : 'Not tested yet'; },
    lower: <>
      {dir && <>
        <Head title="Hazards" note={<OnlyYou />} />
        <div className="md-notes md-notes--hatch">{montage.hazards.map((p) => <p key={p}>{p}</p>)}</div>
      </>}
      {!dir && <Outcomes />}
    </>,
    tools: dir ? <><RecordTests /><section className="sb-sec"><div className="md-tool__h"><b>Outcomes</b><span>When it ends</span></div><Outcomes flat /></section></> : <MakeTest />,
    log: montage.log, logShow: dir ? (big ? 6 : 1) : (big ? 9 : 4),
    screen: <MontageScreen w={w} h={h} />,
    bar: ['Smaller text', 'Larger text'],
  };
}

export function MontageStill({ role, size = 1440, lead = 'light' }: { role: Role; size?: Size; lead?: Theme }) {
  const theme = themeFor(lead);
  const g = geoFor(size, role);
  return <ModeFrame size={size} theme={theme}><ModeBoard mode="montage" role={role} size={size} theme={theme} parts={montageParts(role, size, g.mapW, g.mapH)} /></ModeFrame>;
}
