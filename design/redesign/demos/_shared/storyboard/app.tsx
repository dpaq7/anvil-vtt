// The app outside a live session, in the Storyboard language. One frame for every page:
// the wordmark where the session puts it, a framed rail with who you are, the Director /
// Player switch and the app's own nav, then the page on the mid-tone ground. Page titles
// sit on the ground in ink; content sits in inked frames. The one primary action on a
// page is the shell's active blue with a hard shadow, as "End Ilsabet's turn" is.
import '../still.css';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import type { ReactNode } from 'react';
import { Bug, Clapperboard, House, Image, NotebookPen, Radio, Sun, UserRound } from 'lucide-react';
import { Stage, type Theme } from '../../../kit';
import { modeIcon, type ModeKey } from './shell';
import { user } from './app-data';
import mark from '../../../../../apps/vtt/public/landing/anvil-vtt-menu-icon.png';
import './app.css';

export type AppRole = 'director' | 'player';
export type NavKey = 'home' | 'live' | 'campaigns' | 'heroes' | 'assets' | 'notes' | 'account';

const navFor: Record<AppRole, { key: NavKey; label: string; icon: typeof House }[]> = {
  director: [
    { key: 'home', label: 'Home', icon: House }, { key: 'live', label: 'Live', icon: Radio },
    { key: 'campaigns', label: 'Campaigns', icon: Clapperboard }, { key: 'assets', label: 'Assets', icon: Image },
    { key: 'notes', label: 'Notes', icon: NotebookPen },
  ],
  player: [
    { key: 'home', label: 'Home', icon: House }, { key: 'live', label: 'Live', icon: Radio },
    { key: 'heroes', label: 'Heroes', icon: UserRound }, { key: 'notes', label: 'Notes', icon: NotebookPen },
  ],
};

export function AppStage({ theme = 'light', children }: { theme?: Theme; children: ReactNode }) {
  return <Stage width={1440} height={900} theme={theme} unframed className="look-anvil">{() => children}</Stage>;
}

export function Initials({ who, size = 40 }: { who: AppRole; size?: number }) {
  return <span className="ap-av" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}>{user[who].initials}</span>;
}

export function AppShell({ role, on, children }: { role: AppRole; on: NavKey; children: ReactNode }) {
  const me = user[role];
  return (
    <div className="ap-app" data-role={role}>
      <aside className="ap-side">
        <div className="sb-word ap-word">Anvil</div>
        <nav className="sb-frame ap-rail" aria-label="App">
          <a className="ap-me" data-on={on === 'account' || undefined} href="#account">
            <Initials who={role} />
            <span className="ap-me__t"><b>{me.name}</b><small>Account</small></span>
          </a>
          <div className="ap-flow" role="radiogroup" aria-label="Flow">
            <button role="radio" aria-checked={role === 'director'} data-on={role === 'director' || undefined}>Director</button>
            <button role="radio" aria-checked={role === 'player'} data-on={role === 'player' || undefined}>Player</button>
          </div>
          <ul className="ap-nav">
            {navFor[role].map(({ key, label, icon: I }) => (
              <li key={key}><a href={`#${key}`} data-on={key === on || undefined} aria-current={key === on ? 'page' : undefined}><I size={20} strokeWidth={2.4} />{label}</a></li>
            ))}
          </ul>
          <div className="ap-foot">
            <a href="#report"><Bug size={18} strokeWidth={2.4} />Report issue</a>
            <button className="ap-theme" role="switch" aria-checked="false"><Sun size={18} strokeWidth={2.4} />Light<i aria-hidden /></button>
          </div>
        </nav>
      </aside>
      <main className="ap-main">{children}</main>
    </div>
  );
}

export function PageHead({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="ap-head">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {actions && <div className="ap-acts">{actions}</div>}
    </header>
  );
}

export function Btn({ kind = 'alt', icon, children, ...rest }: { kind?: 'go' | 'alt' | 'quiet' | 'stop'; icon?: ReactNode; children: ReactNode; disabled?: boolean }) {
  return <button className={`ap-btn ap-btn--${kind}`} {...rest}>{icon}{children}</button>;
}

export function Panel({ title, note, action, children, className, as: Tag = 'section' }: { title?: ReactNode; note?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; as?: 'section' | 'div' }) {
  return (
    <Tag className={`sb-frame ap-panel${className ? ` ${className}` : ''}`}>
      {title && <div className="ap-panel__h"><h2>{title}</h2>{note && <span>{note}</span>}{action}</div>}
      {children}
    </Tag>
  );
}

// A campaign's scenes as a small Film Strip: one inked board per scene, in its mode colour.
export function ModeStrip({ scenes, size = 30 }: { scenes: ModeKey[]; size?: number }) {
  return (
    <span className="ap-strip" aria-label={`${scenes.length} scenes`}>
      {scenes.map((m, i) => { const I = modeIcon[m]; return <i key={i} data-mode={m} style={{ width: size, height: size }}><I size={Math.round(size * 0.55)} strokeWidth={2.6} /></i>; })}
    </span>
  );
}

// ---- Public pages -------------------------------------------------------------------
export function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" width="18" height="18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.94v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.94a9 9 0 0 0 0 8.08l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.33C4.66 5.16 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

export function DiscordMark() {
  return (
    <svg aria-hidden viewBox="0 0 127.14 96.36" width="24" height="18" fill="currentColor">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77.05 77.05 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69c-6.27 0-11.43-5.75-11.43-12.8s5.05-12.8 11.43-12.8c6.43 0 11.54 5.8 11.43 12.8 0 7.05-5.05 12.8-11.43 12.8Zm42.24 0c-6.27 0-11.43-5.75-11.43-12.8s5.05-12.8 11.43-12.8c6.43 0 11.54 5.8 11.43 12.8 0 7.05-5 12.8-11.43 12.8Z" />
    </svg>
  );
}

export function OAuth({ column }: { column?: boolean }) {
  return (
    <div className="ap-oauth" data-column={column || undefined}>
      <button className="ap-oauth__g"><GoogleMark />Continue with Google</button>
      <button className="ap-oauth__d"><DiscordMark />Continue with Discord</button>
    </div>
  );
}

// The public pages' bar: the app's own anvil mark and the plain wordmark, as the site has them.
export function MarketingNav({ signIn = true }: { signIn?: boolean }) {
  return (
    <header className="ap-mnav">
      <a href="#home" className="ap-brand"><img src={mark} alt="" width={44} height={44} /><span>Anvil</span></a>
      <nav aria-label="Site"><a href="#about">About</a><a href="#contact">Contact</a>{signIn && <a href="#auth" className="ap-btn ap-btn--go">Sign in</a>}</nav>
    </header>
  );
}
