# Deployment Readiness

This project deploys as two surfaces:

- `apps/server`: Cloudflare Worker API, Durable Object, D1 database, and R2 asset bucket.
- `apps/vtt`: Vite static frontend that calls the Worker through `VITE_API_BASE`.

## Required Cloudflare Resources

The Worker expects these bindings from `apps/server/wrangler.toml`:

- D1 database binding: `DB`
- R2 bucket binding: `ASSETS`
- Durable Object binding: `SESSION_ROOM`

Before a beta deployment, confirm the configured D1 database id and R2 bucket name point at the intended beta resources. Do not deploy beta against a throwaway local database.

## Required Worker Secrets And Vars

Set secrets with Wrangler for the deployed Worker:

```bash
pnpm --filter @anvil/server wrangler secret put DISCORD_CLIENT_ID
pnpm --filter @anvil/server wrangler secret put DISCORD_CLIENT_SECRET
pnpm --filter @anvil/server wrangler secret put GOOGLE_CLIENT_ID
pnpm --filter @anvil/server wrangler secret put GOOGLE_CLIENT_SECRET
pnpm --filter @anvil/server wrangler secret put SESSION_SECRET
pnpm --filter @anvil/server wrangler secret put BUG_REPORT_WEBHOOK_URL
```

Set non-secret vars in `apps/server/wrangler.toml` or the Cloudflare dashboard:

```text
ENVIRONMENT=production
FRONTEND_URL=https://<your-vtt-frontend-origin>
DISCORD_REDIRECT_URI=https://<your-worker-origin>/api/auth/callback
GOOGLE_REDIRECT_URI=https://<your-worker-origin>/api/auth/google/callback
```

The Discord application must include the exact `DISCORD_REDIRECT_URI` in its OAuth2 redirect list.
The Google OAuth client must include the exact `GOOGLE_REDIRECT_URI` in its authorized redirect URIs.
`BUG_REPORT_WEBHOOK_URL` is optional; when present, client crash and server-error reports are stored in D1 and forwarded to that webhook.

## Required VTT Build Env

Set this for the production VTT build:

```text
VITE_API_BASE=https://<your-worker-origin>
```

The value should not have a trailing slash. It is used for HTTP API calls and live-session WebSocket URLs.

## Deployment Order

1. Install dependencies: `pnpm install --frozen-lockfile`
2. Run local checks: `pnpm typecheck`, `pnpm lint`, `pnpm test:run`
3. Build both deploy surfaces: `pnpm deploy:check`
4. Apply remote D1 migrations: `pnpm db:migrate:remote`
5. Deploy the Worker: `pnpm deploy:server`
6. Build and deploy `apps/vtt/dist` with `VITE_API_BASE` set to the Worker origin.

## Beta Smoke Test

After deployment, verify:

- `GET /api/health` returns `{ "status": "ok" }` from the Worker.
- Discord and Google OAuth complete and redirect back to the VTT frontend.
- `/api/auth/me` returns the signed-in user from the frontend.
- A director can create a campaign, create a session, and enter live mode.
- A player can join by code, ready up, reconnect, and receive scene changes.
- Map, token/portrait, handout, custom terrain, and audio uploads are readable by campaign members.
- Live audio playback uses `/api/assets/:id/data` and works in the deployed browser.
