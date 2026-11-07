# Anvil v2 Demo-Led Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task (chosen by Dan on 2026-11-07). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every surface of Anvil v2 by first building approved stageshow demos from the live app, then implementing those demos in the real product with no change to game behaviour.

**Architecture:** Claude drives the running app locally to audit it, builds demos in a standalone `design/redesign/` project, and asks Dan for design decisions at fixed gates. Approved looks become one token table that feeds both the demos and `packages/ui/src/globals.css`, so the demos and the app cannot drift. Implementation then runs surface by surface on one branch, checked against the approved demos with dense real data.

**Tech Stack:** React 19, Tailwind 4, shadcn/Radix (`@anvil/ui`), PixiJS 8, Vite 7, pnpm + turbo. Demos: stageshow kit (React 18, kept outside the pnpm workspace).

**Spec:** The "Brief" section below, plus `docs/spec/ANVIL_V2_FRONTEND_DESIGN.md` and `docs/spec/ANVIL_V2_WEB_FLOWS.md`.

---

## Kickoff prompt

Open a new Claude Code session in `~/Projects/Anvil v2`, make sure Claude in Chrome is connected, and paste:

```text
Execute docs/plans/2026-11-07-demo-led-redesign.md from the first unchecked task,
using superpowers:subagent-driven-development.
If design/redesign/PROGRESS.md exists, read it first and resume from there.

My role is only to approve and guide design choices at the gates the plan defines.
Make every technical decision yourself. Follow the plan's "Who decides what" table,
and stop for me only at a design gate or at something listed under "Always stop".

Use Claude in Chrome to run the local app as Director, and the built-in browser as
Player. Stay on localhost with dev login. Keep PROGRESS.md and DECISIONS.md current
so a new session can pick up where this one stopped.
```

---

## Brief

Dan wants the whole experience improved, not a reskin of one page. Stageshow is used as the design model: it produces polished, believable demos that are quick to judge and cheap to change. Once a demo is approved, it becomes the target for the real screen.

The five scene modes (Battle, Story, Montage, Negotiation, Respite) are the core of the product, and each transforms the whole UI. They are designed first. Everything else follows the language they set.

### Who decides what

| Dan decides (at gates) | Claude decides (no asking) |
|---|---|
| Visual direction, mood, colour, type | Tools, file layout, code structure, order of work |
| Which demo is approved, what to change in it | How to build, test and fix what was approved |
| Trade-offs that change how a screen feels or what is shown first | Small visual calls that follow an approved rule |
| Sign-off on each finished wave | Audit method, fixture data, bug fixes in the redesign |

### Always stop and ask

These are not design choices, but they stay with Dan:

- Merging to `main` or `staging`, or force-pushing.
- Any deploy, such as `pnpm deploy:server`. The build check `pnpm deploy:check` is fine.
- `pnpm db:migrate:remote` or any remote data change.
- Opening any non-localhost Anvil site, or using any real account in the browser.
- A design that cannot be built without changing game rules, server code or the WebSocket protocol.
- Touching Dan's uncommitted work on `main` (see Task 1).

### Gate format

Every gate follows the same shape, so Dan can decide quickly:

1. Add the options to the gallery (`http://localhost:5199/?gate=<n>`) and open it in the built-in browser.
2. Say in two or three plain sentences what changed and why, tied to audit findings.
3. Ask with AskUserQuestion: at most three options, recommendation first, each with a one-line trade-off. Dan can always answer in their own words.
4. Record the answer in `design/redesign/DECISIONS.md` with the date and the demo id.
5. After three rounds on the same item, recommend a final version and ask for yes or no.

Never show a demo that has not passed Claude's own review. Dan should be judging direction, not catching bugs.

### Stageshow in this project

Stageshow is written for simplified marketing art, so two of its rules change here:

- **Fidelity stills** are the design targets. They are 1440 × 900, use real labels and real Draw Steel data, and ignore the 3–7 real strings budget. They must show actual density.
- **Motion demos** follow stageshow's rules in full (10–16 seconds, three to five beats, a payoff). They show how a moment feels, such as a turn starting or a scene changing.

