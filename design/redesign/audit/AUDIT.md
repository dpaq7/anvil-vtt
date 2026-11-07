# Anvil v2 audit

Date: 2026-11-07. Branch: `redesign/demo-led`. Purpose: decide what the design directions must solve. Problems are ranked by harm to play at a real table, not by polish.

Screenshots are in `design/redesign/captures/audit/`, which is gitignored. This file names them by filename, without `.png`. To repeat the capture, see "Repeating the capture" at the end.

## How it was done

- 443 screenshots from one script, with separate browser contexts for Director and Player, against the live session.
- Dense Battle came first, for both roles, at 1440 × 900 and 1280 × 720, in dark and light. The other four modes came after it.
- `design:design-critique` and `design:accessibility-review` were run over the captures. Their findings are merged below.
- Text and contrast figures come from `a11y-probe.mjs` and from the token values in `packages/ui/src/globals.css`. No screen reader was used, and nobody has tested this at a physical table. Keyboard results are 30 Tab presses per page, not a full walk.

## Top ten problems

### 1. Battle opens on the wrong part of the map

Every role lands at 100% zoom on the top-left corner of the map, wherever the tokens are.

- No hero is on screen at load for any role, and the only token in view is a giant cropped one. See `session-battle-director-1440-dark`.
- With fog over that corner, the Player sees a black screen and a sliver of map, with no message. See `session-battle-player-1440-dark` and `display-battle-1440-dark`. It looks like a crash.
- The way out is hidden. On the Player and Display, the Fit button sits below the visible stage at both sizes. Only Ctrl+0 reaches it, and nothing on screen says so beyond a tooltip on that same hidden button.
- Fit is not enough at 1280 × 720. Zoom stops at 25% (`ViewportSystem.ts`), so the bottom of the map stays cut off, and that is where the heroes stand. See `session-battle-player-fit-1280-dark`.

**The design must:** open each role on its own token or the action, and make "show everything" always reachable.

### 2. You cannot tell who is who on the map

At the zoom that shows the whole fight, token labels are about 6 px and unreadable.

- The six heroes in the start cluster overlap into one smear of text. See `crop-battle-heroes-director-2x`.
- All heroes share the same small shield mark and all monsters the same crossed swords. Only the ring colour and label separate them, and the labels fail.
- Large tokens go the other way. "Ajax the Invincible" and the long Aeolyxria name run across neighbouring tokens at a far larger size.
- The canvas is not scaled for high-density screens: `canvas` code sets no resolution, and the 2× crop is as soft as the 1× view.
- Finding a token by hover works and is good, but it is one token at a time. See `session-battle-director-token-hover-1440-dark`.

**The design must:** give labels a fixed readable size, a rule for what happens when they collide, and a token face that identifies a hero without its label.

### 3. Dying and winded look the same as healthy

The tracker has no stamina, no conditions and no state.

- In the Heroes list, Pip Underbough at 0/28 and Wren Halloway at 11/26 look identical to a full-stamina hero. See `session-battle-director-fit-1440-dark` and `session-battle-player-tab-combat-1440-dark`.
- The only signal is an emoji badge about 8 px wide on the token. Nine active conditions show this way, and several cannot be told apart at Fit zoom.
- The Director's phone list is not grouped by side or danger, and its first screen shows one hero of seven before the monsters start. See `phone-battle-director-375-dark`.
- The only stamina readout outside the Director's tools is the hover tooltip, one token at a time. It does colour low stamina amber and red, and that logic should move to the tracker. I did not capture the tooltip as a Player.

**The design must:** show stamina and state in the tracker, with the dying hero impossible to miss.

### 4. Director rails are too narrow to use

The default rails are about 144 px on the left and 170 px on the right.

