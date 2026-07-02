import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Check, FolderKanban, Loader2, Pencil, Plus, X } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, cn } from '@anvil/ui';
import { api } from '../../lib/api.js';
import { useAuthStore } from '../../stores/authStore.js';
import type { CampaignData } from '../../components/sessions/types.js';
import { EmptyState, LoadingPanel } from './shared.js';
import { SceneCreateSheet } from './MobileSceneCreate.js';
import type { SceneCreateTarget } from './MobileSceneCreate.js';

function InlineNameForm({
  placeholder,
  initialValue = '',
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  initialValue?: string;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [busy, setBusy] = useState(false);
  const canSubmit = Boolean(value.trim()) && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit(value.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void submit();
          if (event.key === 'Escape') onCancel();
        }}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1"
      />
      <Button
        size="sm"
        className="size-11 shrink-0 p-0"
        aria-label="Save"
        onClick={() => void submit()}
        disabled={!canSubmit}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="size-11 shrink-0 p-0"
        aria-label="Cancel"
        onClick={onCancel}
        disabled={busy}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-100"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}

function SessionEditList({
  sessions,
  scenesBySession,
  moduleId,
  campaignId,
  onAddScene,
  onChanged,
}: {
  sessions: CampaignData['sessions'];
  scenesBySession: Map<string, CampaignData['scenes']>;
  moduleId: string | null;
  campaignId: string;
  onAddScene: (target: SceneCreateTarget) => void;
  onChanged: () => Promise<void>;
}) {
  const [addingSession, setAddingSession] = useState(false);

  const createSession = async (name: string) => {
    await api.post(`/api/campaigns/${campaignId}/sessions`, {
      name,
      module_id: moduleId ?? undefined,
    });
    setAddingSession(false);
    await onChanged();
  };

  return (
    <div className="divide-y divide-zinc-800">
      {sessions.map((session) => {
        const scenes = scenesBySession.get(session.id) ?? [];
        return (
          <div key={session.id} className="px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-medium text-zinc-200">
                {session.name}
              </p>
              <Badge variant="secondary" className="shrink-0 capitalize">
                {session.status}
              </Badge>
            </div>
            {scenes.length > 0 && (
              <div className="mt-2 grid gap-1">
                {scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-zinc-900 px-2 py-1.5"
                  >
                    <span className="truncate text-xs text-zinc-300">{scene.title}</span>
                    <span className="shrink-0 text-[10px] uppercase text-zinc-500">
                      {scene.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => onAddScene({ sessionId: session.id, sessionName: session.name })}
              className="mt-2 flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100"
            >
              <Plus className="size-3.5" />
              Add scene
            </button>
          </div>
        );
      })}
      <div className="px-3 py-3">
        {addingSession ? (
          <InlineNameForm
            placeholder="Session name"
            onSubmit={createSession}
            onCancel={() => setAddingSession(false)}
          />
        ) : (
          <AddButton label="Add session" onClick={() => setAddingSession(true)} />
        )}
      </div>
    </div>
  );
}

function CampaignEditCard({
  campaign,
  onAddScene,
  onChanged,
}: {
  campaign: CampaignData;
  onAddScene: (target: SceneCreateTarget) => void;
  onChanged: () => Promise<void>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [addingModule, setAddingModule] = useState(false);

  const sessionsByModule = useMemo(() => {
    const map = new Map<string | null, CampaignData['sessions']>();
    for (const session of campaign.sessions) {
      const key = session.module_id ?? null;
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    for (const [key, sessions] of map) {
      map.set(
        key,
        [...sessions].sort((a, b) => a.order_index - b.order_index),
      );
    }
    return map;
  }, [campaign.sessions]);
  const scenesBySession = useMemo(() => {
    const map = new Map<string, CampaignData['scenes']>();
    for (const scene of campaign.scenes) {
      map.set(scene.game_session_id, [...(map.get(scene.game_session_id) ?? []), scene]);
    }
    for (const [key, scenes] of map) {
      map.set(
        key,
        [...scenes].sort((a, b) => a.order_index - b.order_index),
      );
    }
    return map;
  }, [campaign.scenes]);
  const modules = [...campaign.modules].sort((a, b) => a.order_index - b.order_index);
  const unattachedSessions = sessionsByModule.get(null) ?? [];

  const renameCampaign = async (name: string) => {
    await api.put(`/api/campaigns/${campaign.id}`, { name });
    setRenaming(false);
    await onChanged();
  };

  const createModule = async (name: string) => {
    await api.post(`/api/campaigns/${campaign.id}/modules`, { name });
    setAddingModule(false);
    await onChanged();
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/70">
      <CardHeader className="p-4">
        {renaming ? (
          <InlineNameForm
            placeholder="Campaign name"
            initialValue={campaign.name}
            onSubmit={renameCampaign}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="min-w-0 truncate text-base">{campaign.name}</CardTitle>
            <button
              type="button"
              onClick={() => setRenaming(true)}
              aria-label={`Rename ${campaign.name}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Pencil className="size-4" />
            </button>
          </div>
        )}
        {campaign.description && (
          <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{campaign.description}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{campaign.modules.length} modules</Badge>
          <Badge variant="secondary">{campaign.sessions.length} sessions</Badge>
          <Badge variant="secondary">{campaign.scenes.length} scenes</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        {modules.map((module) => (
          <div key={module.id} className="rounded-lg border border-zinc-800 bg-zinc-950/70">
            <div className="border-b border-zinc-800 px-3 py-2">
              <p className="text-sm font-semibold text-zinc-100">{module.name}</p>
            </div>
            <SessionEditList
              sessions={sessionsByModule.get(module.id) ?? []}
              scenesBySession={scenesBySession}
              moduleId={module.id}
              campaignId={campaign.id}
              onAddScene={onAddScene}
              onChanged={onChanged}
            />
          </div>
        ))}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70">
          <div className="border-b border-zinc-800 px-3 py-2">
            <p className="text-sm font-semibold text-zinc-100">Unassigned</p>
          </div>
          <SessionEditList
            sessions={unattachedSessions}
            scenesBySession={scenesBySession}
            moduleId={null}
            campaignId={campaign.id}
            onAddScene={onAddScene}
            onChanged={onChanged}
          />
        </div>
        {addingModule ? (
          <InlineNameForm
            placeholder="Module name"
            onSubmit={createModule}
            onCancel={() => setAddingModule(false)}
          />
        ) : (
          <AddButton label="Add module" onClick={() => setAddingModule(true)} />
        )}
      </CardContent>
    </Card>
  );
}

export function MobileCampaigns() {
  const role = useAuthStore((state) => state.user?.role ?? 'director');
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [sceneTarget, setSceneTarget] = useState<SceneCreateTarget | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.get<{ campaigns: CampaignData[] }>('/api/game-sessions');
      setCampaigns(data.campaigns.filter((campaign) => campaign.role === 'director'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaigns unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'director') return;
    void load();
  }, [load, role]);

  if (role !== 'director') return <Navigate to="/app/mobile" replace />;

  const createCampaign = async (name: string) => {
    await api.post('/api/campaigns', { name });
    setCreating(false);
    await load();
  };

  const handleSceneCreated = async () => {
    setSceneTarget(null);
    await load();
  };

  return (
    <div className={cn('mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Campaigns</h1>
          <p className="mt-1 text-xs text-zinc-500">{campaigns.length} directed</p>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New
          </Button>
        )}
      </div>

      {creating && (
        <InlineNameForm
          placeholder="Campaign name"
          onSubmit={createCampaign}
          onCancel={() => setCreating(false)}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingPanel />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No directed campaigns"
          action={
            !creating && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                Create
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <CampaignEditCard
              key={campaign.id}
              campaign={campaign}
              onAddScene={setSceneTarget}
              onChanged={load}
            />
          ))}
        </div>
      )}

      {sceneTarget && (
        <SceneCreateSheet
          target={sceneTarget}
          onClose={() => setSceneTarget(null)}
          onCreated={handleSceneCreated}
        />
      )}
    </div>
  );
}
