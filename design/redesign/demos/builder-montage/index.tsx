import { ChevronDown, Music, Plus } from 'lucide-react';
import { geoFor } from '../_shared/storyboard/data';
import { montage } from '../_shared/storyboard/mode-data';
import { MontageScreen } from '../_shared/storyboard/montage';
import { ModeFrame, Tabs, themeFor } from '../_shared/storyboard/modes';
import { BuilderShell, StructureTree } from '../_shared/storyboard/builder';
import '../_shared/storyboard/modes.css';

// A non-Battle workspace: the Montage, Original state. The screen is the table's own
// Montage screen before anyone tests; the right rail is the scene's setup, field by field.
const g = geoFor(1440, 'director');

function Field({ label, children, area }: { label: string; children: React.ReactNode; area?: boolean }) {
  return <label className="bd-field"><span>{label}</span><div className={area ? 'bd-in bd-in--area' : 'bd-in'}>{children}</div></label>;
}

export default function BuilderMontage() {
  return (
    <ModeFrame size={1440} theme={themeFor('light')}>
      <BuilderShell g={g} on="montage" leftTab="Structure"
        left={<StructureTree on="montage" />}
        right={<>
          <Tabs list={['Setup', 'Background']} on="Setup" />
          <section className="bd-sec">
            <Field label="Scene audio"><span><Music size={15} strokeWidth={2.6} style={{ verticalAlign: -2, marginRight: 6 }} />Marsh at dusk</span><ChevronDown size={16} strokeWidth={3} /></Field>
            <Field label="Goal" area>{montage.goal}</Field>
            <div className="bd-pair"><Field label="Rounds">{montage.rounds}</Field><Field label="Heroes">7</Field></div>
            <div className="bd-pair"><Field label="Successes">{montage.successLimit}</Field><Field label="Failures">{montage.failureLimit}</Field></div>
          </section>
          <section className="bd-sec">
            <div className="bd-sec__h"><b>Challenges</b><button className="sb-link"><Plus size={13} strokeWidth={3} style={{ verticalAlign: -2 }} /> Add</button></div>
            <ol className="bd-chs">
              {montage.challenges.map((c, i) => (
                <li key={c.name}><em>{i + 1}</em><span><b>{c.name}</b><small>{c.skills.join(', ')}</small></span><button className="sb-link">Edit</button></li>
              ))}
            </ol>
          </section>
          <section className="bd-sec bd-grow">
            <div className="bd-sec__h"><b>Outcomes</b><button className="sb-link">Edit</button></div>
            <dl className="bd-outs">{montage.outcomes.map((o) => <div key={o.label}><dt>{o.label}</dt><dd>{o.text}</dd></div>)}</dl>
          </section>
        </>}
        map={<div className="md-screen" data-mode="montage" style={{ width: g.mapW, height: g.mapH }}><MontageScreen w={g.mapW} h={g.mapH} prep /></div>}
        bar={
          <div className="sb-bar">
            <div className="sb-tools"><span>The table sees this screen when the scene goes live</span></div>
            <div className="sb-roll"><span>Smaller text</span><span>Larger text</span></div>
          </div>
        } />
    </ModeFrame>
  );
}
