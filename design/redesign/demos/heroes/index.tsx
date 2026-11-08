import { Plus, Upload } from 'lucide-react';
import { heroes, type Hero } from '../_shared/battle';
import { AppShell, AppStage, Btn, PageHead } from '../_shared/storyboard/app';
import { HeroMark } from '../_shared/storyboard/map';
import { themeFor } from '../_shared/storyboard/modes';
import './heroes.css';

// The Player's heroes. Each card leads with the hero's drawn head, the same head the
// token wears at the table, so a hero is recognised here before it is read. The eighth
// slot is the empty-state pattern from the states sheet: an open frame with one action.
function Card({ h }: { h: Hero }) {
  return (
    <article className="hr-card">
      <div className="hr-face"><HeroMark h={h} size={106} /></div>
      <h2>{h.label}</h2>
      <p>Level {h.level} {h.heroClass}<br />{h.ancestry}</p>
      <dl>
        <div><dt>Stamina</dt><dd>{h.max}</dd></div>
        <div><dt>{h.resourceName}</dt><dd>0</dd></div>
        <div><dt>Speed</dt><dd>{h.speed}</dd></div>
      </dl>
      <div className="hr-f"><span className="ap-tag">Sunken Bells</span><Btn>Open</Btn></div>
    </article>
  );
}

export default function Heroes() {
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="player" on="heroes">
        <PageHead title="Heroes" sub="7 heroes. Bring one from Forge Steel, or roll up a new one."
          actions={<>
            <Btn icon={<Upload size={18} strokeWidth={2.4} />}>Upload .ds-hero</Btn>
            <Btn kind="go" icon={<Plus size={18} strokeWidth={3} />}>Create hero</Btn>
          </>} />
        <div className="ap-page hr-page">
          <div className="hr-row">{heroes.slice(0, 4).map((h) => <Card key={h.id} h={h} />)}</div>
          <div className="hr-row">
            {heroes.slice(4).map((h) => <Card key={h.id} h={h} />)}
            <article className="hr-card hr-new">
              <div className="hr-face hr-face--new"><Plus size={40} strokeWidth={2.6} /></div>
              <h2>A new hero</h2>
              <p>Sixteen short steps, from level to name. Or upload a Forge Steel file.</p>
              <div className="hr-f"><Btn icon={<Upload size={17} strokeWidth={2.4} />}>Upload .ds-hero</Btn></div>
            </article>
          </div>
        </div>
      </AppShell>
    </AppStage>
  );
}
