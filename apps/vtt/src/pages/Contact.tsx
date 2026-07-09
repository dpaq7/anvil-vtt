import {
  Bug,
  ExternalLink,
  Github,
  Handshake,
  Lightbulb,
  Linkedin,
  Mail,
} from 'lucide-react';
import { MarketingLayout } from '../components/marketing/MarketingLayout.js';
import { Eyebrow } from '../components/marketing/Eyebrow.js';

const GITHUB_URL = 'https://github.com/dpaq7';
const LINKEDIN_URL = 'https://www.linkedin.com/in/dan-paquin/';
const PATREON_PLACEHOLDER_URL = 'https://www.patreon.com/anvilvtt';
const PATREON_WORDMARK_IMAGE = 'https://c14.patreon.com/thumbnail_Patreon_Wordmark_fb38c295a1.png';

const contactChannels = [
  {
    label: 'Bug Reporting',
    email: 'anvil-vtt-bug-reports@gmail.com',
    icon: Bug,
    blurb:
      'Send reproducible problems, crash details, broken flows, screenshots, and anything that blocks a session or campaign workflow.',
  },
  {
    label: 'Feature Suggestion',
    email: 'anvil-vtt-feature-suggestion@gmail.com',
    icon: Lightbulb,
    blurb:
      'Share ideas for tools, quality-of-life improvements, Draw Steel workflows, and table-facing features that would make Anvil better.',
  },
  {
    label: 'Contribution Inquiries',
    email: 'anvil-vtt-contribute@gmail.com',
    icon: Handshake,
    blurb:
      'Reach out about code, design, data, testing, documentation, or community support you would like to contribute to the project.',
  },
] as const;

const PROJECT_LINK_CLASS =
  'inline-flex items-center gap-3 rounded-lg border border-anvil-parchment-300 bg-anvil-parchment-50 px-4 py-3 text-sm font-medium text-anvil-ink transition hover:border-anvil-ember-400/60 hover:shadow-paper';

function ContactCard({ channel }: { channel: (typeof contactChannels)[number] }) {
  const Icon = channel.icon;

  return (
    <article className="edge-deckle border border-anvil-parchment-300 bg-anvil-parchment-50 p-5 shadow-paper">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-chip bg-anvil-ember-400/15 text-anvil-ember-600">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-anvil-ink">{channel.label}</h2>
          <a
            href={`mailto:${channel.email}`}
            className="mt-1 inline-grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-sm font-medium leading-5 text-anvil-ember-600 underline decoration-anvil-ember-400/40 underline-offset-4 transition hover:text-anvil-ember-500 hover:decoration-anvil-ember-500"
          >
            <span className="break-all">{channel.email}</span>
            <Mail aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-anvil-ink-soft">{channel.blurb}</p>
    </article>
  );
}

export function Contact() {
  return (
    <MarketingLayout>
      <section className="px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="motion-safe:animate-fade-up">
            <Eyebrow>Contact</Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-anvil-ink sm:text-5xl">
              Reach the right Anvil inbox.
            </h1>
            <p className="mt-6 text-lg leading-8 text-anvil-ink-soft">
              I am an independent developer, Draw Steel Director, and TTRPG fan building practical
              tools for tables that want less overhead between prep and play. Anvil started from a
              desire to run smoother sessions for friends and has grown into a broader VTT
              experiment for the Draw Steel community.
            </p>
          </div>

          <aside className="texture-parchment edge-deckle border border-anvil-parchment-300 p-5 shadow-paper">
            <h2 className="text-base font-semibold text-anvil-ink">Project links</h2>
            <div className="mt-4 flex flex-col gap-3">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={PROJECT_LINK_CLASS}>
                <Github aria-hidden="true" className="h-4 w-4" />
                GitHub
                <ExternalLink aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-anvil-ink-soft/60" />
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={PROJECT_LINK_CLASS}>
                <Linkedin aria-hidden="true" className="h-4 w-4" />
                LinkedIn
                <ExternalLink aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-anvil-ink-soft/60" />
              </a>
              <a
                href={PATREON_PLACEHOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded-lg border border-anvil-ember-400/40 bg-anvil-ember-400/10 px-4 py-3 text-sm font-medium text-anvil-ember-600 transition hover:border-anvil-ember-400 hover:bg-anvil-ember-400/15"
              >
                <span className="flex h-8 w-24 items-center justify-center rounded bg-white px-2">
                  <img
                    src={PATREON_WORDMARK_IMAGE}
                    alt="Patreon"
                    className="h-auto max-h-5 w-full object-contain"
                  />
                </span>
                Support Anvil on Patreon
                <span className="ml-auto text-xs">Coming soon</span>
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="texture-parchment border-t border-anvil-parchment-300 px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <Eyebrow>Email channels</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold text-anvil-ink">
              Choose the best fit.
            </h2>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {contactChannels.map((channel) => (
              <ContactCard key={channel.email} channel={channel} />
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