- Tabs read "C..", "A...", "D...", "G...". See `session-battle-director-1440-dark`.
- 40 pieces of text truncate on the Director's Battle screen. Names cut to "Ilsab...", "Rade...", and three Radenwight rows are identical.
- The hero card breaks one letter per line, in every mode, and at 1280 it fills the rail. See `session-battle-director-tab-heroes-1280-light` and `session-story-director-1280-light`.
- Bestiary rows and their add buttons are cut off the right edge until the pane is dragged wider. Dragging is undiscoverable mid-session.
- The action log wraps to 2 words a line, so about five entries fit. See `session-battle-director-tab-damage-1440-dark`.
- Compare the Campaign Builder, whose rails hold labelled tabs at a sensible width. See `app-workspace-battle-1440-dark`. The fix is already proven in this app.

**The design must:** set rail widths from content, and keep every tab label readable at 1280.

### 5. A Player's turn is easy to miss and hard to take

- Nothing tells the Player it is time to act. The screen does not change. "Take My Turn" sits at the bottom of the Combat tab, as dark blue text on a blue button, and the rail opens on Sheet. See `session-battle-player-can-claim-1440-dark`.
- That tab is off the visible tab strip at 1280. There, only Sheet and Abilities show. See `session-battle-player-1280-dark`.
- The Turn panel squeezes Main, Maneuver, Move and Triggered into a width where the labels touch, and "Defend" runs off the card. See `session-battle-player-my-turn-1440-dark`.
- The zoom toolbar covers the end of the roll bar, so 2E and 2B are hidden on the Player at both sizes. See `session-battle-player-1440-dark`.
- Abilities wrap to one word per line in a column about 30 px wide. Power roll tiers become unreadable. See `session-battle-player-tab-abilities-1280-light`.
- At 1280 the characteristics strip clips: INT is cut and PRE is lost behind the BATTLE badge. See `session-battle-player-1280-light`.

**The design must:** make "your turn" a page-level event, and put actions and rolls where they stay visible.

### 6. One click ends the session for everyone

"End" in the Director's top bar has no confirmation. `handleEndSession` sends `end_session` straight away (`DirectorView.tsx`). It sits next to Revert, which does confirm, and near Fullscreen. "End Combat" in the left rail is also a faint ghost button under End Turn.

I read this in code. I did not click it, because that would have ended the live session.

**The design must:** separate session-level danger from turn-level actions, and confirm anything that ends play.

### 7. Negotiation and Montage hide what each role needs

- The Director cannot read motivations or pitfalls. They show "? Hidden motivation" with a Reveal button, the same as the Player sees, so the Director must reveal blind. See `session-negotiation-director-1440-dark`. The text exists in the scene data and is only shown after reveal (`NegotiationStage.tsx`). I could not find it anywhere else on the live Director screen.
- The Player's "Make Argument" button is at the bottom edge at 1440 and off screen at 1280. See `session-negotiation-player-1440-dark`.
- The Montage "Roll Test" button sits low in a long scrolling page, below the results cards, and is cut at 1280. See `session-montage-player-1280-light`.

**The design must:** give the Director a private view of secrets, and keep each mode's main action in view.

### 8. Text is too small and faint for a table

- Real sizes on the Player's Battle screen: 106 of 162 text elements are 11 px or under, and 25 are 9 px. The code has 341 fixed sizes of 8 to 11 px (4, 56, 214 and 67).
- `zinc-500` muted text misses AA on most surfaces: 4.49:1 on `zinc-900` and 3.94:1 on `zinc-800` in dark, and 4.27:1 and 3.53:1 in light.
- `zinc-600` as text is about 2:1 in both themes. The stat tiles that look disabled (Speed, Victories, Companion) are real data at this level.
- Borders at `zinc-700` are about 1.5:1, so cards and inputs fade away. See `session-battle-player-tab-turn-1440-dark`.
- Light theme fails on art. In Respite the location title is dark text on a dark image and is almost invisible. See `session-respite-player-1280-light`. Montage cards turn to grey glass with faint text. See `session-montage-director-1280-light`. Scene backdrops stay dark while panels go pale.
- On the Director's Negotiation screen, "End Negotiation" is dark text on saturated purple. The Player's Montage "Roll Test" is the same on orange while it waits for a skill, so it reads as broken, not as disabled.