Every other stageshow craft rule still applies. Load the skill before any demo work.

---

## Global Constraints

- Visual and layout changes only. No edits to `packages/data`, `apps/server`, `packages/types`, XState or Zustand behaviour, or the WebSocket protocol.
- Keep existing `aria-*` labels, keyboard shortcuts (`useKeyboardShortcuts`) and focus behaviour unless a gate approves a change.
- Fog of war stays client-side in `apps/vtt/src/lib/fog-visibility.ts`. Change how fog looks, never what it hides.
- Both themes (`data-theme="dark"` and `"light"`) stay supported through `SessionThemeToggle`.
- Scene mode colours remain tokens (`--color-scene-*`). Their values can change at a gate.
- Code standards from `CLAUDE.md`: strict TypeScript, no `any`, `import type`, function components, new components under 200 lines. Do not split existing large files such as `BattleWorkspace.tsx` (1,990 lines) unless the task needs it.
- `design/` stays out of the pnpm workspace and out of the production build. Do not add stageshow to any `apps/*` or `packages/*` dependency.
- The repo `dpaq7/anvil-vtt` is public. Stage files by explicit path only, never `git add .` or `git add -A`. `docs/MCDM Official Campaigns/` must never be committed by this work.
- Do not commit MCDM maps, art or rules text inside `design/`. Keep captures in the gitignored `design/redesign/captures/`, and use placeholder art in committed demos.
- Keep stageshow's `LICENSE` beside the copied kit. Do not copy its `assets/app-icons.ts`.
- No invented logos. Use Anvil's existing marks from `apps/vtt/public/`, or leave a plain wordmark until a gate decides.
- Commit messages end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

**Quality gate** (run at the end of every implementation task, all must pass):

```bash
pnpm typecheck && pnpm lint && pnpm test:run && pnpm deploy:check
```

```bash
pnpm smoke:live
```

`apps/vtt` has no tests, so the smoke run and the browser journey in each task are the behaviour guard.

## Review Focus

Likely failures that a clean demo will hide. Each is checked in the task named.

1. **Full tables:** six heroes and ten monsters with conditions and long names should stay readable and usable without layout breaks (Tasks 3, 8, 14).
2. **Hidden information:** a Player must see nothing Director-only after the redesign, including fogged tokens, hidden stat blocks and Malice controls (Tasks 14, 15).
3. **State shown only by colour:** mode, winded, dying and turn state must also read through icon, label or shape, for colour-blind players (Tasks 8, 14).
4. **Small laptops and projectors:** the Director view must work at 1280 × 720, and Display view must be legible from across a table (Tasks 7, 9, 15).
5. **Non-happy states:** reconnect overlay, loading skeletons, empty campaign, empty film strip and error fallback must all get the new design (Tasks 9, 13).

---

## File Structure

```text
design/redesign/                 standalone demo project (npm, not pnpm workspace)
  package.json, vite.config.ts   Vite on port 5199, React 18
  kit/                           copied stageshow kit + its LICENSE
  tokens/anvil-tokens.json       the one token table
  tokens/look-anvil.css          generated map to --ss-* tokens
  demos/<id>/                    one folder per demo
  gallery/                       ?demo=<id> and ?gate=<n> pages
  fixtures/                      dense Draw Steel sample data, no MCDM art
  audit/AUDIT.md                 audit findings
  captures/                      screenshots (gitignored)
  DECISIONS.md                   every gate outcome
  PROGRESS.md                    resume notes
  DESIGN.md                      final design language
packages/ui/src/globals.css      real tokens
packages/ui/src/components/*     restyled base components
apps/vtt/src/canvas/theme.ts     new: Pixi colours from one place
apps/vtt/src/**                  surfaces, by task below
```

---

## Phase 1: Set up and see the real app

### Task 1: Preflight and branch

**Files:** Create `design/redesign/PROGRESS.md`, `design/redesign/DECISIONS.md`. Modify `.gitignore`, `.claude/launch.json`.

