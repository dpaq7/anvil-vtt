import { useCallback, useMemo } from 'react';
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { NegotiationLogic, NEGOTIATION_NPCS } from '@anvil/data';
import type { PregenNegotiationScene } from '@anvil/data';
import type {
  NegotiationSceneTemplate,
  NegotiationMotivation,
  NegotiationPitfall,
  MotivationType,
  NPCAttitude,
} from '@anvil/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ATTITUDES: { value: NPCAttitude; label: string }[] = [
  { value: 'hostile', label: 'Hostile' },
  { value: 'unfriendly', label: 'Unfriendly' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'helpful', label: 'Helpful' },
];

const MOTIVATION_TYPES: { value: MotivationType; label: string }[] = [
  { value: 'benevolence', label: 'Benevolence' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'freedom', label: 'Freedom' },
  { value: 'greed', label: 'Greed' },
  { value: 'higher_authority', label: 'Higher Authority' },
  { value: 'justice', label: 'Justice' },
  { value: 'legacy', label: 'Legacy' },
  { value: 'peace', label: 'Peace' },
  { value: 'power', label: 'Power' },
  { value: 'protection', label: 'Protection' },
  { value: 'revelry', label: 'Revelry' },
  { value: 'vengeance', label: 'Vengeance' },
];

// Map NPCAttitude to NegotiationLogic attitude format
function toLogicAttitude(
  attitude: NPCAttitude
): 'hostile' | 'suspicious' | 'neutral' | 'open' | 'friendly' | 'trusting' {
  switch (attitude) {
    case 'hostile':
      return 'hostile';
    case 'unfriendly':
      return 'suspicious';
    case 'neutral':
      return 'neutral';
    case 'friendly':
      return 'open';
    case 'helpful':
      return 'friendly';
    default:
      return 'neutral';
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NegotiationSceneEditor({ data, onChange }: Props) {
  // Parse template from data or use defaults
  const template: NegotiationSceneTemplate = useMemo(() => {
    const parsed = data['template'] as NegotiationSceneTemplate | undefined;
    if (parsed) return parsed;

    // Default template
    return {
      npc: {
        name: '',
        description: '',
        portraitUrl: '',
      },
      startingAttitude: 'neutral' as NPCAttitude,
      startingInterest: 2,
      startingPatience: 4,
      impression: 5,
      impressionModifiers: [],
      motivations: [],
      pitfalls: [],
      characteristics: { might: 0, agility: 0, reason: 0, intuition: 0, presence: 0 },
      skills: [],
      languages: [],
      responses: {
        interest0: { label: 'No, and...', text: '' },
        interest1: { label: 'No.', text: '' },
        interest2: { label: 'No, but...', text: '' },
        interest3: { label: 'Yes, but...', text: '' },
        interest4: { label: 'Yes.', text: '' },
        interest5: { label: 'Yes, and...', text: '' },
      },
    };
  }, [data]);

  // Update helper
  const updateTemplate = useCallback(
    (updates: Partial<NegotiationSceneTemplate>) => {
      onChange({
        ...data,
        template: { ...template, ...updates },
      });
    },
    [data, onChange, template]
  );

  // Calculate derived values from attitude
  const derivedValues = useMemo(() => {
    const logicAttitude = toLogicAttitude(template.startingAttitude);
    return {
      interest: NegotiationLogic.getStartingInterest(logicAttitude),
      patience: NegotiationLogic.getStartingPatience(logicAttitude),
    };
  }, [template.startingAttitude]);

  // --- Motivation handlers ---
  const addMotivation = useCallback(() => {
    const newMotivation: NegotiationMotivation = {
      id: generateId(),
      type: 'benevolence',
      description: '',
      revealed: false,
    };
    updateTemplate({
      motivations: [...template.motivations, newMotivation],
    });
  }, [template.motivations, updateTemplate]);

  const updateMotivation = useCallback(
    (id: string, updates: Partial<NegotiationMotivation>) => {
      updateTemplate({
        motivations: template.motivations.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        ),
      });
    },
    [template.motivations, updateTemplate]
  );

  const removeMotivation = useCallback(
    (id: string) => {
      updateTemplate({
        motivations: template.motivations.filter((m) => m.id !== id),
      });
    },
    [template.motivations, updateTemplate]
  );

  // --- Pitfall handlers ---
  const addPitfall = useCallback(() => {
    const newPitfall: NegotiationPitfall = {
      id: generateId(),
      type: 'benevolence',
      description: '',
      revealed: false,
    };
    updateTemplate({
      pitfalls: [...template.pitfalls, newPitfall],
    });
  }, [template.pitfalls, updateTemplate]);

  const updatePitfall = useCallback(
    (id: string, updates: Partial<NegotiationPitfall>) => {
      updateTemplate({
        pitfalls: template.pitfalls.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      });
    },
    [template.pitfalls, updateTemplate]
  );

  const removePitfall = useCallback(
    (id: string) => {
      updateTemplate({
        pitfalls: template.pitfalls.filter((p) => p.id !== id),
      });
    },
    [template.pitfalls, updateTemplate]
  );

  // --- Template loading ---
  const loadTemplate = useCallback(
    (templateId: string) => {
      const pregen = NEGOTIATION_NPCS.find(
        (n: PregenNegotiationScene) => n.id === templateId
      );
      if (!pregen) return;

      const t = pregen.template;
      updateTemplate({
        npc: {
          name: t.npc.name,
          description: t.npc.description ?? '',
          portraitUrl: t.npc.portraitUrl ?? '',
        },
        startingAttitude: mapPregenAttitude(t.startingAttitude as 'hostile' | 'suspicious' | 'neutral' | 'open' | 'friendly' | 'trusting'),
        startingInterest: t.startingInterest,
        startingPatience: t.startingPatience,
        impression: t.impression,
        impressionModifiers: t.impressionModifiers,
        motivations: t.motivations.map((m: NegotiationMotivation) => ({
          id: m.id,
          type: m.type,
          description: m.description,
          revealed: false,
        })),
        pitfalls: t.pitfalls.map((p: NegotiationPitfall) => ({
          id: p.id,
          type: p.type,
          description: p.description,
          revealed: false,
        })),
        characteristics: t.characteristics,
        skills: t.skills,
        languages: t.languages,
        responses: t.responses,
      });
    },
    [updateTemplate]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Template Loader */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Load Pre-built NPC</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
            onChange={(e) => loadTemplate(e.target.value)}
            value=""
          >
            <option value="">Select a template...</option>
            {NEGOTIATION_NPCS.map((npc) => (
              <option key={npc.id} value={npc.id}>
                {npc.name} (Impression {npc.template.impression})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* NPC Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">NPC Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="text-sm text-zinc-400">
            Name
            <Input
              className="mt-1"
              value={template.npc.name}
              onChange={(e) =>
                updateTemplate({
                  npc: { ...template.npc, name: e.target.value },
                })
              }
              placeholder="NPC name"
            />
          </label>

          <label className="text-sm text-zinc-400">
            Portrait URL (optional)
            <Input
              className="mt-1"
              value={template.npc.portraitUrl ?? ''}
              onChange={(e) =>
                updateTemplate({
                  npc: { ...template.npc, portraitUrl: e.target.value },
                })
              }
              placeholder="https://..."
            />
          </label>

          <label className="text-sm text-zinc-400">
            Description
            <textarea
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
              rows={2}
              value={template.npc.description ?? ''}
              onChange={(e) =>
                updateTemplate({
                  npc: { ...template.npc, description: e.target.value },
                })
              }
              placeholder="Brief description of the NPC"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-zinc-400">
              Starting Attitude
              <select
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                value={template.startingAttitude}
                onChange={(e) =>
                  updateTemplate({
                    startingAttitude: e.target.value as NPCAttitude,
                  })
                }
              >
                {ATTITUDES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-500">
                Derived: Interest {derivedValues.interest}, Patience{' '}
                {derivedValues.patience}
              </p>
            </label>

            <label className="text-sm text-zinc-400">
              Impression (1-12)
              <Input
                className="mt-1"
                type="number"
                min={1}
                max={12}
                value={template.impression}
                onChange={(e) =>
                  updateTemplate({ impression: Number(e.target.value) })
                }
              />
              <p className="mt-1 text-xs text-zinc-500">
                {getImpressionTier(template.impression)}
              </p>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm text-zinc-400">
              Starting Interest (0-5)
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={5}
                value={template.startingInterest}
                onChange={(e) =>
                  updateTemplate({ startingInterest: Number(e.target.value) })
                }
              />
            </label>

            <label className="text-sm text-zinc-400">
              Starting Patience (0-5)
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={5}
                value={template.startingPatience}
                onChange={(e) =>
                  updateTemplate({ startingPatience: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Motivations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Motivations</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={addMotivation}
            disabled={template.motivations.length >= 4}
          >
            + Add
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {template.motivations.length === 0 && (
            <p className="text-xs text-zinc-500">
              No motivations yet. Add 2-4 motivations the NPC cares about.
            </p>
          )}
          {template.motivations.map((m, idx) => (
            <div
              key={m.id}
              className="flex flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">#{idx + 1}</span>
                <select
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                  value={m.type}
                  onChange={(e) =>
                    updateMotivation(m.id, { type: e.target.value as MotivationType })
                  }
                >
                  {MOTIVATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMotivation(m.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>
              <textarea
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
                rows={2}
                value={m.description}
                onChange={(e) =>
                  updateMotivation(m.id, { description: e.target.value })
                }
                placeholder="What the NPC says when this motivation is appealed to..."
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pitfalls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Pitfalls</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={addPitfall}
            disabled={template.pitfalls.length >= 4}
          >
            + Add
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {template.pitfalls.length === 0 && (
            <p className="text-xs text-zinc-500">
              No pitfalls yet. Add 2-4 pitfalls the NPC opposes.
            </p>
          )}
          {template.pitfalls.map((p, idx) => (
            <div
              key={p.id}
              className="flex flex-col gap-2 rounded-md border border-red-900/50 bg-red-900/10 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">#{idx + 1}</span>
                <select
                  className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                  value={p.type}
                  onChange={(e) =>
                    updatePitfall(p.id, { type: e.target.value as MotivationType })
                  }
                >
                  {MOTIVATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePitfall(p.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </Button>
              </div>
              <textarea
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
                rows={2}
                value={p.description}
                onChange={(e) =>
                  updatePitfall(p.id, { description: e.target.value })
                }
                placeholder="What the NPC says when this pitfall is triggered..."
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Outcome Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Outcome Responses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            Define what the NPC says at each interest level when negotiation ends.
          </p>
          {([0, 1, 2, 3, 4, 5] as const).map((level) => {
            const key = `interest${level}` as keyof typeof template.responses;
            const response = template.responses[key];
            return (
              <label key={level} className="text-sm text-zinc-400">
                <span
                  className={`inline-block w-24 rounded px-2 py-0.5 text-xs font-medium ${getInterestLevelColor(level)}`}
                >
                  {response.label}
                </span>
                <Input
                  className="mt-1"
                  value={response.text}
                  onChange={(e) =>
                    updateTemplate({
                      responses: {
                        ...template.responses,
                        [key]: { ...response, text: e.target.value },
                      },
                    })
                  }
                  placeholder={`Response at interest level ${level}`}
                />
              </label>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getImpressionTier(impression: number): string {
  if (impression <= 6) return 'Local-level NPC';
  if (impression <= 9) return 'National-level NPC';
  if (impression <= 11) return 'Kingdom-level NPC';
  return 'World-level NPC';
}

function getInterestLevelColor(level: number): string {
  if (level <= 1) return 'bg-red-500/20 text-red-400';
  if (level === 2) return 'bg-orange-500/20 text-orange-400';
  if (level === 3) return 'bg-yellow-500/20 text-yellow-400';
  if (level === 4) return 'bg-emerald-500/20 text-emerald-400';
  return 'bg-blue-500/20 text-blue-400';
}

function mapPregenAttitude(
  attitude: 'hostile' | 'suspicious' | 'neutral' | 'open' | 'friendly' | 'trusting'
): NPCAttitude {
  switch (attitude) {
    case 'hostile':
      return 'hostile';
    case 'suspicious':
      return 'unfriendly';
    case 'neutral':
      return 'neutral';
    case 'open':
      return 'friendly';
    case 'friendly':
    case 'trusting':
      return 'helpful';
    default:
      return 'neutral';
  }
}
