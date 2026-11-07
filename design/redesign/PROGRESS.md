# Redesign progress

Plan: `docs/plans/2026-11-07-demo-led-redesign.md`. Work happens in the worktree `.claude/worktrees/redesign` on branch `redesign/demo-led`.

## Current state

- Task 1 done. Next: Task 2.
- PR #72 (imports) is open and needs Dan's merge. It has three open security findings, listed in its description.
- `redesign/demo-led` is based on PR #72's branch. The repo merges with merge commits, so no rebase is needed after #72 merges.
- After #72 merges, the main checkout still holds the same files uncommitted, so `git pull` there will refuse until they are cleared. That is Dan's work: ask first.

## Baseline before redesign work (commit c15cc2d)

- `pnpm typecheck`, `pnpm lint`, `pnpm test:run` (3,845 data and 47 server tests) and `pnpm deploy:check` pass.
- `pnpm smoke:live` FAILS, and fails the same way on clean `main` at 3ed6a3b, so it is not caused by the redesign:
  1. The script's join call sends no `room_code`, which the server has required since 47a650f.
  2. With that patched, it stops at `director timed out waiting for director combat update`.

## Blocked at Task 2: server bug needs Dan's decision (2026-11-07)

The `combat update` timeout is a real server crash, not a script problem. In `apps/server/src/durable-objects/SessionRoom.ts`, `broadcastCombat` calls itself when no entity is hidden by fog, which overflows the stack (`RangeError`). It came in with df4eda7 (2026-07-29). That commit is on `main` but not on `staging`. Whether it is deployed has not been checked.

Replacing the self-call with `this.broadcast({ type: 'combat_updated', combat })` was tested in a throwaway worktree, with the `room_code` script fix, and is not committed anywhere. Four runs got past combat with no stack overflow. All four then stopped at the later battle-restore step: after battle, story, battle, the villain's `prone` condition is missing. That cause is unknown. It may be a second bug, or a side effect of the fix. The script's `--hold-open` point comes before that step, so Task 2 should not need it.

Server edits are outside the plan's constraints, so this waits for Dan.