- [ ] **Step 1: Resolve the uncommitted work.** `main` has uncommitted campaign-package and Forge Steel import work touching `CampaignList.tsx`, `HeroList.tsx`, `HeroWizard.tsx` and `MobileCampaigns.tsx`, all of which this redesign restyles. Ask Dan once: land it first (recommended), or redesign without it and merge later. Do not commit, stash or move it without an answer from Dan.
- [ ] **Step 2: Create the branch.** Use superpowers:using-git-worktrees to make branch `redesign/demo-led`.
- [ ] **Step 3: Install and baseline.** Run `pnpm install`, then the quality gate. Expected: all pass. Record any failures that exist before this work in `PROGRESS.md`, so they are not blamed on the redesign.
- [ ] **Step 4: Prepare stageshow.** Run `npm install --include=optional` in `~/.claude/skills/stageshow`. Check with `node ~/.claude/skills/stageshow/scripts/film.mjs --help`. Expected: usage text.
- [ ] **Step 5: Add ignores and launch configs.** Add `design/redesign/captures/` and `design/redesign/node_modules/` to `.gitignore`. Add two `.claude/launch.json` entries: `vtt-smoke` (runtimeExecutable `env`, args `ANVIL_API_PROXY=http://localhost:8797 pnpm --filter @anvil/vtt dev`, port 5173) and `redesign-demos` (`npm --prefix design/redesign run dev`, port 5199).
- [ ] **Step 6: Commit** those files by path.

### Task 2: Live session harness

**Files:** Create `design/redesign/HARNESS.md`.

**Produces:** a live local session with Director and Player connected at once, and the exact steps to rebuild it.

- [ ] **Step 1: Start the seeded server** in the background. It runs local migrations and creates a live session with story, montage, negotiation, respite and battle scenes:

```bash
node scripts/smoke-live-session.mjs --start-server --hold-open --hold-ms 14400000
```

Expected log line: `hold live smoke: ... session=<id>`. Save the id. The session lasts four hours, and restarting creates a new id.

- [ ] **Step 2: Start the app** with preview_start `vtt-smoke`.
- [ ] **Step 3: Sign in each role in a separate browser.** A browser holds one login, so roles need separate cookie jars:
  - Claude in Chrome (Director): `http://localhost:5173/api/auth/dev-login?role=director&next=/app/session/<id>`
  - Built-in browser (Player): `http://localhost:5173/api/auth/dev-login?role=player&next=/app/session/<id>`

  Expected: Director view in Chrome, Player view in the pane, and both show the same scene.
- [ ] **Step 4: Prove live sync.** Change scene on the Film Strip in Chrome and confirm the Player pane follows. Repeat through all five modes.
- [ ] **Step 5: Fallback if a step fails.** Debug with superpowers:systematic-debugging. If the held session is unusable, run plain `pnpm --filter @anvil/server dev` with default proxy, sign in as Director, and create a campaign from the bundled demo scene pack. Dev login is rate limited, so do not loop it.
- [ ] **Step 6: Write `HARNESS.md`** with the working steps and commit.

### Task 3: Dense fixture

**Files:** Modify `design/redesign/HARNESS.md`. Create `design/redesign/fixtures/battle-dense.json`.

The smoke session has one hero and one villain, which is too thin to design against.

- [ ] **Step 1:** In the Director view, using the app's own UI, build up the battle to six heroes, ten monsters, a long-named creature, at least four active conditions, one winded and one dying hero, and fog on part of the map.
- [ ] **Step 2:** Save the same data, without art, to `fixtures/battle-dense.json` for the demos. Use bundled demo-pack or invented names. Do not copy rules text.
- [ ] **Step 3:** Record in `HARNESS.md` how to rebuild this state, then commit.

### Task 4: Full audit

**Files:** Create `design/redesign/audit/AUDIT.md`. Screenshots go in `captures/audit/`.

- [ ] **Step 1: Capture every surface** at 1440 × 900 and 1280 × 720, in dark and light:

