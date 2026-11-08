import { Window } from '../../kit';
import { AppStage, MarketingNav, OAuth } from '../_shared/storyboard/app';
import { themeFor } from '../_shared/storyboard/modes';
import BattleTurnMotion from '../battle-turn-motion';
import SceneChangeMotion, { TITLE_CARD } from '../scene-change-motion';
import './landing.css';

// The public landing page, first screen. Stageshow's hero: copy on the left, the product
// in a window running off the page's right edge, a smaller window straddling its corner.
// Both windows hold the approved motion demos as they are: one turn of Battle, and the
// scene change from a story beat into the fight. On the page they play; this still shows
// their poster frames. Warmth comes from the hazard-yellow ground and the ink, not from
// licensed art. The mark is the app's own anvil icon; nothing here is new branding.
export default function Landing() {
  return (
    <AppStage theme={themeFor('light')}>
      <div className="ap-pub">
        <MarketingNav />
        <section className="ld-hero">
          <div className="ld-copy">
            <h1>Run your Draw Steel table like a film.</h1>
            <p>Anvil is a light virtual tabletop for Draw Steel, in the browser. Line up your scenes, then play them: battle, story, montage, negotiation and respite.</p>
            <OAuth />
            <small>Players join with a room code. Nothing to install.</small>
          </div>
          <Window title="Anvil" className="ld-win ld-main" aria-label="Anvil during a fight">
            <div className="ld-crop"><BattleTurnMotion /></div>
          </Window>
          <Window className="ld-win ld-sat" aria-label="Anvil changing scene">
            <SceneChangeMotion poster={TITLE_CARD} />
          </Window>
        </section>
      </div>
    </AppStage>
  );
}
