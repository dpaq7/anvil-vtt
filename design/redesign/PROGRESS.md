# Redesign progress

Plan: `docs/plans/2026-11-07-demo-led-redesign.md`. Work happens in the worktree `.claude/worktrees/redesign` on branch `redesign/demo-led`.

## Current state

- Tasks 1 to 7 done. Gate 1 chose Storyboard; Gate 2 approved Battle. Task 8 built: Gate 3 demos for Story, Montage, Negotiation, Respite and `scene-change-motion`, waiting for Dan.
- `redesign/demo-led` is pushed to `origin` as a backup. Push after each task.
- The live session no longer matches `battle-dense.json` exactly: capturing the Player's turn moved it on. Scene switches restored the extra heroes from the snapshot on return to Battle.
- The six extra heroes in the dense battle live only in session state, so a scene switch drops them. Capture Battle before changing scene, or rebuild from `HARNESS.md`.
- PR #73 (combat crash and smoke script fix) is open and needs Dan's merge. It is merged into `redesign/demo-led`.
- PR #72 (imports) is open and needs Dan's merge. It has three open security findings, listed in its description.
- `redesign/demo-led` is based on PR #72's branch. The repo merges with merge commits, so no rebase is needed after #72 merges.
- After #72 merges, the main checkout still holds the same files uncommitted, so `git pull` there will refuse until they are cleared. That is Dan's work: ask first.

## Baseline before redesign work (commit c15cc2d)

- `pnpm typecheck`, `pnpm lint`, `pnpm test:run` (3,845 data and 47 server tests) and `pnpm deploy:check` pass.
- `pnpm smoke:live` FAILS, and fails the same way on clean `main` at 3ed6a3b, so it is not caused by the redesign:
  1. The script's join call sends no `room_code`, which the server has required since 47a650f.
  2. With that patched, it stops at `director timed out waiting for director combat update`. This was a real server crash: `broadcastCombat` called itself when no entity was hidden by fog (df4eda7).
  3. With that fixed, it stops at the battle-restore step because the script read conditions as strings, not objects.

  All three are fixed in PR #73, with Dan's approval for the server line. `pnpm smoke:live` passed twice on `claude/fix-combat-broadcast`.

## Repo incident (2026-11-07)

Commit 57ba67d and two blobs vanished from the local object store around 12:27, when packs were rewritten. It happened again around 12:30, with commit 9c383a88. A `git maintenance run --auto` cruft repack was seen running, set off by `gc.auto=250` in Dan's global `.gitconfig`. It is the likely cause, not proven. Run git with `GIT_CONFIG_COUNT=2 GIT_CONFIG_KEY_0=gc.auto GIT_CONFIG_VALUE_0=0 GIT_CONFIG_KEY_1=maintenance.auto GIT_CONFIG_VALUE_1=false`. Restored with a fetch from `origin` into a temporary ref. `git fsck` was clean afterwards. If git reports `invalid sha1 pointer`, check `git fsck --full` and refetch: do not delete refs.
