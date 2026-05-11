const API_BASE = import.meta.env['VITE_API_BASE'] || '';
const HERO_IMAGE = '/landing/anvil-hero.png';
const LOGO_IMAGE = '/landing/anvil-vtt-logo.png';

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
    <div className="flex w-full max-w-xs flex-col gap-3 sm:flex-row sm:max-w-none">
      <a
        href={`${API_BASE}/api/auth/google`}
        className="rounded-lg bg-white px-7 py-3 text-center text-base font-medium text-zinc-950 shadow-lg shadow-black/30 transition hover:bg-zinc-200"
      >
        Continue with Google
      </a>
      <a
        href={`${API_BASE}/api/auth/discord`}
        className="rounded-lg bg-[#d93617] px-7 py-3 text-center text-base font-medium text-white shadow-lg shadow-black/30 transition hover:bg-[#f04a22]"
      >
        Continue with Discord
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

      <footer className="border-t border-zinc-700/60 bg-[#1f2528] px-6 py-5 sm:px-10 lg:px-16 xl:px-24">
        <div className="flex max-w-5xl flex-col gap-3 text-sm text-zinc-300 sm:flex-row sm:items-center">
          <img
            src={LOGO_IMAGE}
            alt="Anvil VTT logo"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <p className="leading-6">
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
      </footer>
    </main>
  );
}
