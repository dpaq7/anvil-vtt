# Redesign progress

Plan: `docs/plans/2026-11-07-demo-led-redesign.md`. Work happens in the worktree `.claude/worktrees/redesign` on branch `redesign/demo-led`.

## Current state

- Tasks 1 and 2 done. Next: Task 3.
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

  All three are fixed in PR #73, with Dan's approval for the server line. `pnpm smoke:live` now passes on `redesign/demo-led`'s fix branch.
