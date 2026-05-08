import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button } from '@anvil/ui';
import { Expand, Swords } from 'lucide-react';
import { api } from '../../lib/api.js';

// Scene-type-specific workspaces (will be created in subsequent phases)
import { StoryWorkspace } from './StoryWorkspace.js';
import { MontageWorkspace } from './MontageWorkspace.js';
import { NegotiationWorkspace } from './NegotiationWorkspace.js';
import { RespiteWorkspace } from './RespiteWorkspace.js';
import { BattleWorkspace } from './BattleWorkspace.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Scene {
  id: string;
  title: string;
  type: 'battle' | 'story' | 'montage' | 'negotiation' | 'respite';
  data: string;
  snapshot?: string | null;
  order_index: number;
  game_session_id: string;
}

export interface SceneWorkspaceProps {
  scene: Scene;
  campaignId: string;
  onSave?: () => void;
  onBeginCombat?: (scene: Scene) => void;
  focusMode?: boolean;
  onFocusModeChange?: (enabled: boolean) => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ViewMode = 'original' | 'endState';

interface SceneSnapshot {
  data: Record<string, unknown>;
  entities: unknown[];
  combat: unknown | null;
  savedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SceneWorkspace({ scene, campaignId, onSave, onBeginCombat, focusMode = false, onFocusModeChange }: SceneWorkspaceProps) {
  const hasSnapshot = Boolean(scene.snapshot);
  const [viewMode, setViewMode] = useState<ViewMode>('original');
  const isReadOnly = viewMode === 'endState';

  // Parse snapshot data (memoized to avoid re-renders)
  const parsedSnapshot = useMemo<SceneSnapshot | null>(() => {
    if (!scene.snapshot) return null;
    try {
      return JSON.parse(scene.snapshot) as SceneSnapshot;
    } catch {
      return null;
    }
  }, [scene.snapshot]);

  // Parse scene data
  const [data, setData] = useState<Record<string, unknown>>(() => {
    try {
      return JSON.parse(scene.data) as Record<string, unknown>;
    } catch {
      return {};
    }
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>(scene.data);

  // Reset data when scene changes or view mode switches
  useEffect(() => {
    if (viewMode === 'endState' && parsedSnapshot) {
      setData(parsedSnapshot.data);
    } else {
      try {
        const parsed = JSON.parse(scene.data) as Record<string, unknown>;
        setData(parsed);
        lastSavedDataRef.current = scene.data;
      } catch {
        setData({});
        lastSavedDataRef.current = '{}';
      }
    }
    setSaveStatus('idle');
  }, [scene.id, scene.data, viewMode, parsedSnapshot]);

  // Debounced auto-save (disabled in read-only snapshot mode)
  const handleDataChange = useCallback(
    (newData: Record<string, unknown>) => {
      if (isReadOnly) return;

      setData(newData);

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Check if data actually changed
      const newDataStr = JSON.stringify(newData);
      if (newDataStr === lastSavedDataRef.current) {
        return;
      }

      setSaveStatus('saving');

      // Debounce save by 1 second
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await api.put(`/api/scenes/${scene.id}`, { data: newDataStr });
          lastSavedDataRef.current = newDataStr;
          setSaveStatus('saved');
          onSave?.();

          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (err) {
          console.error('Failed to save scene:', err);
          setSaveStatus('error');
        }
      }, 1000);
    },
    [scene.id, onSave, isReadOnly]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Scene type colors for the header accent
  const sceneColors: Record<string, string> = {
    battle: 'border-red-500',
    story: 'border-purple-500',
    montage: 'border-amber-500',
    negotiation: 'border-blue-500',
    respite: 'border-green-500',
  };

  const sceneLabels: Record<string, string> = {
    battle: 'Battle',
    story: 'Story',
    montage: 'Montage',
    negotiation: 'Negotiation',
    respite: 'Respite',
  };

  // Render scene-type-specific workspace
  const renderWorkspace = () => {
    const workspaceProps = { data, onChange: handleDataChange, scene, campaignId };

    switch (scene.type) {
      case 'story':
        return <StoryWorkspace {...workspaceProps} />;
      case 'montage':
        return <MontageWorkspace {...workspaceProps} />;
      case 'negotiation':
        return <NegotiationWorkspace {...workspaceProps} />;
      case 'respite':
        return <RespiteWorkspace {...workspaceProps} />;
      case 'battle':
        return <BattleWorkspace {...workspaceProps} focusMode={focusMode} />;
      default:
        return (
          <div className="flex h-full items-center justify-center text-zinc-500">
            Unknown scene type: {scene.type}
          </div>
        );
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      {!focusMode && (
      <div
        className={`flex items-center justify-between border-b-2 bg-zinc-900/80 px-4 py-3 ${sceneColors[scene.type] ?? 'border-zinc-700'}`}
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">{scene.title}</h2>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs uppercase text-zinc-400">
            {sceneLabels[scene.type] ?? scene.type}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status indicator */}
          {!isReadOnly && (
            <>
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1.5 text-xs text-red-500">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Save failed
                </span>
              )}
            </>
          )}

          {scene.type === 'battle' && !isReadOnly && (
            <Button
              size="sm"
              className="bg-red-600 text-zinc-100 hover:bg-red-500"
              onClick={() => onBeginCombat?.(scene)}
            >
              <Swords className="size-4" />
              Draw Steel!
            </Button>
          )}

          {/* Original / End State toggle */}
          {hasSnapshot && (
            <div className="flex rounded-md border border-zinc-700 bg-zinc-800/60">
              <button
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'original'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setViewMode('original')}
              >
                Original
              </button>
              <button
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === 'endState'
                    ? 'bg-zinc-700 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setViewMode('endState')}
              >
                End State
              </button>
            </div>
          )}

          {onFocusModeChange && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Focus scene"
              aria-label="Focus scene"
              onClick={() => onFocusModeChange(true)}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <Expand className="size-4" />
            </Button>
          )}

          {/* Read-only indicator */}
          {isReadOnly && (
            <span className="flex items-center gap-1.5 text-xs text-amber-500">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Read-only snapshot
            </span>
          )}

        </div>
      </div>
      )}

      {/* Workspace content */}
      <div className="flex-1 overflow-hidden">{renderWorkspace()}</div>
    </div>
  );
}
