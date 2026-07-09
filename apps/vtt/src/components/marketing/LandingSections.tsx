import { Clapperboard, Play, Swords, Users } from 'lucide-react';
import { cn } from '@anvil/ui';
import { Eyebrow } from './Eyebrow.js';
import { OAuthButtons } from './OAuthButtons.js';

const FEATURES = [
  {
    icon: Clapperboard,
    title: 'Scene-first prep',
    body: 'Build battles, stories, montages, negotiations, and respites in one flow — like storyboarding a film.',
    tilt: 'motion-safe:md:-rotate-1',
  },
  {
    icon: Users,
    title: 'Live table sync',
    body: 'Run sessions straight from the browser with room codes, roles, and shared state. No installs, no fuss.',
    tilt: 'motion-safe:md:rotate-1',
  },
  {
    icon: Swords,
    title: 'Draw Steel native',
    body: 'Tools shaped around the rhythms, rolls, and scene types of the game — power rolls, edges, banes and all.',
    tilt: 'motion-safe:md:-rotate-1',
  },
];

const FLOW_STEPS = [
  {
    step: '1',
    chip: 'bg-scene-story/15 text-scene-story border-scene-story/30',
    title: 'Forge a campaign',
    body: 'Sketch scenes, drop in maps and monsters, and line them up on your film strip.',
  },
  {
    step: '2',
    chip: 'bg-scene-negotiation/15 text-scene-negotiation border-scene-negotiation/30',
    title: 'Gather your party',
    body: 'Players join with a code from any browser and roll up heroes in minutes.',
  },
  {
    step: '3',
    chip: 'bg-scene-battle/15 text-scene-battle border-scene-battle/30',
    title: 'Go live',
    body: 'Hit the table — the whole party sees each scene unfold in real time.',
  },
];

export function LandingFeatures() {
  return (
    <section className="px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={cn(
              'texture-parchment edge-deckle border border-anvil-parchment-300 p-6 shadow-paper transition-shadow hover:shadow-paper-lift',
              feature.tilt,
            )}
          >
            <span className="inline-flex size-10 items-center justify-center rounded-chip bg-anvil-ember-400/15 text-anvil-ember-600">
              <feature.icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-anvil-ink">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-anvil-ink-soft">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingFlow() {
  return (
    <section className="texture-parchment border-y border-anvil-parchment-300 px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl">
        <Eyebrow>How a session flows</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-semibold text-anvil-ink sm:text-4xl">
          From blank page to game night in three moves
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {FLOW_STEPS.map((item) => (
            <li key={item.step} className="flex gap-4">
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-chip border font-display text-lg font-bold',
                  item.chip,
                )}
                aria-hidden="true"
              >
                {item.step}
              </span>
              <div>
                <h3 className="font-semibold text-anvil-ink">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-anvil-ink-soft">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="px-6 py-16 sm:px-10 lg:px-16">
      <div className="texture-parchment edge-deckle mx-auto flex max-w-3xl flex-col items-center gap-6 border border-anvil-parchment-300 px-8 py-12 text-center shadow-paper">
        <Play className="size-8 text-anvil-ember-500" aria-hidden="true" />
        <h2 className="font-display text-3xl font-semibold text-anvil-ink sm:text-4xl">
          Ready to roll?
        </h2>
        <p className="max-w-md text-balance leading-7 text-anvil-ink-soft">
          Free while in beta. Sign in, forge a campaign, and have your party at the table tonight.
        </p>
        <OAuthButtons />
      </div>
    </section>
  );
}
