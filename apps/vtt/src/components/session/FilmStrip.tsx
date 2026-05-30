import { SceneTypeIcon, SCENE_BG_COLORS, SCENE_BORDER_COLORS, cn } from '@anvil/ui';
import type { SceneRef } from '../../types/protocol.js';
import type { SceneType } from '@anvil/ui';

interface FilmStripProps {
  scenes: SceneRef[];
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
}

export function FilmStrip({ scenes, activeSceneId, onSelectScene }: FilmStripProps) {
  return (
    <div className="flex h-full items-center gap-2 overflow-x-auto px-4">
      {scenes.map((scene) => {
        const sceneType = (scene.type as SceneType) || 'story';
        const isActive = scene.id === activeSceneId;
        return (
          <button
            key={scene.id}
            onClick={() => onSelectScene(scene.id)}
            title={scene.name}
            aria-label={scene.name}
            className={cn(
              'flex h-12 w-20 shrink-0 flex-col items-center justify-center rounded border transition',
              SCENE_BG_COLORS[sceneType],
              isActive
                ? cn(SCENE_BORDER_COLORS[sceneType], 'border-2 ring-1 ring-white/20')
                : 'border-zinc-700 hover:border-zinc-600',
            )}
          >
            <SceneTypeIcon type={sceneType} className="text-sm" />
            <span className="mt-0.5 max-w-[72px] truncate text-[10px] text-zinc-300">
              {scene.name}
            </span>
          </button>
        );
      })}
      {scenes.length === 0 && (
        <span className="text-xs text-zinc-500">No scenes</span>
      )}
    </div>
  );
}
