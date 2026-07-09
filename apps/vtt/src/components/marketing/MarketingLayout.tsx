import type { ReactNode } from 'react';
import { MarketingNav } from './MarketingNav.js';
import { SiteFooter } from './SiteFooter.js';

interface MarketingLayoutProps {
  children: ReactNode;
  /** Hide the footer (e.g. the focused /auth screen). */
  minimal?: boolean;
}

/**
 * Shared shell for the public pages. Pins the warm parchment (light) theme —
 * the playful-tabletop palette — regardless of the app's dark/light setting.
 * Individual sections (like the landing hero) may still paint their own dark
 * bands with theme-stable colors.
 */
export function MarketingLayout({ children, minimal = false }: MarketingLayoutProps) {
  return (
    <main data-theme="light" className="flex min-h-screen flex-col bg-anvil-parchment-50 text-anvil-ink">
      <MarketingNav />
      <div className="flex-1">{children}</div>
      {minimal ? null : <SiteFooter />}
    </main>
  );
}
