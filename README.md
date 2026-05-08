# Anvil VTT

A Virtual Tabletop for **Draw Steel** (MCDM's tactical TTRPG). Uses a "film director" metaphor — the Director (GM) controls scenes via a Film Strip across five scene modes: Battle, Story, Montage, Negotiation, and Respite.

## Tech Stack

- **Frontend:** React 19, TypeScript (strict), Vite 7, Tailwind CSS, shadcn/ui + Radix
- **Canvas:** PixiJS v8 for the battle map with fog of war, tokens, and grid
- **State:** Zustand (UI), XState 5 (scene machine)
- **Backend:** Cloudflare Workers + Hono, Durable Objects (real-time sessions), D1 (SQLite), R2 (assets)
- **Real-time:** WebSocket via Durable Objects, server-authoritative dice rolling
- **Auth:** Discord OAuth

## Monorepo Structure

```
packages/
  types/      # @anvil/types — Domain types (heroes, entities, scenes, combat)
  data/       # @anvil/data  — Game data, logic modules, compendium, rules
  ui/         # @anvil/ui    — Shared React components and hooks
apps/
  vtt/        # @anvil/vtt   — Main web app (routes, stores, canvas, session UI)
  server/     # @anvil/server — Cloudflare Workers + Durable Objects API
```

## Getting Started

```bash
pnpm install
pnpm build    # Build all packages
pnpm dev      # Dev mode (all packages)
pnpm test     # Run tests
pnpm lint     # Lint all packages
```

### Package-specific commands

```bash
pnpm --filter @anvil/data build       # Build data package
pnpm --filter @anvil/data test        # Run data tests
pnpm --filter @anvil/types build      # Build types package
```

Build order: `@anvil/types` → `@anvil/data` → `@anvil/ui` → `@anvil/vtt`, `@anvil/server`

## Architecture

### Key Design Decisions

- **No CRDTs** — WebSocket + last-write-wins for simplicity
- **Server-side dice** — `crypto.getRandomValues` for fairness and trust
- **Client-side fog of war** — Server broadcasts all entities; clients filter visibility
- **Eager loading** — Full session state loaded on "Go Live" (no lazy hydration)
- **Manual combat tracking** — Automate math, not judgment calls
- **Logic modules** — All game calculations in pure static functions, never in components

## Scene Modes

| Mode | Description |
|------|-------------|
| **Battle** | PixiJS tactical map with tokens, grid, fog of war, combat tracker |
| **Story** | Cinematic read-aloud text with director notes |
| **Montage** | Collaborative challenges with success/failure tracking |
| **Negotiation** | Interest/patience meters, motivations, argument log |
| **Respite** | Downtime activities and long-term projects |

## License

[MIT](LICENSE)
