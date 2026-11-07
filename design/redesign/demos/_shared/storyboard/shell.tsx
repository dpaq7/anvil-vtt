import '@fontsource-variable/bricolage-grotesque';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, BookOpen, ChevronRight, Footprints, Handshake, Swords, Tent } from 'lucide-react';
import { scenes, tools } from '../battle';
import { type Geo, type Role, type Size } from './data';
import './storyboard.css';

const modeIcon = { story: BookOpen, montage: Footprints, negotiation: Handshake, battle: Swords, respite: Tent };

export function FilmCell({ s, arrow }: { s: (typeof scenes)[number]; arrow?: boolean }) {
  const I = modeIcon[s.key];
  return (
    <div className="sb-cell">
      <button className="sb-board" data-mode={s.key} data-on={('active' in s && s.active) || undefined}>
        <i><I size={20} strokeWidth={2.6} /></i>
        <span><b>{'short' in s ? s.short : s.name}</b><small>{s.mode}</small></span>
      </button>
      {arrow && <ArrowRight className="sb-arrow" size={15} strokeWidth={3.5} />}
    </div>
  );
}

// The strip of scenes. Only the Director gets it whole: a Player sees the scene they are in,
// because the names of scenes still to come belong to the Director.
export function FilmStrip() {
  return <nav className="sb-strip" aria-label="Film strip">{scenes.map((s, i) => <FilmCell key={s.name} s={s} arrow={i < scenes.length - 1} />)}</nav>;
}

export function RollBar({ size, tools: list, on = 'Select' }: { size: Size; tools: string[]; on?: string }) {
  const narrow = size === 1280 && list.length > 4;
  return (
    <div className="sb-bar">
      <div className="sb-tools" role="toolbar" aria-label="Map tools">{list.map((t) => <span key={t} data-on={t === on || undefined}>{t}</span>)}</div>
      <div className="sb-roll" role="toolbar" aria-label="Dice">
        {narrow
          ? <><span data-on>Power<ChevronRight className="sb-down" size={13} strokeWidth={3} /></span><span>Mod <b>0</b></span><span>None<ChevronRight className="sb-down" size={13} strokeWidth={3} /></span></>
          : <><span data-on>Power</span><span>Resource</span><span>d6</span><span>Mod <b>0</b></span><span data-on>None</span><span>E</span><span>B</span><span>2E</span><span>2B</span></>}
      </div>
    </div>
  );
}

export const directorTools = tools;
export const playerTools = ['Select', 'Pan'];

export function Shell({ g, role, top, left, right, map, bar, status, turn, wash }: {
  g: Geo; role: Role; top: ReactNode; left: ReactNode; right: ReactNode; map: ReactNode; bar: ReactNode; status: ReactNode; turn?: boolean; wash?: ReactNode;
}) {
  const vars = { '--top': `${g.top}px`, '--bar': `${g.bar}px`, '--status': `${g.status}px`, '--row': `${g.row}px`, '--dying': `${g.dying}px`, '--unit': `${g.unit}px`, width: g.w, height: g.h } as CSSProperties;
  return (
    <div className="sb-app" data-role={role} data-size={g.w} style={vars}>
      <header className="sb-top">{top}</header>
      <div className="sb-mid">
        {left}
        <main className="sb-centre">
          <div className="sb-screen" data-turn={turn || undefined}>{map}</div>
          {bar}
        </main>
        {right}
      </div>
      <footer className="sb-status">{status}</footer>
      {wash}
    </div>
  );
}
