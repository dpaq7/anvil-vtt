import { ArrowLeft, ExternalLink, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const LOGO_IMAGE = '/landing/anvil-vtt-logo.png';
const GITHUB_URL = 'https://github.com/dpaq7';
const LINKEDIN_URL = 'https://www.linkedin.com/in/danpaquin/';
const PATREON_PLACEHOLDER_URL = 'https://www.patreon.com/anvilvtt';
const PATREON_WORDMARK_IMAGE = 'https://c14.patreon.com/thumbnail_Patreon_Wordmark_fb38c295a1.png';

const acknowledgements = [
  {
    name: 'Andy Aiken and Forge Steel',
    href: 'https://github.com/andyaiken/forgesteel',
    text: 'Forge Steel showed how useful focused Draw Steel tooling could be and helped inspire the shape of Anvil.',
  },
  {
    name: 'Steel Compendium',
    href: 'https://github.com/SteelCompendium',
    text: 'The Steel Compendium GitHub projects made JSON and Markdown rule data easier to explore, reference, and adapt.',
  },
  {
    name: 'MCDM Productions',
    href: 'https://www.mcdmproductions.com/',
    text: 'MCDM created Draw Steel, an amazing heroic fantasy game that is exciting to prep, run, and play.',
  },
  {
    name: 'Matt Colville',
    href: 'https://mcdm.gg/RunningTheGame',
    text: 'Running the Game gave me the confidence to DM for the first time and changed how I think about the table.',
  },
  {
    name: 'The amazing Draw Steel community',
    href: 'https://mcdm.gg/discord',
    text: 'The wider community keeps the game moving through play, questions, homebrew, feedback, and shared enthusiasm.',
  },
];

function ExternalTextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-medium text-orange-200 underline decoration-orange-300/40 underline-offset-4 transition hover:text-orange-100 hover:decoration-orange-100"
    >
      {children}
      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  );
}

export function About() {
  return (
    <main className="min-h-screen bg-[#242b2f] text-zinc-100">
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
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              About Anvil
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              A focused virtual tabletop for Draw Steel.
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Anvil is a lightweight, web-based VTT for running{' '}
              <ExternalTextLink href="https://www.mcdmproductions.com/">Draw Steel</ExternalTextLink>{' '}
              campaigns. It focuses on the parts a Director needs at the table: scene prep,
              fast live-session flow, role-aware views, room codes, and tools shaped around battle,
              story, montage, negotiation, and respite scenes.
            </p>
            <p className="mt-5 text-base leading-7 text-zinc-400">
              The project is independent and built for fans. It is not affiliated with, sponsored by,
              or endorsed by MCDM Productions, LLC.
            </p>
            <section aria-labelledby="transparency-heading" className="mt-10 border-t border-zinc-700/60 pt-8">
              <h2 id="transparency-heading" className="text-2xl font-semibold text-white">
                Transparency
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-300">
                Although I have accumulated some years of experience with Python in Data Science
                projects, and have been an occaisional writer of html, css, basic, and pascal since
                childhood, I am not a software developer and do not wish to misrepresent myself as
                one. I had some ideas to make the VTT I've always wanted to use, and applied the
                best current tools and models to bring it to life as best I could. I understand and
                respect that for some people any project developed with AI is a hard pass.  I
                believe you are right to be skeptical of AI generated software and I truly respect
                and appreciate the tireless work of talented people on whom the frontier modles I
                used were trained.  You are stars, champions, and some of the most hard working and
                passionate people this world has to offer. My one request -  if you are willing to
                try Anvil - and do find fault or would like to make suggestions, to please send a
                respectful note to anvil-vtt-feedback@gmail.com.  My comittment is that I will try
                to keep improving Anvil and my own skills as long as I have the ability and time to
                do so.  Thank you, Dan Paquin
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-700/60 bg-[#1f2528] px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Acknowledgements
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Built on generous work.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {acknowledgements.map((item) => (
              <article key={item.name} className="rounded border border-zinc-700/70 bg-zinc-900/45 p-5">
                <h3 className="text-base font-semibold text-white">
                  <ExternalTextLink href={item.href}>{item.name}</ExternalTextLink>
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-14 sm:px-10 sm:py-16 lg:px-16 xl:px-24">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">
              Creator
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Dan Paquin</h2>
            <p className="mt-5 text-base leading-7 text-zinc-300">
              I am an independent developer, Draw Steel Director, and TTRPG fan building practical
              tools for tables that want less overhead between prep and play. Anvil started from a
              desire to run smoother sessions for friends and has grown into a broader VTT
              experiment for the Draw Steel community.
            </p>
          </div>

          <aside className="rounded border border-zinc-700/70 bg-zinc-900/45 p-5">
            <h3 className="text-base font-semibold text-white">Project links</h3>
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
    </main>
  );
}
