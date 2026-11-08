# Anvil design language: Storyboard

This is the locked design language for the Anvil v2 redesign. It records what Dan approved at Gates 1 to 5 (see `DECISIONS.md`). Phase 3 builds every real screen from it.

- **Source of truth.** The approved demos under `design/redesign/demos/` are the target. This file names the rules they follow. If this file and a demo disagree, the demo wins, and this file must be fixed.
- **Tokens.** `tokens/anvil-tokens.json` is the one token table. `tokens/look-anvil.css` is generated from it (`npm run tokens`). Never edit the CSS by hand.
- **Viewing a demo.** `cd design/redesign && npm run dev`, then open `http://127.0.0.1:5199/?demo=<id>`. `?gate=<n>` shows a whole gate. Mode demos take `?theme=light|dark` to show their other theme.
- **Shared code.** Almost every rule below lives in `demos/_shared/storyboard/`. Class prefixes tell you the file: `sb-` is `storyboard.css` (session shell), `md-` is `modes.css`, `ph-` is `phone.css`, `dp-` is `display.css`, `st-` is `states.css`, `ap-` is `app.css`, `bd-` is `builder.css`.
- **Not design.** Placeholder art, invented names, scene text and numbers in the demos are not part of the design. Real data replaces them. Drawn heads are placeholders for the art that Storyboard needs (Gate 1 cost).

## Contents

