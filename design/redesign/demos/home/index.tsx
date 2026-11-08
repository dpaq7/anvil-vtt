import { ArrowRight, Check, ChevronDown, KeyRound, Radio } from 'lucide-react';
import { heroes } from '../_shared/battle';
import { AppShell, AppStage, Btn, ModeStrip, PageHead, Panel } from '../_shared/storyboard/app';
import { campaigns, live, notes } from '../_shared/storyboard/app-data';
import { HeroMark } from '../_shared/storyboard/map';
import { themeFor } from '../_shared/storyboard/modes';
import './home.css';

// The Director's home. The audit kept its job: what is live, what to open next. Here the
// live table leads with its room code at full size, as the lobby does, and every campaign
// carries its scenes as a small Film Strip, so the five modes read before any words.
export default function Home() {
  return (
    <AppStage theme={themeFor('light')}>
      <AppShell role="director" on="home">
        <PageHead title="Welcome back, Dev Director" sub="One table is live. Your campaigns and notes are below."
          actions={<>
            <Btn icon={<Check size={17} strokeWidth={3} />}>First steps, 3 of 4 done<ChevronDown size={17} strokeWidth={2.6} /></Btn>
            <Btn icon={<KeyRound size={17} strokeWidth={2.6} />}>Join code</Btn>
            <Btn kind="go" icon={<Radio size={18} strokeWidth={2.6} />}>Go live</Btn>
          </>} />
        <div className="ap-page hm-grid">
          <Panel title="Live now" note="1 table" className="hm-live">
            <div className="hm-room">
              <div className="hm-room__l">
                <div className="hm-room__who">
                  <span className="ap-live">Live</span>
                  <h3>{live.name}</h3>
                  <p>{live.campaign}</p>
                  <p className="hm-soft">{live.started}. Playing <b>{live.scene}</b></p>
                  <ModeStrip scenes={campaigns[0].scenes} size={34} />
                </div>
                <div className="hm-party">
                  <ul aria-label="At the table">{heroes.map((h) => <li key={h.id} title={h.label}><HeroMark h={h} size={44} /></li>)}</ul>
                  <span><b>7 of 7</b> here</span>
                </div>
              </div>
              <div className="hm-code">
                <span>Room code</span>
                <strong>{live.code}</strong>
                <small>Players type this on the join page</small>
                <Btn kind="go">Rejoin the table<ArrowRight size={18} strokeWidth={3} /></Btn>
              </div>
            </div>
          </Panel>

          <Panel title="Your party" note="7 heroes" className="hm-roster" action={<a href="#heroes">Open</a>}>
            <ul className="hm-list">
              {heroes.map((h) => (
                <li key={h.id}><HeroMark h={h} size={34} /><span className="hm-list__t"><b>{h.label}</b><small>Level {h.level} {h.heroClass}, {h.ancestry}</small></span><em>{h.max}</em></li>
              ))}
            </ul>
          </Panel>

          <Panel title="Campaigns" note="3 of yours" className="hm-camps" action={<a href="#campaigns">All campaigns</a>}>
            <ul className="hm-camp">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <ModeStrip scenes={c.scenes} size={28} />
                  <span className="hm-camp__t"><b>{c.name}</b><small>{c.blurb}</small></span>
                  <em>{c.sessions === 1 ? '1 session' : `${c.sessions} sessions`}<br />{c.last}</em>
                  <Btn>Open</Btn>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recent notes" note="6 notes" className="hm-notes" action={<a href="#notes">Open notes</a>}>
            <ul className="hm-note">
              {notes.slice(0, 5).map((n) => <li key={n.id}><b>{n.title}</b><small>{n.folder}. {n.when}</small></li>)}
            </ul>
          </Panel>
        </div>
      </AppShell>
    </AppStage>
  );
}