**The design must:** set a minimum size for table reading, and define how text sits on art in both themes.

### 9. The Display is not built for a screen across the room

- It shows pan, select and zoom controls on the shared TV, with a stray drag handle. See `display-battle-1440-dark`.
- It uses desktop text sizes. Montage body text is unreadable at distance, and the Story read-aloud is a small faint italic line in a huge empty screen. See `display-story-1440-dark` and `display-montage-1440-dark`.
- It opens on the same black fogged corner as problem 1.
- It follows the theme stored in that browser, so a light-theme laptop gives a pale TV.

**The design must:** treat Display as its own surface with room-scale type and no controls.

### 10. Failures and loading tell the wrong story

- Loading looks like empty. With requests held, Campaigns says "No campaigns yet" and Assets says "Create a campaign first". See `state-loading-campaigns-1440-light` and `state-loading-assets-1440-dark`. A slow connection reads as lost work.
- A bad campaign link stays on "Loading..." forever. See `state-badcampaign-1440-dark`.
- A bad route goes silently to the marketing page, even when signed in. See `state-badroute-1440-dark`.
- A bad session shows "Not found" and a Refresh button that cannot help, with no way back. See `state-badsession-1440-dark`. Bad invite is bare red text. See `public-join-badtoken-1280-light`.
- A failed page load says "Update needed", which may not be true. See `state-routeerror-chunk-1440-dark`.
- Reconnect blurs the whole table and blocks reading, and stacks toasts in the corner. See `state-reconnect-player-1440-dark`. The wording is good, but the map and sheet stay useful during a short drop, so hiding them costs play time.

**The design must:** give loading, empty and failed their own looks, each with a way forward.

## What works and must be kept

