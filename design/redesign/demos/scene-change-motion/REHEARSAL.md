# Rehearsal: scene-change-motion

Gold: `choreography` for the idea (a frame that holds while dependent content changes in tracks) and the `page swap` recipe in `motion.md` (keep the chrome, crossfade only the body). No gold is a whole app changing mode, so the frame is the shared Storyboard shell from Gate 2, unchanged.

Beats, Director view, 1440, light:
1. Open on the Story beat, a finished screen: the script page over the drowned chapel, Director notes, the read-aloud editor. Hold 1.8 s.
2. The cursor travels to "Get the Sword!" in the Film Strip and clicks it. The Story board settles flat, the Battle board fills red, tilts and raises.
3. A red title card slides across the screen ("Get the Sword!", Battle). Its words arrive after it lands and leave before it moves, so no edge slices them.
4. While the card holds, the shell turns over around it: rail tabs, the line under each of the seven heroes rolls from ancestry and class to turn state, Ilsabet's row lights as acting, the lower left rail becomes the Director's side with Malice and End turn, the right rail becomes Damage and the Now card, the bar gains map tools. Staggered 0, 240, 380 and 520 ms. The dice stay put.
5. Payoff: the card leaves to the right and reveals the map, with the corner tracker reading Round 1 and Ilsabet's ring on. Hold 3 s.

Loop about 11.5 s. Reset: the same ink "Anvil" wipe as `battle-turn-motion`; the state snaps back to Story behind it. Data never rewinds in view.

Data liberty: the round comes back with the scene, as if the Director cut away to a story beat mid-fight (Dovrin done, Ilsabet acting). Stamina, dying and winded carry across both modes, as they do in the app.

Captured: default `film.mjs --gate` (1280 viewport, scaled), `--states --gate --width 1440 --pad 0`, `--at strip` at 150 ms, `--reduced`.
Gate: `rehearsal passed` on the exact command `node ~/.claude/skills/stageshow/scripts/film.mjs "http://127.0.0.1:5199/?demo=scene-change-motion" --gate`.
Fixed on the way: a `framing:` line on the right rail (its column now sits on the canvas like the others), and a `hard edge:` on the card's words.
Candidates that stand: `jump:` lines on the card and wipe happen off screen or under the wipe; `settle snap` is Roll's measured strip and the wipe's wordmark; `handoff shift` is a status badge inside the swapped layers; `half-pixel glyph` is the board's 34 px icon cell, unchanged from Gate 2.
Coverage: `inconclusive`, about 113 sampling gaps over 276 ms, as at Gate 2. A full app screen is heavy to record, so motion inside those gaps was not judged.
Reduced motion: the poster is the payoff, Battle with Ilsabet acting, complete and still.
Not checked: 390 width (a table screen is not a phone design), live frame pacing on a real display, a fresh-eye review, dark theme in motion.
