import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SceneType } from '@anvil/ui';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion.js';
import { ModeIcon } from '../FilmStrip.js';
import { modeWord } from '../../../lib/scene-mode.js';

/*
 * Scene change choreography (DESIGN.md 5.3; demo `scene-change-motion`). When the scene
 * changes mode: the Film Strip hands its raise on (CSS on the boards), 260 ms later a title
 * card in the new mode's colour slides across the screen, the screen switches under it,
 * the shell around it crossfades in a stagger, then the card leaves to the right.
 * Under reduced motion (5.4) none of this runs: the shell switches straight to the new mode.
 */
export const SCENE_CHANGE_MS = {
  cardIn: 260,
  /** The card has landed and covers the screen (260 + 0.6 s travel). */
  covered: 860,
  /** The shell starts to turn over; each layer adds its own stagger. */
  swap: 880,
  cardOut: 2180,
  done: 2960,
} as const;

type CardState = 'off' | 'in' | 'out';

interface SceneChangeState {
  /** Bumps once per animated mode change. */
  epoch: number;
  startedAt: number;
  card: CardState;
  mode: SceneType | null;
  name: string;
}

const SceneChangeContext = createContext<SceneChangeState>({
  epoch: 0,
  startedAt: 0,
  card: 'off',
  mode: null,
  name: '',
});

export function SceneChangeProvider({
  mode,
  name,
  children,
}: {
  mode: SceneType | null;
  name: string;
  children: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState<SceneChangeState>({ epoch: 0, startedAt: 0, card: 'off', mode, name });
  const [seenMode, setSeenMode] = useState(mode);

  // A mode change seen during render starts a run (derived state, no extra commit).
  if (seenMode !== mode) {
    setSeenMode(mode);
    if (seenMode !== null && mode !== null && !reduced) {
      setState((prev) => ({ epoch: prev.epoch + 1, startedAt: Date.now(), card: 'off', mode, name }));
    } else {
      setState((prev) => ({ ...prev, card: 'off', mode, name }));
    }
  }

  const { epoch } = state;
  useEffect(() => {
    if (epoch === 0) return;
    const at = (ms: number, card: CardState) => setTimeout(() => setState((prev) => ({ ...prev, card })), ms);
    const timers = [
      at(SCENE_CHANGE_MS.cardIn, 'in'),
      at(SCENE_CHANGE_MS.cardOut, 'out'),
      at(SCENE_CHANGE_MS.done, 'off'),
    ];
    return () => timers.forEach(clearTimeout);
  }, [epoch]);

  return <SceneChangeContext.Provider value={state}>{children}</SceneChangeContext.Provider>;
}

/** The title card that crosses the screen. Lives inside the screen frame. */
export function SceneTitleCard() {
  const { card, mode, name } = useContext(SceneChangeContext);
  if (!mode) return null;
  return (
    <div className="sc-card" data-mode={mode} data-s={card} aria-hidden="true">
      <div className="sc-card__in">
        <i>
          <ModeIcon type={mode} size={44} />
        </i>
        <strong>{name}</strong>
        <span>{modeWord(mode)}</span>
      </div>
    </div>
  );
}

interface SceneSwapProps {
  children: ReactNode;
  /** Stagger after the swap starts, in ms (rails 0 / 240 / 380, bar 520). */
  delay?: number;
  /** The lower left rail rises 8 px as it arrives. */
  rise?: boolean;
  /** The screen switches at once under the card instead of crossfading. */
  screen?: boolean;
  className?: string;
}

interface Layer {
  epoch: number;
  node: ReactNode;
}

/**
 * Two layers in one place during a mode change: the outgoing content stays (inert) while
 * the incoming content fades in over it, then the old layer goes. Outside a run it is one
 * layer and renders its children as they are.
 */
export function SceneSwap({ children, delay = 0, rise = false, screen = false, className = '' }: SceneSwapProps) {
  const { epoch, startedAt } = useContext(SceneChangeContext);
  const committed = useRef<ReactNode>(children);
  const [seenEpoch, setSeenEpoch] = useState(epoch);
  const [old, setOld] = useState<Layer | null>(null);
  const [stage, setStage] = useState<'wait' | 'rise' | 'on'>('on');

  if (seenEpoch !== epoch) {
    setSeenEpoch(epoch);
    setOld({ epoch: seenEpoch, node: committed.current });
    setStage(screen ? 'on' : rise ? 'rise' : 'wait');
  }

  useLayoutEffect(() => {
    committed.current = children;
  });

  useEffect(() => {
    if (!old) return;
    const elapsed = Date.now() - startedAt;
    if (screen) {
      const t = setTimeout(() => setOld(null), Math.max(0, SCENE_CHANGE_MS.covered - elapsed));
      return () => clearTimeout(t);
    }
    const onAt = Math.max(0, SCENE_CHANGE_MS.swap + delay - elapsed);
    const t1 = setTimeout(() => setStage('on'), onAt);
    const t2 = setTimeout(() => setOld(null), onAt + (rise ? 400 : 280));
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [old, startedAt, delay, rise, screen]);

  return (
    <div className={`sc-swap ${screen ? 'sc-swap--screen' : ''} ${className}`}>
      {old && (
        <div className="sc-layer" data-k="old" key={`e${old.epoch}`} aria-hidden="true" inert>
          {old.node}
        </div>
      )}
      <div className="sc-layer" data-k="new" data-s={stage} key={`e${epoch}`}>
        {children}
      </div>
    </div>
  );
}
