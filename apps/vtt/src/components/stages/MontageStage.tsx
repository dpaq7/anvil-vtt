import { useCallback, useState, useMemo } from 'react';
import { Dice5, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@anvil/ui';
import { skills } from '@anvil/data';
import type { TestLogEntry } from '../../types/protocol.js';

const CHARACTERISTICS = ['might', 'agility', 'reason', 'intuition', 'presence'] as const;
type Characteristic = (typeof CHARACTERISTICS)[number];

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
  totalSuccess?: string;
  partialSuccess?: string;
  totalFailure?: string;
  testLog?: TestLogEntry[];
  roundsCompleted?: boolean[];
  onMontageRoll?: (skillId: string, characteristicId: string) => void;
  onAdjustSuccesses?: (delta: number) => void;
  onAdjustFailures?: (delta: number) => void;
  onResetMontage?: () => void;
  onToggleRound?: (roundIndex: number) => void;
}

function TestLogItem({ entry }: { entry: TestLogEntry }) {
  const skill = skills.find((item) => item.id === entry.skillId);
  const isSuccess = entry.outcome === 'success';

  return (
    <div
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
        isSuccess ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
      }`}
    >
      {isSuccess ? <CheckCircle2 className="size-3.5 shrink-0" /> : <XCircle className="size-3.5 shrink-0" />}
      <span className="font-medium">{entry.playerName}</span>
      <span className="text-zinc-400">rolled</span>
      <span>{skill?.name ?? entry.skillId}</span>
      <span className="text-zinc-500">({entry.characteristicId})</span>
      <span className="ml-auto text-xs text-zinc-500">
        {entry.roll} - T{entry.tier}
      </span>
    </div>
  );
}

function ListPills({ items }: { items?: string[] }) {
  if (!items?.length) return <span className="text-xs text-zinc-600">None set</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded bg-zinc-950/70 px-2 py-1 text-xs text-zinc-300">
          {item}
        </span>
      ))}
    </div>
  );
}

export function MontageStage({
  goal,
  currentSuccesses,
  successLimit,
  currentFailures,
  failureLimit,
  outcome,
  challenges,
  isDirector,
  roundLimit = 2,
  heroCount = 5,
  totalSuccess = '',
  partialSuccess = '',
  totalFailure = '',
  testLog = [],
  roundsCompleted = [],
  onMontageRoll,
  onAdjustSuccesses,
  onAdjustFailures,
  onResetMontage,
  onToggleRound,
}: MontageStageProps) {
  const successPct = successLimit > 0 ? (currentSuccesses / successLimit) * 100 : 0;
  const failurePct = failureLimit > 0 ? (currentFailures / failureLimit) * 100 : 0;
  const normalizedOutcome = outcome || 'pending';
  const isActive = normalizedOutcome === 'pending';

  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedChar, setSelectedChar] = useState<Characteristic>('reason');

  const skillGroups = useMemo(() => {
    const groups: Record<string, typeof skills> = {};
    for (const skill of skills) {
      const group = skill.group;
      if (!groups[group]) groups[group] = [];
      groups[group].push(skill);
    }
    return groups;
  }, []);

  const handleRoll = useCallback(() => {
    if (!selectedSkillId || !onMontageRoll) return;
    onMontageRoll(selectedSkillId, selectedChar);
  }, [selectedSkillId, selectedChar, onMontageRoll]);

  const statCards = [
    { label: 'Rounds', value: roundLimit },
    { label: 'Success Limit', value: successLimit },
    { label: 'Failure Limit', value: failureLimit },
    { label: 'Heroes', value: heroCount },
  ];

  const outcomes = [
    { label: 'Total Success', text: totalSuccess, color: 'border-emerald-500/30 text-emerald-300' },
    { label: 'Partial Success', text: partialSuccess, color: 'border-amber-500/30 text-amber-300' },
    { label: 'Total Failure', text: totalFailure, color: 'border-red-500/30 text-red-300' },
  ];

  return (
    <div className="h-full overflow-auto p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Montage Goal</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-100">{goal || 'No goal set'}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-100">{stat.value}</p>
              {isDirector && stat.label === 'Rounds' && roundLimit > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {Array.from({ length: roundLimit }, (_, index) => (
                    <label
                      key={index}
                      className="flex size-5 items-center justify-center rounded border border-zinc-700 bg-zinc-950/60"
                      title={`Round ${index + 1}`}
                    >
                      <input
                        type="checkbox"
                        checked={roundsCompleted[index] === true}
                        disabled={!isDirector || !onToggleRound}
                        onChange={() => onToggleRound?.(index)}
                        className="size-3 accent-amber-500"
                        aria-label={`Round ${index + 1} complete`}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-emerald-400">Successes</span>
              <span className="text-zinc-400">{currentSuccesses} / {successLimit}</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, successPct)}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-red-400">Failures</span>
              <span className="text-zinc-400">{currentFailures} / {failureLimit}</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.min(100, failurePct)}%` }} />
            </div>
          </div>
        </div>

        {!isActive && (
          <div className="text-center">
            <span
              className={`rounded px-3 py-1 text-sm font-medium ${
                normalizedOutcome === 'total_success'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : normalizedOutcome === 'partial_success'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
              }`}
            >
              {normalizedOutcome.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {outcomes.map((item) => (
            <div key={item.label} className={`rounded-md border bg-zinc-900/60 p-4 ${item.color}`}>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.text || 'No outcome set.'}</p>
            </div>
          ))}
        </div>

        {isDirector && (
          <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/70 p-4">
            <Button variant="outline" size="sm" onClick={() => onAdjustSuccesses?.(-1)} disabled={currentSuccesses <= 0}>
              - Success
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAdjustSuccesses?.(1)} disabled={currentSuccesses >= successLimit}>
              + Success
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAdjustFailures?.(-1)} disabled={currentFailures <= 0}>
              - Failure
            </Button>
            <Button variant="outline" size="sm" onClick={() => onAdjustFailures?.(1)} disabled={currentFailures >= failureLimit}>
              + Failure
            </Button>
            <Button variant="ghost" size="sm" onClick={onResetMontage} className="gap-1">
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        )}

        {!isDirector && isActive && onMontageRoll && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-md border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
              <Dice5 className="size-4 text-amber-400" />
              Make a Montage Test
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-zinc-400">Skill</span>
              <select
                value={selectedSkillId}
                onChange={(event) => setSelectedSkillId(event.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500"
              >
                <option value="">Choose a skill...</option>
                {Object.entries(skillGroups).map(([group, groupSkills]) => (
                  <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
                    {groupSkills.map((skill) => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <div>
              <span className="mb-1 block text-xs font-medium text-zinc-400">Characteristic</span>
              <div className="grid grid-cols-5 gap-1">
                {CHARACTERISTICS.map((characteristic) => (
                  <button
                    key={characteristic}
                    onClick={() => setSelectedChar(characteristic)}
                    className={`rounded px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      selectedChar === characteristic
                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {characteristic.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleRoll} disabled={!selectedSkillId} className="bg-amber-600 hover:bg-amber-700">
              <Dice5 className="mr-1.5 size-4" />
              Roll Test
            </Button>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-200">Challenges</p>
              <p className="text-xs text-zinc-500">Each challenge gives players a concrete obstacle and suggested tests.</p>
            </div>
            <span className="text-xs text-zinc-500">{challenges.length} challenge{challenges.length === 1 ? '' : 's'}</span>
          </div>
          {challenges.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className={`rounded-md border p-4 ${
                    challenge.completed
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-zinc-800 bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-zinc-100">{challenge.name}</p>
                    {challenge.completed && <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />}
                  </div>
                  {challenge.description && <p className="mt-2 text-sm leading-relaxed text-zinc-400">{challenge.description}</p>}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggested Characteristics</p>
                      <ListPills items={challenge.suggestedCharacteristics} />
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggested Skills</p>
                      <ListPills items={challenge.suggestedSkills} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-6 text-center text-sm text-zinc-500">
              No challenges set.
            </div>
          )}
        </div>

        {testLog.length > 0 && (
          <div className="mx-auto w-full max-w-2xl">
            <p className="mb-2 text-sm font-medium text-zinc-300">Roll Log</p>
            <div className="flex flex-col gap-1">
              {testLog.slice().reverse().map((entry) => <TestLogItem key={entry.id} entry={entry} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
