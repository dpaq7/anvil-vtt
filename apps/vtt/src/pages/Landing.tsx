import { Link } from 'react-router-dom';

const API_BASE = import.meta.env['VITE_API_BASE'] || '';
const HERO_IMAGE = '/landing/anvil-hero.png';
const LOGO_IMAGE = '/landing/anvil-vtt-logo.png';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.94a9 9 0 0 0 0 8.08l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.33C4.66 5.16 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 127.14 96.36" className="h-[18px] w-[24px] shrink-0 fill-current">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77.05 77.05 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69c-6.27 0-11.43-5.75-11.43-12.8s5.05-12.8 11.43-12.8c6.43 0 11.54 5.8 11.43 12.8 0 7.05-5.05 12.8-11.43 12.8Zm42.24 0c-6.27 0-11.43-5.75-11.43-12.8s5.05-12.8 11.43-12.8c6.43 0 11.54 5.8 11.43 12.8 0 7.05-5 12.8-11.43 12.8Z" />
    </svg>
  );
}

export function Landing() {
  const desktopHeroStyle = {
    backgroundImage: `url('${HERO_IMAGE}')`,
    backgroundPosition: 'center top',
    backgroundSize: 'max(100vw, calc(100svh * 2.42)) auto',
  };

  const mobileHeroStyle = {
    backgroundImage: `url('${HERO_IMAGE}')`,
    backgroundPosition: '58% top',
    backgroundSize: 'auto 68svh',
  };

  const authButtons = (
    <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
      <a
        href={`${API_BASE}/api/auth/google`}
        className="inline-flex h-12 w-full min-w-56 items-center justify-center gap-3 rounded border border-[#dadce0] bg-white px-5 text-sm font-medium text-[#3c4043] shadow-lg shadow-black/30 transition hover:bg-[#f8fafd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </a>
      <a
        href={`${API_BASE}/api/auth/discord`}
        className="inline-flex h-12 w-full min-w-56 items-center justify-center gap-3 rounded bg-[#5865f2] px-5 text-sm font-medium text-white shadow-lg shadow-black/30 transition hover:bg-[#4752c4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
      >
        <DiscordIcon />
        <span>Continue with Discord</span>
      </a>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#242b2f] text-zinc-100">
      <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-[#242b2f] md:min-h-[88svh]">
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-no-repeat md:block"
          style={desktopHeroStyle}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-no-repeat md:hidden"
          style={mobileHeroStyle}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,4,5,0.95)_0%,rgba(7,8,9,0.78)_34%,rgba(23,18,15,0.34)_58%,rgba(5,6,7,0.38)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(238,58,17,0.06)_0%,rgba(229,62,18,0.16)_45%,rgba(69,82,86,0.72)_82%,#242b2f_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(255,66,20,0)_0%,rgba(141,43,25,0.20)_28%,rgba(56,66,70,0.90)_80%,#242b2f_100%)]"
        />

        <div className="relative z-10 flex w-full items-end px-6 pb-24 pt-[38svh] sm:px-10 sm:pb-12 sm:pt-[42svh] md:items-center md:px-12 md:py-16 lg:px-16 xl:px-24">
          <div className="max-w-xl pt-12 md:pt-0">
            <div className="flex items-center gap-4 sm:gap-5">
              <img
                src={LOGO_IMAGE}
                alt="Anvil VTT logo"
                className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_8px_28px_rgba(0,0,0,0.75)] sm:h-20 sm:w-20 lg:h-24 lg:w-24"
              />
              <h1 className="text-5xl font-bold leading-none text-white [text-shadow:0_3px_28px_rgba(0,0,0,0.82)] sm:text-6xl lg:text-7xl">
                Anvil
              </h1>
            </div>
            <p className="mt-5 max-w-lg text-balance text-lg leading-8 text-zinc-100 [text-shadow:0_2px_22px_rgba(0,0,0,0.78)] sm:text-xl">
              A lightweight, easy-to-use, fully web-based vtt for Draw Steel by MCDM.
            </p>
            <p className="mt-5 max-w-md text-base leading-7 text-zinc-300 [text-shadow:0_2px_18px_rgba(0,0,0,0.75)]">
              Direct your campaigns like a film. Five scene modes transform your table for battle,
              story, montage, negotiation, and respite.
            </p>
            <div className="mt-8">{authButtons}</div>
            {import.meta.env.DEV ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-300 [text-shadow:0_2px_16px_rgba(0,0,0,0.78)]">
                <span className="font-medium text-zinc-100">Dev login</span>
                <a
                  href={`${API_BASE}/api/auth/dev-login?role=director`}
                  className="rounded border border-zinc-500/70 px-3 py-1.5 font-medium text-zinc-100 transition hover:border-zinc-100 hover:bg-white/10"
                >
                  Director
                </a>
                <a
                  href={`${API_BASE}/api/auth/dev-login?role=player`}
                  className="rounded border border-zinc-500/70 px-3 py-1.5 font-medium text-zinc-100 transition hover:border-zinc-100 hover:bg-white/10"
                >
                  Player
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-700/60 bg-[#242b2f] px-6 py-7 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid max-w-5xl gap-5 text-sm text-zinc-300 md:grid-cols-3">
          <div>
            <h2 className="font-semibold text-zinc-100">Scene-first prep</h2>
            <p className="mt-2 leading-6">
              Build battles, stories, montages, negotiations, and respites in one flow.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-zinc-100">Live table sync</h2>
            <p className="mt-2 leading-6">
              Run sessions from the browser with room codes, roles, and shared state.
            </p>
          </div>
          <div>
            <h2 className="font-semibold text-zinc-100">Draw Steel native</h2>
            <p className="mt-2 leading-6">
              Use tools shaped around the rhythms, rolls, and scene types of the game.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-700/60 bg-[#1f2528] px-6 py-10 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid max-w-5xl gap-8 text-sm text-zinc-300 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img
                src={LOGO_IMAGE}
                alt="Anvil VTT logo"
                className="h-9 w-9 shrink-0 object-contain"
              />
              <span className="text-base font-semibold text-zinc-100">Anvil</span>
            </div>
            <p className="mt-3 leading-6">
              Draw Steel is a product of{' '}
              <a
                href="https://www.mcdmproductions.com/"
                className="font-medium text-zinc-100 underline decoration-zinc-500 underline-offset-4 transition hover:text-white hover:decoration-zinc-100"
              >
                MCDM
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold uppercase tracking-[0.16em] text-zinc-100">About</h2>
            <p className="mt-3 leading-6">
              A browser-based virtual tabletop built around fast campaign prep and live Draw Steel
              sessions.
            </p>
            <Link to="/about" className="mt-3 inline-block font-medium text-zinc-100 transition hover:text-white">
              About Anvil
            </Link>
          </div>

          <div>
            <h2 className="font-semibold uppercase tracking-[0.16em] text-zinc-100">Contact</h2>
            <p className="mt-3 leading-6">
              Questions, feedback, and playtest notes can be shared with the Anvil team during
              testing.
            </p>
          </div>

          <div>
            <h2 className="font-semibold uppercase tracking-[0.16em] text-zinc-100">Links</h2>
            <nav className="mt-3 flex flex-col gap-2" aria-label="Footer links">
              <Link to="/about" className="text-zinc-300 transition hover:text-white">
                About Anvil
              </Link>
              <a
                href="https://www.mcdmproductions.com/"
                className="text-zinc-300 transition hover:text-white"
              >
                MCDM Productions
              </a>
              <a href={`${API_BASE}/api/auth/google`} className="text-zinc-300 transition hover:text-white">
                Sign in with Google
              </a>
              <a href={`${API_BASE}/api/auth/discord`} className="text-zinc-300 transition hover:text-white">
                Sign in with Discord
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
