const API_BASE = import.meta.env['VITE_API_BASE'] || '';

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-950 text-zinc-100">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-5xl font-bold tracking-tight">Anvil</h1>
        <p className="text-lg text-zinc-400">Virtual Tabletop for Draw Steel</p>
      </div>

      <p className="max-w-md text-center text-zinc-500">
        Direct your campaigns like a film. Five scene modes transform your table for battle,
        story, montage, negotiation, and respite.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <a
          href={`${API_BASE}/api/auth/google`}
          className="rounded-lg bg-white px-8 py-3 text-center text-lg font-medium text-zinc-950 transition hover:bg-zinc-200"
        >
          Continue with Google
        </a>
        <a
          href={`${API_BASE}/api/auth/discord`}
          className="rounded-lg bg-indigo-600 px-8 py-3 text-center text-lg font-medium text-white transition hover:bg-indigo-500"
        >
          Continue with Discord
        </a>
      </div>
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
