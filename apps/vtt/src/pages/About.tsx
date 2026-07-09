import { ExternalLink } from 'lucide-react';
import { MarketingLayout } from '../components/marketing/MarketingLayout.js';
import { Eyebrow } from '../components/marketing/Eyebrow.js';

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
      className="inline-flex items-center gap-1 font-medium text-anvil-ember-600 underline decoration-anvil-ember-400/40 underline-offset-4 transition hover:text-anvil-ember-500 hover:decoration-anvil-ember-500"
    >
      {children}
      <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  );
}

export function About() {
  return (
    <MarketingLayout>
      <section className="px-6 py-14 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-3xl motion-safe:animate-fade-up">
            <Eyebrow>About Anvil</Eyebrow>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-anvil-ink sm:text-5xl">
              A focused virtual tabletop for Draw Steel.
            </h1>
            <p className="mt-6 text-lg leading-8 text-anvil-ink-soft">
              Anvil is a lightweight, web-based VTT for running{' '}
              <ExternalTextLink href="https://www.mcdmproductions.com/">Draw Steel</ExternalTextLink>{' '}
              campaigns. It focuses on the parts a Director needs at the table: scene prep,
              fast live-session flow, role-aware views, room codes, and tools shaped around battle,
              story, montage, negotiation, and respite scenes.
            </p>
            <p className="mt-5 text-base leading-7 text-anvil-ink-soft/80">
              The project is independent and built for fans. It is not affiliated with, sponsored by,
              or endorsed by MCDM Productions, LLC.
            </p>
            <section
              aria-labelledby="transparency-heading"
              className="mt-10 border-t border-anvil-parchment-300 pt-8"
            >
              <h2
                id="transparency-heading"
                className="font-display text-2xl font-semibold text-anvil-ink"
              >
                Transparency
              </h2>
              <p className="mt-4 text-base leading-8 text-anvil-ink-soft">
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
                try Anvil - and do find fault or would like to make suggestions, please use the
                contact page to send a respectful note through the right channel. My comittment is
                that I will try to keep improving Anvil and my own skills as long as I have the
                ability and time to do so. Thank you, Dan Paquin
              </p>
            </section>
          </div>
        </div>
      </section>

      <section className="texture-parchment border-t border-anvil-parchment-300 px-6 py-12 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow>Acknowledgements</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold text-anvil-ink">
              Built on generous work.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {acknowledgements.map((item) => (
              <article
                key={item.name}
                className="edge-deckle border border-anvil-parchment-300 bg-anvil-parchment-50 p-5 shadow-paper"
              >
                <h3 className="text-base font-semibold text-anvil-ink">
                  <ExternalTextLink href={item.href}>{item.name}</ExternalTextLink>
                </h3>
                <p className="mt-3 text-sm leading-6 text-anvil-ink-soft">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
