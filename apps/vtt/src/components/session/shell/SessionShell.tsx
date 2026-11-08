import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { SceneType } from '@anvil/ui';
import { ConnectionLost, DropStrip } from '../../ReconnectOverlay.js';
import type { StateAction } from '../../StateMessage.js';
import { useSessionConnection } from './connection-context.js';
import { SceneChangeProvider, SceneSwap, SceneTitleCard } from './SceneChange.js';
import './session-shell.css';
import '../battle/battle.css';

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

const RAILS_KEY = 'anvil-session-rails';
const RAIL_LEFT = 'var(--shape-rail-left)';
const RAIL_RIGHT = 'var(--shape-rail-right)';
const RAIL_STRIP = '30px';

interface RailsCollapsed {
  left: boolean;
  right: boolean;
}

/** Which rails are collapsed: a preference on this device only, never sent to the table. */
function useRailsCollapsed(): [RailsCollapsed, (side: keyof RailsCollapsed) => void] {
  const [collapsed, setCollapsed] = useState<RailsCollapsed>(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(RAILS_KEY) ?? '{}') as Partial<RailsCollapsed>;
      return { left: saved.left === true, right: saved.right === true };
    } catch {
      return { left: false, right: false };
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(RAILS_KEY, JSON.stringify(collapsed));
    } catch {
      // The rail still folds for this visit.
    }
  }, [collapsed]);
  return [collapsed, (side) => setCollapsed((prev) => ({ ...prev, [side]: !prev[side] }))];
}

/** A collapsed rail stays on screen as a strip, so the way back is always in view. */
function RailStrip({ side, onOpen }: { side: 'left' | 'right'; onOpen: () => void }) {
  const Icon = side === 'left' ? ChevronRight : ChevronLeft;
  return (
    <button type="button" className="sb-railstrip" aria-label={`Open ${side} rail`} title={`Open ${side} rail`} onClick={onOpen}>
      <Icon size={16} strokeWidth={3} aria-hidden="true" />
      <span>Open {side} rail</span>
    </button>
  );
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
  const [collapsed, toggleRail] = useRailsCollapsed();
  const columns = [
    left ? (collapsed.left ? RAIL_STRIP : RAIL_LEFT) : null,
    'minmax(0, 1fr)',
    right ? (collapsed.right ? RAIL_STRIP : RAIL_RIGHT) : null,
  ].filter(Boolean).join(' ');

  return (
    <SceneChangeProvider mode={mode} name={sceneName}>
      <div className="sb-app" data-role={role} data-mode={mode ?? undefined}>
        <header className="sb-top">
          <div className="sb-word">Anvil</div>
          {top}
        </header>
        <div className="sb-mid" style={{ gridTemplateColumns: columns }}>
          {left && collapsed.left && <RailStrip side="left" onOpen={() => toggleRail('left')} />}
          {/* Kept mounted while collapsed, so tabs and typed text survive. */}
          {left && (
            <section className="sb-frame sb-rail" aria-label="Left rail" hidden={collapsed.left}>
              <SceneSwap>{left}</SceneSwap>
            </section>
          )}
          <main className="sb-centre">
            <div className="sb-screen" data-turn={turn || undefined}>
              <SceneSwap screen>{screen}</SceneSwap>
              <SceneTitleCard />
              {paused && !lost && <DropStrip seconds={dropSeconds} />}
              {left && !collapsed.left && (
                <button type="button" className="sb-railtab" data-side="left" aria-label="Collapse left rail" title="Collapse left rail" onClick={() => toggleRail('left')}>
                  <ChevronLeft size={15} strokeWidth={3} aria-hidden="true" />
                </button>
              )}
              {right && !collapsed.right && (
                <button type="button" className="sb-railtab" data-side="right" aria-label="Collapse right rail" title="Collapse right rail" onClick={() => toggleRail('right')}>
                  <ChevronRight size={15} strokeWidth={3} aria-hidden="true" />
                </button>
              )}
            </div>
            {bar && (
              <SceneSwap delay={520} className="sb-bar-swap">
                <div className="sb-bar">{bar}</div>
              </SceneSwap>
            )}
          </main>
          {right && collapsed.right && <RailStrip side="right" onOpen={() => toggleRail('right')} />}
          {right && (
            <section className="sb-frame sb-rail" aria-label="Right rail" hidden={collapsed.right}>
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
