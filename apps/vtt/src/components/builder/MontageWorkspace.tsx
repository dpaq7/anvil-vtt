import { useCallback, useMemo } from 'react';
import { Button, Input } from '@anvil/ui';
import { MontageStage } from '../stages/MontageStage.js';
import { SceneAudioPanel } from '../session/SceneAudioPanel.js';
import type { Scene } from './SceneWorkspace.js';

interface MontageWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
}

interface MontageChallenge {
  id: string;
  name: string;
  description: string;
  suggestedSkills: string[];
  suggestedCharacteristics: string[];
  skill?: string;
  characteristic?: string;
}

interface MontageSceneData {
  goal: string;
  roundLimit: number;
  heroCount: number;
  successesNeeded: number;
  failureLimit: number;
  challenges: MontageChallenge[];
  totalSuccess: string;
  partialSuccess: string;
  totalFailure: string;
  notes: string;
}

const CHARACTERISTICS = ['Might', 'Agility', 'Reason', 'Intuition', 'Presence'];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function normalizeChallenge(raw: unknown): MontageChallenge {
  if (!raw || typeof raw !== 'object') {
    return {
      id: generateId(),
      name: String(raw ?? ''),
      description: '',
      suggestedSkills: [],
      suggestedCharacteristics: [],
    };
  }

  const item = raw as Partial<MontageChallenge>;
  const legacySkill = typeof item.skill === 'string' && item.skill ? [item.skill] : [];
  const legacyCharacteristic = typeof item.characteristic === 'string' && item.characteristic ? [item.characteristic] : [];
  const suggestedSkills = stringList(item.suggestedSkills);
  const suggestedCharacteristics = stringList(item.suggestedCharacteristics);

  return {
    id: typeof item.id === 'string' && item.id ? item.id : generateId(),
    name: typeof item.name === 'string' ? item.name : '',
    description: typeof item.description === 'string' ? item.description : '',
    suggestedSkills: suggestedSkills.length ? suggestedSkills : legacySkill,
    suggestedCharacteristics: suggestedCharacteristics.length ? suggestedCharacteristics : legacyCharacteristic,
    skill: item.skill,
    characteristic: item.characteristic,
  };
}

