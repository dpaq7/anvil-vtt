// Campaign Builder on the approved session shell. The audit kept the Builder's layout:
// labelled tabs, readable rails, Original and End State. Here the session's own frame
// carries it, so prep and play look like one product: the Film Strip on top is the
// session's scenes (the one being edited raised), the rails keep their labelled tabs,
// and the screen shows what the table will see when the scene goes live.
import type { ReactNode } from 'react';
import { ArrowLeft, Check, ChevronDown, Folder, Swords, Upload } from 'lucide-react';
import { scenes } from '../battle';
import type { Geo } from './data';
import { Tabs } from './modes';
import { FilmStrip, Shell, modeIcon, type ModeKey } from './shell';
import './builder.css';

export function BuilderTop({ on }: { on: ModeKey }) {
  return (
    <>
      <div className="sb-word">Anvil</div>
      <FilmStrip on={on} />
      <div className="bd-state" role="radiogroup" aria-label="Scene state">
        <span data-on role="radio" aria-checked>Original</span><span role="radio" aria-checked={false}>End State</span>
      </div>
      <button className="bd-draw"><Swords size={18} strokeWidth={2.6} />Draw Steel!</button>
    </>
  );
}

export function BuilderStatus() {
  return (
    <>
      <a href="#campaigns"><ArrowLeft size={14} strokeWidth={3} />Campaigns</a>
      <span>The Sunken Bells of Marrowmere</span>
      <span>Session 3: The ferry</span>
      <span><Check size={14} strokeWidth={3} />Saved 12:40 PM</span>
      <div><span>Dark</span><span>Fullscreen</span></div>
    </>
  );
}

// The campaign tree: sessions hold scenes, in Film Strip order, each in its mode colour.
export function StructureTree({ on }: { on: ModeKey }) {
  return (
    <div className="bd-tree">
      <div className="bd-node"><ChevronDown size={16} strokeWidth={2.6} /><Folder size={17} strokeWidth={2.4} /><b>The Sunken Bells of Marrowmere</b></div>
      <div className="bd-node bd-node--2"><ChevronDown size={16} strokeWidth={2.6} /><Folder size={17} strokeWidth={2.4} /><b>Session 3: The ferry</b></div>
      <ol>
        {scenes.map((s) => {
          const I = modeIcon[s.key];
          return <li key={s.key} data-mode={s.key} data-on={s.key === on || undefined}><div className="bd-scene"><i><I size={16} strokeWidth={2.6} /></i><span><b>{s.name}</b><small>{s.mode}</small></span></div></li>;
        })}
      </ol>
      <div className="bd-node bd-node--2 bd-node--shut"><ChevronDown size={16} strokeWidth={2.6} /><Folder size={17} strokeWidth={2.4} /><b>Session 2: The chapel</b><small>4 scenes</small></div>
      <div className="bd-node bd-node--2 bd-node--shut"><ChevronDown size={16} strokeWidth={2.6} /><Folder size={17} strokeWidth={2.4} /><b>Session 1: Arrival</b><small>3 scenes</small></div>
      <div className="bd-tree__f"><button className="bd-btn"><Upload size={16} strokeWidth={2.6} />Import scenes</button></div>
    </div>
  );
}

export function BuilderShell({ g, on, leftTab, left, right, map, bar }: { g: Geo; on: ModeKey; leftTab: 'Structure' | 'Initiative'; left: ReactNode; right: ReactNode; map: ReactNode; bar: ReactNode }) {
  return (
    <div className="bd" data-mode={on}>
      <Shell g={g} role="director" mode={on}
        top={<BuilderTop on={on} />}
        left={<section className="sb-frame sb-rail" aria-label="Rail"><Tabs list={on === 'battle' ? ['Structure', 'Initiative'] : ['Structure']} on={leftTab} />{left}</section>}
        right={<section className="sb-frame sb-rail" aria-label="Rail">{right}</section>}
        map={map} bar={bar} status={<BuilderStatus />} />
    </div>
  );
}