| Group | Surfaces |
|---|---|
| Session, desktop | Director and Player for Battle, Story, Montage, Negotiation, Respite; Lobby; `/app/live` |
| Session, other | `/app/session/:id/phone` as both roles (375 × 812); `/app/session/:id/display` |
| App | `/app`, `/app/campaigns`, `/app/campaigns/:id` with all five workspaces, `/app/heroes`, `/app/heroes/new`, `/app/heroes/:id`, `/app/assets`, `/app/notes`, `/app/account`, `/app/join` |
| Mobile app | every `/app/mobile/*` route (375 × 812) |
| Public | `/`, `/about`, `/contact`, `/auth`, `/join/:token` |
| States | reconnect overlay, loading skeletons, empty lists, route error |

- [ ] **Step 2: Critique.** Run `design:design-critique` and `design:accessibility-review` over the captures. Rank findings by harm to play at a real table, not by polish.
- [ ] **Step 3: Audit the system.** Record that `globals.css` carries overlapping colour languages (remapped zinc, `creator`, parchment/ember), that zinc classes appear 2,888 times across 176 files, and which 11 files hard-code hex colours. Read the existing `docs/spec/ANVIL_V2_FRONTEND_DESIGN.md` and note where the app has moved away from it.
- [ ] **Step 4:** Write `AUDIT.md`: the top ten problems, what already works and must be kept, and a full surface list. Commit it.

---

## Phase 2: Demos and design gates

### Task 5: Demo project

**Files:** Create everything under `design/redesign/` per File Structure, except audit and fixtures.

- [ ] **Step 1:** Scaffold a Vite + React 18 project on port 5199. Copy stageshow's `kit/` and `LICENSE`.
- [ ] **Step 2:** Add gallery routes `?demo=<id>` and `?gate=<n>`.
- [ ] **Step 3:** Create `tokens/anvil-tokens.json` from the current `globals.css`, and a script that writes `tokens/look-anvil.css` mapping it to `--ss-*` tokens, following `references/looks.md`. Fonts stay Fraunces and Inter until Gate 1 says otherwise.
- [ ] **Step 4:** Confirm with a one-screen test demo: `node ~/.claude/skills/stageshow/scripts/film.mjs "http://localhost:5199/?demo=test" --still --out design/redesign/captures/test.png`. Expected: a PNG with no console errors. Delete the test demo and commit.

### Task 6: Gate 1, visual direction

**Files:** Create `design/redesign/demos/direction-{a,b,c}/`, `tokens/direction-{a,b,c}.json`.

- [ ] **Step 1:** Use superpowers:brainstorming's design thinking and `frontend-design` to define three clearly different directions. All three must grow from the "film director" idea and answer the top audit findings. Avoid three shades of the same dark UI.
- [ ] **Step 2:** Build each direction as a Battle Director fidelity still, using `fixtures/battle-dense.json`.
- [ ] **Step 3:** Self-review each against stageshow's `references/verify.md` and the audit.
- [ ] **Step 4: Gate 1.** Dan picks a direction, or a mix. Commit the winner's tokens to `anvil-tokens.json`.

### Task 7: Gate 2, Battle

**Files:** Create `demos/battle-director/`, `demos/battle-player/`, `demos/battle-turn-motion/`.

- [ ] **Step 1:** Build Director and Player fidelity stills, plus the same Director still at 1280 × 720.
- [ ] **Step 2:** Build a motion demo of a turn: the tracker advances, a token acts, a roll resolves, stamina changes.
- [ ] **Step 3:** Run `film.mjs "<url>" --gate` on the motion demo. Expected: ends with `rehearsal passed`.
- [ ] **Step 4: Gate 2.** Dan approves Battle. This also sets the shared shell: rails, Film Strip, status bar and panels.

### Task 8: Gate 3, the other four modes

**Files:** Create `demos/{story,montage,negotiation,respite}-{director,player}/`, `demos/scene-change-motion/`.

