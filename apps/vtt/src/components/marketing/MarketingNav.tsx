import { Link, NavLink } from 'react-router-dom';
import { AnvilIcon, cn } from '@anvil/ui';

const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

/**
 * Sticky translucent navbar shared by every marketing page. Gives the
 * previously-orphaned /auth page a permanent home ("Sign in").
 */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-anvil-parchment-300/70 bg-anvil-parchment-50/85 backdrop-blur">
      <nav
        className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6 sm:px-10"
        aria-label="Site"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <AnvilIcon size={28} alt="" />
          <span className="font-display text-xl font-semibold text-anvil-ink">Anvil</span>
        </Link>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'rounded-chip px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-anvil-ink/8 text-anvil-ink'
                    : 'text-anvil-ink-soft hover:bg-anvil-ink/5 hover:text-anvil-ink',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link
            to="/auth"
            className="ml-1 inline-flex h-9 items-center rounded-chip bg-anvil-ember-500 px-4 text-sm font-semibold text-white shadow-paper transition hover:bg-anvil-ember-600"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
