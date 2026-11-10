import type { ComponentType, ReactNode } from 'react';
import { CircleDashed, Laptop, Smartphone, WifiOff } from 'lucide-react';
import { FilmBoard } from '../../../components/session/FilmStrip.js';
import { sceneTypeOf } from '../../../lib/scene-mode.js';
import type { SceneRef } from '../../../types/protocol.js';
import '../../../components/session/shell/session-shell.css';
import '../../../components/session/battle/battle.css';
import '../../../components/session/modes/modes.css';
import './phone.css';

/*
 * The in-session phone frame (Gate 4; demos phone-player, phone-director, states): the live
 * scene's board on top, one framed sheet, the one action docked above the tab bar, the app's own
 * four tabs. Every control is 44 px or more.
 */

export function PhoneApp({ role, scene, children }: { role: 'director' | 'player'; scene: SceneRef | null; children: ReactNode }) {
  return (
    <div className="ph-app" data-role={role} data-mode={scene ? sceneTypeOf(scene) : undefined}>
      {children}
    </div>
  );
}

/** The wordmark and the live board, flat, the same board the laptop's Film Strip raises. */
export function PhoneTop({ scene, right }: { scene: SceneRef | null; right?: ReactNode }) {
  return (
    <header className="ph-top">
      <div className="sb-word">Anvil</div>
      {scene ? (
        <div className="sb-strip sb-strip--one ph-board">
          <div className="sb-cell">
            <FilmBoard scene={scene} live />
          </div>
        </div>
      ) : (
        <span className="st-ghostboard" aria-label="No scene yet" />
      )}
      {right}
    </header>
  );
}

export interface PhoneTab<T extends string> {
  id: T;
  Icon: ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' }>;
  label: string;
}

export function PhoneTabBar<T extends string>({ tabs, active, onSelect }: { tabs: ReadonlyArray<PhoneTab<T>>; active: T; onSelect: (tab: T) => void }) {
  return (
    <nav className="ph-tabs" aria-label="Phone tabs">
      {tabs.map(({ id, Icon, label }) => (
        <button key={id} type="button" data-on={active === id || undefined} aria-current={active === id ? 'page' : undefined} onClick={() => onSelect(id)}>
          <Icon size={20} strokeWidth={2.4} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/** A short drop: the sheet stays readable, a hazard strip says so, the dock waits. */
export function PhoneDropStrip() {
  return (
    <div className="st-drop st-drop--phone" role="status">
      <i>
        <WifiOff size={18} strokeWidth={2.6} aria-hidden="true" />
      </i>
      <b>Reconnecting…</b>
      <span>You can keep reading.</span>
    </div>
  );
}

/** The docked action. During a drop it waits, and says so; nothing is queued. */
export function PhoneDock({ label, onClick, waiting, disabled, take = false }: { label: string; onClick: () => void; waiting: boolean; disabled?: boolean; take?: boolean }) {
  return (
    <button
      type="button"
      className={take ? 'ph-go ph-go--take' : 'ph-go'}
      data-wait={waiting || undefined}
      disabled={waiting || disabled}
      onClick={onClick}
    >
      {waiting ? `${label}, when back` : label}
    </button>
  );
}

/** States sheet: "Phone locked". Unlocks by itself once a laptop holds the table. */
export function LockedPhone() {
  return (
    <main className="ph-app st-lock">
      <div className="st-lock__art" aria-hidden="true">
        <span className="st-lock__laptop"><Laptop size={64} strokeWidth={2} /></span>
        <span className="st-lock__phone"><Smartphone size={44} strokeWidth={2.2} /></span>
      </div>
      <h1>Open this table on your laptop first</h1>
      <p>The phone works beside a laptop or tablet signed in to the same account.</p>
      <ol>
        <li><b>1</b><span>On your laptop, open this session.</span></li>
        <li><b>2</b><span>Keep this phone open. It unlocks by itself.</span></li>
      </ol>
      <div className="st-wait" role="status"><i />Waiting for your laptop…</div>
    </main>
  );
}

/** States sheet: "Phone loading". The shape of what is coming, never an empty sheet. */
export function PhoneLoading({ label, error }: { label: string; error?: string | null }) {
  return (
    <main className="ph-app" data-role="player">
      <PhoneTop scene={null} />
      <div className="ph-body st-phload">
        <div className="st-load__h" role="status">
          <CircleDashed size={18} strokeWidth={2.6} aria-hidden="true" />
          <b>{error ?? label}</b>
        </div>
        {[70, 52, 64, 40].map((w) => (
          <div className="st-ghost" key={w}>
            <i />
            <div>
              <u style={{ width: `${w}%` }} />
              <u style={{ width: '34%' }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