- [ ] **Step 1:** Build Director and Player fidelity stills for each mode, on the shell from Gate 2, with real state: `readAloudText`, `successes`/`failures`, `interest`/`patience`, `activities`.
- [ ] **Step 2:** Build one motion demo of the whole UI changing between two modes. Mode changes are the product's signature moment.
- [ ] **Step 3:** Confirm each mode reads by shape or label as well as colour (Review Focus 3), and that a full table still fits (Review Focus 1).
- [ ] **Step 4: Gate 3.** Dan approves all four together, or lists changes.

### Task 9: Gate 4, phone and Display

**Files:** Create `demos/phone-{director,player}/`, `demos/display/`, `demos/states/`.

- [ ] **Step 1:** Build phone stills for Battle plus one other mode, for each role, at 375 × 812.
- [ ] **Step 2:** Build Display view for Battle and Story at 1920 × 1080. Check legibility with the capture scaled to 25%.
- [ ] **Step 3:** Build the states sheet: reconnect, loading, empty, error.
- [ ] **Step 4: Gate 4.**

### Task 10: Gate 5, the rest of the product

**Files:** Create `demos/{home,campaigns,builder,heroes,hero-sheet,wizard,assets,notes,account,landing,auth}/`.

- [ ] **Step 1:** Build one fidelity still each. For Campaign Builder, show the Battle workspace and one other. Build the landing page with stageshow's hero treatment, using the approved motion demos.
- [ ] **Step 2: Gate 5.** Dan approves as a set.

### Task 11: Lock the design language

**Files:** Create `design/redesign/DESIGN.md`. Modify `docs/spec/ANVIL_V2_FRONTEND_DESIGN.md`, `tokens/anvil-tokens.json`.

- [ ] **Step 1:** Write `DESIGN.md`: tokens, type scale, spacing, component rules, motion rules, mode rules, and which demo is the target for each surface.
- [ ] **Step 2:** Update the frontend design spec to match, so future work follows the new system. Commit.

From here, Dan only signs off finished waves. New design questions go back to Dan only if an approved demo cannot work with real data.

---

## Phase 3: Implementation

Each wave task ends the same way, which is not repeated below:

1. Run the quality gate.
2. Replay the wave's journey in the two browsers, with the dense fixture.
3. Capture the real screen at the demo's size, next to its demo, into `captures/wave-<n>/`. Fix any difference that was not forced by real data.
4. Check dark and light, and 1280 × 720.
5. Commit by path and update `PROGRESS.md`.
6. **Sign-off gate:** show Dan the side-by-side pairs. Fix, then move on.

Run `superpowers:requesting-code-review` before each sign-off.

### Task 12: Wave 1, foundation

**Files:** Modify `packages/ui/src/globals.css`, `packages/ui/src/components/*`. Create `apps/vtt/src/canvas/theme.ts`. Modify the Pixi layers and the hex-colour files found in Task 4.

**Produces:** `CANVAS_THEME: { grid: number; fog: number; selection: number; targeting: number; turn: number }`, plus any further keys the approved Battle demo needs, each with a light and dark value resolved through `themeStore`.

- [ ] **Step 1:** Change token values first. Because zinc is already remapped in `@theme`, most of the 2,888 class uses will update with no file edits. Do not mass-rewrite classes.
- [ ] **Step 2:** Fold `creator` and parchment/ember into the single token set. Keep old names as aliases until no file uses them, then remove them.
- [ ] **Step 3:** Restyle `@anvil/ui` components to the approved rules.
- [ ] **Step 4:** Move hard-coded canvas colours into `theme.ts`. Colours only: no change to fog, targeting or interaction logic.
- [ ] **Step 5:** Journey: open each app section and a live session, and confirm nothing is unreadable in either theme.

### Task 13: Wave 2, session shell

**Files:** Modify `pages/session/DirectorView.tsx`, `PlayerView.tsx`, `SessionPage.tsx`, `components/layout/AppLayout.tsx`, `components/session/{FilmStrip,DirectorFilmStrip,StatusBar,ParticipantStatusBar}.tsx`, `ReconnectOverlay.tsx`, `LoadingSkeleton.tsx`, `RouteErrorFallback.tsx`.

