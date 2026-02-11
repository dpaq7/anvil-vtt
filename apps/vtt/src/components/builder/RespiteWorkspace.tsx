import { useCallback } from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { RespiteStage } from '../stages/RespiteStage.js';
import { SceneAudioPanel } from '../session/SceneAudioPanel.js';
import type { Scene } from './SceneWorkspace.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RespiteWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
}

interface RespiteProject {
  id: string;
  name: string;
  goalPoints: number;
}

interface RespiteSceneData {
  location: string;
  duration: string;
  availableActivities: string[];
  projects: RespiteProject[];
  notes: string;
}

// Standard respite activities from Draw Steel
const RESPITE_ACTIVITIES = [
  { id: 'recover', label: 'Recover', description: 'Heal stamina and conditions' },
  { id: 'craft', label: 'Craft', description: 'Create items or equipment' },
  { id: 'research', label: 'Research', description: 'Study lore or gather information' },
  { id: 'socialize', label: 'Socialize', description: 'Build relationships with NPCs' },
  { id: 'change_kit', label: 'Change Kit', description: 'Swap equipped kit' },
  { id: 'project', label: 'Project', description: 'Work on long-term projects' },
  { id: 'train', label: 'Train', description: 'Practice skills or abilities' },
  { id: 'negotiate', label: 'Negotiate', description: 'Attempt negotiations' },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RespiteWorkspace({ data, onChange, campaignId }: RespiteWorkspaceProps) {
  // Parse activities from either string (legacy) or array (new format)
  const parseAvailableActivities = (): string[] => {
    const raw = data['availableActivities'];
    if (Array.isArray(raw)) {
      return raw as string[];
    }
    // Legacy format: string with one activity per line (from 'activities' field)
    const legacyActivities = data['activities'];
    if (typeof legacyActivities === 'string' && legacyActivities.trim()) {
      return legacyActivities.split('\n').filter(Boolean).map((a) => a.trim().toLowerCase().replace(/\s+/g, '_'));
    }
    // Default to common activities
    return ['recover', 'craft', 'research', 'socialize'];
  };

  // Parse projects
  const parseProjects = (): RespiteProject[] => {
    const raw = data['projects'];
    if (Array.isArray(raw)) {
      return raw as RespiteProject[];
    }
    return [];
  };

  // Extract typed data with defaults (handle both 'location' and 'locationDescription')
  const respiteData: RespiteSceneData = {
    location: (data['location'] as string) ?? (data['locationDescription'] as string) ?? '',
    duration: (data['duration'] as string) ?? '',
    availableActivities: parseAvailableActivities(),
    projects: parseProjects(),
    notes: (data['notes'] as string) ?? '',
  };

  const updateField = <K extends keyof RespiteSceneData>(field: K, value: RespiteSceneData[K]) => {
    onChange({ ...data, [field]: value });
  };

  // Activity toggle
  const toggleActivity = useCallback(
    (activityId: string) => {
      const current = respiteData.availableActivities;
      const newActivities = current.includes(activityId)
        ? current.filter((a) => a !== activityId)
        : [...current, activityId];
      onChange({ ...data, availableActivities: newActivities });
    },
    [data, respiteData.availableActivities, onChange]
  );

  // Project handlers
  const addProject = useCallback(() => {
    const newProject: RespiteProject = {
      id: generateId(),
      name: '',
      goalPoints: 10,
    };
    onChange({ ...data, projects: [...respiteData.projects, newProject] });
  }, [data, respiteData.projects, onChange]);

  const updateProject = useCallback(
    (id: string, updates: Partial<RespiteProject>) => {
      const updated = respiteData.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      onChange({ ...data, projects: updated });
    },
    [data, respiteData.projects, onChange]
  );

  const removeProject = useCallback(
    (id: string) => {
      onChange({ ...data, projects: respiteData.projects.filter((p) => p.id !== id) });
    },
    [data, respiteData.projects, onChange]
  );

  // Convert projects to stage format
  const stageProjects = respiteData.projects.map((p) => ({
    id: p.id,
    name: p.name || 'Unnamed Project',
    currentPoints: 0,
    goalPoints: p.goalPoints,
  }));

  // Build sample activities for preview (no heroes assigned yet)
  const stageActivities = respiteData.availableActivities.map((actId) => ({
    heroName: 'Available',
    activityType: actId,
    completed: false,
  }));

  return (
    <div className="flex h-full">
      {/* Main area: Live preview of RespiteStage */}
      <div className="flex-1 overflow-auto bg-zinc-950">
        <RespiteStage
          location={respiteData.location}
          activities={stageActivities}
          projects={stageProjects}
          completed={false}
          isDirector={true}
        />

        {/* Empty state hint */}
        {!respiteData.location && respiteData.projects.length === 0 && (
          <div className="flex items-center justify-center pb-8">
            <div className="text-center text-zinc-600">
              <p className="text-lg font-medium">Respite Scene</p>
              <p className="mt-1 text-sm">Set a location and configure activities in the sidebar</p>
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

          {/* Location */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Location</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={respiteData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="Where the heroes are resting..."
            />
          </label>

          {/* Duration */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Duration</span>
            <Input
              value={respiteData.duration}
              onChange={(e) => updateField('duration', e.target.value)}
              placeholder="e.g. 'One full day', '8 hours'"
              className="text-sm"
            />
          </label>

          {/* Available Activities */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Available Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {RESPITE_ACTIVITIES.map((activity) => {
                  const isSelected = respiteData.availableActivities.includes(activity.id);
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => toggleActivity(activity.id)}
                      className={`flex flex-col items-start rounded-md border px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'border-green-500/50 bg-green-500/10 text-green-300'
                          : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-sm font-medium">{activity.label}</span>
                      <span className="text-xs opacity-70">{activity.description}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Long-term Projects</CardTitle>
              <Button variant="outline" size="sm" onClick={addProject}>
                + Add
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {respiteData.projects.length === 0 && (
                <p className="text-xs text-zinc-500">
                  No projects yet. Add projects that span multiple respites.
                </p>
              )}
              {respiteData.projects.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">#{idx + 1}</span>
                    <Input
                      value={p.name}
                      onChange={(e) => updateProject(p.id, { name: e.target.value })}
                      placeholder="Project name"
                      className="flex-1 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(p.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Goal:</span>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={p.goalPoints}
                      onChange={(e) => updateProject(p.id, { goalPoints: Number(e.target.value) })}
                      className="w-20 text-sm"
                    />
                    <span className="text-xs text-zinc-500">points</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Director Notes */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Director Notes</span>
            <textarea
              className="min-h-[80px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={respiteData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Private notes for this respite..."
            />
          </label>
        </div>
      </div>
    </div>
  );
}
