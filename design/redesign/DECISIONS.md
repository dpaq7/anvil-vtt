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
