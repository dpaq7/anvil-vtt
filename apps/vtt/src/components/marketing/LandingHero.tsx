import { DevLoginRow, OAuthButtons } from './OAuthButtons.js';

const HERO_WEBP = '/landing/anvil-hero.webp';
const HERO_PNG = '/landing/anvil-hero.png';

const heroImageSet = `image-set(url('${HERO_WEBP}') type('image/webp'), url('${HERO_PNG}') type('image/png'))`;

/**
 * The cinematic dark hero band. Deliberately theme-stable (explicit
 * parchment/ink colors, not zinc) since the page around it is pinned to the
 * light marketing theme; the bottom gradient hands off to the parchment page.
 */
export function LandingHero() {
  const desktopHeroStyle = {
    backgroundImage: heroImageSet,
    backgroundPosition: 'center top',
    backgroundSize: 'max(100vw, calc(100svh * 2.42)) auto',
  };

  const mobileHeroStyle = {
    backgroundImage: heroImageSet,
    backgroundPosition: '58% top',
    backgroundSize: 'auto 68svh',
  };

  return (
    <section className="relative isolate flex min-h-[92svh] overflow-hidden bg-[#242b2f] md:min-h-[82svh]">
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
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(232,112,61,0.06)_0%,rgba(212,90,42,0.14)_45%,rgba(69,82,86,0.55)_82%,rgba(36,43,47,0.85)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,rgba(232,112,61,0)_0%,rgba(141,43,25,0.18)_26%,rgba(70,64,55,0.85)_74%,#fbf7ef_100%)]"
      />

      <div className="relative z-10 flex w-full items-end px-6 pb-28 pt-[34svh] sm:px-10 sm:pb-16 sm:pt-[40svh] md:items-center md:px-12 md:py-16 lg:px-16 xl:px-24">
        <div className="max-w-xl pt-12 motion-safe:animate-fade-up md:pt-0">
          <h1 className="font-display text-6xl font-bold tracking-tight text-anvil-parchment-50 drop-shadow-[0_6px_28px_rgba(0,0,0,0.85)] sm:text-7xl lg:text-8xl">
            Anvil
          </h1>
          <p className="mt-5 max-w-lg text-balance text-lg leading-8 text-anvil-parchment-100 [text-shadow:0_2px_22px_rgba(0,0,0,0.78)] sm:text-xl">
            A lightweight, easy-to-use, fully web-based VTT for Draw Steel by MCDM.
          </p>
          <p className="mt-5 max-w-md text-base leading-7 text-anvil-parchment-200 [text-shadow:0_2px_18px_rgba(0,0,0,0.75)]">
            Direct your campaigns like a film. Five scene modes transform your table for battle,
            story, montage, negotiation, and respite.
          </p>
          <div className="mt-8">
            <OAuthButtons />
          </div>
          <div className="mt-4 [text-shadow:0_2px_16px_rgba(0,0,0,0.78)]">
            <DevLoginRow tone="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
