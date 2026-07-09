import { Link } from 'react-router-dom';
import { D20Icon } from '@anvil/ui';
import { MarketingLayout } from '../components/marketing/MarketingLayout.js';
import { DevLoginRow, OAuthButtons } from '../components/marketing/OAuthButtons.js';

export function Auth() {
  return (
    <MarketingLayout minimal>
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-16">
        <div className="texture-parchment edge-deckle flex w-full max-w-md flex-col items-center gap-6 border border-anvil-parchment-300 px-8 py-12 text-center shadow-paper">
          <span className="inline-flex size-14 items-center justify-center rounded-chip bg-anvil-ember-400/15 text-anvil-ember-600 motion-safe:animate-dice-roll">
            <D20Icon size={32} aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-anvil-ink">Roll up a hero</h1>
            <p className="mt-2 text-sm leading-6 text-anvil-ink-soft">
              Sign in to forge campaigns, join tables, and play Draw Steel with your party.
            </p>
          </div>
          <OAuthButtons direction="column" />
          <DevLoginRow tone="light" />
          <Link
            to="/"
            className="text-sm font-medium text-anvil-ember-600 underline decoration-anvil-ember-400/40 underline-offset-4 transition hover:decoration-anvil-ember-600"
          >
            Back to the landing page
          </Link>
        </div>
      </div>
    </MarketingLayout>
  );
}
