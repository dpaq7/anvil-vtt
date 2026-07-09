import { Link } from 'react-router-dom';

const LOGO_IMAGE = '/landing/anvil-vtt-logo.png';

/**
 * Shared marketing footer — a warm dark ink band with paper grain,
 * theme-stable so it reads the same under the pinned light marketing theme.
 */
export function SiteFooter() {
  return (
    <footer className="texture-grain border-t border-anvil-parchment-300/40 bg-anvil-ink px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-5xl gap-8 text-sm text-anvil-parchment-200 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src={LOGO_IMAGE} alt="Anvil VTT logo" className="h-9 w-9 shrink-0 object-contain" />
            <span className="font-display text-lg font-semibold text-anvil-parchment-50">Anvil</span>
          </div>
          <p className="mt-3 leading-6">
            Draw Steel is a product of{' '}
            <a
              href="https://www.mcdmproductions.com/"
              className="font-medium text-anvil-parchment-50 underline decoration-anvil-parchment-200/50 underline-offset-4 transition hover:decoration-anvil-parchment-50"
            >
              MCDM
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="font-semibold uppercase tracking-[0.16em] text-anvil-parchment-50">About</h2>
          <p className="mt-3 leading-6">
            A browser-based virtual tabletop built around fast campaign prep and live Draw Steel
            sessions.
          </p>
          <Link
            to="/about"
            className="mt-3 inline-block font-medium text-anvil-parchment-50 transition hover:text-white"
          >
            About Anvil
          </Link>
        </div>

        <div>
          <h2 className="font-semibold uppercase tracking-[0.16em] text-anvil-parchment-50">Contact</h2>
          <p className="mt-3 leading-6">
            Bug reports, feature suggestions, and contribution notes each have a dedicated inbox.
          </p>
          <Link
            to="/contact"
            className="mt-3 inline-block font-medium text-anvil-parchment-50 transition hover:text-white"
          >
            Contact Anvil
          </Link>
        </div>

        <div>
          <h2 className="font-semibold uppercase tracking-[0.16em] text-anvil-parchment-50">Links</h2>
          <nav className="mt-3 flex flex-col gap-2" aria-label="Footer links">
            <Link to="/about" className="transition hover:text-white">
              About Anvil
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Contact
            </Link>
            <a href="https://www.mcdmproductions.com/" className="transition hover:text-white">
              MCDM Productions
            </a>
            <Link to="/auth" className="transition hover:text-white">
              Sign in
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
