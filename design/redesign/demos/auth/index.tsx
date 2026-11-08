import { ArrowLeft } from 'lucide-react';
import { AppStage, MarketingNav, OAuth } from '../_shared/storyboard/app';
import { modeIcon, type ModeKey } from '../_shared/storyboard/shell';
import { themeFor } from '../_shared/storyboard/modes';
import './auth.css';

// Sign in. The page keeps the app's copy and its two sign-in buttons. Beside the card,
// the five modes as Film Strip boards say what Anvil is before anyone signs in, with
// Battle raised as it is at the table. The dev-login row is development only and left out.
export const modes: { key: ModeKey; name: string; line: string }[] = [
  { key: 'story', name: 'Story', line: 'Read-aloud, scene art and sound' },
  { key: 'montage', name: 'Montage', line: 'Tests against the clock' },
  { key: 'negotiation', name: 'Negotiation', line: 'Interest, patience and secrets' },
  { key: 'battle', name: 'Battle', line: 'The map, turns and stamina' },
  { key: 'respite', name: 'Respite', line: 'Rest, projects and a song' },
];

export function ModeBoards({ on = 'battle' }: { on?: ModeKey }) {
  return (
    <ol className="au-boards" aria-label="Five scene modes">
      {modes.map((m) => { const I = modeIcon[m.key]; return (
        <li key={m.key} data-mode={m.key} data-on={m.key === on || undefined}>
          <i><I size={26} strokeWidth={2.6} /></i>
          <span><b>{m.name}</b><small>{m.line}</small></span>
        </li>
      ); })}
    </ol>
  );
}

export default function Auth() {
  return (
    <AppStage theme={themeFor('light')}>
      <div className="ap-pub">
        <MarketingNav signIn={false} />
        <div className="ap-page au-page">
          <section className="au-art">
            <h2>One table, five kinds of scene.</h2>
            <ModeBoards />
          </section>
          <section className="au-card">
            <h1>Roll up a hero</h1>
            <p>Sign in to forge campaigns, join tables and play Draw Steel with your party.</p>
            <OAuth column />
            <a className="au-back" href="#landing"><ArrowLeft size={16} strokeWidth={3} />Back to the landing page</a>
          </section>
        </div>
      </div>
    </AppStage>
  );
}
