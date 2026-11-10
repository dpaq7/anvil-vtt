import { useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { CircleDashed, WifiOff } from 'lucide-react';
import { TooltipProvider } from '@anvil/ui';
import { useSessionSocket } from '../../hooks/useSessionSocket.js';
import { ErrorBoundary } from '../../components/ErrorBoundary.js';
import { SessionConnectionProvider } from '../../components/session/shell/connection.js';
import { sceneTypeOf } from '../../lib/scene-mode.js';
import { applyTheme, useThemeStore } from '../../stores/themeStore.js';
import { DisplayBattle, DisplayMode, DisplayStory } from './display/DisplayScenes.js';
import '../../components/session/shell/session-shell.css';
import '../../components/session/battle/battle.css';
import '../../components/session/modes/modes.css';
import './display/display.css';

const W = 1920;
const H = 1080;

/** The 1920 x 1080 stage, scaled to the window so room scale holds on any screen. */
function useStageScale(): number {
  const [scale, setScale] = useState(() => Math.min(window.innerWidth / W, window.innerHeight / H));
  useEffect(() => {
    const onResize = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

/**
 * The Display is always dark, for a lit screen in a dim room (Gate 4). This window only: the
 * person's own theme preference is not written, and returns when the window closes.
 */
function useDisplayDark() {
  useLayoutEffect(() => {
    const previous = useThemeStore.getState().theme;
    applyTheme('dark');
    useThemeStore.setState({ theme: 'dark' });
    return () => {
      applyTheme(previous);
      useThemeStore.setState({ theme: previous });
    };
  }, []);
}

function DisplayState({ icon, title, line, children }: { icon: ReactNode; title: string; line: string; children?: ReactNode }) {
  return (
    <div className="dp-state" role="status">
      <div className="dp-msg">
        <i>{icon}</i>
        <h1>{title}</h1>
        <p>{line}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * The Display for the screen across the room (demos `display`, `display-story`; section 8 for the
 * other modes and its own states). Room-scale type, no controls of any kind, opens on the action.
 * It holds its own socket and draws as the Player, whoever signed in.
 */
export function DisplayView() {
  const { id } = useParams<{ id: string }>();
  const { state, status, error } = useSessionSocket(id ?? null);
  const scale = useStageScale();
  useDisplayDark();

  const scene = useMemo(() => state?.scenes.find((s) => s.id === state.activeSceneId) ?? null, [state]);

  const body = (() => {
    if (!state) {
      if (error && status !== 'connecting') {
        return <DisplayState icon={<WifiOff size={56} strokeWidth={2.6} aria-hidden="true" />} title="Can't reach the table" line="The Display keeps trying by itself." />;
      }
      return (
        <DisplayState icon={<CircleDashed size={56} strokeWidth={2.6} aria-hidden="true" />} title="Opening the table…" line="Scenes, heroes and the map">
          {[0, 1].map((i) => <div className="dp-ghost" key={i}><i /><div><u style={{ width: '70%' }} /><u style={{ width: '40%' }} /></div></div>)}
        </DisplayState>
      );
    }
    if (!scene) {
      return (
        <DisplayState icon={<CircleDashed size={56} strokeWidth={2.6} aria-hidden="true" />} title="Waiting for the Director" line="The first scene appears here.">
          <div className="dp-strip" aria-hidden="true"><span /><span /><span /><span /><span /></div>
        </DisplayState>
      );
    }
    const mode = sceneTypeOf(scene);
    if (mode === 'battle') return <DisplayBattle scene={scene} state={state} />;
    if (mode === 'story') return <DisplayStory scene={scene} state={state} />;
    return <DisplayMode mode={mode} scene={scene} state={state} />;
  })();

  return (
    <TooltipProvider delayDuration={0}>
      <ErrorBoundary label="display">
        <SessionConnectionProvider status={status}>
          <div className="dp-root" data-theme="dark">
            <div className="dp-stage" style={{ transform: `scale(${scale}) translate(-50%, -50%)` }}>
              {body}
              {state && status !== 'connected' && (
                <div className="st-drop" style={{ height: 72, fontSize: 28 }} role="status">
                  <i style={{ width: 72 }}><WifiOff size={36} strokeWidth={2.6} aria-hidden="true" /></i>
                  <b style={{ fontSize: 34 }}>{status === 'disconnected' ? "Can't reach the table" : 'Reconnecting…'}</b>
                  <span>Showing the table as it was.</span>
                </div>
              )}
            </div>
          </div>
        </SessionConnectionProvider>
      </ErrorBoundary>
    </TooltipProvider>
  );
}
