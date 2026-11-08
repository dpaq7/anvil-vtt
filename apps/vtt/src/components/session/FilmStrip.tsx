import { BookOpen, Footprints, Handshake, Swords, Tent, type LucideIcon } from 'lucide-react';
import type { SceneType } from '@anvil/ui';
import type { SceneRef } from '../../types/protocol.js';
import { MODE_WORD, sceneTypeOf } from '../../lib/scene-mode.js';
import { SceneNameTooltip } from './SceneNameTooltip.js';
import './shell/session-shell.css';

/*
 * Film Strip cell (DESIGN.md section 4; demo `battle-director`, `sb-board`): a 34 px icon
 * cell in the mode colour, then the scene name over the mode word. The live board is filled
 * with its mode colour, framed in ink, raised and tilted.
 */
const MODE_ICON: Record<SceneType, LucideIcon> = {
  story: BookOpen,
  montage: Footprints,
  negotiation: Handshake,
  battle: Swords,
  respite: Tent,
};

export function ModeIcon({ type, size = 20 }: { type: SceneType; size?: number }) {
  const Icon = MODE_ICON[type];
  return <Icon size={size} strokeWidth={2.6} aria-hidden="true" />;
}

interface FilmBoardProps {
  scene: SceneRef;
  live: boolean;
  /** Left out where the board only shows the scene (the Player's strip). */
  onSelect?: (sceneId: string) => void;
  /** True while a drop holds actions that need the server. */
  waiting?: boolean;
}

export function FilmBoard({ scene, live, onSelect, waiting = false }: FilmBoardProps) {
  const type = sceneTypeOf(scene);
  return (
    <SceneNameTooltip label={scene.name}>
      {(tip) => (
        <button
          type="button"
          ref={tip.ref}
          onBlur={tip.onBlur}
          onFocus={tip.onFocus}
          onMouseEnter={tip.onMouseEnter}
          onMouseLeave={tip.onMouseLeave}
          onPointerEnter={tip.onPointerEnter}
          onPointerLeave={tip.onPointerLeave}
          aria-describedby={tip['aria-describedby']}
          aria-label={scene.name}
          aria-current={live ? 'step' : undefined}
          className="sb-board"
          data-mode={type}
          data-on={live || undefined}
          disabled={!onSelect || (waiting && !live)}
          onClick={onSelect ? () => onSelect(scene.id) : undefined}
        >
          <i>
            <ModeIcon type={type} />
          </i>
          <span>
            <b>{scene.name}</b>
            <small>{MODE_WORD[type]}</small>
          </span>
        </button>
      )}
    </SceneNameTooltip>
  );
}

interface FilmStripProps {
  scenes: SceneRef[];
  activeSceneId: string | null;
}

/**
 * The Player's Film Strip: only the live board (`sb-strip--one`). Future scene names belong
 * to the Director (DESIGN.md section 7), so a Player never receives them in the DOM.
 */
export function FilmStrip({ scenes, activeSceneId }: FilmStripProps) {
  const live = scenes.find((scene) => scene.id === activeSceneId) ?? null;
  return (
    <nav className="sb-strip sb-strip--one" aria-label="Film strip">
      {live && (
        <div className="sb-cell">
          <FilmBoard scene={live} live />
        </div>
      )}
    </nav>
  );
}
