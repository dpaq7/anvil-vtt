import { Bold, Check, ChevronDown, FilePlus, Folder, FolderPlus, Heading2, Italic, Link2, List, ListChecks, Plus, Search } from 'lucide-react';
import { AppShell, AppStage, Btn, PageHead } from '../_shared/storyboard/app';
import { notes } from '../_shared/storyboard/app-data';
import { OnlyYou, themeFor } from '../_shared/storyboard/modes';
import '../_shared/storyboard/modes.css';
import './notes.css';

// Notes. The tree on the left, one note open on the right, written like a prep sheet.
// Every word of the note is invented placeholder. "Only you" is the session's own mark
// for Director-only things, so a private note reads the same here as at the table.
const folders = [
  { name: 'Sunken Bells', items: notes.filter((n) => n.folder === 'Sunken Bells') },
  { name: 'Personal', items: notes.filter((n) => n.folder === 'Personal') },
];
const open = notes[0];

export default function Notes() {
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="director" on="notes">
        <PageHead title="Notes" sub="Prep, recaps and loose ideas, for you or for the table."
          actions={<Btn kind="go" icon={<Plus size={18} strokeWidth={3} />}>New note</Btn>} />
        <div className="ap-page nt-page">
          <aside className="nt-tree">
            <div className="nt-search"><div className="ap-input"><Search size={17} strokeWidth={2.6} /><span className="ap-ph">Search notes</span></div></div>
            {folders.map((f) => (
              <section key={f.name}>
                <div className="nt-folder"><ChevronDown size={16} strokeWidth={2.6} /><Folder size={17} strokeWidth={2.4} /><b>{f.name}</b><small>{f.items.length}</small></div>
                <ul>{f.items.map((n) => <li key={n.id} data-on={n.id === open.id || undefined}><b>{n.title}</b><small>{n.when}</small></li>)}</ul>
              </section>
            ))}
            <div className="nt-foot"><Btn icon={<FilePlus size={16} strokeWidth={2.4} />}>Note</Btn><Btn icon={<FolderPlus size={16} strokeWidth={2.4} />}>Folder</Btn></div>
          </aside>
          <article className="nt-doc">
            <div className="nt-bar" role="toolbar" aria-label="Format">
              {[Bold, Italic, Heading2, List, ListChecks, Link2].map((I, i) => <span key={i}><I size={18} strokeWidth={2.4} /></span>)}
              <em>Saved 11:40 AM</em>
            </div>
            <div className="nt-body">
              <header>
                <h2>{open.title}</h2>
                <p>In <b>The Sunken Bells of Marrowmere</b>. {open.words} words. <OnlyYou /></p>
              </header>
              <h3>Where we left off</h3>
              <p>The party reached the drowned chapel and found the lantern lit. Odile rowed them in. Nobody has asked her why the chapel flooded.</p>
              <h3>Tonight, in order</h3>
              <ul className="nt-list">
                <li>Open on the rope still swinging. Let them argue about climbing it.</li>
                <li>The swamp chase if they leave by the boardwalk, the thief if they stay.</li>
                <li>The fight at the ferry road. Ajax waits until someone grabs the sword.</li>
                <li>End at the ferry camp if there is time. Pip will want a song.</li>
              </ul>
              <h3>Before we start</h3>
              <ul className="nt-checks">
                <li data-done><i><Check size={14} strokeWidth={3.5} /></i>Upload the bell tower map</li>
                <li data-done><i><Check size={14} strokeWidth={3.5} /></i>Give the thief three motivations</li>
                <li><i />Pick rain audio for the chapel</li>
              </ul>
              <h3>If they skip the chapel</h3>
              <p>Move the lantern to the ferry camp. The bell-ringer is still the one who lit it, and he still has the rope.</p>
            </div>
          </article>
        </div>
      </AppShell>
    </AppStage>
  );
}