export function MontageWorkspace({ data, onChange, campaignId }: MontageWorkspaceProps) {
  const challenges = useMemo<MontageChallenge[]>(() => {
    const raw = data['challenges'];
    if (Array.isArray(raw)) return raw.map(normalizeChallenge);
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split('\n').filter(Boolean).map((name) => normalizeChallenge({ name: name.trim() }));
    }
    return [];
  }, [data]);

  const montageData: MontageSceneData = {
    goal: (data['goal'] as string) ?? '',
    roundLimit: readNumber(data['roundLimit'], 2),
    heroCount: readNumber(data['heroCount'], 5),
    successesNeeded: readNumber(data['successesNeeded'], 5),
    failureLimit: readNumber(data['failureLimit'], 5),
    challenges,
    totalSuccess: ((data['totalSuccess'] ?? data['successOutcome']) as string) ?? '',
    partialSuccess: ((data['partialSuccess'] ?? data['partialOutcome']) as string) ?? '',
    totalFailure: ((data['totalFailure'] ?? data['failureOutcome']) as string) ?? '',
    notes: (data['notes'] as string) ?? '',
  };

  const updateData = useCallback(
    (updates: Record<string, unknown>) => {
      onChange({ ...data, ...updates });
    },
    [data, onChange],
  );

  const addChallenge = useCallback(() => {
    const newChallenge: MontageChallenge = {
      id: generateId(),
      name: '',
      description: '',
      suggestedSkills: [],
      suggestedCharacteristics: [],
    };
    updateData({ challenges: [...montageData.challenges, newChallenge] });
  }, [montageData.challenges, updateData]);

  const updateChallenge = useCallback(
    (id: string, updates: Partial<MontageChallenge>) => {
      updateData({
        challenges: montageData.challenges.map((challenge) =>
          challenge.id === id ? { ...challenge, ...updates } : challenge,
        ),
      });
    },
    [montageData.challenges, updateData],
  );

  const removeChallenge = useCallback(
    (id: string) => {
      updateData({ challenges: montageData.challenges.filter((challenge) => challenge.id !== id) });
    },
    [montageData.challenges, updateData],
  );

  const toggleCharacteristic = useCallback(
    (id: string, characteristic: string) => {
      const challenge = montageData.challenges.find((item) => item.id === id);
      if (!challenge) return;
      const selected = challenge.suggestedCharacteristics.includes(characteristic);
      updateChallenge(id, {
        suggestedCharacteristics: selected
          ? challenge.suggestedCharacteristics.filter((item) => item !== characteristic)
          : [...challenge.suggestedCharacteristics, characteristic],
      });
    },
    [montageData.challenges, updateChallenge],
  );

  const stageChallenges = montageData.challenges.map((challenge) => ({
    id: challenge.id,
    name: challenge.name || 'Unnamed Challenge',
    description: challenge.description,
    suggestedSkills: challenge.suggestedSkills,
    suggestedCharacteristics: challenge.suggestedCharacteristics,
    completed: false,
  }));

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden bg-zinc-950">
        <MontageStage
          goal={montageData.goal}
          roundLimit={montageData.roundLimit}
          heroCount={montageData.heroCount}
          currentSuccesses={0}
          successLimit={montageData.successesNeeded}
          currentFailures={0}
          failureLimit={montageData.failureLimit}
          outcome="pending"
          totalSuccess={montageData.totalSuccess}
          partialSuccess={montageData.partialSuccess}
          totalFailure={montageData.totalFailure}
          challenges={stageChallenges}
          isDirector={true}
        />
      </div>

      <div className="w-96 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/80 p-4">
        <div className="flex flex-col gap-5">
          <SceneAudioPanel
            campaignId={campaignId}
            audioId={(data['audioMusic'] as string) ?? null}
            onAudioChange={(id) => updateData({ audioMusic: id ?? undefined })}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Goal</span>
            <Input
              value={montageData.goal}
              onChange={(event) => updateData({ goal: event.target.value })}
              placeholder="What the heroes are trying to accomplish"
              className="text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Rounds</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={montageData.roundLimit}
                onChange={(event) => updateData({ roundLimit: Number(event.target.value) })}
                className="text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Heroes</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={montageData.heroCount}
                onChange={(event) => updateData({ heroCount: Number(event.target.value) })}
                className="text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Successes</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={montageData.successesNeeded}
                onChange={(event) => updateData({ successesNeeded: Number(event.target.value) })}
                className="text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Failures</span>
              <Input
                type="number"
                min={1}
                max={20}
                value={montageData.failureLimit}
                onChange={(event) => updateData({ failureLimit: Number(event.target.value) })}
                className="text-sm"
              />
            </label>
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-300">Challenges</span>
              <Button variant="outline" size="sm" onClick={addChallenge}>+ Add</Button>
            </div>
            <div className="flex flex-col gap-3">
              {montageData.challenges.length === 0 && (
                <p className="text-xs text-zinc-500">Add obstacles with suggested tests the heroes can attempt.</p>
              )}
              {montageData.challenges.map((challenge, index) => (
                <div key={challenge.id} className="flex flex-col gap-3 rounded-md border border-zinc-700 bg-zinc-900/80 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">#{index + 1}</span>
                    <Input
                      value={challenge.name}
                      onChange={(event) => updateChallenge(challenge.id, { name: event.target.value })}
                      placeholder="Challenge name"
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChallenge(challenge.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>

                  <textarea
                    className="min-h-[72px] resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    value={challenge.description}
                    onChange={(event) => updateChallenge(challenge.id, { description: event.target.value })}
                    placeholder="What obstacle does this test represent?"
                  />

                  <div className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Suggested Characteristics</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CHARACTERISTICS.map((characteristic) => {
                        const active = challenge.suggestedCharacteristics.includes(characteristic);
                        return (
                          <button
                            key={characteristic}
                            type="button"
                            onClick={() => toggleCharacteristic(challenge.id, characteristic)}
                            className={`rounded border px-2 py-1 text-xs transition-colors ${
                              active
                                ? 'border-amber-400 bg-amber-500/15 text-amber-200'
                                : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500'
                            }`}
                          >
                            {characteristic.slice(0, 3).toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Suggested Skills</span>
                    <Input
                      value={challenge.suggestedSkills.join(', ')}
                      onChange={(event) => updateChallenge(challenge.id, { suggestedSkills: splitList(event.target.value) })}
                      placeholder="Climb, Endurance, Navigate"
                      className="text-sm"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-emerald-400">Total Success Outcome</span>
            <textarea
              className="min-h-[84px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={montageData.totalSuccess}
              onChange={(event) => updateData({ totalSuccess: event.target.value, successOutcome: event.target.value })}
              placeholder="What happens if the heroes reach the success limit before failing?"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-amber-400">Partial Success Outcome</span>
            <textarea
              className="min-h-[84px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              value={montageData.partialSuccess}
              onChange={(event) => updateData({ partialSuccess: event.target.value, partialOutcome: event.target.value })}
              placeholder="What happens if the montage ends with mixed results?"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-red-400">Total Failure Outcome</span>
            <textarea
              className="min-h-[84px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={montageData.totalFailure}
              onChange={(event) => updateData({ totalFailure: event.target.value, failureOutcome: event.target.value })}
              placeholder="What happens if failures reach the limit?"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Director Notes</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              value={montageData.notes}
              onChange={(event) => updateData({ notes: event.target.value })}
              placeholder="Private notes for running this montage..."
            />
          </label>
        </div>
      </div>
    </div>
  );
}