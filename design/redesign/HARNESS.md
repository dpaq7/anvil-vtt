# Live session harness

A local session with Director and Player connected at once. Proven 2026-11-07: changing scene as Director moved the Player through Story, Montage, Negotiation, Respite and Battle.

Run everything from the `redesign/demo-led` worktree, `.claude/worktrees/redesign`.

## Rebuild it

1. Start the seeded server in the background. It takes about three minutes to reach the hold line, because the log filter shows nothing during the run:

   ```bash
   node scripts/smoke-live-session.mjs --start-server --hold-open --hold-ms 14400000
   ```

   Wait for `hold live smoke: ... session=<id>` and save the id. The session lasts four hours, and restarting creates a new id. The hold starts after combat begins, so the session opens on Battle in round 1.

2. Start the app:

   ```bash
   ANVIL_API_PROXY=http://localhost:8797 pnpm --filter @anvil/vtt dev
   ```

   `preview_start` with `vtt-smoke` does not work from this session: it reads the launch directory's `.claude/launch.json`, and it started an unrelated server. Use it only if the session was opened in this repo.

3. Sign in each role in its own browser, because a browser holds one login:

   - Director: `http://localhost:5173/api/auth/dev-login?role=director&next=/app/session/<id>`
   - Player: `http://localhost:5173/api/auth/dev-login?role=player&next=/app/session/<id>`

   Dev login is rate limited, so do not loop it.

## Which browser

- Player: the built-in browser pane.
- Director: Playwright (`mcp__plugin_playwright_playwright__*`). The plan named Claude in Chrome, but its tab group disappeared on every attempt on 2026-11-07. Try Chrome again if that matters, and fall back to Playwright.

## Notes

- The map can take a moment to draw after sign-in. A blank canvas in the first seconds is not a fault.
- Playwright writes screenshots to `.playwright-mcp/`, which is gitignored.
