import {
  ArrowLeft,
  Bug,
  ExternalLink,
  Github,
  Handshake,
  Lightbulb,
  Linkedin,
  Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_IMAGE = '/landing/anvil-vtt-logo.png';
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

function ContactCard({ channel }: { channel: (typeof contactChannels)[number] }) {
  const Icon = channel.icon;

  return (
    <article className="rounded border border-zinc-700/70 bg-zinc-900/45 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-orange-500/10 text-orange-200">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">{channel.label}</h2>
          <a
            href={`mailto:${channel.email}`}
            className="mt-1 inline-grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 text-sm font-medium leading-5 text-orange-200 underline decoration-orange-300/40 underline-offset-4 transition hover:text-orange-100 hover:decoration-orange-100"
          >
            <span className="break-all">{channel.email}</span>
            <Mail aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          </a>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{channel.blurb}</p>
    </article>
  );
}

export function Contact() {
  return (
    <main data-theme="dark" className="min-h-screen bg-[#242b2f] text-zinc-100">
      <section className="border-b border-zinc-700/60 bg-[#1f2528] px-6 py-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to Anvil
          </Link>
          <img src={LOGO_IMAGE} alt="Anvil VTT logo" className="h-10 w-10 object-contain" />
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 sm:py-16 lg:px-16 xl:px-24">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Contact
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Reach the right Anvil inbox.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              I am an independent developer, Draw Steel Director, and TTRPG fan building practical
              tools for tables that want less overhead between prep and play. Anvil started from a
              desire to run smoother sessions for friends and has grown into a broader VTT
              experiment for the Draw Steel community.
            </p>
          </div>

          <aside className="rounded border border-zinc-700/70 bg-zinc-900/45 p-5">
            <h2 className="text-base font-semibold text-white">Project links</h2>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                <Github aria-hidden="true" className="h-4 w-4" />
                GitHub
                <ExternalLink aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-zinc-500" />
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded border border-zinc-700 bg-zinc-950/60 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                <Linkedin aria-hidden="true" className="h-4 w-4" />
                LinkedIn
                <ExternalLink aria-hidden="true" className="ml-auto h-3.5 w-3.5 text-zinc-500" />
              </a>
              <a
                href={PATREON_PLACEHOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 rounded border border-orange-300/30 bg-orange-500/10 px-4 py-3 text-sm font-medium text-orange-100 transition hover:border-orange-200/60 hover:bg-orange-500/15"
              >
                <span className="flex h-8 w-24 items-center justify-center rounded bg-white px-2">
                  <img src={PATREON_WORDMARK_IMAGE} alt="Patreon" className="h-auto max-h-5 w-full object-contain" />
                </span>
                Support Anvil on Patreon
                <span className="ml-auto text-xs text-orange-200/80">Coming soon</span>
                <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 text-orange-200/80" />
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-zinc-700/60 bg-[#1f2528] px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Email channels
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Choose the best fit.</h2>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {contactChannels.map((channel) => (
              <ContactCard key={channel.email} channel={channel} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