- [ ] **Step 1:** Implement the shell from Gate 2 and the states sheet from Gate 4.
- [ ] **Step 2:** Implement the mode transition from `scene-change-motion`, with `prefers-reduced-motion` respected.
- [ ] **Step 3:** Journey: Director changes through all five modes while the Player follows. Then stop the server briefly and confirm the reconnect overlay and recovery.

### Task 14: Wave 3, Battle

**Files:** Modify `components/stages/BattleStage.tsx`, `components/session/{CombatTracker,BattleTurnTracker,TurnActionBar,TurnActions,MalicePanel,DiceTray,PowerRollDisplay,CreatureCard,CreatureTracker,AbilityPanel,AbilityCard,VitalsBar,TokenTooltip,TokenContextMenu,TerrainContextMenu,DamageDialog,TargetSelector}.tsx`, `canvas/layers/*` (drawing style only).

- [ ] **Step 1:** Implement against `battle-director`, `battle-player` and `battle-turn-motion`.
- [ ] **Step 2:** Journey with the dense fixture: run a full round, apply damage, add a condition, make a power roll, use a Malice action, move tokens through fog.
- [ ] **Step 3: Colour check.** Confirm winded, dying and turn state read by icon, label or shape in a greyscale capture.
- [ ] **Step 4: Hidden-information check.** With Director and Player side by side, confirm the Player sees no fogged tokens, hidden stat blocks or Malice controls. Any leak blocks sign-off.

### Task 15: Wave 4, other modes, phone, Display

**Files:** Modify `components/stages/{StoryStage,MontageStage,NegotiationStage,RespiteStage,SceneBackdrop}.tsx`, their rail panels in `components/session/`, `pages/session/phone/*`, `PhoneSessionPage.tsx`, `DisplayView.tsx`.

- [ ] **Step 1:** Implement each mode against its demo.
- [ ] **Step 2:** Implement phone and Display against Gate 4.
- [ ] **Step 3:** Journey: play one action in each mode as both roles, on desktop and phone sizes. Confirm Display at 1920 × 1080 and repeat the hidden-information check on phone and Display.

### Task 16: Wave 5, the rest of the app

**Files:** Modify `pages/{Home,CampaignList,CampaignBuilder,HeroList,HeroSheet,HeroWizard,Assets,Notes,Account,Lobby,LivePage,JoinSession,JoinCampaign}.tsx`, `components/{builder,dashboard,creator,wizard,assets,notes,onboarding,sessions}/*`, `pages/mobile/*`.

- [ ] **Step 1:** Implement against Gate 5. Do the Campaign Builder last, because `BattleWorkspace.tsx` is the riskiest file.
- [ ] **Step 2:** Journey: create a campaign, add one scene of each type, go live, create a hero through the wizard, upload an asset, write a note, repeat the key steps on `/app/mobile`.

### Task 17: Wave 6, public site

**Files:** Modify `pages/{Landing,About,Contact,Auth}.tsx`, `components/marketing/*`. Add approved motion demos to the landing page only if they ship without the stageshow kit in the app bundle, for example as exported video. Otherwise use stills.

- [ ] **Step 1:** Implement against Gate 5.
- [ ] **Step 2:** Journey: signed-out visit to every public page at desktop and phone sizes, including `/auth` and `/join/:token`.

### Task 18: Final pass and handoff

**Files:** Modify `design/redesign/PROGRESS.md`.

- [ ] **Step 1:** Repeat the full Task 4 capture, and run `design:accessibility-review` again. Fix all serious findings.
- [ ] **Step 2:** Search for leftovers: unused aliases, hard-coded hex colours outside `canvas/theme.ts`, and any import of `design/` from `apps/` or `packages/`. Expected: none.
- [ ] **Step 3:** Run the quality gate, then superpowers:finishing-a-development-branch. Open a PR into `main` with before and after images, using no MCDM art. Do not merge it: merging and deploying are Dan's call.