1. [Core rules](#1-core-rules)
2. [Tokens](#2-tokens)
3. [Type](#3-type)
4. [Components](#4-components)
5. [Motion](#5-motion)
6. [Modes](#6-modes)
7. [Roles and hidden information](#7-roles-and-hidden-information)
8. [Surfaces not drawn](#8-surfaces-not-drawn)
9. [Approved behaviour changes](#9-approved-behaviour-changes)
10. [Surface to demo map](#10-surface-to-demo-map)
11. [Canvas palette](#11-canvas-palette)
12. [Conflicts resolved](#12-conflicts-resolved)
13. [Known gaps carried into Phase 3](#13-known-gaps-carried-into-phase-3)

---

## 1. Core rules

These rules decide every case this file does not name.

1. **Heavy ink carries meaning.** The 3 px frame (`--shape-frame`) and hard shadows go only on: the map or mode screen, the live Film Strip board, whoever is acting, the dying row, the one primary action, and anything that floats over the map. Everything inside a rail uses the quiet rule (`--shape-frame-quiet`, 1.5 px, and `--color-line-quiet` dividers).
2. **The map uses art tokens.** Anything drawn on the map or on scene art uses `--art-*`, which do not change with theme. It must read the same in both themes and on any uploaded map.
3. **Mode colour is identity, never an action.** Scene colours mark which mode a thing belongs to. Actions use `--color-active` (blue). The one exception is "Draw Steel!" in the Builder, which starts Battle (see section 12).
4. **Director-only things wear the fog preview's mark.** Ink hatching and a shut eye (`EyeOff`). The "Only you" tag (`md-only`) and "Hidden from players" tag (`sb-fogtag`) are the two forms.
5. **No text straight on art.** Words over art sit on an art plate (`--art-plate`, ink keyline) or on a theme surface with a heavy frame.
6. **13 px is the floor.** No text under 13 px anywhere a person reads at the table. The Display floor is 26 px.
7. **Never colour alone.** Mode, winded, dying, turn state, done and hidden each read by icon, word or shape as well as colour. Check every new state in greyscale.
8. **Square corners.** Radius is 0. Only these are round: hero faces and portraits, the done, condition and hidden badges, avatars (`ap-av`), the theme switch, and the live dot.
9. **Comic page grids.** A group of panels is one framed page with 3 px ink gutters (`ap-page`, `st-grid`, `md-chs`, `md-tks`), not cards on a background.
10. **Rails keep their width.** At smaller sizes the centre (map, screen or page body) takes what is left. Lists show whole rows; they never cut a row in half.
11. **Names wrap, never cut,** except where a demo cuts on purpose: tracker rows cut a long creature name at the comma, and Film Strip boards use the scene's short name.

---

## 2. Tokens

All values are in `tokens/anvil-tokens.json`. CSS names are the generated names in `tokens/look-anvil.css`.

### 2.1 Theme colours

These change with `data-theme`. Contrast was measured at Gates 1 to 5: all text pairs pass AA.

| Token | CSS variable | Light | Dark | Use |
|---|---|---|---|---|
| canvas | `--color-canvas` | `#8fa6ab` | `#46565b` | The mid-tone ground behind every frame. The page background. |
| onCanvas | `--color-on-canvas` | `#15171c` | `#f1f3ee` | Text and icons on the ground: wordmark, page titles, status bar, Film Strip arrows. |
| surface | `--color-surface` | `#f1f3ee` | `#1d2024` | Inside every frame: rails, panels, popovers, dialogs. |
| well | `--color-well` | `#e2e6e1` | `#2a2e34` | Inactive tabs, done rows, done tickets, hover. |
| raised | `--color-raised` | `#ffffff` | `#30353c` | Inputs, secondary buttons, action buttons, note page. |
| text | `--color-text` | `#15171c` | `#f1f3ee` | Body text. Also the fill of selected tabs and segments. |
| textSoft | `--color-text-soft` | `#3f4650` | `#c3cbd0` | Secondary text, placeholders, inactive tabs. Passes AA on surface, well and raised. |
| line | `--color-line` | `#15171c` | `#d3dad8` | Frames and rules. In dark it is a soft chalk. |
| lineQuiet | `--color-line-quiet` | `#c3cac6` | `#464d54` | Dividers between rows inside a rail. Never a frame. |
| shadow | `--color-shadow` | `#15171c` | `#0d0e11` | Hard shadows on theme surfaces. |
| active | `--color-active` | `#2348c9` | `#9db4ff` | Primary action, acting row, selected item, the turn outline. |
| onActive | `--color-on-active` | `#ffffff` | `#15171c` | Text on `active`. |
| activeSoft | `--color-active-soft` | `#dbe3ff` | `#2b3560` | Now-acting card, the Player's action section, the live corner-tracker cell. |
| alert | `--color-alert` | `#b3241b` | `#ff9d92` | Text and dashed edge of session-ending actions (End session, Delete account). |
| danger | `--color-danger` | `#ffd21f` | `#ffd21f` | Winded tag, reconnect chip, the hit flash on a unit row. Yellow in both themes. |
| onDanger | `--color-on-danger` | `#15171c` | `#15171c` | Text on `danger`. |
| success | `--color-success` | `#1a7a43` | `#6fd39b` | Success text. Rare. |
| mapDim | `--map-dim` | `1` | `0.86` | Brightness applied to map and scene art (`filter: brightness()`). |

Note the names: `danger` is hazard yellow, and `alert` is red. Do not swap them.

### 2.2 Scene mode colours

These do not change with theme. The text colour on each is fixed too.

| Mode | `--color-scene-*` | `--color-on-scene-*` | Contrast | Icon (lucide) |
|---|---|---|---|---|
| Story | `#8b3fe0` | `#ffffff` | 5.41:1 | `BookOpen` |
| Montage | `#e38a00` | `#15171c` | 6.75:1 | `Footprints` |
| Negotiation | `#2b6fe6` | `#ffffff` | 4.65:1 | `Handshake` |
| Battle | `#cf2a20` | `#ffffff` | 5.24:1 | `Swords` |
| Respite | `#1f9d55` | `#15171c` | 5.13:1 | `Tent` |

### 2.3 Art colours

These never change with theme. Use them for the map, scene art, tokens, and anything floating over art.

| Token | CSS variable | Value | Use |
|---|---|---|---|
| ink | `--art-ink` | `#15171c` | Outlines on the map, heavy frames on floating things, the live board's icon cell. |
| plate | `--art-plate` | `#ffffff` | Map label plates, token keyline, face discs, "Take my turn". |
| onPlate | `--art-on-plate` | `#15171c` | Text on plate. |
| heroPlate | `--art-hero-plate` | `#15171c` | Hero name labels on the map. |
| onHeroPlate | `--art-on-hero-plate` | `#ffffff` | Text on hero plates, and any text on ink. |
| activePlate | `--art-active-plate` | `#2348c9` | The acting token's ring and label, the Player's turn band, the move trail. |
| onActivePlate | `--art-on-active-plate` | `#ffffff` | Text on activePlate. |
| hazard | `--art-hazard` | `#ffd21f` | Dying row tape, burst, "is dying!" shout, failure icons, drop strip, room code, public-page ground. |
| onHazard | `--art-on-hazard` | `#15171c` | Text on hazard. |
| fog | `--art-fog` | `#15171c` | The Player's fog, and secrets the Player has not found. |
| fogHatch | `--art-fog-hatch` | `#2a2e38` | Fill of the Director's fog preview. Changed at Task 11 from the unused `#2c3038` to match the map. |
| fogHatchAlpha | `--art-fog-hatch-alpha` | `0.42` | Opacity of that fill. Added at Task 11. |
| gridAlpha | `--art-grid-alpha` | `0.2` | Grid lines are ink at this opacity. Added at Task 11. |
| keyline | `--art-keyline` | `#f1f3ee` | Thin keyline round drawn heads on dark panels. Added at Task 11. |
| tokenShadow | `--art-token-shadow` | `rgb(21 23 28 / 0.9)` | The small offset shadow under every head on the map. Added at Task 11. |
| scrim | `--art-scrim` | `rgb(21 23 28 / 0.62)` | Behind a confirmation dialog. Added at Task 11. |
| miniFoe | `--art-mini-foe` | `#d6372c` | Creature squares on the mini-map. Added at Task 11. |

### 2.4 Shape: radius, outlines and shadows

| Token | CSS variable | Value | Use |
|---|---|---|---|
| radius | `--shape-radius` | `0` | Everything. See rule 8 for the round exceptions. |
| frame | `--shape-frame` | `3px` | Heavy ink frame (rule 1). |
| frameQuiet | `--shape-frame-quiet` | `1.5px` | Rails' inner rules, Film Strip boards at rest, inputs, secondary buttons. |
| frameDashed | `--shape-frame-dashed` | `2px` | Dashed edges: session-ending buttons, open slots, empty boxes, waiting actions. Added at Task 11. |
| faceRing | `--shape-face-ring` | `2.5px` | Ink ring round a face disc (turn band, dying row, wizard heads). Added at Task 11. |
| meter | `--shape-meter` | `7px` | Height of a stamina meter in a rail row. Added at Task 11. |
| hardShadowSmall | `--shape-hard-shadow-small` | `3px 3px 0` | Primary buttons, map shout, Interest step. |
| hardShadow | `--shape-hard-shadow` | `4px 4px 0` | Map screen, live board, popover, turn band, floating panels. |
| hardShadowLarge | `--shape-hard-shadow-large` | `6px 6px 0` | Confirmation dialog, Story script page. Added at Task 11. |
| hardShadowPage | `--shape-hard-shadow-page` | `7px 7px 0` | Comic page grids (challenges, tickets, states, phones on the sheet). Added at Task 11. |
| hardShadowWindow | `--shape-hard-shadow-window` | `8px 8px 0` | Landing windows, Display board. Added at Task 11. |
| railLeft | `--shape-rail-left` | `304px` | Session left rail, both sizes. |
| railRight | `--shape-rail-right` | `294px` | Session right rail, both sizes. |

Shadow colour: `--color-shadow` on theme surfaces, `--art-ink` on things over art (popover, shout, roll card, take button).

### 2.5 Space and layout

Space steps (`--space-*`): `hair` 2, `xs` 4, `sm` 6, `gutter` 8, `md` 10, `pad` 12, `lg` 16, `xl` 24 px. The session shell uses 12 px outer padding and 8 px gaps between columns. App pages use 12 px gaps. Rail sections pad 10 × 12 px. App panels pad 16 px.

Layout sizes (`--layout-*`):

| Token | 1440 × 900 | 1280 × 720 | Use |
|---|---|---|---|
| top | 62 | 52 | Session top row: wordmark, Film Strip or turn band, End session. |
| bar | 46 | 42 | The bar under the screen: tools and dice. |
| status | 26 | 24 | Status bar on the ground. |
| tabs | 34 | 34 | Rail tab row. |
| sub | 28 | 26 | Rail section heading (`sb-sub`). The Director heading is 32 / 30. |
| row | 48 | 40 | Hero row in a rail. |
| dying | 64 | 52 | Dying row. |
| unit | 34 | 22 | Director's creature row. Player: 33 / 24. |
| miniMap | 112 | 84 | Mini-map width. |
| appRail | 232 | 232 | App rail outside a session. |
| appHead | 62 | 62 | App page title row. |
| target | 44 | 44 | Minimum touch target on phone. |

Phone: 375 × 812, top 70, tab bar 60, hero row 50, dying row 54, creature row 49, docked action 56 px.

Geometry: the map width is `viewport − 24 − 304 − 294 − 16 − 6` and the cell is that width over the visible columns. See `geoFor()` in `_shared/storyboard/data.ts`.

### 2.6 Display tokens

`--display-*`: theme always `dark`, 1920 × 1080, rail 440, map zoom ×2, frame 6 px. Type: floor 26, body 28, names 34, round 40, board 44, turn 64, script slug 30, script 46 px.

### 2.7 Values that stay local

Every colour a demo uses is either a token above or one of these. Each is local on purpose.

| Value | Where | Why it is local |
|---|---|---|
| `#ffffff` | face discs, text on ink | It is `--art-plate` or `--art-on-hero-plate`. Build with those tokens. |
| `#4752c4` | Discord sign-in (`app.css`) | Brand colour, darkened so white passes AA. Lives in `OAuthButtons.tsx`. |
| `#4285F4`, `#34A853`, `#FBBC05`, `#EA4335` | Google mark (`app.tsx`) | Brand mark. Lives in `OAuthButtons.tsx`. |
| `#2c3b2a` | Respite screen (`modes.css`) | Fallback behind placeholder camp art. Real scenes use their own image. |
| `rgb(21 23 28 / .5)` | title card icon shadow (`scene.css`) | One-off inside the scene-change card. |
| map colours in `map.tsx` (`#a9c56c`, `#67c1d3`, `#efcd85`, …) | placeholder map | Placeholder art. Real maps are uploads. The mini-map draws ground, water and trail from the map image. |
| heads in `faces.tsx`, `wizard/index.tsx`, `scene-art.tsx` | placeholder art | Art, not tokens. |

### 2.8 Porting tokens into `packages/ui/src/globals.css` (Task 12)

- Create the variables with exactly the names in `tokens/look-anvil.css` (`--color-*`, `--color-scene-*`, `--color-on-scene-*`, `--art-*`, `--shape-*`, `--type-*`, `--space-*`, `--layout-*`, `--font-*`, `--map-dim`). Theme colours go under `:root, [data-theme="dark"]` and `[data-theme="light"]`. Art, scene, shape, type and space go once, outside the theme blocks. Same names mean demo CSS ports line for line.
- Remap the existing names by role, in both themes, so the 2,929 zinc classes update without edits:

| Old name | New value |
|---|---|
| `zinc-950` (page) | `canvas` |
| `zinc-900` (card) | `surface` |
| `zinc-800` (elevated, hover) | `well` |
| `zinc-700`, `zinc-600` (borders) | `lineQuiet` |
| `zinc-500`, `zinc-400` (muted text) | `textSoft` |
| `zinc-300` to `zinc-50` (text) | `text` |
| `creator-bg`, `creator-card-hover` | `well` |
| `creator-card` | `surface` |
| `creator-text` / `creator-text-muted` | `text` / `textSoft` |
| `creator-border` | `lineQuiet` |
| `creator-highlight` | `active` |
| `anvil-parchment-50`, `-100`, `anvil-paper` | `surface` |
| `anvil-parchment-200` | `well` |
| `anvil-parchment-300` | `lineQuiet` |
| `anvil-ink`, `anvil-ink-soft` | `art.ink`, `textSoft` |
| `anvil-accent`, `anvil-ember-*` | `art.hazard` for grounds and highlights; actions use `active` |
| `flow-director`, `flow-player`, `sidebar-director`, `sidebar-player` | `text` (the Director / Player switch fills the chosen side with text colour) |
| `scene-*` | the scene values in 2.2 |
| `--radius-card`, `--radius-chip` | `0` |
| `--shadow-paper`, `--shadow-paper-lift` | `hardShadowSmall` and `hardShadow`, in `--color-shadow` |
| `--font-display`, `--font-body` | Bricolage Grotesque and Atkinson Hyperlegible (section 3) |

- Keep old names as aliases until no file uses them, then delete them (plan Task 12 Step 2). The light-theme overrides of `cyan`, `sky`, `blue` and the other accent stops, and the `anvil-dashboard` tones, stay until their last users are restyled in Task 16. New code must not use them.
- Remove `.texture-grain`, `.texture-parchment*` and `.edge-deckle` once unused. Storyboard has no paper grain and no deckled edges.

---

## 3. Type

### 3.1 Fonts and loading

| Role | Family | Weights | Package |
|---|---|---|---|
| Display (names, headings, numbers that matter, buttons that act) | Bricolage Grotesque Variable | 700, 800 | `@fontsource-variable/bricolage-grotesque` 5.3.0 |
| Body (everything else) | Atkinson Hyperlegible | 400, 700 | `@fontsource/atkinson-hyperlegible` 5.3.0, files `400.css` and `700.css` |
| Script (Story read-aloud only) | Courier Prime | 400, 700 | `@fontsource/courier-prime` 5.3.0, files `400.css` and `700.css` |
| Mono (rare) | `ui-monospace, SFMono-Regular, Menlo, monospace` | system | none |

- Load all three in `apps/vtt/src/main.tsx`, replacing the Inter and Fraunces imports, and swap the packages in `apps/vtt/package.json`. Fonts are self-hosted through Fontsource. Do not use a font CDN.
- Session, app and public roots set `font-variant-numeric: tabular-nums`, so stamina and counts do not jump.
- Body line height is 1.3 in the session and 1.35 on app pages.

### 3.2 Scale

| Token | Size | Font, weight | Use (demo class) |
|---|---|---|---|
| `--type-min` | 13 | body 400 or 700 | The floor. Tabs, sub-lines, log, labels on the map, chips, captions. |
| `--type-body` | 14 | body 400 | Body text, stamina numbers. |
| `--type-name` | 14 | display 700 | Names in rows, board names. |
| `--type-label` | 15 | body 700 or display 700 | Dialog body, End turn, secondary app text. |
| `--type-heading` | 16 | display 800 | Rail section headings (`sb-sub b`), panel headings in rails, the shout. |
| `--type-emphasis` | 17 | display 800 | Now-acting name, "Take my turn", DYING word, script slug. |
| `--type-panel` | 19 | display 800 | App panel headings (`ap-panel__h h2`), goal plate. |
| `--type-band` / `--type-dialog` | 22 | display 800 | The Player's mode band, dialog title. |
| `--type-script` | 25 | script 400, line 1.5 | Story read-aloud page. |
| `--type-turn` | 26 | display 800 | "Your turn, Smoke". |
| `--type-wordmark` / `--type-page-title` | 32 | display 800, tracking −0.02em | Wordmark "Anvil", app page titles. |
| `--type-auth-title` | 44 | display 800 | Sign-in title. |
| `--type-hero-title` | 52 | display 800, tracking −0.03em | Landing headline. |

App pages also use 15 to 24 px display sizes for card titles (campaign 24, hero 21, note title 34). Read those from each Gate 5 demo's CSS.

At 1280 × 720 these change (`--type-1280-*`): wordmark 26, turn 22, band 19, script 21, script slug 15, DYING word 14. Nothing else shrinks. The 13 px floor holds at 1280.

### 3.3 The 13 px floor

- No text node under 13 px in any session, app or public surface. This was measured on every approved still.
- Map labels are fixed at 13 px whatever the zoom. A label with no free slot is dropped (the token's face and number stay). It never shrinks.
- The Smaller / Larger text buttons scale the reading surfaces of Story, Montage and Negotiation. They never take any text under 13 px.

### 3.4 Display room scale

The Display is read from across a room. Nothing under 26 px. Names 34, round 40, board name 44, "Up now" name 64, read-aloud 46 on a 30 px slug. The map is drawn at laptop geometry and scaled ×2, so a 13 px map label lands at 26 px. Legibility was checked at 25% scale.

---

## 4. Components

Each entry gives the rule, then the demo and class to copy.

### Frame

A box with `--color-surface` fill and a 3 px `--color-line` frame. Holds rails, app panels and the bar. No shadow unless it floats or acts. **Demo:** every surface, `sb-frame`.

### Panel (app)

A frame with a 48 px heading row: 19 px display title, optional 13 px count in `textSoft`, optional underlined link on the right, quiet rule under it. Panels on one page share 3 px ink gutters inside one `ap-page`. Counts sit in the heading ("Campaigns 3"), not in tiles. **Demo:** `home`, `ap-panel`, `ap-page`.

### Rail

A frame, fixed width (304 left, 294 right), content stacked: tabs, then sections. Sections are separated by quiet rules, never by shadows. Rows inside are separated by an inset 1 px `lineQuiet` line. The rail never scrolls the page; long lists clip to whole rows or scroll inside the rail. **Demo:** `battle-director`, `sb-rail`, `sb-sec`.

App rail: 232 px, user row (64 px), Director / Player switch, nav rows (46 px, 16 px display, selected row filled with `text` and a 6 px `active` inset bar), then Report issue and the theme switch at the foot. **Demo:** `home`, `ap-rail`.

### Tab

A row of equal tabs, 34 px, 13 px bold. Inactive: `well` fill, `textSoft`. Selected: `text` fill, `surface` text. Counts follow the label in regular weight ("Heroes 7"). Every label must fit at 1280 with no truncation. App tabs are 40 px with 16 px padding. **Demo:** `battle-director` (`sb-tabs`), `hero-sheet` (`hs-tabs`), `account` (`ap-tabs`).

### Buttons

| Kind | Look | Use | Demo, class |
|---|---|---|---|
| Primary | `active` fill, `onActive` text, 3 px ink frame, small hard shadow, display 700 to 800 | The one main action on a surface: End turn, Roll test, Make an argument, Complete, Go live, Try again | `battle-director` `sb-end`; `montage-player` `md-go`; `home` `ap-btn--go`; `states` `st-go` |
| Secondary | `raised` fill, quiet inset frame, body 700 | Everything else that acts | `home` `ap-btn--alt`; `states` `st-alt`; `respite-director` `md-tk__do` |
| Quiet link | underlined, 13 px or body, no frame | Low-weight actions: End combat…, Reset…, Catch Breath, Defend | `battle-director` `sb-link`, `sb-free` |
| Session danger | `surface` fill, `alert` text, 2 px dashed `alert` edge, never a shadow | Anything that ends play or deletes: End session…, Delete account… | `battle-director` `sb-endsession`; `account` `ap-btn--stop` |
| Take (plate) | `art.plate` fill, ink text, 3 px ink frame, small ink shadow | "Take my turn" inside the blue turn band. On phone also ringed in `activePlate` | `battle-player` `sb-take`; `phone-player` `ph-go--take` |
| Waiting | `well` fill, `textSoft`, dashed edge, no shadow, label ends "when back" | An action held during a reconnect | `states` `st-take`, `ph-go[data-wait]` |
| Disabled | `well` fill, `textSoft`, quiet `lineQuiet` edge | Not available now. Never coloured text on a coloured fill | `home` `ap-btn[disabled]`; `story-director` `md-btn[disabled]` |
| Mode start | Battle red fill, white text, ink frame, small shadow | "Draw Steel!" in the Builder only | `builder` `bd-draw` |
| Stepper | − value + : 30 px square buttons, quiet inset frame, 20 px display number | Malice, successes, Interest, Patience | `montage-director` `md-step`; `battle-director` `sb-malice` (22 px); phone `ph-step` (48 px) |
| Segmented | quiet inset frame, equal parts, selected part filled with `text` | Damage / Heal, characteristic pick, Original / End State | `battle-director` `sb-seg`; `builder` `bd-state` |

Pressed: every button moves `translate(1px, 1px)`. Anything that ends play for everyone asks first (see Dialog). Labels that open a confirmation end with "…".

### Chip and tag

| Kind | Look | Demo, class |
|---|---|---|
| Winded tag | 13 px bold, `danger` fill, `onDanger` text, 1.5 px ink keyline, after the name | `battle-director` `sb-winded` |
| Only you / Hidden | 22 px high, ink fill, white 13 px bold, `EyeOff` 13 px, keyline in `line` | `story-director` `md-only` |
| Map fog tag | ink fill, white, `EyeOff`, "Hidden from players" ("Hidden" at 1280) | `battle-director` `sb-fogtag` |
| Neutral tag | 24 px, `well` fill, quiet keyline, 13 px bold | `home` `ap-tag` |
| Live tag | Battle red, white, white dot, 2 px ink keyline | `home` `ap-live` |
| Skill chip | 13 px bold, 1.5 px inset frame in `line` | `montage-director` `md-chips` |
| Ability kind | ink fill white for Main; raised with ink edge for Maneuver and Move; hazard for Triggered | `hero-sheet` `hs-kind` |
| Map label | 22 px high, plate fill, ink text, 1.5 px ink keyline, 13 px bold. Hero labels: hero plate, display font. Acting: active plate | `battle-director` `sb-label` |

### Token face

One face per entity, used on the map, in every rail row, on the phone, on the Display and on app pages. The face is the identity; the label is a help.

- **Drawn head.** Each class and ancestry has its own silhouette with a 4-unit ink outline (in a 64-unit box). Heroes are heads; creatures are family faces. On the map every head gets `drop-shadow(1.5px 2px 0 var(--art-token-shadow))`. On dark panels (rails, phone, Display, tickets, NPC rows) a drawn head gets a keyline: `drop-shadow(0 0 .6px var(--art-keyline))` twice (1 px on the Display). **Demo:** `battle-director`, `_shared/storyboard/faces.tsx`.
- **Uploaded portrait.** An upload becomes a sticker: clipped to a shape, then a white keyline, then the same 4-unit ink outline, then an offset ink shadow (2.2, 2.6). Heroes are round. Creatures are eight-sided. Side reads by shape. Uploads already carry the white keyline, so they get no extra keyline on dark. **Demo:** `battle-director` (Torvald, Cicero), `_shared/storyboard/portraits.tsx`.
- **Sizes.** Map hero = one cell; creature = 0.87 cell; large creature = 1.9 cells. Rail row 36, creature row 22, Now card 46, turn band 38 (32 at 1280), dying row 38, phone party 40, Display party 56, hero card 118, hero sheet 172.
- **Squads.** One label per squad ("Scrappers 1 to 4"). Each member shows its number on a plate at its bottom-right corner (`sb-foe b`).

### State markers

| State | On the map | In a rail row | Elsewhere | Demo |
|---|---|---|---|---|
| Acting | White disc behind the face, ring 3.5 px `activePlate` then ink to 6 px; label on active plate; token above others | Row filled with `active`, text `onActive`, sub-line bold ("Acting now", or "Your turn" for your own hero), meter in current colour | Side tracker dot filled `active` with a ring; Now card shows the face; screen gets a 3 px `active` outline on the Player's turn | `battle-director`, `battle-player` |
| Done | Ink disc badge with a white check at top-left, plate ring | Row in `well`, sub-line "Done", same check badge on the face | Side tracker dot filled with `text`; phone party face at 75% opacity | `battle-player` |
| Winded | No map marker | Yellow "Winded" tag after the name; meter fill hatched (`repeating-linear-gradient(135deg, text 0 2px, transparent 2px 4px)`) | Display: same tag at 26 px | `battle-director` (Wren) |
| Dying | Hazard burst (22-point star, ink 4) behind the token; head tilted −14°; X eyes on drawn heads; tilted hazard shout "Pip is dying!" with ink frame and small ink shadow | Full-weight hazard tape row: 135° hazard and ink stripes, 3 px ink rules top and bottom, face on a white disc tilted −9°, name on a hazard plate, "DYING" in 17 px caps, `cur/max` on ink | Side tracker diamond in hazard; phone party face on hazard tilted −9° plus "Pip is dying" shout; Display hazard plate "DYING 0/28" | `battle-director` (Pip) |
| Dying upload | Greyscale portrait plus the X overlay (rule stated at Gate 2, not drawn) | Same row as above | — | rule only |
| Hidden (Director view) | Ink disc badge with white `EyeOff` at bottom-left of a fogged creature; fog drawn as the hatched preview with "Hidden from players" | Phone: 24 px ink square with `EyeOff` | NPC row hatched (`well` and `surface` stripes) with "Hidden" tag; secret card with hatched left edge and "Hidden from players" | `battle-director`, `story-director`, `negotiation-director` |
| Condition | Plate disc badge at bottom-right with the condition icon | Condition names in the sub-line, comma separated | Popover status | `battle-director` |

### Tracker row and trackers

- **Hero row** (`sb-row`): 36 px face, name (14 px display) and a 13 px sub-line, then `cur/max` and a 7 px meter right-aligned in a 64 px column. The sub-line is the mode's line (section 6). Rows are 48 px (40 at 1280). **Demo:** `battle-director`.
- **Dying row** (`sb-dying`): see State markers. 64 px (52 at 1280). It keeps full weight inside the quiet rail. It is the one thing a rail must shout.
- **Creature row** (`sb-unit`): 22 px face, name, and `cur/max` for the Director only. A Player sees a condition word, never stamina. Squads fold into one row ("Scrappers, 3 squads") on the Director's view and on the Player's at 1280.
- **Corner tracker** (`sb-side`): hangs from the screen's top-right corner, `surface` fill, 3 px ink on its left and bottom edges only. Cells 38 px high, divided by `lineQuiet`. Battle: Round, Heroes (count and one dot per hero), Director (count). The live cell takes `activeSoft`. Each mode puts its own counts here (section 6).
- **Phone tracker strip** (`ph-track`): 48 px, Round, Heroes n/7, Director n/14, inside the sheet.
- **Order on phone:** danger first. Dying, then winded, then acting, then the rest by stamina, done last. Creatures: most hurt first, hidden ones marked.

### Meter

A 7 px bar with a 1.5 px `text` edge and `text` fill (`sb-meter`). Winded hatches the fill. On an active row the meter takes `currentColor`. Width changes over 0.7 s (section 5). Vital meters are 9 to 12 px. **Demo:** `battle-director`, `hero-sheet`.

### Film Strip cell

- Each scene is a board: a 34 px icon cell in its mode colour (mode icon, 20 px, stroke 2.6), then the scene name (14 px display, one line) over the mode word (13 px). Boards at rest: `surface`, 1.5 px `line` edge. Ink arrows sit between boards on the ground. **Demo:** `battle-director`, `sb-board`.
- The live board is filled with its mode colour, 3 px ink frame, hard shadow, tilted −0.6°, and its icon cell turns ink with a white icon.
- The Director sees every scene. A Player sees only the live board (`sb-strip--one`, min 196 px), because future scene names are the Director's. The phone shows the live board flat (no tilt).
- In app pages a campaign's scenes are a small strip of mode squares (`ap-strip`), and in the Builder a tree (`bd-tree`).

### Banner

| Kind | Look | Demo, class |
|---|---|---|
| Player's turn | Replaces the Player's top row beside the live board. `activePlate` fill, 3 px ink, hard shadow; face on a white disc; "Your turn, Smoke" at 26 px; who just finished at 14 px; "Take my turn" plate on the right | `battle-player` `sb-turn` |
| Mode band | The Player's top row in the other four modes. `surface`, 3 px ink frame, a 10 px inset bar of the mode colour on the left; goal at 22 px and one line of what the table is doing | `story-player` `md-band` |
| Phone turn | Blue block above the sheet, 26 px words, face on a 50 px disc; the sheet gets a 3 px `active` outline | `phone-player` `ph-turn` |
| Reconnect strip | Hangs from the screen's top-left: hazard fill, ink edge right and bottom, ink icon cell with `WifiOff`, "Reconnecting…" plus how old the table is | `states` `st-drop` |
| Map shout | Hazard plate, 16 px display 800, 3 px ink, small ink shadow, tilted −3° | `battle-director` `sb-shout` |

### Popover

Opens beside the token, never over the token it belongs to. `surface` fill, 3 px ink frame, 4 px ink hard shadow. Name in 14 px display 800, a stamina line and meter, then action rows (26 px, quiet top rule, chevron right). 178 px wide at 1440, 148 at 1280. Context menus, the token tooltip and dropdowns use the same box. **Demo:** `battle-director`, `sb-pop`.

The roll card (`bt-roll`) is a popover too: 190 px, dice on plates with ink edges, total in 24 px display, tier in 13 px. **Demo:** `battle-turn-motion`.

### Dialog

Only for steps that end or change play for everyone. A scrim (`--art-scrim`) over the whole app. The card is 400 px, `surface`, 3 px ink, 6 px ink shadow, 20 px padding. Title 22 px display ("End this session?"), one plain sentence at 15 px. The safe action is primary and first ("Keep playing"). The danger action is the dashed session-danger button ("End session"). The card has `role="alertdialog"`. **Demo:** `battle-director-end`, `sb-confirm`.

### Input

`raised` fill, 1.5 px inset frame in `line`, min height 34 px in rails (36 in the Builder, 40 on app pages, 44 on phone), 4 × 9 px padding. Placeholder in `textSoft`. A select shows a 16 px chevron on the right. A label sits above at 13 px bold (rails) or 14 px bold (app). Text areas use the same box with 8 × 10 padding. **Demo:** `battle-director` `sb-input`; `builder` `bd-in`; `account` `ap-input`.

### Log row

13 px, text left, time right in `textSoft`, on one line, 4 px padding, no rules between rows. A new row is bold. The heading shows the entry count. **Demo:** `battle-director`, `sb-log__e`.

### Empty

An open slot and one thing to do. A row of dashed 44 px squares (the first may be a filled mode board), a 22 px title ("No campaigns yet"), one plain sentence, then the primary and secondary actions. In a list, the last slot is a dashed "Add …" row or tile. **Demo:** `states` (No campaigns, `st-empty`), `campaigns` (`cp-add`), `heroes` (`hr-face--new`).

### Loading

Loading is never drawn as empty. Draw the shape of what is coming, hatched (`repeating-linear-gradient(135deg, lineQuiet 0 3px, transparent 3px 9px)` with a quiet inset edge), and say what is loading ("Loading your campaigns…"). A session loads as the shell in outline with "Opening the table…" on the ink screen. An upload in progress is a hatched tile with its percent and meter. **Demo:** `states` (`st-ghost`, `st-sess`), `assets` (`as-art--up`).

### Error

Every failure says what happened in plain words and gives a way forward. A 56 px hazard square with an ink frame, tilted −4°, holding the icon; a 22 px title; one 15 px sentence; then a primary action and, if useful, a secondary one. No bare red text. Copy and actions per case are on the states sheet. **Demo:** `states` (`st-msg`).

| Case | Title | Actions |
|---|---|---|
| Connection lost (after 30 s) | Can't reach the table | Try again, Back to campaign |
| Bad session link | No live session at this link | Your campaigns, Use a room code |
| Bad campaign link | No campaign at this link | Your campaigns |
| Bad address, signed in | No page at `<path>` | Go to your home, Back |
| Bad invite | This invite link no longer works | Join with a room code |
| New version | A new version of Anvil is ready | Reload |

### Mini-map and view controls

Bottom-right of the map, in a panel with ink on its top and left edges: the mini-map (112 px, 84 at 1280) with the view marked by a 2 px ink box, zoom − % +, "Show all", and "N above view" when creatures are off the top. The Player's mini-map shows no fogged creatures and draws fog solid. **Demo:** `battle-director`, `sb-nav`.

---

## 5. Motion

### 5.1 Curves and times

| Name | Curve | Times | Used for |
|---|---|---|---|
| Travel | `cubic-bezier(.45, 0, .1, 1)` | 0.7 s token move and meter width; 0.6 s title card; 0.5 s wipe | Things that go somewhere |
| Settle | `cubic-bezier(.25, .8, .25, 1)` | 0.25 s badge; 0.28 s layer fade; 0.4 s roll card and lower rail; 0.45 s board raise | Things that arrive |
| Pop | `cubic-bezier(.3, 1.5, .6, 1)` | 0.3 s dice; 0.32 s hit number | Results |
| Colour | linear default | 0.2 s | Row fills, labels, ring opacity, tracker dots |

Rules:
- Data never rewinds in view.
- Only change what the event changed. The frame (rails, bar, Film Strip) never moves.
- Pressed buttons move 1 px; nothing bounces on hover.
- The ink "Anvil" wipe in the motion demos is only the loop reset. Do not ship it.

### 5.2 Turn choreography (`battle-turn-motion`)

When a turn ends and the next starts:
1. The old acting row loses its fill and gets the done badge (badge scales from 0.6, 0.25 s). The new row fills with `active` (0.2 s). The Now card crossfades to the new face (0.25 s). The corner tracker count rolls and its dot changes. The map ring moves to the new token (opacity 0.2 s).
2. When a token moves, it travels each square in 0.7 s on the travel curve. A 5 px `activePlate` trail draws behind it (dash offset, 0.7 s). Move left counts down in the Now card.
3. A power roll opens the roll card beside the token (opacity 0.12 s, rise 12 px over 0.4 s). Dice settle on their values; the total and tier pop in last.
4. When damage applies, the hit burst pops on the target (−6°, 0.32 s) with the amount on it, the creature's tracker row flashes `danger` (0.25 s), its number rolls down, and a new bold log row appears.

### 5.3 Scene change choreography (`scene-change-motion`)

When the scene changes mode:
1. The Film Strip hands its raise from the old board to the new one: colours 0.3 s, tilt and shadow 0.45 s, settle curve.
2. 260 ms later, a title card in the new mode's colour slides across the screen from the left (0.6 s, travel). Its icon and the scene name (66 px, ink text shadow) fade in only after it lands (0.22 s, delay 0.42 s), so no edge cuts the words.
3. While the card holds, the shell under it swaps. The screen content switches at once under the card. Around it, the shell crossfades in a stagger, each layer 0.28 s: rail tabs and hero sub-lines at 0 ms; the lower left rail at 240 ms (with an 8 px rise); the right rail at 380 ms; the bar at 520 ms. The dice never move.
4. The card leaves to the right (0.6 s, after a 0.16 s pause in which its words fade first). The new screen is revealed, already in its live state.

The Player follows the same sequence on their own shell. A Player's single board changes in place.

### 5.4 Reduced motion

Under `@media (prefers-reduced-motion: reduce)`:
- Every transition and animation above is 0 s. The end state applies at once.
- No title card. The shell switches straight to the new mode.
- Tokens jump to their square. No trail is drawn.
- Numbers set without rolling. The roll card appears complete.
- Announcements in the existing live region still fire.

---

## 6. Modes

The frame is the same in every mode: Film Strip on top, the party down the left rail (all seven rows with stamina, winded and dying, because stamina carries across scenes), a screen with a corner tracker at top right, a bar under the screen with the same dice on its right, the mode's tools at the top of the right rail, and the log under them. A mode changes only the parts in this table.

| Part | Battle | Story | Montage | Negotiation | Respite |
|---|---|---|---|---|---|
| Demo | `battle-director`, `battle-player` | `story-director`, `story-player` | `montage-*` | `negotiation-*` | `respite-*` |
| Live board | Battle red | Story purple | Montage orange | Negotiation blue | Respite green |
| Player's top row | Turn band on the Player's turn | Mode band: scene name; "Dev Director is reading aloud. Listen." | Goal; "Round 1 of 2. Each hero makes one test." | Goal; "<NPC> is wary. Interest n, patience n." | Goal; "Pick one activity each. Done when you say so." |
| Director's left tabs | Combat, Heroes, Creatures, Log | Story, Heroes, NPCs, Log | Montage, Heroes, NPCs, Log | Negotiation, Heroes, NPCs, Log | Respite, Heroes, NPCs, Log |
| Hero heading note | "n of 7 acted" | "7 at the table" | "n of 7 tested" | "n have argued" | "n of 7 done" |
| Hero sub-line | Turn state and conditions | Ancestry and class | "Swim 13, success" or "Not tested yet" | "Persuade, +1" or "Has not argued" | "Recover, working" or "No activity" |
| Lower left rail | Director's side: Malice, creature rows, End turn and End combat… (Director) | In this scene (NPCs; hidden ones hatched, Director only); Director notes (Only you) or the Player's Sound with own volume | Hazards (Only you) or Outcomes (Player) | Outcomes ladder (Only you) or Across the table and What you know (Player) | Projects; Open activities |
| Screen | The map | Bound script page over the scene art: holes, a mode-colour margin rule, slug in caps, read-aloud at 25 px | Goal plate at top left, two lanes (successes against limit in orange boxes with checks, failures in ink boxes with X), comic strip of challenges (Cleared, Now lit, Ahead) | NPC card on blue, tilted −1°; Interest stair and Patience hourglasses hang from the corner; motivations and pitfalls below | Camp art band with the place plate; ticket board of activities (done stamped grey, working solid, open dashed with Claim, yours lit) |
| Corner tracker | Round, Heroes, Director | Director: "Players see this page". Player: "Read by Dev Director" | Round n of 2; Tested n of 7 | The Interest and Patience meters | Done n of 9; Open n |
| Right rail, Director | Tabs Audio, Damage, Grid, Assets; Damage / Heal; Now card; Log | Tabs Audio, Read-aloud, Assets; read-aloud editor | Tabs Audio, Tests, Assets; Record a test steppers, rounds, Reset…; Outcomes | Tabs Audio, Target, Assets; Interest and Patience steppers; End negotiation… | Tabs Audio, Activities, Assets; Add activity |
| Right rail, Player | Hero card with Main, Maneuver, Move, Triggered pinned at top; characteristics; Abilities / Sheet / Log | Hero card; Log | Make a test (skill, characteristic, Roll test) | Make an argument (skill, what you say, button) | Your activity, Complete |
| Bar tools | Director: Pan, Select, Draw, Fog, Terrain, Eraser, Measure. Player: Select, Pan | Smaller text, Larger text | Smaller text, Larger text | Smaller text, Larger text | Filter: All n, Open n, Done n |

- The Player's main action always sits at the top of the right rail, never below the fold, at both sizes.
- At 1280 the Director's dice fold to "Power ▾", "Mod 0" and "None ▾" whenever the tool list has more than four items. The Player's dice never fold.
- The demos' lead themes (Battle light, Story dark, Montage light, Negotiation dark, Respite light) are only the theme each still was judged in. In the app the theme is the person's choice in both, for every mode.

---

## 7. Roles and hidden information

This is the hidden-information contract. A Phase 3 wave that breaks any row does not pass sign-off.

| Thing | Director (laptop) | Player (laptop) | Phone, Director | Phone, Player | Display |
|---|---|---|---|---|---|
| Scenes in the Film Strip | All, with names | Live scene only | Live board | Live board | Live board |
| Past scene names | Yes | Only in the log, once played | Yes | Log only | No |
| Fogged area | Hatched preview, "Hidden from players" | Solid ink, "Fog. Not explored yet" | — | — | Solid ink |
| Fogged creatures (map, tracker, mini-map, counts, labels) | Shown, with the hidden badge | Absent everywhere. Counts drop them (0/11, not 0/14) | Shown, marked hidden | Absent | Absent |
| Hidden creature names in the log | Real name | "Something" | Real name | "Something" | Not shown |
| Creature stamina numbers | `cur/max` | Never; condition words only | `cur/max` | Never | Never |
| Malice and its stepper | Yes | No | Yes | No | No |
| End session…, End combat…, Revert…, Display link, Apply damage, map tools beyond Select and Pan | Yes | No | End turn dock only | No | No |
| Director notes, Hazards, Outcomes ladder | Yes, marked Only you | No | Yes | No | No |
| Hidden NPCs in a scene | Hatched row, Hidden tag | Absent | Yes | Absent | Absent |
| Negotiation secrets not revealed | Full text, hatched edge, Hidden from players, Reveal | Ink card "A motivation (or pitfall) not found yet", no words | Full text, Reveal | One ink card "Not found yet: n motivations, n pitfalls" | Ink cards, no words |
| Revealed secrets | Full text, "Players know" | Full text | Full text | Full text | Full text |
| Read-aloud | Editor and page | Page | — | — | Page at room scale |
| Turn controls | End turn for the acting creature or hero | Take my turn when allowed; own actions | End turn dock | Take my turn, Make argument | None |
| Volume | Audio tab | Own volume slider (Story) | Audio tab | — | None |
| Any control at all | Yes | Yes | Yes | Yes | None: no pan, zoom, mini-map, tools or dice |

Rules behind the table:
- Every Player and Display view draws through the same visibility helpers (today `apps/vtt/src/lib/fog-visibility.ts`; in the demos `_shared/storyboard/data.ts`). Never filter a list by hand in a component.
- The Display draws as the Player role. It never reads Director data.
- The client already knows the viewer's role, so private views are display choices. No protocol change.
- Copy that would name a hidden thing must not be on a Player surface. Task 8 found and fixed one such leak (an open activity named a hidden NPC).
- Wave sign-off for Tasks 14 and 15 includes a DOM text check of Player, phone and Display screens for Director-only words: Malice, Hidden, Only you, Reveal, Director notes, Hazards, End session, End combat, Revert, hidden creature and NPC names, hidden secret text, outcome text, and future scene names.

---

## 8. Surfaces not drawn

Derive these from the rules above and the nearest demo. Each line says which demo to start from. Items marked *(derived)* go beyond what a gate showed; build them as stated and show them at the wave's sign-off.

### Dark theme for Gate 5 pages

Use the same markup with the dark token set. Art stays art: hazard grounds (landing, sign-in boards, room code), mode squares and face discs do not change. Drawn heads on dark panels take the keyline. Discord keeps `#4752c4`. Hatching uses `lineQuiet`, which is darker in dark. Check: every text pair at least 4.5:1, measured. Start from each Gate 5 demo with `?theme=dark`.

### 1280 × 720 for Gate 5 pages

- The app rail stays 232 px. Fixed side columns keep their width (home 380, notes tree 320, assets 220 and 320, wizard 236 and 300, hero sheet 330, account 400, sign-in card 520). The `minmax(0, 1fr)` column takes what is left.
- Card rows keep their count while each card holds its content with names wrapped. When a card would cut a name, drop one column. *(derived)*
- At 720 high, lists end on whole rows and scroll inside their panel. The page never scrolls sideways.
- The wordmark drops to 26 px, as in the session. No other text shrinks.

### Display for Montage, Negotiation and Respite *(derived)*

- Fixed dark, no controls, room scale (section 3.4), Player role data.
- Layout: the Battle Display layout. The mode's Player screen (`md-screen`) is drawn at laptop geometry and scaled ×2 on the left. The 440 px rail on the right is headed by the mode's board (`dp-board`) and lists the party with the mode's sub-line at 26 px. The rail's top line uses the corner tracker's words (Montage "Round 1 of 2"; Respite "Done 3 of 9"). There is no "Up now" plate, because these modes have no turns.
- Negotiation secrets on the Display follow the Player's rules: ink cards, no words.

### The Display's own states *(derived)*

Loading, lost connection and waiting for a scene use the states sheet's panels at room scale (×2), dark, with no buttons, because the Display has no controls. Lost connection reads "Can't reach the table" and keeps retrying by itself. Waiting reads "Waiting for the Director" over an empty strip.

### The Player's home

Use `home`'s frame and panels with the Player's nav (Home, Live, Heroes, Notes). Keep the content the Player's home has in the app today. Put a live table first if there is one, joined campaigns with "scenes you have played" as on `campaigns`, the Player's heroes with drawn heads as on `heroes`, then notes. Counts go in panel headings.

### Other Builder workspaces (Story, Negotiation, Respite)

Use `builder-montage`: the Builder shell, the structure tree on the left, the table's own mode screen in its Original state in the centre, and the workspace's existing setup fields in the right rail (`bd-sec`, `bd-field`, `bd-in`), with Director notes marked Only you. The bar keeps Smaller / Larger text.
- Story: the script page drawn from the read-aloud over the scene art.
- Negotiation: the face-off at its starting Interest and Patience, with every secret in the Director's hidden form.
- Respite: the ticket board with every activity open.

### About, Contact, and the landing below the fold

Use the public frame (`ap-pub`, the marketing bar `ap-mnav`) on the canvas ground. Page content sits in one comic page (`ap-page`) of panels. The first band may use the landing's hazard ground. Long text uses the notes body style (17 px, line 1.55, max 760 px). Contact's form uses `ap-field` and `ap-input` with one primary button. Keep the existing copy and sections. The footer keeps "Draw Steel by MCDM" and its attribution on every public page.

### Other states and pages

- **Other empty states** (heroes, assets, notes, live sessions): the Empty pattern, with that list's own create and import actions.
- **Lobby and Live page:** the room code at full size on a hazard block (`home`'s `hm-code`), in app panels.
- **Join session, Join campaign, `/join/:token`:** the sign-in layout (`auth`), with the bad-invite error from the states sheet.
- **Mobile app (`/app/mobile`):** the phone patterns (`ph-*`): one framed sheet, quiet sections, 44 px targets, the main action docked above the tab bar, and the app's own tabs.
- **Director's phone in Story, Montage and Respite:** the phone sheet with the mode's Director tools from section 6 at thumb size (48 px steppers in a framed dock).
- **Player's Battle, not their turn** *(derived)*: the top row uses the mode band ("Battle", and who is acting). The blue turn band appears only when the Player may take a turn.
- **Montage and Negotiation end states, Respite with no activities:** the same screen with its final values and a plate naming the outcome; an empty board uses the Empty pattern.
- **Damage dialog, power roll result, opportunity prompt, dice tray result, context menus:** popover rules; the roll card is the power roll display. Use a Dialog only when the step ends play for everyone.
- **Abilities in the session rail:** the hero sheet's ability card (`hs-ab`) at rail width.
- **Focus.** No gate drew focus. Keep the existing focus-visible behaviour and recolour the ring to `--color-active`.

---

## 9. Approved behaviour changes

These are the only behaviour changes Phase 3 may make. All are client-side, on messages and routes the server already handles. Anything else that changes behaviour needs a gate.

| Gate | Change |
|---|---|
| 2 | End session asks for confirmation first. |
| 2 | The Player gets a full-width "Your turn" banner with "Take my turn" in view. |
| 2 | Uploaded portraits sit inside the same inked token frame as drawn faces. |
| 3 | The Director reads Negotiation motivations and pitfalls privately before revealing them. Players see them hidden. |
| 3 | Smaller / Larger text buttons. |
| 3 | A Respite filter: All, Open, Done. |
| 3 | The Player's own volume slider in Story. |
| 4 | Phone turn actions: "Take my turn" (existing CLAIM_TURN) and "Make argument" (existing `negotiation_argument`) on the Player's phone. |
| 4 | Pause actions on a drop: during a reconnect the table stays readable and actions that need the server wait. Nothing is queued. |
| 4 | Real not-found pages for a bad campaign link and for a bad address while signed in. The client stops loading on a 404 and does not redirect. |
| 4 | After 30 seconds of failed retries, show "Can't reach the table" with Try again. 30 s is a tunable guess. |
| 5 | The Campaign Builder uses the live-session shell and goes back through "← Campaigns". |
| 5 | Home's count tiles become counts in the section headings. |
| 5 | The landing has new copy. "Draw Steel by MCDM" and the footer attribution stay. |

Display-only items carried by the approved demos. These change how existing state is shown, not what the app does:
- Battle opens on the action for the Director and on the Player's own token for a Player. The mini-map, "Show all" and "N above view" keep everything reachable.
- Fixed 13 px map labels, with the collision rule.
- The Player's Film Strip shows the live scene only.
- The "is dying!" shout on the map.
- The Director's phone shows Malice, danger-first sorting and an End turn dock on its Live tab. Reveal and the Interest and Patience steppers use the existing messages. The Player's phone shows only found secrets.
- The Display is always dark and has no controls.
- The new copy on the failure pages (section 4, Error).

---

## 10. Surface to demo map

Each real file in Phase 3 (plan Tasks 12 to 17) and the demo it must match. "Rule" means the file has no drawn demo; build it from the named section.

### Task 12: foundation

| File | Target |
|---|---|
| `packages/ui/src/globals.css` | Section 2; `tokens/look-anvil.css` |
| `packages/ui/src/components/Button.tsx` | Buttons (section 4): `battle-director`, `home`, `states` |
| `Card.tsx` | Panel and Frame: `home` |
| `Dialog.tsx` | Dialog: `battle-director-end` |
| `Tabs.tsx` | Tab: `battle-director`, `hero-sheet`, `account` |
| `Input.tsx`, `Textarea.tsx`, `Select.tsx` | Input: `battle-director`, `builder`, `account` |
| `Badge.tsx` | Chip and tag: `battle-director`, `home` |
| `Alert.tsx` | Error: `states` |
| `StaminaBar.tsx`, `Progress.tsx` | Meter: `battle-director` |
| `SceneTypeIcon.tsx`, `scene-type.ts` | Scene colours and icons (2.2), Film Strip cell |
| `Sidebar.tsx`, `layout/*`, `sidebar-context.ts` | App rail: `home` |
| `RoleToggle.tsx` | Director / Player switch: `home` (`ap-flow`) |
| `Tooltip.tsx`, `DropdownMenu.tsx` | Popover: `battle-director` |
| `Checkbox.tsx` | `notes` (`nt-checks`) |
| `Table.tsx` | `account` (`ac-files`) |
| `Collapsible.tsx`, `ScrollArea.tsx`, `Separator.tsx` | Rail rules (quiet rule) |
| `apps/vtt/src/main.tsx` (fonts) | Section 3.1 |
| `apps/vtt/src/canvas/theme.ts` (new) | Section 11 |
| `canvas/layers/*` (colours only), `canvas/systems/InteractionManager.ts` | Section 11 |
| `canvas/BattleCanvas.tsx` | Section 11; `battle-director`, `battle-player` |
| `components/stages/BattleStage.tsx` | Section 11 (grid and draw colours) |
| `components/builder/BattleWorkspace.tsx`, `BattleToolbar.tsx`, `CardGrid.tsx` | Tokens only in Task 12; `builder` in Task 16 |
| `pages/session/DirectorView.tsx` | Tokens only in Task 12; `battle-director` in Task 13 |
| `components/marketing/OAuthButtons.tsx` | Brand colours stay local (2.7): `auth` |
| `components/marketing/LandingHero.tsx` | Tokens only in Task 12; `landing` in Task 17 |
| `lib/scene-data.ts`, `lib/scene-drafts.ts` | Scene colours (2.2) |

### Task 13: session shell

| File | Target |
|---|---|
| `pages/session/DirectorView.tsx` | `battle-director`, `battle-director-1280`, `battle-director-dark`, `battle-director-end` |
| `pages/session/PlayerView.tsx` | `battle-player`, `battle-player-1280`, `battle-player-dark` |
| `pages/session/SessionPage.tsx` | `states`: Loading a session, Bad session link |
| `components/layout/AppLayout.tsx` | `home` (app frame `ap-app`) |
| `components/session/FilmStrip.tsx`, `DirectorFilmStrip.tsx` | `battle-director` (`sb-strip`), `battle-player` (`sb-strip--one`), `scene-change-motion` |
| `components/session/StatusBar.tsx`, `ParticipantStatusBar.tsx` | `battle-director`, `battle-player` (`sb-status`); `states` (reconnect chip) |
| `components/ReconnectOverlay.tsx` | `states`: A short drop, Connection lost |
| `components/LoadingSkeleton.tsx` | `states`: Loading is not empty |
| `components/RouteErrorFallback.tsx` | `states`: When something fails |
| Mode transition | `scene-change-motion`; section 5.3 and 5.4 |

### Task 14: Battle

| File | Target |
|---|---|
| `components/stages/BattleStage.tsx` | `battle-director`, `battle-player`: screen, bar, mini-map |
| `components/session/CombatTracker.tsx` | `battle-director` left rail (`sb-row`, `sb-dying`, `DirectorList`) |
| `BattleTurnTracker.tsx` | `battle-director` corner tracker (`sb-side`) |
| `TurnActionBar.tsx`, `TurnActions.tsx` | `battle-player` (`sb-acts[data-states]`); `battle-director` Now card (`sb-now`) |
| `MalicePanel.tsx` | `battle-director` (`sb-malice`) |
| `DiceTray.tsx` | `battle-director`, `battle-player` bar (`sb-roll`) |
| `PowerRollDisplay.tsx` | `battle-turn-motion` (`bt-roll`) |
| `CreatureCard.tsx`, `CreatureTracker.tsx` | `battle-director` (`sb-unit`, `sb-pop`) |
| `AbilityPanel.tsx`, `AbilityCard.tsx` | `hero-sheet` ability card (`hs-ab`) at rail width |
| `VitalsBar.tsx` | `battle-player` hero card (`sb-vital`) |
| `TokenTooltip.tsx`, `TokenContextMenu.tsx`, `TerrainContextMenu.tsx` | Popover: `battle-director` (`sb-pop`) |
| `DamageDialog.tsx`, `TargetSelector.tsx` | `battle-director` right rail Damage section (`sb-seg`, `sb-input--target`, `sb-amt`) |
| `canvas/layers/*` (drawing style) | `battle-director`, `battle-player` map; section 11 |
| Turn motion | `battle-turn-motion`; section 5.2 |

### Task 15: other modes, phone, Display

| File | Target |
|---|---|
| `components/stages/StoryStage.tsx` | `story-director`, `story-player` |
| `MontageStage.tsx` | `montage-director`, `montage-player` and their `-1280` |
| `NegotiationStage.tsx` | `negotiation-director`, `negotiation-player` and their `-1280` |
| `RespiteStage.tsx` | `respite-director`, `respite-player` |
| `SceneBackdrop.tsx` | Rule 5 and `--map-dim`; scene art in each mode demo |
| Mode rail panels in `components/session/` | Each mode's rails (section 6) |
| `pages/session/phone/PhonePlayerView.tsx` | `phone-player`, `phone-player-negotiation` |
| `pages/session/phone/PhoneDirectorView.tsx` | `phone-director`, `phone-director-negotiation` |
| `pages/session/phone/PhoneNotes.tsx`, `phone-shared.tsx`, `phone-utils.ts` | Phone patterns (`ph-*`) |
| `pages/session/PhoneSessionPage.tsx` | `states`: Phone locked, Phone short drop, Phone loading |
| `pages/session/DisplayView.tsx` | `display`, `display-story`; section 8 for the other modes and states |

### Task 16: the rest of the app

| File | Target |
|---|---|
| `pages/Home.tsx`, `components/dashboard/*` | `home` (Player's home: section 8) |
| `pages/CampaignList.tsx` | `campaigns` |
| `pages/CampaignBuilder.tsx`, `components/builder/*` | `builder`, `builder-montage` (other workspaces: section 8) |
| `pages/HeroList.tsx` | `heroes` |
| `pages/HeroSheet.tsx`, `components/creator/*` | `hero-sheet` |
| `pages/HeroWizard.tsx`, `components/wizard/*` | `wizard` |
| `pages/Assets.tsx`, `components/assets/*` | `assets` |
| `pages/Notes.tsx`, `components/notes/*` | `notes` |
| `pages/Account.tsx` | `account` |
| `pages/Lobby.tsx`, `pages/LivePage.tsx`, `components/sessions/*` | Rule: `home` live table and room code (section 8) |
| `pages/JoinSession.tsx`, `pages/JoinCampaign.tsx` | Rule: `auth` layout and `states` bad invite |
| `components/onboarding/*` | Rule: `home` (First steps), Dialog only if it blocks |
| `pages/mobile/*` | Rule: phone patterns (section 8) |

### Task 17: public site

| File | Target |
|---|---|
| `pages/Landing.tsx`, `components/marketing/*` | `landing` (below the fold: section 8) |
| `pages/Auth.tsx` | `auth` |
| `pages/About.tsx`, `pages/Contact.tsx` | Rule: section 8 |
| Motion on the landing | `battle-turn-motion` cropped to its payoff, and the Player's Negotiation inset, as in `landing`. Ship them without the stageshow kit (for example as exported video), or as stills. |

---

## 11. Canvas palette

For `apps/vtt/src/canvas/theme.ts`, resolved through `themeStore`. Pixi takes numbers, so values are given as `0x` hex. Map colours are art tokens, so almost every key is the same in both themes. That is the point: the map reads the same in both themes and on any uploaded map. Only the margin outside the map and the map dim change.

Rows marked *(derived)* are not drawn in a demo. They follow rule 2 and the nearest drawn state. Show them at Task 14 sign-off.

| Key | Light | Dark | Width, alpha, style | Source |
|---|---|---|---|---|
| `background` (margin outside the map) | `0x8fa6ab` | `0x46565b` | solid | `--color-canvas`. Fixes the navy `0x1a1a2e` margin (audit bug). |
| `mapDim` (map image brightness) | `1` | `0.86` | brightness filter, or tint `0xdbdbdb` in dark | `--map-dim` |
| `grid` | `0x15171c` | `0x15171c` | 1.25 px, alpha 0.2, dashed 2 on, 6 off | `InkMap` in `map.tsx` |
| `fogPlayer` | `0x15171c` | `0x15171c` | fill alpha 1; edge 3 px ink | Player fog, `battle-player` |
| `fogPreviewFill` (Director) | `0x2a2e38` | `0x2a2e38` | fill alpha 0.42 | `--art-fog-hatch` |
| `fogPreviewHatch` (Director) | `0x15171c` | `0x15171c` | 3 px stripes, 12 px apart, at 45°; edge 3 px ink | `battle-director` |
| `fogDraft` (fog being drawn) | `0x2a2e38` | `0x2a2e38` | as the Director preview | *(derived)* |
| `turn` (acting token ring) | `0x2348c9` | `0x2348c9` | 3.5 px ring, then ink `0x15171c` out to 6 px, on a white `0xffffff` disc | `--art-active-plate`, `sb-tok__ring` |
| `moveTrail` | `0x2348c9` | `0x2348c9` | 5 px, round caps | `battle-turn-motion` |
| `tokenOutline` (all sides) | `0x15171c` | `0x15171c` | 4 units in a 64-unit face | `faces.tsx`, `portraits.tsx` |
| `tokenKeyline` (uploads) | `0xffffff` | `0xffffff` | white ring inside the outline | `portraits.tsx` |
| `tokenShadow` | `0x15171c` | `0x15171c` | alpha 0.9, offset 1.5, 2 | `--art-token-shadow` |
| Side by shape | — | — | Hero round, creature eight-sided. No side colours: the blue, red and purple rings go | `portraits.tsx` |
| `npc` shape | — | — | round, like a hero, with no hero name plate *(derived)* | — |
| `selection` (selected token) | `0xffffff` | `0xffffff` | 3 px ring, then ink 1.5 px outside | *(derived)* from the label plate |
| `selectionRect` (marquee) | `0x2348c9` | `0x2348c9` | fill alpha 0.12; edge 1.5 px alpha 1 | *(derived)* |
| `targetRange` (area in range) | `0x2348c9` | `0x2348c9` | fill alpha 0.13; edge 1 px alpha 0.5 | *(derived)*: range belongs to the acting token |
| `targetValid` | `0xffd21f` | `0xffd21f` | 2.5 px ring, then ink 1.5 px outside | *(derived)* from the hit burst |
| `targetInvalid`, `targetCandidate` | `0x15171c` | `0x15171c` | 1.5 px, alpha 0.55, dashed | *(derived)* |
| `warning` (path over budget, opportunity attack) | `0xffd21f` | `0xffd21f` | 2 px, with an ink edge | *(derived)* from `--art-hazard` |
| `ruler` | `0x15171c` | `0x15171c` | 2 px; label as a map label | *(derived)* |
| `labelPlate` / `labelText` | `0xffffff` / `0x15171c` | same | 22 px high, 1.5 px ink keyline, 13 px bold | `sb-label` |
| `heroLabelPlate` / text | `0x15171c` / `0xffffff` | same | display font | `sb-label[data-hero]` |
| `activeLabelPlate` / text | `0x2348c9` / `0xffffff` | same | | `sb-label[data-active]` |
| `dyingBurst` | `0xffd21f` | `0xffd21f` | 22-point star, ink edge 4 | `Burst` in `map.tsx` |
| `doneBadge` | `0x15171c` disc, `0xffffff` check | same | plate ring 2 px | `sb-badge--done` |
| `conditionBadge` | `0xffffff` disc, `0x15171c` icon | same | ink ring 2 px | `sb-badge` |
| `hiddenBadge` (Director only) | `0x15171c` disc, `0xffffff` eye | same | plate ring 2 px | `sb-badge--hidden` |
| `squadNumber` | `0xffffff` plate, `0x15171c` text | same | ink edge 2 px, 13 px | `sb-foe b` |
| `miniMapFoe` | `0xd6372c` | `0xd6372c` | squares | `--art-mini-foe` |
| `miniMapHero` | `0x15171c` | `0x15171c` | dots | `MiniMap` |
| `drawDefault` (draw tool's first colour) | `0xcf2a20` | `0xcf2a20` | | Battle red, replacing `#ef4444` |

Notes for the layers:
- Winded has no map marker in the approved demo; the tracker carries it. The stamina arc on tokens is not in the demo either. In Task 12, recolour them only: winded ring to `0xffd21f`, stamina arc to `0x15171c`. Task 14 removes both to match `battle-director`.
- The dying ring becomes the burst and the tilted head in Task 14. In Task 12 recolour it to `0xffd21f` with an ink edge.
- Terrain zone colours are scene data the Director picks. Keep them in Task 12.
- Fog logic does not change. Only how fog looks (plan Global Constraints).

---

## 12. Conflicts resolved

Where demos disagree, the later gate wins.

| # | Conflict | Resolution |
|---|---|---|
| 1 | Gate 1 `direction-c` put hard shadows on rails, dividers on inactive tabs, a 10-box meter, rules between log rows and action-button shadows. | Gate 2 dropped all of these (the quiet rule). Follow Gate 2. `direction-c` is a record only. |
| 2 | `direction-c` heads drew about 5% larger before the viewBox grew in Task 7. | Follow `faces.tsx` as it is now. |
| 3 | `display.css` header comment says "the turn at 72". Its CSS and the Gate 4 report use 64 px. | 64 px (`--display-turn`). |
| 4 | `modes.css` says mode colour never marks an action. Gate 5 `builder` fills "Draw Steel!" with Battle red. | Gate 5 wins for that one button, because it starts Battle itself. Every other action stays `active` blue. |
| 5 | Task 10 round 0 put `scene-change-motion` in the landing's inset window and dropped the MCDM credit. | The fix round (approved commit `4342a2e`) wins: the inset is the Player's Negotiation board drawn 1:1, the main window shows `battle-turn-motion` 1:1 cropped to its payoff, and the credit stays. |
| 6 | Gate 2's Director at 1280 folded dice whenever it had tools; Gate 3 added a `fold` prop. | Fold the Director's dice at 1280 when the bar has more than four tools; never fold the Player's. Same result in both gates. |
| 7 | Gate 3 lead themes differ by mode (Story and Negotiation dark), while Gate 2 led light. | Lead themes were only for judging stills. The app follows the person's theme in every mode. The Display alone is fixed dark (Gate 4). |
| 8 | `anvil-tokens.json` had `fogHatch #2c3038`, unused; the map draws `#2a2e38` at 0.42. | The token now matches the map (Task 11). |
| 9 | `.sb-board[data-on] i` and other demo CSS write `#fff` literally. | Build with `--art-plate` or `--art-on-hero-plate`. Same value. |
| 10 | Gate 4 phone moved Malice to the Director's side heading; the laptop puts Malice on the Director heading of the left rail. | Same rule in both: Malice sits on the Director's side heading. |

---

## 13. Known gaps carried into Phase 3

From the Task 7 to 10 reports. These are deferred minors, not design questions. Fix them where real data allows; do not redesign.

- At 1280 the "Pip is dying!" shout can clip 2 px at the map's bottom edge, and some squad labels drop under the collision rule. The token numbers stay.
- Player fog at 1280 is about 1.3 rows high, because the view favours the Player's token and party.
- Large tokens can be cut by the map's top edge (`battle-player`, Display).
- Story and Montage Player left rails have empty space under their last section at 1440. Real data may fill it; otherwise leave it empty rather than stretch rows.
- Motion coverage in film checks was "inconclusive" because a full app screen is heavy to record. Check motion live at speed during Tasks 13 and 14.
- Respite Director working tickets show Complete rather than the word "Working". They still read by solid frame.
