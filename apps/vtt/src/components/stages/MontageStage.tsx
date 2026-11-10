import { ArrowRight, Check, Flag, X } from 'lucide-react';
import type { TestLogEntry } from '../../types/protocol.js';
import { Side } from '../session/modes/parts.js';
import { OUTCOME_LABEL } from './mode-helpers.js';

interface MontageChallengePreview {
  id: string;
  name: string;
  completed: boolean;
  description?: string;
  suggestedSkills?: string[];
  suggestedCharacteristics?: string[];
}

interface MontageStageProps {
  goal: string;
  currentSuccesses: number;
  successLimit: number;
  currentFailures: number;
  failureLimit: number;
  outcome: string;
  challenges: MontageChallengePreview[];
  isDirector: boolean;
  roundLimit?: number;
  heroCount?: number;
  /** Outcome texts belong to the rail (`Outcomes`); kept so the Builder's preview still compiles. */
  totalSuccess?: string;
  partialSuccess?: string;
  totalFailure?: string;
  testLog?: TestLogEntry[];
  /** The Director's own round ticks (client-side). Without them the round is not known. */
  roundsCompleted?: boolean[];
  /** Heroes who have tested, of how many, from the hero rail's own count. */
  tested?: { n: number; of: number };
  /** Hide the corner tracker (the Display draws its own). */
  bare?: boolean;
}


/** Successes and failures as two lanes of boxes against their limits (`md-lane`). */
function Lane({ kind, n, of }: { kind: 'ok' | 'fail'; n: number; of: number }) {
  return (
    <div className="md-lane" data-kind={kind}>
      <div className="md-lane__l">
        <b>{kind === 'ok' ? 'Successes' : 'Failures'}</b>
        <span>
          {n} of {of}
        </span>
      </div>
      <ol>
        {Array.from({ length: Math.max(0, of) }, (_, i) => (
          <li key={i} data-on={i < n || undefined} aria-label={i < n ? (kind === 'ok' ? 'Success' : 'Failure') : 'Not yet'}>
            {i < n ? (
              kind === 'ok' ? <Check size={22} strokeWidth={3.5} aria-hidden="true" /> : <X size={22} strokeWidth={3.5} aria-hidden="true" />
            ) : i === of - 1 && kind === 'ok' ? (
              <Flag size={18} strokeWidth={2.6} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

const STATE_WORD = { cleared: 'Cleared', now: 'Now', ahead: 'Ahead' } as const;

/** Montage's screen: goal plate, the two lanes, the strip of challenges (DESIGN.md section 6). */
export function MontageStage({
  goal,
  currentSuccesses,
  successLimit,
  currentFailures,
  failureLimit,
  outcome,
  challenges,
  roundLimit = 2,
  heroCount = 5,
  testLog = [],
  roundsCompleted,
  tested,
  bare = false,
}: MontageStageProps) {
  const prep = testLog.length === 0 && currentSuccesses === 0 && currentFailures === 0;
  const firstOpen = challenges.findIndex((challenge) => !challenge.completed);
  const stateOf = (index: number) =>
    challenges[index]?.completed ? 'cleared' : index === firstOpen && !prep ? 'now' : 'ahead';
  const round = roundsCompleted ? Math.min(roundLimit, roundsCompleted.filter(Boolean).length + 1) : null;
  const ended = outcome && outcome !== 'pending' ? OUTCOME_LABEL[outcome] ?? outcome.replace(/_/g, ' ') : null;

  return (
    <>
      {!bare && (
        <Side
          items={[
            round !== null ? { label: `Round ${round}`, value: `of ${roundLimit}` } : { label: `${roundLimit} rounds` },
            tested ? { label: 'Tested', value: `${tested.n} of ${tested.of}`, on: !ended } : { label: 'Heroes', value: `${heroCount}` },
          ]}
        />
      )}
      <div className="md-stack">
        <div className="md-plate md-goal">
          <small>Goal</small>
          <strong>{goal || 'No goal set'}</strong>
        </div>
        <div className="md-course">
          <Lane kind="ok" n={currentSuccesses} of={successLimit} />
          <Lane kind="fail" n={currentFailures} of={failureLimit} />
        </div>
        {challenges.length > 0 ? (
          <div className="md-chs">
            {challenges.map((challenge, index) => {
              const state = stateOf(index);
              const skills = [...(challenge.suggestedSkills ?? []), ...(challenge.suggestedCharacteristics ?? [])];
              return (
                <section key={challenge.id} className="md-ch" data-state={state}>
                  <div className="md-ch__top">
                    {!prep || state === 'cleared' ? (
                      <em>
                        {state === 'cleared' ? <Check size={13} strokeWidth={3.5} aria-hidden="true" /> : state === 'now' ? <ArrowRight size={13} strokeWidth={3.5} aria-hidden="true" /> : null}
                        {STATE_WORD[state]}
                      </em>
                    ) : null}
                  </div>
                  <div className="md-ch__b">
                    <strong>{challenge.name}</strong>
                    {challenge.description && <p>{challenge.description}</p>}
                    {skills.length > 0 && (
                      <div className="md-chips">
                        {skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}
      </div>
      {ended && <div className="md-end" role="status">Montage over. {ended}</div>}
    </>
  );
}
