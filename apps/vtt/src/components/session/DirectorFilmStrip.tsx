import { useMemo } from 'react';
import { SceneTypeIcon, SCENE_BG_COLORS, SCENE_BORDER_COLORS, cn } from '@anvil/ui';
import type { SceneType } from '@anvil/ui';
import type { SceneRef } from '../../types/protocol.js';

interface DirectorFilmStripProps {
  scenes: SceneRef[];
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
}

function SceneChip({
  scene,
  isActive,
  onClick,
}: {
  scene: SceneRef;
  isActive: boolean;
  onClick: () => void;
}) {
  const sceneType = (scene.type as SceneType) || 'story';
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition',
        SCENE_BG_COLORS[sceneType],
        isActive
          ? cn(SCENE_BORDER_COLORS[sceneType], 'border-2 ring-1 ring-white/20')
          : 'border-zinc-700/50 hover:border-zinc-600',
      )}
    >
      <SceneTypeIcon type={sceneType} className="text-xs" />
      <span className="max-w-[100px] truncate text-zinc-200">{scene.name}</span>
    </button>
  );
}

/**
 * Director-only top bar: horizontal scene flow with respite floated right
 * behind a vertical separator. Replaces the old "Session" title bar.
 */
export function DirectorFilmStrip({
  scenes,
  activeSceneId,
  onSelectScene,
}: DirectorFilmStripProps) {
  const { mainScenes, respiteScene } = useMemo(() => {
    const main: SceneRef[] = [];
    let respite: SceneRef | null = null;
    for (const s of scenes) {
      if (s.type === 'respite') {
        respite = s;
      } else {
        main.push(s);
      }
    }
    return { mainScenes: main, respiteScene: respite };
  }, [scenes]);

  return (
    <div className="flex h-full w-full items-center gap-2 overflow-x-auto">
      {/* Main scene flow */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {mainScenes.map((scene) => (
          <SceneChip
            key={scene.id}
            scene={scene}
            isActive={scene.id === activeSceneId}
            onClick={() => onSelectScene(scene.id)}
          />
        ))}
        {mainScenes.length === 0 && (
          <span className="text-xs text-zinc-600">No scenes</span>
        )}
      </div>

      {/* Spacer pushes respite to the right */}
      <div className="flex-1" />

      {/* Respite separator + chip */}
      {respiteScene && (
        <>
          <div className="h-6 w-px shrink-0 bg-zinc-700" />
          <SceneChip
            scene={respiteScene}
            isActive={respiteScene.id === activeSceneId}
            onClick={() => onSelectScene(respiteScene.id)}
          />
        </>
      )}
    </div>
  );
}