- **Fog privacy.** The Player and Display get a solid black fogged area. Hidden monsters drop out of the tracker count (0/11 against the Director's 0/14), and the Player's log says "Something" instead of a hidden name. See `session-battle-player-tab-log-1440-dark`.
- **Director fog preview.** The Director sees through fog with a tint, so both roles work from one map.
- **The side tracker.** The top bar's Round, Heroes and Director groups with acted counts read at a glance, and they stay on all views.
- **Token popover.** It opens beside the token with name, stamina bar and three clear actions. See `session-battle-director-token-menu-1440-dark`.
- **Hover tooltip** with name and stamina.
- **Scene chips with mode colours.** The Director switches scene in one click, and the colours teach the five modes. The Player was moved through every mode without a reload.
- **Campaign Builder layout.** Labelled tabs, readable rails, Original and End State. See `app-workspace-montage-1440-dark`.
- **Hero sheet page.** Strong hierarchy and the best-looking screen in the app. See `app-hero-sheet-player-1440-dark`.
- **Mobile app and phone companion.** Clear bottom navigation and steppers with proper targets. All 9 controls on the Director's phone are at least 44 px. Hero wizard on mobile is a good single-column flow. See `mobile-hero-player-light` and `mobile-hero-new-player-dark`.
- **Phone lock screen.** It says exactly what to do. See `state-phone-locked-dark`.
- **Home dashboard.** Good summary and next steps. See `app-home-dismissed-player-1280-light`.
- **Lobby.** The room code is the biggest thing on the page, as it should be. See `app-lobby-forced-director-1440-dark`.
- **Keyboard focus.** In the walks made, no focused control lacked a visible ring except 2 on the Player's phone, and none landed off screen.
- **Revert** has a confirmation that says what will be lost.
- **Marketing pages.** Warm, consistent and legible.

## Bugs seen

Not fixed, as agreed.

| Bug | Evidence | Status |
|---|---|---|
| React duplicate keys for skills (`handle-animals`, `criminal-underworld`) | 492 console errors across Player pages, in `console.log` | Reproduced. The seed hero's skills list holds both forms of each name |
| Duplicate fog zone ("2 zones") | Task 3 report | **Not reproduced at the end.** After the scene round trip the Fog tool reads "1 zone". See `session-battle-director-fog-tool-1440-dark`. Likely present only before the snapshot reload |
| Fit button below the visible stage on Player and Display | `session-battle-player-1440-dark` | Reproduced |
| Scrolling that button into view shifts the whole stage up, cutting the tracker under the top bar and leaving a blank band below | Seen in the first Player and Display fit captures; the script now clicks without scrolling, so those files were replaced | Reproduced. The stage can scroll inside a page that should not |
| Bad campaign id never leaves "Loading..." | `state-badcampaign-1440-dark` | Reproduced |
| `/app/heroes/:id` for a hero you do not own shows bare "Not found" with no way back | `app-hero-sheet-director-1440-dark` | Reproduced |
| Director can only reveal secrets blind | Problem 7 | Reproduced |
| `landing/anvil-hero.webp` preloaded but unused on every page | 109 console warnings | Reproduced |
| Light theme leaves the canvas margin navy (`0x1a1a2e` in `BattleCanvas.tsx`) | `session-battle-player-fit-1280-light` | Reproduced |
| From Task 3, not re-tested: Single submenu adds no minion; new monsters stack on one cell; fast fog drag draws nothing | Task 3 report | Not re-tested |

**Harness note.** HARNESS.md says a scene switch drops the six extra heroes. That is true while away, but returning to Battle restored all seven from the snapshot, with 25 villains, conditions and fog. See `session-battle-final-director-fit-1440-dark`. The live session now differs from `battle-dense.json` in one way: the capture ended Ilsabet's turn and the Player claimed one, so Smoke Beastheart is active and heroes read 2/7.

## Accessibility summary

Standard: WCAG 2.1 AA, from captures and measurement.

| Check | Result |
|---|---|
| 1.1.1 / 4.1.2 Map | The canvas has no role, label or tab stop. The map is invisible to a screen reader, and tokens can only be reached through the rails |
| 4.1.2 Names | 878 of 962 controls on the Director's Battle page had no accessible name by the probe's test. Most are icon buttons in the full Bestiary list, which stays in the page |
| 3.3.2 Labels | 3 inputs on the Director's Battle page and 2 selects on the Player's have no label |
| 1.3.1 Structure | Session pages have no `main` and no `h1`. The Director's has no headings at all. App pages have landmarks and one `h1` |
| 1.4.3 Contrast | Primary text passes at 11.2:1 dark and 12.8:1 light. Muted fails, as in problem 8 |
| 1.4.11 Non-text | Borders about 1.5:1. Conditions rely on small emoji |
| 1.4.1 Colour | Hero, monster and active state on tokens are ring colour first |
| 2.4.7 Focus | Good, see above |
| 2.5.5 Targets (AAA) | Player's phone: 8 of 27 controls under 44 px. Director's phone: 0 of 9 |
| 4.1.3 Status | One live region exists on all pages. Whether turn changes are announced was not tested |

## The colour system today

`packages/ui/src/globals.css` carries overlapping colour languages:

1. **Remapped zinc.** Tailwind's zinc stops are redefined as warm greys with teal-tinted text, and again for light theme. `zinc-950` is the background in dark and a pale cream in light, so the name means nothing. Each stop is defined twice in dark: in `@theme` and in `:root`.
2. **`creator`.** Semantic aliases with the same values as zinc stops, also redefined per theme. 464 class uses.
3. **Parchment and ember.** "Playful tabletop", deliberately not per-theme, used by marketing and onboarding, through `anvil-parchment-*` and `anvil-ember-*`.
4. **Others.** Scene mode colours, `anvil-accent`, role sidebar colours (pink and purple, which stay the same in both themes), and light-theme overrides of cyan, sky, blue and indigo stops.

**Recount, not copied.** Zinc utility classes number **2,929 across 176 files** (`apps/vtt/src` and `packages`, `.ts`, `.tsx`, `.css`). The plan said 2,888 across 176. The file count matches, and the class count is 41 higher. Of these, 2,776 are in 155 files in `apps/vtt`. The counted prefixes are bg, text, border, ring, divide, from, to, via, placeholder, fill, stroke, accent, outline, shadow, caret and decoration. Worst files: `HeroSheet.tsx` 127 lines, `CampaignBuilder.tsx` 115, `BattleWorkspace.tsx` 89.

**Hard-coded hex.** The plan's 11 files is right for `apps/vtt`:

`BattleWorkspace.tsx`, `BattleToolbar.tsx`, `DirectorView.tsx`, `OAuthButtons.tsx`, `BattleCanvas.tsx`, `CardGrid.tsx`, `BattleStage.tsx`, `scene-drafts.ts`, `scene-data.ts`, `LandingHero.tsx`, `InteractionManager.ts`.

Seven more files in `packages` hold hex values, 18 in all. `OAuthButtons.tsx` is fine, since those are brand colours. `globals.css` holds 144 lines with hex, as expected for tokens. `BattleCanvas.tsx` also has `0x1a1a2e` as a number, which a `#` search misses.

## Where the app has moved from the design spec

Against `docs/spec/ANVIL_V2_FRONTEND_DESIGN.md`:

| Spec | App today |
|---|---|
| Cool near-black, `#09090b` base, white text | Warm grey base `#242423`, teal-tinted text |
| Dark only | Dark and light, with light incomplete on art and canvas |
| Display font Cinzel | Fraunces, plus a parchment language the spec does not mention |
| Slim 48 px icon rails that expand to 280 and 320 px | Always-open tabbed text rails of about 144 and 170 px, the worst of both |
| Film strip along the bottom, 56 px | Scene chips in the top bar |
| Director's left rail is tools, right rail is party | Left rail is combat and party, tools float on the stage |
| Horizontal tool bar under the stage, with Ping | Vertical floating panel, and no Ping in the toolbar |
| Player left rail is abilities | Abilities are a tab in the right rail |
| Player vitals bar with portrait and stamina bar, 60 px | 48 px row of stat tiles with no bar |
| Status bar shows turn indicator for Player | Status bar shows connection and names only |
| Mode tints the interface | Mode shows only in a chip, a small badge and a thin line in the builder |
| Smallest type 10 px | 8 and 9 px in use |
| All text meets WCAG AA | Not met |

The spec is out of date, and it should not be treated as the target. Its principles still hold, and "Content over chrome" and "Mode communicates state" are the two the app has drifted from most.

## Full surface list

Listed surfaces: 47. Captured: 47. Not captured: 0, with the partial gaps noted further down.

Sizes are 1440 × 900 and 1280 × 720 in dark and light, unless noted. Phone and mobile are 375 × 812, dark and light.

| Group | Surface | Files |
|---|---|---|
| Session | Director and Player, Battle (dense) | `session-battle-{role}-{size}-{theme}`, `-fit-`, `-tab-*` |
| Session | Director and Player, Story | `session-story-{role}-{size}-{theme}`, `-tab-*` |
| Session | Director and Player, Montage | `session-montage-…` |
| Session | Director and Player, Negotiation | `session-negotiation-…` |
| Session | Director and Player, Respite | `session-respite-…` |
| Session | Lobby, both roles | `app-lobby-forced-{role}-{size}-{theme}` (see note 1) |
| Session | `/app/live`, both roles | `app-live-{role}-{size}-{theme}` |
| Session, other | `/phone` as Director and Player, all five modes | `phone-{mode}-{role}-375-{theme}` |
| Session, other | `/display`, all five modes | `display-{mode}-{size}-{theme}`, `display-battle-fit-…` |
| App | `/app` | `app-home-{role}-…` (onboarding modal), `app-home-dismissed-…` |
| App | `/app/campaigns`, `/app/campaigns/:id` | `app-campaigns-…`, `app-campaign-…`, `app-campaign-tree-open-1440-dark` |
| App | Five workspaces | `app-workspace-{mode}-{size}-{theme}` |
| App | `/app/heroes`, `/new`, `/:id` | `app-heroes-…`, `app-hero-new-…`, `app-hero-sheet-…` |
| App | `/app/assets`, `/notes`, `/account`, `/join` | `app-assets-…`, `app-notes-…`, `app-account-…`, `app-join-…` |
| Mobile | `/app/mobile` home, heroes, heroes/new, heroes/:id, notes, assets, campaigns, account | `mobile-{route}-{role}-{theme}` |
| Public | `/`, `/about`, `/contact`, `/auth` | `public-{page}-{size}-{theme}`, `-full-` at 1440 |
| Public | `/join/:token` | `public-join-anon-…`, `public-join-token-…`, `public-join-badtoken-…` |
| States | Reconnect | `state-reconnect-player-{size}-{theme}` |
| States | Loading | `state-loading-{session,home,campaigns,assets,heroes,route-chunk}-…` |
| States | Empty lists | `state-empty-{home,live,campaigns,heroes,assets,notes}-…` |
| States | Route error | `state-badroute-…`, `state-badsession-…`, `state-badcampaign-…`, `state-badhero-…`, `state-routeerror-chunk-…` |
| Extra | Phone locked | `state-phone-locked-{theme}` |
| Extra | Token hover, popover, selected; Player's own turn | `session-battle-director-token-*`, `session-battle-player-my-turn-*`, `session-battle-player-can-claim-*` |

Notes on how some surfaces were reached:

1. **Lobby** redirects when a session is active, so the session's status was rewritten to `lobby` in the browser. The lobby page is real, and the state behind it is forced. `app-lobby-{role}-…` shows the redirect to Battle.
2. **Modes other than Battle** ran on the seed party with one hero, so they were not tested under load.
3. **Rail tabs** cover 1440 dark and 1280 light for Battle, and 1440 dark only for the other four modes.
4. **Forced states** were blocked in the browser. No server was stopped.
5. `app-hero-sheet-director-…` shows "Not found", since the hero belongs to the Player. Use the Player's.
6. **Display** was opened as the Director only.
7. `/app/mobile/*` is a catch-all redirect to home and is not a separate surface.

### Partial gaps: not captured

These sit inside surfaces listed above. None of them was seen.

| Not captured | Reason |
|---|---|
| Reconnect overlay, failed "Refresh Page" variant | Needs a terminal socket error, which the forced close did not trigger |
| Reconnect overlay as Director | Same component, only forced for the Player |
| Generic "Something went wrong" route error | No route throws a non-chunk error on demand. Only the "Update needed" branch was seen, and a bad route redirects instead of erroring |
| Damage dialog, power roll result, opportunity attack prompt, dice tray result | Would need real rolls and attacks in the session. Not attempted, to keep the fixture intact until the dense captures were done |
| Villain turn from the Director's side | Not attempted |
| Hero wizard steps 2 to 16 | Only step 1 was captured, desktop and mobile |
| Hero sheet tabs, Account Settings and Data tabs, Assets sub-lists other than the default | Default view only |

## Repeating the capture

```bash
PLAYWRIGHT_CORE=/path/to/playwright-core node design/redesign/audit/capture.mjs
PLAYWRIGHT_CORE=/path/to/playwright-core node design/redesign/audit/a11y-probe.mjs
```

- `playwright-core` is not in this repo's `node_modules`, despite the note in the plan. Any copy works. The script falls back to `tmp/forge-steel-session-three-reference/node_modules/playwright-core` in the main checkout. It uses the installed Google Chrome.
- Set `AUDIT_SESSION`, `AUDIT_HERO` and `AUDIT_CAMPAIGN` for a rebuilt harness.
- It signs in once per role and keeps the cookies in `captures/audit/.auth/`. Delete that folder when the server's sessions reset.
- The `battle-interact` phase ends a hero's turn and claims the Player's, so it changes the fixture. It needs the dense fixture and token positions at 1440 × 900.
- The `public` phase creates one campaign invite in the local dev database on each run.
