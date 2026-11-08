import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { SceneRef } from '../../types/protocol.js';
import { FilmBoard } from './FilmStrip.js';
import { useSessionConnection } from './shell/connection-context.js';

interface DirectorFilmStripProps {
  scenes: SceneRef[];
  activeSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
}

/**
 * The Director's Film Strip (demo `battle-director`, `sb-strip`): every scene as a board in
 * play order, ink arrows between them on the ground. Choosing a board switches the scene;
 * during a drop the boards wait.
 */
export function DirectorFilmStrip({
  scenes,
  activeSceneId,
  onSelectScene,
}: DirectorFilmStripProps) {
  const { paused } = useSessionConnection();
  const ordered = useMemo(
    () => [...scenes].sort((a, b) => a.order_index - b.order_index),
    [scenes],
  );

  return (
    <nav className="sb-strip" aria-label="Film strip">
      {ordered.map((scene, i) => (
        <div className="sb-cell" key={scene.id}>
          <FilmBoard
            scene={scene}
            live={scene.id === activeSceneId}
            onSelect={onSelectScene}
            waiting={paused}
          />
          {i < ordered.length - 1 && (
            <ArrowRight className="sb-arrow" size={15} strokeWidth={3.5} aria-hidden="true" />
          )}
        </div>
      ))}
      {ordered.length === 0 && (
        <span className="self-center text-[13px] font-bold text-on-canvas">No scenes</span>
      )}
    </nav>
  );
}
