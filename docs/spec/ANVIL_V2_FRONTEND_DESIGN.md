# Anvil V2 — Frontend Design System

> The Storyboard design language, approved through five design gates in November 2026.

This spec says how frontend work in Anvil is designed and built. The visual detail lives in one place:

- **`design/redesign/DESIGN.md`** is the design language: tokens, type, components, motion, modes, roles, rules for surfaces not drawn, and the canvas palette.
- **`design/redesign/tokens/anvil-tokens.json`** is the one token table. `tokens/look-anvil.css` is generated from it.
- **`design/redesign/demos/`** holds the approved demos. They are the visual target for every screen. Run them with `cd design/redesign && npm run dev`, then open `http://127.0.0.1:5199/?demo=<id>`.
- **`design/redesign/DECISIONS.md`** records every gate outcome and every approved behaviour change.

Do not copy values from DESIGN.md into this file. If they disagree, DESIGN.md and the demos win.

The previous version of this spec (shadcn defaults, Inter and Cinzel, a cool near-black theme, 48 px icon rails, a bottom Film Strip) is replaced. The audit in `design/redesign/audit/AUDIT.md` lists where the app had drifted from it and why it was retired.

---

## Design Principles

### 1. Unified Mental Model
The Campaign Builder and the Live Session use the same shell: Film Strip on top, the party in the left rail, the screen in the centre, tools and log in the right rail, a bar under the screen and a status bar at the foot. The Builder goes back through "← Campaigns". Directors learn one interface.

### 2. The Table Comes First
The screen opens on the action, not on a corner of the map. Every role can always reach "show everything". Rails are wide enough to read without truncation at 1280 × 720.

### 3. Mode Communicates State
Each scene mode has its own colour, icon and word, and its own screen shape. You know the mode at a glance, and without colour.

### 4. Heavy Ink Carries Meaning
Heavy outlines and hard shadows mark only what matters now: the screen, the live scene, whoever is acting, dying, the one primary action, and anything floating over the map. Everything else uses a quiet rule, so long sessions stay comfortable.

### 5. Readable at the Table
13 px is the smallest text. Text never sits straight on art. State never reads by colour alone.

### 6. Both Themes, Fully
Light and dark are both first-class. The map and scene art use theme-independent art colours, so they read the same in both. The Display is always dark.

---

## Where the Rules Live

| Topic | Section of `design/redesign/DESIGN.md` |
|---|---|
| Colour, scene, art, shape, space and layout tokens; porting into `globals.css` | 2. Tokens |
| Fonts, loading, type scale, the 13 px floor, Display scale | 3. Type |
| Frame, panel, rail, tab, buttons, chips, token faces, state markers, tracker rows, Film Strip, banners, popover, dialog, input, empty, loading, error | 4. Components |
| Curves, the turn and scene-change choreography, reduced motion | 5. Motion |
| What each of the five modes changes in the shell | 6. Modes |
| What Director, Player, phone and Display may each show | 7. Roles and hidden information |
| Dark theme and 1280 for app pages, Display for other modes, Player's home, other Builder workspaces, About, Contact | 8. Surfaces not drawn |
| The only allowed behaviour changes | 9. Approved behaviour changes |
| Which demo each real file must match | 10. Surface to demo map |
| Pixi colours for `apps/vtt/src/canvas/theme.ts` | 11. Canvas palette |

---

## Architecture Notes

These are not visual and still hold.

### Where design code lives

- `packages/ui/src/globals.css` holds the real tokens. Its variable names match `tokens/look-anvil.css`, so demo CSS ports line for line. Tailwind v4 reads them through `@theme`.
- `packages/ui/src/components/*` (`@anvil/ui`) are the base components, built on Radix primitives (`@radix-ui/react-*`) with Tailwind classes. Restyle them to DESIGN.md section 4. Keep their Radix behaviour: focus traps, keyboard handling and ARIA come from Radix.
- `apps/vtt/src/canvas/theme.ts` is the one place for Pixi colours. Layers read it; they hold no hex values of their own.
- Icons come from `lucide-react`. Mode icons: Story `BookOpen`, Montage `Footprints`, Negotiation `Handshake`, Battle `Swords`, Respite `Tent`.
- `design/` is a standalone npm project. It stays out of the pnpm workspace and the production build. Never add the stageshow kit to `apps/*` or `packages/*`.

### Themes

- The theme is set by `data-theme="dark"` or `"light"` on the root and switched through `SessionThemeToggle`. Both stay supported.
- The Display ignores the stored theme and is always dark.

### Hidden information

- Fog of war stays client-side in `apps/vtt/src/lib/fog-visibility.ts`. Design changes how fog looks, never what it hides.
- Every Player and Display view draws through the visibility helpers. A component never filters Director data by hand. DESIGN.md section 7 is the contract.

### Code standards

From `CLAUDE.md`: strict TypeScript, no `any`, `import type`, function components, new components under 200 lines. Do not split existing large files (such as `BattleWorkspace.tsx`) unless the task needs it.

---

## Sizes and Surfaces

| Surface | Sizes that must work | Design target |
|---|---|---|
| Director and Player laptop | 1440 × 900 and 1280 × 720, both themes | Gate 2 and 3 demos |
| App pages | 1440 × 900 and 1280 × 720, both themes | Gate 5 demos, plus DESIGN.md section 8 |
| Phone companion (`/phone`) and mobile app (`/app/mobile`) | 375 × 812, both themes, 44 px minimum targets | Gate 4 phone demos |
| Display (`/display`) | 1920 × 1080, dark only, legible at 25% | Gate 4 Display demos |
| Public pages | Desktop and phone widths | Gate 5 `landing` and `auth` |

Desktop is the primary surface. Rails keep their width at 1280; the centre takes what is left. Phone surfaces use the phone patterns, not squeezed desktop rails.

---

## Accessibility

### Standard
WCAG 2.1 AA. Every text pair is measured, not judged by eye: 4.5:1 for body text, 3:1 for large text and non-text marks. The approved token pairs all pass.

### Keyboard Navigation
- Every interactive element is reachable with Tab.
- Escape closes popovers, dialogs and menus.
- Enter and Space activate buttons.
- Keep existing keyboard shortcuts (`useKeyboardShortcuts`) and focus behaviour unless a gate approves a change.

### Focus Management
- Dialogs trap focus (Radix).
- Keep the visible focus ring on every control, recoloured to `--color-active`.
- A focused control must never land off screen.

### ARIA Labels
- Keep every existing `aria-*` label.
- Every icon-only button needs a label (for example "Raise Malice", "Zoom in").
- Session pages get a `main` landmark and a heading structure.
- The confirmation for anything that ends play uses `role="alertdialog"`.
- Status changes (turns, scene changes, reconnects) go through the existing live region.

### Colour and Motion
- State reads by icon, word or shape as well as colour (DESIGN.md rule 7).
- Respect `prefers-reduced-motion` (DESIGN.md section 5.4).

---

## How New Work Uses This

1. Find the demo for the surface in DESIGN.md section 10. Match it.
2. If no demo covers it, build it from DESIGN.md section 8 and the core rules in section 1.
3. Use tokens only. A new colour, size or shadow goes into `anvil-tokens.json` first, then `npm run tokens`, then `globals.css`.
4. Behaviour changes are limited to DESIGN.md section 9. Anything else needs a design gate with Dan.
5. Check both themes, 1280 × 720, greyscale for state, and the hidden-information contract before sign-off.

---

*Document Version: 2.0 (Storyboard)*
*Design language: `design/redesign/DESIGN.md`*
*Typefaces: Bricolage Grotesque, Atkinson Hyperlegible, Courier Prime*
