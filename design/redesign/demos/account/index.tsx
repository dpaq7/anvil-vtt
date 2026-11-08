import { Archive, Download, HardDrive, Trash2, Upload } from 'lucide-react';
import { AppShell, AppStage, Btn, Initials, PageHead, Panel } from '../_shared/storyboard/app';
import { themeFor } from '../_shared/storyboard/modes';
import './account.css';

// Account, Data tab: what you store, a backup you can take away, and the one step that
// cannot be undone, set apart in the shell's dashed alert style (as End session is).
const parts = [
  { name: 'Audio', mb: 112, c: 'var(--color-scene-story)' },
  { name: 'Maps', mb: 38, c: 'var(--color-scene-respite)' },
  { name: 'Pictures', mb: 9, c: 'var(--color-scene-montage)' },
  { name: 'Tokens and portraits', mb: 5, c: 'var(--color-scene-negotiation)' },
];
const total = parts.reduce((a, p) => a + p.mb, 0);
const files = [
  { name: 'rain-on-black-water.mp3', in: 'Smoke Story Beat', mb: 24.2, c: parts[0].c },
  { name: 'marsh-at-dusk.mp3', in: 'A Chase Through a Trap Riddled Swamp', mb: 18.7, c: parts[0].c },
  { name: 'ferry-road.png', in: 'Get the Sword!', mb: 6.1, c: parts[1].c },
  { name: 'drowned-chapel.png', in: 'Smoke Story Beat', mb: 5.4, c: parts[1].c },
  { name: 'swamp-crossing.png', in: 'A Chase Through a Trap Riddled Swamp', mb: 4.9, c: parts[1].c },
  { name: 'thiefs-parlour.png', in: 'Negotiation with a Thief', mb: 4.2, c: parts[1].c },
];

export default function Account() {
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="director" on="account">
        <PageHead title="Account" sub="Dev Director. Director flow." actions={<nav className="ap-tabs ac-tabs" aria-label="Account"><span>Profile</span><span>Settings</span><span data-on>Data</span></nav>} />
        <div className="ap-page ac-page">
          <Panel title="Storage" note={`${total} MB used`} className="ac-store">
            <div className="ac-body">
              <div className="ac-bar" aria-label="Storage by kind">{parts.map((p) => <i key={p.name} style={{ flex: p.mb, background: p.c }} />)}</div>
              <ul className="ac-legend">
                {parts.map((p) => <li key={p.name}><i style={{ background: p.c }} /><span>{p.name}</span><b>{p.mb} MB</b></li>)}
              </ul>
              <h3 className="ac-h"><HardDrive size={17} strokeWidth={2.4} />Largest uploads</h3>
              <ul className="ac-files">
                {files.map((f) => <li key={f.name}><i style={{ background: f.c }} /><span>{f.name}</span><small>{f.in}</small><b>{f.mb} MB</b></li>)}
              </ul>
            </div>
          </Panel>
          <Panel title="Profile" className="ac-me">
            <div className="ac-body ac-who">
              <Initials who="director" size={72} />
              <div><b>Dev Director</b><span>Signed in with Google</span></div>
            </div>
            <dl className="ac-kv">
              <div><dt>Username</dt><dd>Dev Director</dd></div>
              <div><dt>Avatar</dt><dd>Using initials</dd></div>
              <div><dt>Current flow</dt><dd>Director</dd></div>
              <div><dt>Member since</dt><dd>September 2026</dd></div>
              <div><dt>Campaigns</dt><dd>3 run, 1 joined</dd></div>
              <div><dt>Notes</dt><dd>6</dd></div>
            </dl>
          </Panel>
          <Panel title="Backup archive" note="Campaigns, heroes, notes and uploads" className="ac-backup">
            <div className="ac-body">
              <p>Download everything as one file. Import it here, or into another account, to bring it all back.</p>
              <div className="ac-last"><Archive size={18} strokeWidth={2.4} /><span>Last backup <b>Nov 2, 9:14 PM</b>, 151 MB</span></div>
              <div className="ac-acts"><Btn kind="go" icon={<Download size={18} strokeWidth={2.6} />}>Download backup</Btn><Btn icon={<Upload size={17} strokeWidth={2.4} />}>Import backup</Btn></div>
            </div>
          </Panel>
          <Panel title="Delete your account" className="ac-del">
            <div className="ac-body">
              <p>This removes every campaign, hero, note and upload for good. Players lose the campaigns you run. Download a backup first.</p>
              <div className="ac-acts"><Btn kind="stop" icon={<Trash2 size={17} strokeWidth={2.4} />}>Delete account…</Btn></div>
            </div>
          </Panel>
        </div>
      </AppShell>
    </AppStage>
  );
}
