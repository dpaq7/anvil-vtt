import { useState, useMemo } from 'react';
import { Button, Badge } from '@anvil/ui';
import type { CampaignModule, CampaignSession, CampaignScene } from './types.js';

export interface SessionLauncherProps {
  modules: CampaignModule[];
  sessions: CampaignSession[];
  scenes: CampaignScene[];
  onGoLive: (sessionId: string, sceneId: string | null) => void;
  onRejoin: (sessionId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-zinc-500',
  lobby: 'text-yellow-400',
  active: 'text-green-400',
  paused: 'text-orange-400',
  completed: 'text-zinc-600',
};

const SCENE_TYPE_LABELS: Record<string, string> = {
  battle: 'Battle',
  story: 'Story',
  montage: 'Montage',
  negotiation: 'Negotiation',
  respite: 'Respite',
};

export function SessionLauncher({ modules, sessions, scenes, onGoLive, onRejoin }: SessionLauncherProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedSceneId, setSelectedSceneId] = useState<string>('');

  // Filter sessions by module
  const filteredSessions = useMemo(() => {
    if (selectedModuleId === 'all') return sessions;
    return sessions.filter((s) => s.module_id === selectedModuleId);
  }, [sessions, selectedModuleId]);

  // Filter scenes by session
  const filteredScenes = useMemo(() => {
    if (!selectedSessionId) return [];
    return scenes.filter((sc) => sc.game_session_id === selectedSessionId);
  }, [scenes, selectedSessionId]);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null;
  const isLive = selectedSession?.status === 'lobby' || selectedSession?.status === 'active';
  const isDraft = !selectedSession?.status || selectedSession.status === 'draft';
  const isCompleted = selectedSession?.status === 'completed';

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setSelectedSessionId('');
    setSelectedSceneId('');
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedSceneId('');
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3">
      {/* Module select */}
      {modules.length > 0 && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Module</label>
          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100"
            value={selectedModuleId}
            onChange={(e) => handleModuleChange(e.target.value)}
          >
            <option value="all">All</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Session select */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-zinc-500">Session</label>
        <select
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100"
          value={selectedSessionId}
          onChange={(e) => handleSessionChange(e.target.value)}
        >
          <option value="">Select a session...</option>
          {filteredSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.status || 'draft'})
            </option>
          ))}
        </select>
        {selectedSession && (
          <Badge
            variant="secondary"
            className={`text-[10px] ${STATUS_COLORS[selectedSession.status] ?? 'text-zinc-500'}`}
          >
            {selectedSession.status || 'draft'}
          </Badge>
        )}
      </div>

      {/* Scene select */}
      {selectedSessionId && filteredScenes.length > 0 && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-zinc-500">Scene</label>
          <select
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100"
            value={selectedSceneId}
            onChange={(e) => setSelectedSceneId(e.target.value)}
          >
            <option value="">First scene</option>
            {filteredScenes.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title} ({SCENE_TYPE_LABELS[sc.type] ?? sc.type})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action button */}
      {selectedSessionId && isDraft && (
        <Button
          size="sm"
          variant="default"
          onClick={() => onGoLive(selectedSessionId, selectedSceneId || null)}
        >
          Go Live
        </Button>
      )}
      {selectedSessionId && isLive && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRejoin(selectedSessionId)}
        >
          Rejoin
        </Button>
      )}
      {selectedSessionId && isCompleted && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onGoLive(selectedSessionId, selectedSceneId || null)}
        >
          Relaunch
        </Button>
      )}
    </div>
  );
}
