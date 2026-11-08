import type { ReactNode } from 'react';
import type { SceneType } from '@anvil/ui';
import { ConnectionLost, DropStrip } from '../../ReconnectOverlay.js';
import type { StateAction } from '../../StateMessage.js';
import { useSessionConnection } from './connection-context.js';
import { SceneChangeProvider, SceneSwap, SceneTitleCard } from './SceneChange.js';
import './session-shell.css';

/*
 * The live-session frame (DESIGN.md section 6; demos `battle-director`, `battle-player`).
 * The same in every mode: the top row (wordmark, Film Strip or the Player's band, session
 * danger), the left rail (304), the screen in heavy ink with the bar under it, the right
 * rail (294), and the status bar on the ground. Rails keep their width; the screen takes
 * what is left. Each mode slots its own content into these places.
 */
interface SessionShellProps {
  role: 'director' | 'player';
  mode: SceneType | null;
  /** The live scene's name, for the title card on a mode change. */
  sceneName: string;
  /** Everything in the top row after the wordmark. */
  top: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  screen: ReactNode;
  /** The bar under the screen: the mode's tools and the dice. */
  bar?: ReactNode;
  status: ReactNode;
  /** The Player's turn: the screen gets a 3 px active outline. */
  turn?: boolean;
  /** The give-up window has passed: cover the table with "Can't reach the table". */
  lost?: boolean;
  onRetry: () => void;
  back?: StateAction;
  /** Dialogs and other things that float over the whole shell. */
  children?: ReactNode;
}

export function SessionShell({
  role,
  mode,
  sceneName,
  top,
  left,
  right,
  screen,
  bar,
  status,
  turn = false,
  lost = false,
  onRetry,
  back,
  children,
}: SessionShellProps) {
  const { paused, dropSeconds } = useSessionConnection();
  const rails = left && right ? 'both' : right ? 'right' : left ? 'left' : 'none';

  return (
    <SceneChangeProvider mode={mode} name={sceneName}>
      <div className="sb-app" data-role={role} data-mode={mode ?? undefined}>
        <header className="sb-top">
          <div className="sb-word">Anvil</div>
          {top}
        </header>
        <div className="sb-mid" data-rails={rails}>
          {left && (
            <section className="sb-frame sb-rail" aria-label="Left rail">
              <SceneSwap>{left}</SceneSwap>
            </section>
          )}
          <main className="sb-centre">
            <div className="sb-screen" data-turn={turn || undefined}>
              <SceneSwap screen>{screen}</SceneSwap>
              <SceneTitleCard />
              {paused && !lost && <DropStrip seconds={dropSeconds} />}
            </div>
            {bar && (
              <SceneSwap delay={520} className="sb-bar-swap">
                <div className="sb-bar">{bar}</div>
              </SceneSwap>
            )}
          </main>
          {right && (
            <section className="sb-frame sb-rail" aria-label="Right rail">
              <SceneSwap delay={380}>{right}</SceneSwap>
            </section>
          )}
        </div>
        {status}
        {lost && <ConnectionLost onRetry={onRetry} back={back} />}
        {children}
      </div>
    </SceneChangeProvider>
  );
}
