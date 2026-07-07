# Phone Character Creator — Design

**Date:** 2026-07-05
**Status:** Approved (brainstormed with Dan)
**Scope:** `apps/vtt` hero wizard, phone viewports only. Desktop rendering must not change.

## Goal

The hero wizard is shared verbatim between desktop (`/app/heroes/new`) and the mobile
shell (`/app/mobile/heroes/new`). On a phone it is readable but dense: the breadcrumb
wraps all 16 step labels into several cluttered rows, and dense steps (Skills, Perks,
Abilities, Characteristics, Culture) stack many choice-grids with rules preamble into
one long scroll.

Redesign the phone experience around one principle: **the user should never have to
figure out the interface** — one decision per screen, minimal words, primary action
always in thumb reach.

## Decisions (agreed)

1. **Scope: all 16 steps** get the phone treatment, not just the worst offenders.
2. **Header:** compact `[←] Step 6 of 16 — Skills` line + slim progress bar. Tapping
   it opens a bottom sheet listing all steps with complete/incomplete status for
   jump navigation (replaces the breadcrumb wrap on phone).
3. **Density model: sub-pagination.** Dense steps split into one decision per screen
   ("Skill source 2 of 4"), never a stacked scroll of grids.
4. **Advance flow: explicit Continue.** Tapping a choice selects it; a sticky Continue
   button advances. No auto-advance — mis-taps must never navigate.
5. **Verbal simplification:** each screen asks one plain-English question ("Pick a
   skill from your upbringing"); mechanical provenance ("Career · choice 1 of 2")
   is a small overline. Rules preamble paragraphs are dropped on phone.
6. **Progressive disclosure:** choices render as full-width single-column rows
   (name + one-line summary, ≥44px targets). Full rules text lives behind an info
   affordance that peeks a bottom sheet with a Select action.
7. **Optional steps** (Complication, Titles) get a first-class "Skip for now" button.
8. **Phone detection:** same rule as the rest of the mobile program —
   `(max-width: 767px) and (pointer: coarse)` (`apps/vtt/src/lib/device.ts`).

## Architecture

All game logic, step order, validation, and persistence are untouched
(`wizardStore`, `WizardLogic`, IndexedDB drafts, save payload). Changes are
rendering-only, gated by phone detection.

### New primitives — `apps/vtt/src/components/creator/phone/`

| Component | Responsibility |
|---|---|
| `PhoneStepHeader` | Back arrow, "Step X of N — Label", slim progress bar; tap opens `PhoneStepsSheet` |
| `PhoneStepsSheet` | Bottom sheet: all steps + status, tap to jump (`goToStep`) |
| `DecisionScreen` | One decision: overline, question, helper (optional), single-column children, optional "Skip for now" button — no footer of its own |
| `ChoiceRow` | Full-width row: name, one-line summary, selected state, info button |
| `DetailPeekSheet` | Bottom sheet with full rules text + Select action |
| `useIsPhoneViewport()` | Reactive hook wrapping the `device.ts` media query (matchMedia listener) |

### Sub-step wiring

- `wizardStore` gains `subStepIndex`, reset whenever `currentStepId` changes.
  Not persisted to IndexedDB — re-entering a step starts at its first screen.
- Each step component computes its decision screens from character state at render
  time (counts are dynamic, e.g. one per skill source).
- On phone, the step renders its screens through a `PhoneDecisionFlow` wrapper that
  registers the screen count with the store and renders the active screen. The
  single footer lives in `HeroCreatorLayout` on both form factors: its
  Continue/Back call the sub-step-aware `goNext`/`goBack`, and on phone it shows
  sub-progress dots when a step has multiple screens. Desktop footer unchanged.
- `HeroCreatorLayout` branches its chrome only: `PhoneStepHeader` vs existing
  `BreadcrumbNav`; `CharacterSidebar` already hides below `md`.

### Per-step screen mapping (phone)

| Step | Screens |
|---|---|
| Level | 1 |
| Ancestry | 2 — ancestry pick; traits (when the ancestry has choices) |
| Culture | 3–4 — preset/bespoke, then environment / organization / upbringing as applicable |
| Career | 2 — career pick; inciting incident |
| Class | 1 |
| Subclass | 1 (2 where the class picks twice, e.g. Conduit domains) |
| Complication | 1 (+ Skip) |
| Characteristics | 1 — single-column array assignment |
| Kit | 1–2 — primary; secondary when entitled |
| Skills | 1 per skill source (dynamic) |
| Languages | 1 |
| Perks | 1 per perk slot (dynamic) |
| Titles | 1 (+ Skip) |
| Abilities | 1 per ability slot (dynamic) |
| Personal | 2 — identity (name/pronouns/portrait); backstory/appearance |
| Review | 1 — summary + Create Hero |
| Level-up (L2+) | 1 per level initially, phone-formatted |

`SplitViewSelector`'s phone mode changes from "list stacked above detail panel" to
"list + detail peek sheet"; its `md:` two-pane desktop layout is untouched.

## Verification

- `pnpm test`, `pnpm lint`, `pnpm build` — expected green with no test changes
  (logic untouched).
- Manual walkthrough at 390×844 (dev login): complete hero creation end-to-end on
  the phone path, including a dense build (Conduit — multiple skill sources,
  ability slots, double subclass). Zero console errors.
- Desktop regression at 1280px: wizard renders identically to today.
