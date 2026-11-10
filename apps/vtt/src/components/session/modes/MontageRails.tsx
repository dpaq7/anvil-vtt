import { useMemo, useState } from 'react';
import { Check, ChevronDown, Dice5 } from 'lucide-react';
import { skills } from '@anvil/data';
import { useSessionConnection } from '../shell/connection-context.js';
import { ConfirmLink } from './ConfirmLink.js';
import { Head, Stepper } from './parts.js';

const TRAITS = [
  ['might', 'MIG'],
  ['agility', 'AGI'],
  ['reason', 'REA'],
  ['intuition', 'INT'],
  ['presence', 'PRE'],
] as const;

export interface MontageOutcomes {
  totalSuccess: string;
  partialSuccess: string;
  totalFailure: string;
}

/** What each ending means. Both roles read these (`montage-*`). */
export function MontageOutcomesList({ outcomes, flat = false }: { outcomes: MontageOutcomes; flat?: boolean }) {
  const rows = [
    ['Total success', outcomes.totalSuccess],
    ['Partial success', outcomes.partialSuccess],
    ['Total failure', outcomes.totalFailure],
  ] as const;
  return (
    <>
      {!flat && <Head title="Outcomes" note="When the montage ends" />}
      <div className="md-outs" data-flat={flat || undefined}>
        {rows.map(([label, text]) => (
          <div key={label}>
            <b>{label}</b>
            <span>{text || 'Not set.'}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/** The Director's tools: record a test, tick rounds, reset (`montage-director`). */
export function RecordTests({
  successes,
  successLimit,
  failures,
  failureLimit,
  roundLimit,
  rounds,
  outcomes,
  onToggleRound,
  onAdjustSuccesses,
  onAdjustFailures,
  onReset,
}: {
  successes: number;
  successLimit: number;
  failures: number;
  failureLimit: number;
  roundLimit: number;
  rounds: boolean[];
  outcomes: MontageOutcomes;
  onToggleRound: (index: number) => void;
  onAdjustSuccesses: (delta: number) => void;
  onAdjustFailures: (delta: number) => void;
  onReset: () => void;
}) {
  const round = Math.min(roundLimit, rounds.filter(Boolean).length + 1);
  return (
    <>
      <section className="sb-sec md-tools">
        <div className="md-tool__h">
          <b>Record a test</b>
          <span>Round {round} of {roundLimit}</span>
        </div>
        <Stepper label="Successes" value={successes} of={successLimit} canLower={successes > 0} canRaise={successes < successLimit} onChange={onAdjustSuccesses} />
        <Stepper label="Failures" value={failures} of={failureLimit} canLower={failures > 0} canRaise={failures < failureLimit} onChange={onAdjustFailures} />
        <div className="md-tool__f">
          <span className="md-rounds">
            Rounds
            {Array.from({ length: roundLimit }, (_, i) => (
              <button key={i} type="button" aria-pressed={rounds[i] === true} aria-label={`Round ${i + 1} complete`} onClick={() => onToggleRound(i)}>
                {rounds[i] && <Check size={12} strokeWidth={3.5} aria-hidden="true" />}
                {i + 1}
              </button>
            ))}
          </span>
          <ConfirmLink label="Reset…" title="Reset this montage?" body="Successes, failures and the test log go back to zero for everyone." keep="Keep it" confirm="Reset montage" onConfirm={onReset} />
        </div>
      </section>
      <section className="sb-sec">
        <div className="md-tool__h">
          <b>Outcomes</b>
          <span>When it ends</span>
        </div>
        <MontageOutcomesList outcomes={outcomes} flat />
      </section>
    </>
  );
}

/** The Player's main action, at the top of the right rail (`montage-player`). */
export function MakeTest({ tested, ended, onRoll }: { tested: string | null; ended: boolean; onRoll: (skillId: string, trait: string) => void }) {
  const { paused } = useSessionConnection();
  const [skillId, setSkillId] = useState('');
  const [trait, setTrait] = useState<string>('reason');
  const groups = useMemo(() => {
    const out = new Map<string, typeof skills>();
    for (const skill of skills) out.set(skill.group, [...(out.get(skill.group) ?? []), skill]);
    return [...out.entries()];
  }, []);
  const skill = skills.find((s) => s.id === skillId);
  return (
    <section className="sb-sec md-act">
      <div className="md-tool__h">
        <b>Make a test</b>
        <span>{ended ? 'The montage is over' : tested ?? 'You have not tested yet'}</span>
      </div>
      <label className="sb-input">
        <span><small>Skill</small> {skill?.name ?? 'Choose a skill'}</span>
        <ChevronDown size={16} strokeWidth={3} aria-hidden="true" />
        <select aria-label="Skill" value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          <option value="">Choose a skill</option>
          {groups.map(([group, list]) => (
            <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
              {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="sb-seg" role="group" aria-label="Characteristic">
        {TRAITS.map(([id, short]) => (
          <button key={id} type="button" data-on={trait === id || undefined} aria-pressed={trait === id} onClick={() => setTrait(id)}>{short}</button>
        ))}
      </div>
      <button type="button" className="md-go" data-wait={paused || undefined} disabled={paused || ended || !skillId} onClick={() => onRoll(skillId, trait)}>
        <Dice5 size={18} strokeWidth={2.6} aria-hidden="true" />
        {paused ? 'Roll test, when back' : 'Roll test'}
      </button>
    </section>
  );
}
