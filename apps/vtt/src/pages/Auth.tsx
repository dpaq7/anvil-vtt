const API_BASE = import.meta.env['VITE_API_BASE'] || '';

export function Auth() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-zinc-950 text-zinc-100">
      <h1 className="text-3xl font-bold">Anvil VTT</h1>
      <p className="text-zinc-400">Sign in to continue</p>
      <a
        href={`${API_BASE}/api/auth/discord`}
        className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500"
      >
        Login with Discord
      </a>
      {import.meta.env.DEV ? (
        <div className="flex gap-3">
          <a
            href={`${API_BASE}/api/auth/dev-login?role=director`}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Director
          </a>
          <a
            href={`${API_BASE}/api/auth/dev-login?role=player`}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
          >
            Player
          </a>
        </div>
      ) : null}
    </div>
  );
}
