# Redesign decisions

Every gate outcome and every choice Dan makes, newest last.

## 2026-11-07: Uncommitted import work (Task 1 Step 1)

Dan chose to land it first. It is on `claude/campaign-hero-imports` as PR #72, waiting for Dan's merge. `redesign/demo-led` is cut from that branch, so the demos can include the import buttons.

## 2026-11-07: Combat crash (Task 2)

Starting combat crashed the server when nothing was hidden by fog, which blocked the live harness. Dan chose a separate fix PR. It is PR #73, merged into `redesign/demo-led` and waiting for Dan's merge into `main`.

## 2026-11-07: Gate 1, visual direction

Dan chose **Storyboard** (`direction-c`): inked frames, bold shapes, a mid-tone ground, and character faces on tokens. Claude recommended Projection Booth, and Dan preferred Storyboard.

Known costs to design for at later gates: every class and ancestry needs a drawn head, uploaded token art must have a place in the system, and heavy outlines must stay comfortable over a long session.

## 2026-11-07: Gate 2, Battle and the shared shell

Dan approved as shown: `battle-director` (1440, 1280, dark), `battle-player`, `battle-turn-motion`, and `battle-director-end`. This sets the shell for every surface: Film Strip across the top, rails, status bar and panels.

Approved changes to behaviour, which the plan allows only through a gate:
- End session asks for confirmation (client-side only).
- The Player gets a full-width "Your turn" banner with "Take my turn" in view.
- Uploaded portraits sit inside the same inked token frame as drawn faces.

## 2026-11-07: Gate 3, the other four modes

Dan approved all four: `story-*`, `montage-*`, `negotiation-*`, `respite-*` (Director and Player), and `scene-change-motion`.

Approved changes to behaviour, all client-side:
- The Director reads Negotiation motivations and pitfalls privately before revealing them. Players see them hidden.
- Dan chose to keep all three new controls: Smaller/Larger text buttons, a Respite filter (All, Open, Done), and the Player's own volume slider in Story. Phase 3 builds them as client-side features.

## 2026-11-07: Gate 4, phone, Display and states

Dan approved: `phone-player`, `phone-director` and their Negotiation versions, `display` (Battle and Story), and the `states` sheet.

Dan chose all four behaviour changes, each client-side on messages the server already handles:
- Phone turn actions: "Take my turn" and "Make argument" on the Player's phone.
- Pause actions on a drop: during a reconnect the table stays readable and actions wait.
- Real not-found pages for a bad campaign link and a bad address while signed in.
- A 30-second give-up showing "Can't reach the table" with Try again. 30 seconds is Claude's guess, so it can be tuned.

## 2026-11-07: Gate 5, the rest of the product

Dan approved the set: `home`, `campaigns`, `builder`, `builder-montage`, `heroes`, `hero-sheet`, `wizard`, `assets`, `notes`, `account`, `auth`, `landing`.

Layout calls approved with it:
- The Campaign Builder uses the live-session shell and goes back through "← Campaigns".
- Home's count tiles become counts in the section headings.
- The landing has new copy. "Draw Steel by MCDM" and the footer attribution stay: Claude restored them as attribution, not a design choice.

Not shown and designed by rule during the build: dark theme and 1280 for these pages, the Player's home, the other three Builder workspaces, the landing below the fold, About and Contact.

## 2026-11-08: Wave 1 sign-off (foundation)

Dan signed off Wave 1 (commits 4a8a43b..a61abd1): tokens, fonts, base components and `CANVAS_THEME`. Layouts follow in Waves 2 to 6.

## 2026-11-08: Wave 2 sign-off (session shell)

Dan signed off Wave 2 (commits be7ca1e..c50d4e9).

Rail controls: rails stay at fixed widths and drag-to-resize stays removed, but Dan chose to bring back a collapse button on each rail in live sessions, so the map can be widened without Fullscreen. Wave 3 builds it.

Dan was asked to watch one scene change into Battle on a real GPU, because the title card's timing could not be confirmed under test.

## 2026-11-08: Wave 3 sign-off (Battle)

Dan signed off Wave 3 (commits ac0eec4..1fc4461, with the `commit_move` fix from PR #74 merged in).

Rulings:
- "End combat…" keeps its confirmation.
- A Player can drag their own hero on their own turn. Off-turn drags stay refused. The server applies movement cost and opportunity attacks.
- The server sends Players every visible creature's full data, including stamina and abilities. Screens hide it, but browser tools can read it. This predates the redesign. Dan chose a separate fix PR after the redesign, so it is listed as a follow-up.

Dan was asked to watch movement and roll animations on a real GPU, because they could not be confirmed under test.
