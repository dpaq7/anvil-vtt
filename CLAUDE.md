# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anvil v2 is a Virtual Tabletop for **Draw Steel** (MCDM's tactical TTRPG). Uses a "film director" metaphor — the Director (GM) controls scenes via a Film Strip. Five scene modes (Battle, Story, Montage, Negotiation, Respite) each transform the entire UI.

**Status:** Monorepo scaffolded. `@anvil/types` and `@anvil/data` packages contain ported v1 game data, types, and logic modules. UI, VTT app, and server are stubs.

## Build Commands

```bash
pnpm build                          # Build all packages (turbo)
pnpm dev                            # Dev mode all packages
pnpm test                           # Run tests (vitest in @anvil/data)
pnpm lint                           # Lint all packages
pnpm --filter @anvil/data build     # Build just the data package
pnpm --filter @anvil/types build    # Build just the types package
pnpm --filter @anvil/data test      # Run data package tests
pnpm --filter @anvil/data test:run  # Run tests once (no watch)
```

Build order: `@anvil/types` → `@anvil/data` → `@anvil/ui` → `@anvil/vtt`, `@anvil/server`

## Reference Documentation

Read the relevant doc before starting any task:

| Doc | Path | When to read |
|-----|------|--------------|
| **Full project brief** | `docs/ANVIL_V2_CLAUDE_CODE_BRIEF.md` | **Onboarding / broad context** |
| Product spec & DB schema | `docs/spec/ANVIL_V2_SPEC.md` | Starting any feature |
| Real-time sync & WebSocket protocol | `docs/spec/ANVIL_V2_REVISED_ARCHITECTURE.md` | Session/multiplayer work |
| GameData API & Logic modules | `docs/spec/ANVIL_V2_RULESET_IMPLEMENTATION.md` | Game mechanics |
| User journeys & state management | `docs/spec/ANVIL_V2_WEB_FLOWS.md` | UI flows |
| Design system & components | `docs/spec/ANVIL_V2_FRONTEND_DESIGN.md` | Any UI work |
| Logic module patterns (Forgesteel) | `docs/FORGESTEEL_PATTERNS.md` | Writing calculation code |
| Development guide & rules reference | `docs/KNOWLEDGE_BIBLE.md` | General reference |

## Architecture

### Tech Stack

- **Frontend:** React 19, TypeScript (strict), PixiJS v8 (canvas), Zustand (UI state), XState 5.x (scene modes)
- **UI:** shadcn/ui + Radix primitives, Tailwind CSS (dark theme)
- **Backend:** Cloudflare Workers (API), Durable Objects (session state), D1 (SQLite), R2 (assets)
- **Auth:** Supabase Auth
- **Real-time:** Native WebSocket to Durable Objects

### Monorepo Structure

```
packages/
  types/      # @anvil/types — VTT domain types (entity, scene, session, combat, hero)
  data/       # @anvil/data  — Game data, Logic modules, compendium, rules (depends on @anvil/types)
  ui/         # @anvil/ui    — React components, hooks (stub)
apps/
  vtt/        # @anvil/vtt   — Main app: routes, Zustand stores, XState machines (stub)
  server/     # @anvil/server — Cloudflare Workers + Durable Objects (stub)
```

### Key packages

**`@anvil/types`** — Pure TypeScript interfaces for the VTT domain model: heroes (per-class discriminated unions), entities, scenes, sessions, combat, conditions, characteristics, terrain, presentation.

**`@anvil/data`** — All game logic and data:
- `src/logic/` — 20+ Logic modules (HeroLogic, RollLogic, BattleLogic, MontageLogic, etc.). Pure functions; UI never calculates directly.
- `src/game-data/` — GameData access layer, class definitions, condition parser, generated JSON
- `src/rules/` — Reference data: skills, perks, conditions, complications, titles, progression
- `src/compendium/` — JSON data loaders and search utilities
- `src/types/` — Compendium data types (abilities, monsters, ancestries)
- `src/portfolios/`, `src/items/`, `src/monsters/`, `src/terrain/`, `src/scene-objects/`

### Architectural Constraints

- **No CRDTs** — WebSocket + last-write-wins
- **Client-side fog of war** — Server broadcasts all entities; clients filter visibility
- **Server-side dice** — Fairness and trust
- **Eager loading** — Load all session data on "Go Live" (no lazy hydration races)
- **Manual combat tracking** — Automate math, not judgment calls
- **Logic modules pattern** — All calculations in static Logic classes, never in components
- **Store source, derive computed** — Never persist calculated values; derive at render time

## Code Standards

- TypeScript strict mode, no `any`
- `@typescript-eslint/consistent-type-imports` enforced (use `import type`)
- Function components with hooks only
- Props via explicit interfaces (e.g. `EntityCardProps`)
- Component structure: hooks → derived values → callbacks → render
- Components < 200 lines; decompose larger ones
- Result pattern (`{ ok, value } | { ok, error }`) for fallible operations
- shadcn/ui as component base; follow Tailwind spacing/color system

## Game Data Rules (Draw Steel)

Game data (ancestries, classes, monsters, abilities) is an **immutable source of truth**.

- **Derive, don't store** — stamina, defenses, conditions are always computed from source data via Logic modules
- **Power Roll:** 2d10 + characteristic. Tier 1 (≤11), Tier 2 (12–16), Tier 3 (17+)
- **Edge/Bane:** Roll 3d10, keep highest/lowest 2
- **Winded:** current stamina ≤ 50% max. **Dying:** stamina ≤ 0
- **Recovery:** `floor(maxStamina / 3)`
- **Malice:** Director resource, +2 per round
