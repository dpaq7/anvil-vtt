import { Handshake, Hourglass, MessageSquare } from 'lucide-react';
import { Window } from '../../kit';
import { AppStage, MarketingNav, OAuth } from '../_shared/storyboard/app';
import { negotiation } from '../_shared/storyboard/mode-data';
import { themeFor } from '../_shared/storyboard/modes';
import { MaudreyFace } from '../_shared/storyboard/scene-art';
import BattleTurnMotion from '../battle-turn-motion';
import './landing.css';

// The public landing page, first screen. Stageshow's hero: copy on the left, the product
// in a window run off the page's right and bottom edges at full size, and one small
// satellite straddling the window's edge. The window holds the approved battle-turn-motion
// demo as it is, drawn 1:1 and cropped to its payoff (the roll, the hit, the log line);
// on the page it plays, and this still shows its poster frame. The satellite is a
// Player's Negotiation board drawn for this size, not a scaled-down screen.
// The mark is the app's own anvil icon; "by MCDM" is the site's attribution and stays.
function NegotiationCard() {
  const n = negotiation;
  return (
    <aside className="ld-sat" aria-label="A Player's Negotiation board">
      <header><i><Handshake size={20} strokeWidth={2.6} /></i><span><b>Negotiation with a Thief</b><small>{n.goal}</small></span></header>
      <div className="ld-npc">
        <span className="ld-face"><MaudreyFace size={60} /></span>
        <span><b>Maudrey</b><small>{n.attitude}, and counting her coins</small></span>
      </div>
      <div className="ld-meter">
        <span>Interest</span>
        <ol aria-label={`Interest ${n.interest} of 5`}>{[1, 2, 3, 4, 5].map((i) => <li key={i} data-on={i <= n.interest || undefined}>{i}</li>)}</ol>
      </div>
      <div className="ld-meter">
        <span>Patience</span>
        <span className="ld-glass" aria-label={`Patience ${n.patience} of ${n.maxPatience}`}>{[1, 2, 3, 4, 5].map((i) => <Hourglass key={i} size={20} strokeWidth={2.4} data-on={i <= n.patience || undefined} />)}</span>
      </div>
      <button className="ld-argue"><MessageSquare size={18} strokeWidth={2.6} />Make argument</button>
    </aside>
  );
}

export default function Landing() {
  return (
    <AppStage theme={themeFor('light')}>
      <div className="ap-pub">
        <MarketingNav />
        <section className="ld-hero">
          <Window title="Anvil" className="ld-win ld-main" aria-label="Anvil during a fight">
            <div className="ld-crop"><BattleTurnMotion /></div>
          </Window>
          <NegotiationCard />
          <div className="ld-copy">
            <h1>Run your Draw Steel table like a film.</h1>
            <p>A lightweight, easy-to-use, fully web-based VTT for Draw Steel by MCDM.</p>
            <p>Line up your scenes, then play them: battle, story, montage, negotiation and respite.</p>
            <OAuth />
            <small>Players join with a room code. Nothing to install.</small>
          </div>
        </section>
      </div>
    </AppStage>
  );
}
