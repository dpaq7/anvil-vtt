const API_BASE = import.meta.env['VITE_API_BASE'] || '';

export function GoogleIcon() {
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

export function DiscordIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 127.14 96.36" className="h-[18px] w-[24px] shrink-0 fill-current">
      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.04a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.04a68.68 68.68 0 0 1-10.87 5.19 77.05 77.05 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69c-6.27 0-11.43-5.75-11.43-12.8s5.05-12.8 11.43-12.8c6.43 0 11.54 5.8 11.43 12.8 0 7.05-5.05 12.8-11.43 12.8Zm42.24 0c-6.27 0-11.43-5.75-11.43-12.8s5.05-12.8 11.43-12.8c6.43 0 11.54 5.8 11.43 12.8 0 7.05-5 12.8-11.43 12.8Z" />
    </svg>
  );
}

interface OAuthButtonsProps {
  /** Layout of the two provider buttons. */
  direction?: 'row' | 'column';
}

/**
 * The Google/Discord sign-in entry points. Full-page navigations to the
 * backend OAuth endpoints — hrefs must not change. Shared by the landing
 * hero, the CTA band, and the /auth page.
 */
export function OAuthButtons({ direction = 'row' }: OAuthButtonsProps) {
  const wrap =
    direction === 'row'
      ? 'flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row'
      : 'flex w-full flex-col gap-3';
  const widthClass = direction === 'row' ? 'sm:w-auto' : '';
  return (
    <div className={wrap}>
      <a
        href={`${API_BASE}/api/auth/google`}
        className={`inline-flex h-12 w-full min-w-56 items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white px-5 text-sm font-medium text-[#3c4043] shadow-lg shadow-black/20 transition hover:bg-[#f8fafd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anvil-ember-500 ${widthClass}`}
      >
        <GoogleIcon />
        <span>Continue with Google</span>
      </a>
      <a
        href={`${API_BASE}/api/auth/discord`}
        className={`inline-flex h-12 w-full min-w-56 items-center justify-center gap-3 rounded-lg bg-[#5865f2] px-5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:bg-[#4752c4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-anvil-ember-500 ${widthClass}`}
      >
        <DiscordIcon />
        <span>Continue with Discord</span>
      </a>
    </div>
  );
}

/** DEV-only quick sign-in as Director/Player. Renders nothing in prod builds. */
export function DevLoginRow({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  if (!import.meta.env.DEV) return null;
  const label = tone === 'dark' ? 'text-anvil-parchment-50' : 'text-anvil-ink';
  const chip =
    tone === 'dark'
      ? 'border-anvil-parchment-50/50 text-anvil-parchment-50 hover:border-anvil-parchment-50 hover:bg-white/10'
      : 'border-anvil-ink/30 text-anvil-ink hover:border-anvil-ink hover:bg-anvil-ink/5';
  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm ${label}`}>
      <span className="font-medium">Dev login</span>
      <a
        href={`${API_BASE}/api/auth/dev-login?role=director`}
        className={`rounded-chip border px-3 py-1.5 font-medium transition ${chip}`}
      >
        Director
      </a>
      <a
        href={`${API_BASE}/api/auth/dev-login?role=player`}
        className={`rounded-chip border px-3 py-1.5 font-medium transition ${chip}`}
      >
        Player
      </a>
    </div>
  );
}
