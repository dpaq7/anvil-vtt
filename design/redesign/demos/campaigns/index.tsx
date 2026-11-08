import { ArrowRight, PackageOpen, Plus, Upload } from 'lucide-react';
import { AppShell, AppStage, Btn, PageHead, Panel } from '../_shared/storyboard/app';
import { campaigns, joined, type Campaign } from '../_shared/storyboard/app-data';
import { themeFor } from '../_shared/storyboard/modes';
import { modeIcon } from '../_shared/storyboard/shell';
import './campaigns.css';

// Campaigns. Each card is the campaign's storyboard: its scenes listed as Film Strip
// boards in mode colour, so a Director sees the shape of a campaign before opening it.
// The import buttons from PR #72 sit beside Create: a whole campaign package, or scenes.
const word = { story: 'Story', montage: 'Montage', negotiation: 'Negotiation', battle: 'Battle', respite: 'Respite' } as const;

function Card({ c }: { c: Campaign }) {
  return (
    <Panel as="div" className="cp-card">
      <div className="cp-card__h">
        {c.live ? <span className="ap-live">Live now</span> : <span className="ap-tag">{c.scenes.length} scenes</span>}
        <h2>{c.name}</h2>
        <p>{c.blurb}</p>
      </div>
      <ol className="cp-scenes" aria-label="Scenes">
        {c.scenes.map((m, i) => { const I = modeIcon[m]; return <li key={i} data-mode={m}><i><I size={18} strokeWidth={2.6} /></i><span><b>{c.names![i]}</b><small>{word[m]}</small></span></li>; })}
        {c.scenes.length < 5 && <li className="cp-add"><i><Plus size={18} strokeWidth={2.6} /></i><span><b>Add a scene</b><small>Any of the five modes</small></span></li>}
      </ol>
      <div className="cp-card__f">
        <span>{c.sessions === 1 ? '1 session' : `${c.sessions} sessions`}<br />{c.last}</span>
        {c.live ? <Btn kind="go">Open<ArrowRight size={17} strokeWidth={3} /></Btn> : <Btn>Open</Btn>}
      </div>
    </Panel>
  );
}

export default function Campaigns() {
  const j = joined[0];
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="director" on="campaigns">
        <PageHead title="Campaigns" sub="3 of yours, and 1 you play in."
          actions={<>
            <Btn icon={<PackageOpen size={18} strokeWidth={2.4} />}>Import campaign</Btn>
            <Btn icon={<Upload size={18} strokeWidth={2.4} />}>Scene import</Btn>
            <Btn kind="go" icon={<Plus size={18} strokeWidth={3} />}>Create campaign</Btn>
          </>} />
        <div className="ap-page cp-grid">
          <div className="cp-row">{campaigns.map((c) => <Card key={c.id} c={c} />)}</div>
          <Panel title="Joined campaigns" note="You play in these" className="cp-joined">
            <div className="cp-join">
              <div className="cp-join__t">
                <b>{j.name}</b><small>{j.blurb}</small>
                <span>Run by <b>{j.director}</b>. {j.sessions} sessions, last on Oct 30. Beside it, the scenes you have played.</span>
              </div>
              <ol className="cp-scenes cp-scenes--row" aria-label="Scenes">
                {j.scenes.map((m, i) => { const I = modeIcon[m]; return <li key={i} data-mode={m}><i><I size={18} strokeWidth={2.6} /></i><span><b>{j.names![i]}</b><small>{word[m]}</small></span></li>; })}
              </ol>
              <Btn>Open</Btn>
            </div>
          </Panel>
        </div>
      </AppShell>
    </AppStage>
  );
}
