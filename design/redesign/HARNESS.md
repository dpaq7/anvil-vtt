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

## Dense battle state

`fixtures/battle-dense.json` is the crowded battle the demos are judged against: 7 heroes, 25 monster tokens, one long-named creature, nine active conditions, one winded and one dying hero, fog over part of the map, round 1 with turn state. It holds names, stats, conditions, turn state and positions only. No rules text, ability text or art.

Rebuild it on a fresh session at the "Get the Sword!" battle scene (the seeded session already has 1 hero, Cicero, 3 ratcrobats and 12 scrappers):

1. **Monsters, UI.** Director view, right rail, Assets, Bestiary. Widen the right pane first by dragging its separator left, or the add buttons are clipped. Click the `+` on a row, then `Current Scene`. Added: Angulotl Daybringer, Hopper, Needler, Slink, Wave, Aeolyxria the Uncanny, Ajax the Invincible, Arixx, Ashen Hoarder. Minions open a Mob/Squad/Platoon/Horde/Single menu, and the Single submenu did not add anything when clicked, so use non-minions. New tokens all land on one cell, (8,11).
2. **Heroes, no UI path.** The Heroes tab only lists the Director's own library ("No heroes yet"), and session heroes come from players joining, one hero per user. So the six extra heroes were created over the Director's own authenticated WebSocket, as `create_entity` messages. This is the same protocol the app uses. Dev login has one Director and one Player, so there was no second player to join. A `POST /api/heroes` would not have put a hero in the session.
   - From the Director page, use `GET /api/auth/me` for `csrfToken`, then `POST /api/sessions/<id>/ws-token` with header `X-CSRF-Token` and body `{"clientKind":"director"}`, then open `ws://localhost:8797/api/sessions/<id>/ws?token=<token>`. The vite origin does not proxy the socket. Tokens last 30 seconds.
   - Hero names, class, stamina and positions are in the fixture's `entities`. Heroes sit at (4-6, 19-20).
3. **Positions, size and the long name.** `update_entity` on each new monster: x, y, size 2 for the four large ones, and `name` on Aeolyxria set to "Aeolyxria the Uncanny, Warden of the Seven Sunken Bells of Old Marrowmere".
4. **Combat.** `combat_action` `START_COMBAT` with every hero and monster id, then the Player clicks Roll d10 in their own browser. Heroes went first (rolled 7). Then `CLAIM_TURN` for Dovrin, `END_TURN`, `CLAIM_TURN` for Ilsabet, so one hero has acted and one is active. A scene switch reloads hero entities from the database and would drop the six created heroes.
5. **Damage, UI.** Director view, right rail, Damage tab: pick a target, type an amount, Apply Damage. Winded: Wren Halloway 15 (11/26). Dying: Pip Underbough 30, which clamps to 0/28. The others in the fixture have lighter hits.
6. **Conditions.** `combat_action` `APPLY_CONDITION` with the condition name for each target, as listed in the fixture.
7. **Fog, UI.** Left toolbar, Fog, brush size 8, then press, wait 100 ms, move a little, release on the map. A fast drag with no pause draws nothing. Result: one 8 by 8 zone at (0,0). The client holds it twice with the same id, so the count reads "2 zones".
