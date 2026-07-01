import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button, Input, SceneTypeIcon, Textarea, cn } from '@anvil/ui';
import { loadMonsters } from '@anvil/data';
import type { CompendiumItemBase } from '@anvil/data';
import type { MotivationType, NPCAttitude, SceneType } from '@anvil/types';
import { api } from '../../lib/api.js';
import {
  NEGOTIATION_TRAITS,
  RESPITE_ACTIVITY_OPTIONS,
  SCENE_TYPE_OPTIONS,
  buildMonsterLookup,
  createEmptyNegotiationTrait,
  createInitialSceneDrafts,
  createSceneData,
  isNegotiationDraftReady,
} from '../../lib/scene-drafts.js';
import type {
  BattleDifficulty,
  NegotiationTraitRole,
  NegotiationTraitSelection,
  SceneCreationDrafts,
} from '../../lib/scene-drafts.js';

const SELECT_CLASS =
  'h-11 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-zinc-400">
      <span className="font-medium text-zinc-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function NegotiationTraitList({
  role,
  selections,
  onChange,
}: {
  role: NegotiationTraitRole;
  selections: NegotiationTraitSelection[];
  onChange: (selections: NegotiationTraitSelection[]) => void;
}) {
  const title = role === 'motivation' ? 'Motivations' : 'Pitfalls';
  const minimum =
    role === 'motivation'
      ? 'Choose at least two traits the NPC responds well to.'
      : 'Choose at least one trait that sparks ire, shame, or fear.';
  const minCount = role === 'motivation' ? 2 : 1;

  const updateSelection = (id: string, updates: Partial<NegotiationTraitSelection>) => {
    onChange(
      selections.map((selection) =>
        selection.id === id ? { ...selection, ...updates } : selection,
      ),
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-300">{title}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{minimum}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...selections, createEmptyNegotiationTrait()])}
          disabled={selections.length >= 4}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {selections.map((selection, index) => {
          const trait = selection.type
            ? NEGOTIATION_TRAITS.find((item) => item.value === selection.type) ?? null
            : null;
          const ruleText = trait
            ? role === 'motivation'
              ? trait.motivation
              : trait.pitfall
            : '';
          return (
            <div key={selection.id} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-xs font-semibold text-zinc-500">
                  {index + 1}
                </span>
                <select
                  className={cn(SELECT_CLASS, 'min-w-0 flex-1')}
                  value={selection.type}
                  onChange={(event) =>
                    updateSelection(selection.id, {
                      type: event.target.value as MotivationType | '',
                    })
                  }
                >
                  <option value="">Select trait</option>
                  {NEGOTIATION_TRAITS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-zinc-500 hover:text-red-300"
                  onClick={() =>
                    onChange(selections.filter((item) => item.id !== selection.id))
                  }
                  disabled={selections.length <= minCount}
                >
                  Remove
                </Button>
              </div>
              {ruleText ? (
                <p className="mt-2 text-xs leading-5 text-zinc-500">{ruleText}</p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  Select one of the twelve Draw Steel negotiation traits.
                </p>
              )}
              <Textarea
                className="mt-2 min-h-16"
                value={selection.note}
                onChange={(event) =>
                  updateSelection(selection.id, { note: event.target.value })
                }
                placeholder={
                  role === 'motivation'
                    ? 'NPC-specific reason this appeals to them'
                    : 'NPC-specific phrase or action that triggers this pitfall'
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SceneTypeFields({
  type,
  drafts,
  onUpdate,
}: {
  type: SceneType;
  drafts: SceneCreationDrafts;
  onUpdate: <T extends SceneType>(type: T, updates: Partial<SceneCreationDrafts[T]>) => void;
}) {
  switch (type) {
    case 'battle': {
      const draft = drafts.battle;
      return (
        <div className="space-y-4 rounded-md border border-red-900/50 bg-red-950/10 p-3">
          <p className="text-xs leading-5 text-zinc-500">
            Sets up the battle shell. Place tokens, paint fog, and pick the map on a
            tablet or desktop.
          </p>
          <Field label="Difficulty">
            <select
              className={SELECT_CLASS}
              value={draft.difficulty}
              onChange={(event) =>
                onUpdate('battle', { difficulty: event.target.value as BattleDifficulty })
              }
            >
              <option value="easy">Easy</option>
              <option value="standard">Standard</option>
              <option value="hard">Hard</option>
              <option value="extreme">Extreme</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Grid columns">
              <Input
                className="h-11"
                type="number"
                min={5}
                max={80}
                value={draft.gridCols}
                onChange={(event) =>
                  onUpdate('battle', { gridCols: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Grid rows">
              <Input
                className="h-11"
                type="number"
                min={5}
                max={80}
                value={draft.gridRows}
                onChange={(event) =>
                  onUpdate('battle', { gridRows: Number(event.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Monster groups (one per line)">
            <Textarea
              className="min-h-24"
              value={draft.creatureGroups}
              onChange={(event) =>
                onUpdate('battle', { creatureGroups: event.target.value })
              }
              placeholder={'Goblin x3\nGoblin Cursespitter x1'}
            />
          </Field>
          <Field label="Tactical notes">
            <Textarea
              value={draft.notes}
              onChange={(event) => onUpdate('battle', { notes: event.target.value })}
              placeholder="Encounter notes"
            />
          </Field>
        </div>
      );
    }
    case 'story': {
      const draft = drafts.story;
      return (
        <div className="space-y-4 rounded-md border border-purple-900/50 bg-purple-950/10 p-3">
          <Field label="Read-aloud text">
            <Textarea
              className="min-h-28"
              value={draft.readAloud}
              onChange={(event) => onUpdate('story', { readAloud: event.target.value })}
              placeholder="Scene text"
            />
          </Field>
          <Field label="Background image URL">
            <Input
              className="h-11"
              value={draft.assetUrl}
              onChange={(event) => onUpdate('story', { assetUrl: event.target.value })}
              placeholder="https://..."
            />
          </Field>
          <Field label="Director notes">
            <Textarea
              value={draft.notes}
              onChange={(event) => onUpdate('story', { notes: event.target.value })}
              placeholder="Private scene notes"
            />
          </Field>
        </div>
      );
    }
    case 'montage': {
      const draft = drafts.montage;
      return (
        <div className="space-y-4 rounded-md border border-amber-900/50 bg-amber-950/10 p-3">
          <Field label="Goal">
            <Input
              className="h-11"
              value={draft.goal}
              onChange={(event) => onUpdate('montage', { goal: event.target.value })}
              placeholder="Escape the collapsing ruins"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Rounds">
              <Input
                className="h-11"
                type="number"
                min={1}
                max={12}
                value={draft.roundLimit}
                onChange={(event) =>
                  onUpdate('montage', { roundLimit: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Successes">
              <Input
                className="h-11"
                type="number"
                min={1}
                max={20}
                value={draft.successesNeeded}
                onChange={(event) =>
                  onUpdate('montage', { successesNeeded: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Failures">
              <Input
                className="h-11"
                type="number"
                min={1}
                max={20}
                value={draft.failureLimit}
                onChange={(event) =>
                  onUpdate('montage', { failureLimit: Number(event.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Challenges (one per line)">
            <Textarea
              className="min-h-24"
              value={draft.challenges}
              onChange={(event) => onUpdate('montage', { challenges: event.target.value })}
              placeholder={'Navigate the flooded passage\nDisable the spinning blades'}
            />
          </Field>
          <Field label="Director notes">
            <Textarea
              value={draft.notes}
              onChange={(event) => onUpdate('montage', { notes: event.target.value })}
              placeholder="Montage notes"
            />
          </Field>
        </div>
      );
    }
    case 'negotiation': {
      const draft = drafts.negotiation;
      return (
        <div className="space-y-4 rounded-md border border-blue-900/50 bg-blue-950/10 p-3">
          <Field label="NPC name">
            <Input
              className="h-11"
              value={draft.npcName}
              onChange={(event) => onUpdate('negotiation', { npcName: event.target.value })}
              placeholder="Magistrate Venn"
            />
          </Field>
          <Field label="Starting attitude">
            <select
              className={SELECT_CLASS}
              value={draft.startingAttitude}
              onChange={(event) =>
                onUpdate('negotiation', {
                  startingAttitude: event.target.value as NPCAttitude,
                })
              }
            >
              <option value="hostile">Hostile</option>
              <option value="unfriendly">Unfriendly</option>
              <option value="neutral">Neutral</option>
              <option value="friendly">Friendly</option>
              <option value="helpful">Helpful</option>
            </select>
          </Field>
          <Field label="NPC description">
            <Textarea
              value={draft.npcDescription}
              onChange={(event) =>
                onUpdate('negotiation', { npcDescription: event.target.value })
              }
              placeholder="What the NPC wants and how they behave"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Interest">
              <Input
                className="h-11"
                type="number"
                min={0}
                max={5}
                value={draft.startingInterest}
                onChange={(event) =>
                  onUpdate('negotiation', { startingInterest: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Patience">
              <Input
                className="h-11"
                type="number"
                min={0}
                max={5}
                value={draft.startingPatience}
                onChange={(event) =>
                  onUpdate('negotiation', { startingPatience: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Impression">
              <Input
                className="h-11"
                type="number"
                min={1}
                max={12}
                value={draft.impression}
                onChange={(event) =>
                  onUpdate('negotiation', { impression: Number(event.target.value) })
                }
              />
            </Field>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-3 text-xs leading-5 text-zinc-500">
            Draw Steel negotiations use twelve traits as either motivations or pitfalls.
            Configure at least two motivations and one pitfall before creating the scene.
          </div>
          <NegotiationTraitList
            role="motivation"
            selections={draft.motivations}
            onChange={(motivations) => onUpdate('negotiation', { motivations })}
          />
          <NegotiationTraitList
            role="pitfall"
            selections={draft.pitfalls}
            onChange={(pitfalls) => onUpdate('negotiation', { pitfalls })}
          />
          <Field label="Director notes">
            <Textarea
              value={draft.notes}
              onChange={(event) => onUpdate('negotiation', { notes: event.target.value })}
              placeholder="Negotiation notes"
            />
          </Field>
        </div>
      );
    }
    case 'respite': {
      const draft = drafts.respite;
      return (
        <div className="space-y-4 rounded-md border border-emerald-900/50 bg-emerald-950/10 p-3">
          <Field label="Location">
            <Input
              className="h-11"
              value={draft.location}
              onChange={(event) => onUpdate('respite', { location: event.target.value })}
              placeholder="The Old Lantern Inn"
            />
          </Field>
          <Field label="Duration">
            <Input
              className="h-11"
              value={draft.duration}
              onChange={(event) => onUpdate('respite', { duration: event.target.value })}
              placeholder="One evening"
            />
          </Field>
          <div>
            <p className="text-sm font-medium text-zinc-300">Activities</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {RESPITE_ACTIVITY_OPTIONS.map((activity) => {
                const checked = draft.availableActivities.includes(activity.id);
                return (
                  <label
                    key={activity.id}
                    className={cn(
                      'flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-sm',
                      checked
                        ? 'border-emerald-700 bg-emerald-950/40 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        onUpdate('respite', {
                          availableActivities: event.target.checked
                            ? [...draft.availableActivities, activity.id]
                            : draft.availableActivities.filter((id) => id !== activity.id),
                        });
                      }}
                    />
                    <span>{activity.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <Field label="Projects (one per line)">
            <Textarea
              value={draft.projects}
              onChange={(event) => onUpdate('respite', { projects: event.target.value })}
              placeholder={'Repair the broken ward\nResearch the baroness'}
            />
          </Field>
          <Field label="Director notes">
            <Textarea
              value={draft.notes}
              onChange={(event) => onUpdate('respite', { notes: event.target.value })}
              placeholder="Respite notes"
            />
          </Field>
        </div>
      );
    }
    default:
      return null;
  }
}

export interface SceneCreateTarget {
  sessionId: string;
  sessionName: string;
}

export function SceneCreateSheet({
  target,
  onClose,
  onCreated,
}: {
  target: SceneCreateTarget;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [sceneType, setSceneType] = useState<SceneType>('story');
  const [drafts, setDrafts] = useState<SceneCreationDrafts>(() => createInitialSceneDrafts());
  const [monsterItems, setMonsterItems] = useState<CompendiumItemBase[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMonsters()
      .then((data) => {
        if (!cancelled) setMonsterItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setMonsterItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const monsterByName = useMemo(() => buildMonsterLookup(monsterItems), [monsterItems]);

  const updateDraft = <T extends SceneType>(
    type: T,
    updates: Partial<SceneCreationDrafts[T]>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [type]: {
        ...current[type],
        ...updates,
      },
    } as SceneCreationDrafts));
  };

  const canCreate =
    Boolean(title.trim()) &&
    (sceneType !== 'negotiation' || isNegotiationDraftReady(drafts.negotiation)) &&
    !saving;

  const handleCreate = async () => {
    if (!canCreate) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/api/sessions/${target.sessionId}/scenes`, {
        title: title.trim(),
        type: sceneType,
        data: JSON.stringify(createSceneData(sceneType, drafts, monsterByName)),
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">New Scene</p>
          <p className="truncate text-xs text-zinc-500">{target.sessionName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scene form"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4">
          <Field label="Scene title">
            <Input
              className="h-11"
              placeholder="Scene title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-zinc-300">Scene type</p>
            <div className="mt-2 grid gap-2">
              {SCENE_TYPE_OPTIONS.map((option) => {
                const selected = sceneType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSceneType(option.value)}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-md border px-3 py-2 text-left transition',
                      selected
                        ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
                    )}
                  >
                    <SceneTypeIcon type={option.value} className="size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {option.summary}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <SceneTypeFields type={sceneType} drafts={drafts} onUpdate={updateDraft} />

          {error && (
            <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3">
        <div className="mx-auto flex w-full max-w-3xl gap-2">
          <Button variant="ghost" className="h-11 flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="h-11 flex-1" onClick={() => void handleCreate()} disabled={!canCreate}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create Scene
          </Button>
        </div>
      </footer>
    </div>
  );
}
