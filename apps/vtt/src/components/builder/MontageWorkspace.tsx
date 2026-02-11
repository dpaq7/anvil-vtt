import { useCallback } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { MontageStage } from '../stages/MontageStage.js';
import { SceneAudioPanel } from '../session/SceneAudioPanel.js';
import type { Scene } from './SceneWorkspace.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MontageWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
}

interface MontageChallenge {
  id: string;
  name: string;
  skill: string;
  characteristic: string;
}

interface MontageSceneData {
  goal: string;
  difficulty: 'easy' | 'standard' | 'hard';
  successesNeeded: number;
  failureLimit: number;
  challenges: MontageChallenge[];
  successOutcome: string;
  failureOutcome: string;
  notes: string;
}

const SKILLS = [
  'Alchemy', 'Architecture', 'Blacksmithing', 'Climb', 'Culture', 'Disguise',
  'Drive', 'Endurance', 'Fletching', 'Heal', 'Hide', 'History', 'Intimidate',
  'Jump', 'Law', 'Lead', 'Lie', 'Lift', 'Mechanics', 'Monster Lore', 'Music',
  'Nature', 'Navigate', 'Perform', 'Persuade', 'Pick Lock', 'Pick Pocket',
  'Read Person', 'Religion', 'Ride', 'Sneak', 'Swim', 'Track', 'Watch',
];

const CHARACTERISTICS = ['Might', 'Agility', 'Reason', 'Intuition', 'Presence'];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MontageWorkspace({ data, onChange, campaignId }: MontageWorkspaceProps) {
  // Parse challenges from either string (legacy) or array (new format)
  const parseChallenges = (): MontageChallenge[] => {
    const raw = data['challenges'];
    if (Array.isArray(raw)) {
      return raw as MontageChallenge[];
    }
    // Legacy format: string with one challenge per line
    if (typeof raw === 'string' && raw.trim()) {
      return raw.split('\n').filter(Boolean).map((name) => ({
        id: generateId(),
        name: name.trim(),
        skill: '',
        characteristic: '',
      }));
    }
    return [];
  };

  // Extract typed data with defaults
  const montageData: MontageSceneData = {
    goal: (data['goal'] as string) ?? '',
    difficulty: (data['difficulty'] as 'easy' | 'standard' | 'hard') ?? 'standard',
    successesNeeded: (data['successesNeeded'] as number) ?? 3,
    failureLimit: (data['failureLimit'] as number) ?? 3,
    challenges: parseChallenges(),
    successOutcome: (data['successOutcome'] as string) ?? '',
    failureOutcome: (data['failureOutcome'] as string) ?? '',
    notes: (data['notes'] as string) ?? '',
  };

  const updateField = <K extends keyof MontageSceneData>(field: K, value: MontageSceneData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Challenge handlers
  const addChallenge = useCallback(() => {
    const newChallenge: MontageChallenge = {
      id: generateId(),
      name: '',
      skill: '',
      characteristic: '',
    };
    onChange({ ...data, challenges: [...montageData.challenges, newChallenge] });
  }, [data, montageData.challenges, onChange]);

  const updateChallenge = useCallback(
    (id: string, updates: Partial<MontageChallenge>) => {
      const updated = montageData.challenges.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      );
      onChange({ ...data, challenges: updated });
    },
    [data, montageData.challenges, onChange]
  );

  const removeChallenge = useCallback(
    (id: string) => {
      onChange({ ...data, challenges: montageData.challenges.filter((c) => c.id !== id) });
    },
    [data, montageData.challenges, onChange]
  );

  // Convert challenges to stage format
  const stageChallenges = montageData.challenges.map((c) => ({
    id: c.id,
    name: c.name || 'Unnamed Challenge',
    completed: false,
  }));

  return (
    <div className="flex h-full">
      {/* Main area: Live preview of MontageStage */}
      <div className="flex-1 overflow-auto bg-zinc-950">
        <MontageStage
          goal={montageData.goal}
          currentSuccesses={0}
          successLimit={montageData.successesNeeded}
          currentFailures={0}
          failureLimit={montageData.failureLimit}
          outcome="pending"
          challenges={stageChallenges}
          isDirector={true}
        />

        {/* Empty state hint */}
        {!montageData.goal && montageData.challenges.length === 0 && (
          <div className="flex items-center justify-center pb-8">
            <div className="text-center text-zinc-600">
              <p className="text-lg font-medium">Montage Scene</p>
              <p className="mt-1 text-sm">Set a goal and add challenges in the sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar: Editor fields */}
      <div className="w-96 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/80 p-4">
        <div className="flex flex-col gap-5">
          {/* Scene Audio */}
          <SceneAudioPanel
            campaignId={campaignId}
            audioId={(data['audioMusic'] as string) ?? null}
            onAudioChange={(id) => onChange({ ...data, audioMusic: id ?? undefined })}
          />

          {/* Goal */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Goal</span>
            <Input
              value={montageData.goal}
              onChange={(e) => updateField('goal', e.target.value)}
              placeholder="What the heroes are trying to accomplish"
              className="text-sm"
            />
          </label>

          {/* Difficulty & Limits */}
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Difficulty</span>
              <select
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                value={montageData.difficulty}
                onChange={(e) => updateField('difficulty', e.target.value as 'easy' | 'standard' | 'hard')}
              >
                <option value="easy">Easy</option>
                <option value="standard">Standard</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Successes</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={montageData.successesNeeded}
                onChange={(e) => updateField('successesNeeded', Number(e.target.value))}
                className="text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Failures</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={montageData.failureLimit}
                onChange={(e) => updateField('failureLimit', Number(e.target.value))}
                className="text-sm"
              />
            </label>
          </div>

          {/* Challenges */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Challenges</CardTitle>
              <Button variant="outline" size="sm" onClick={addChallenge}>
                + Add
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {montageData.challenges.length === 0 && (
                <p className="text-xs text-zinc-500">
                  No challenges yet. Add specific obstacles the heroes must overcome.
                </p>
              )}
              {montageData.challenges.map((c, idx) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">#{idx + 1}</span>
                    <Input
                      value={c.name}
                      onChange={(e) => updateChallenge(c.id, { name: e.target.value })}
                      placeholder="Challenge name"
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeChallenge(c.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                      value={c.skill}
                      onChange={(e) => updateChallenge(c.id, { skill: e.target.value })}
                    >
                      <option value="">Skill (optional)</option>
                      {SKILLS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                      value={c.characteristic}
                      onChange={(e) => updateChallenge(c.id, { characteristic: e.target.value })}
                    >
                      <option value="">Characteristic (optional)</option>
                      {CHARACTERISTICS.map((ch) => (
                        <option key={ch} value={ch}>{ch}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Outcomes */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-emerald-400">Success Outcome</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={montageData.successOutcome}
              onChange={(e) => updateField('successOutcome', e.target.value)}
              placeholder="What happens if the heroes succeed..."
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-red-400">Failure Outcome</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              value={montageData.failureOutcome}
              onChange={(e) => updateField('failureOutcome', e.target.value)}
              placeholder="What happens if the heroes fail..."
            />
          </label>

          {/* Director Notes */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Director Notes</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              value={montageData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Private notes for running this montage..."
            />
          </label>
        </div>
      </div>
    </div>
  );
}
