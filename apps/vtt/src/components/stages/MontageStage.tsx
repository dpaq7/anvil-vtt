import { useCallback, useState, useMemo } from 'react';
import { Dice5, CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { skills } from '@anvil/data';
import type { TestLogEntry } from '../../types/protocol.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const CHARACTERISTICS = ['might', 'agility', 'reason', 'intuition', 'presence'] as const;
type Characteristic = (typeof CHARACTERISTICS)[number];

interface MontageStageProps {
  goal: string;
  currentSuccesses: number;
  successLimit: number;
  currentFailures: number;
  failureLimit: number;
  outcome: string;
  challenges: { id: string; name: string; completed: boolean }[];
  isDirector: boolean;
  /** Test log from server */
  testLog?: TestLogEntry[];
  /** Player callback to make a montage roll */
  onMontageRoll?: (skillId: string, characteristicId: string) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TestLogItem({ entry }: { entry: TestLogEntry }) {
  const skill = skills.find((s) => s.id === entry.skillId);
  const isSuccess = entry.outcome === 'success';

  return (
    <div
      className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
        isSuccess ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="size-3.5 shrink-0" />
      ) : (
        <XCircle className="size-3.5 shrink-0" />
      )}
      <span className="font-medium">{entry.playerName}</span>
      <span className="text-zinc-400">rolled</span>
      <span>{skill?.name ?? entry.skillId}</span>
      <span className="text-zinc-500">({entry.characteristicId})</span>
      <span className="ml-auto text-xs text-zinc-500">
        {entry.roll} &rarr; T{entry.tier}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function MontageStage({
  goal,
  currentSuccesses,
  successLimit,
  currentFailures,
  failureLimit,
  outcome,
  challenges,
  isDirector,
  testLog = [],
  onMontageRoll,
}: MontageStageProps) {
  const successPct = successLimit > 0 ? (currentSuccesses / successLimit) * 100 : 0;
  const failurePct = failureLimit > 0 ? (currentFailures / failureLimit) * 100 : 0;
  const isActive = outcome === 'pending';

  // Player roll state
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [selectedChar, setSelectedChar] = useState<Characteristic>('reason');

  // Group skills by category for the picker
  const skillGroups = useMemo(() => {
    const groups: Record<string, typeof skills> = {};
    for (const s of skills) {
      const group = s.group;
      if (!groups[group]) groups[group] = [];
      groups[group].push(s);
    }
    return groups;
  }, []);

  const handleRoll = useCallback(() => {
    if (!selectedSkillId || !onMontageRoll) return;
    onMontageRoll(selectedSkillId, selectedChar);
  }, [selectedSkillId, selectedChar, onMontageRoll]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-8">
      {/* Goal */}
      <div className="text-center">
        <p className="text-xs uppercase text-zinc-500">Montage Goal</p>
        <p className="text-lg font-medium text-zinc-100">{goal || 'No goal set'}</p>
      </div>

      {/* Progress bars */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        {/* Successes */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-emerald-400">Successes</span>
            <span className="text-zinc-400">
              {currentSuccesses} / {successLimit}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, successPct)}%` }}
            />
          </div>
        </div>

        {/* Failures */}
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-red-400">Failures</span>
            <span className="text-zinc-400">
              {currentFailures} / {failureLimit}
            </span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-red-500 transition-all"
              style={{ width: `${Math.min(100, failurePct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Outcome */}
      {!isActive && (
        <div className="text-center">
          <span
            className={`rounded px-3 py-1 text-sm font-medium ${
              outcome === 'total_success'
                ? 'bg-emerald-500/20 text-emerald-400'
                : outcome === 'partial_success'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
            }`}
          >
            {outcome.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      {/* Player roll panel */}
      {!isDirector && isActive && onMontageRoll && (
        <Card className="mx-auto w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Dice5 className="size-4 text-amber-400" />
              Make a Montage Test
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Skill picker */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Skill</label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500"
              >
                <option value="">Choose a skill...</option>
                {Object.entries(skillGroups).map(([group, groupSkills]) => (
                  <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
                    {groupSkills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Characteristic picker */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Characteristic</label>
              <div className="grid grid-cols-5 gap-1">
                {CHARACTERISTICS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedChar(c)}
                    className={`rounded px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      selectedChar === c
                        ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/50'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {c.slice(0, 3).toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Roll button */}
            <Button
              onClick={handleRoll}
              disabled={!selectedSkillId}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Dice5 className="mr-1.5 size-4" />
              Roll Test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Challenge cards */}
      {challenges.length > 0 && (
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-2 text-sm font-medium text-zinc-300">Challenges</p>
          <div className="grid grid-cols-2 gap-2">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`rounded border px-3 py-2 text-sm ${
                  c.completed
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-300'
                }`}
              >
                {c.name}
                {c.completed && <span className="ml-1 text-emerald-400">&check;</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test log */}
      {testLog.length > 0 && (
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-2 text-sm font-medium text-zinc-300">Roll Log</p>
          <div className="flex flex-col gap-1">
            {testLog
              .slice()
              .reverse()
              .map((entry) => (
                <TestLogItem key={entry.id} entry={entry} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
