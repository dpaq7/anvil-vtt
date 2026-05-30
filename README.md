# Anvil VTT

[![Status: active beta](https://img.shields.io/badge/status-active%20beta-c28f2c)](#project-status)
[![Build: passing locally](https://img.shields.io/badge/build-passing%20locally-2ea44f)](#build-and-validation)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Acknowledgements

Anvil is an independent fan-built tool for **Draw Steel**. It is not affiliated with, sponsored by, or endorsed by MCDM Productions, LLC. DRAW STEEL © 2024 MCDM Productions, LLC.

- [MCDM Productions](https://www.mcdmproductions.com/) for creating Draw Steel.
- [Andy Aiken and Forge Steel](https://github.com/andyaiken/forgesteel) for showing how useful focused Draw Steel tooling can be.
- [Steel Compendium](https://github.com/SteelCompendium) for making Draw Steel rules data easier to explore, reference, and adapt.

Anvil is a virtual tabletop for **Draw Steel**, built around a director-style campaign workflow. Directors organize campaigns into modules, sessions, and playable scenes, then run those scenes live for players through focused interfaces for battle, story, montage, negotiation, and respite play.

The app is in active beta development. Core director, player, campaign, live-session, notes, asset, and hero workflows are functional, but data coverage, import/export workflows, deployment hardening, and broad automated test coverage are still evolving.

## Project Status

- **Stage:** active beta / pre-release.
- **Production frontend:** `https://anvilvtt.ca`, served as a Vite static app through Cloudflare Pages.
- **Production API:** `https://api.anvilvtt.ca`, served as a Cloudflare Worker custom domain with Durable Objects, D1, and R2 bindings configured in `apps/server/wrangler.toml`.
- **Build status:** local validation is passing with `pnpm typecheck` and `pnpm deploy:check` as of May 21, 2026.
- **Hosted CI:** no GitHub Actions workflow is checked in yet; build status is currently verified locally before release/merge.

## Tech Stack

- **Frontend:** React 19, React Router 7, TypeScript, Vite 7, Tailwind CSS 4, shared `@anvil/ui` components, Radix UI primitives, and Lucide icons
- **Canvas:** PixiJS 8 for tactical maps, grid rendering, token layers, terrain, drawings, and fog
- **Rich Text & Notes:** TipTap, Markdown conversion, nested notebooks, personal notes, and campaign notes
- **State & Flow:** React state, Zustand stores, XState scene flow where it fits, and typed shared protocol models
- **Backend:** Cloudflare Workers, Hono, Durable Objects, D1, and R2
- **Real-time:** WebSockets through Durable Objects for live sessions
- **Auth:** Discord and Google OAuth through Worker-managed D1 sessions, with development-only local login
- **Telemetry:** client crash reports, manual issue reports, sanitized breadcrumbs, API failure reporting, and optional webhook forwarding
- **Data:** Workspace packages for Draw Steel rules data, compendium data, typed scene/session/campaign models, and reusable game logic
- **Deployment:** Cloudflare Pages for the VTT frontend and Cloudflare Workers for the API/session backend
- **Tooling:** pnpm workspaces, Turbo, TypeScript project builds, Wrangler, Vite, ESLint, and Vitest

## Monorepo Layout

```text
apps/
  server/   Cloudflare Worker API, Durable Object session room, D1/R2 integration
  vtt/      React VTT client, campaign builder, live session UI, PixiJS canvas

packages/
  data/     Draw Steel data, rules logic, pregenerated content, import documents
  types/    Shared TypeScript domain types
  ui/       Shared UI primitives and layout components
```

## Features

- **Campaign Builder:** campaign, module, session, and scene organization for directors.
- **Five Scene Modes:** battle, story, montage, negotiation, and respite scenes with mode-specific director/player surfaces.
- **Battle Maps:** map images, square grids, token placement, terrain zones, fog tools, drawing tools, zoom/pan controls, and initiative summaries.
- **Live Sessions:** lobby flow, room codes, director/player roles, WebSocket state sync, and active scene switching.
- **Draw Steel Data:** heroes, monsters, class data, kits, rules helpers, power roll logic, recoveries, resources, and creature data.
- **Hero Tools:** character creation flows, hero sheets, campaign membership, and player hero assignment.
- **Campaign Assets:** maps, NPCs, audio, custom terrain, monster portraits, notes, and activity tracking.
- **Scene Import:** JSON import format for creating a new campaign or appending scenes to an existing campaign.
- **Demo Content:** bundled MCDM Draw Steel demo scene pack with montage tests, negotiations, battle maps, tokens, terrain, objectives, and director notes.

## Scene Import

Scene Import uses a structured JSON document with this shape:

```json
{
  "format": "anvil.scene-import",
  "version": 1,
  "campaign": {
    "name": "Imported Campaign",
    "description": "Optional description"
  },
  "modules": [
    {
      "name": "Module Name",
      "sessions": [
        {
          "name": "Session Name",
          "scenes": [
            {
              "title": "Scene Name",
              "type": "battle",
              "data": {}
            }
          ]
        }
      ]
    }
  ]
}
```

The `data` object is native Anvil scene data. Battle scenes can include map URLs, grid settings, tokens, terrain, fog, drawings, difficulty, notes, and hero starting areas. Montage and negotiation scenes map to their mode-specific live state templates.

## Getting Started

Requirements:

- Node.js 20+
- pnpm 9+
- Wrangler for Cloudflare Worker development

Install and build:

```bash
pnpm install
pnpm build
```

Run the full local development stack:

```bash
pnpm --filter @anvil/server dev
pnpm --filter @anvil/vtt dev
```

Local URLs:

- VTT client: `http://localhost:5173`
- Worker API: `http://localhost:8787`

Useful checks:

```bash
pnpm typecheck
pnpm deploy:check
pnpm --filter @anvil/types typecheck
pnpm --filter @anvil/data typecheck
pnpm --filter @anvil/server typecheck
pnpm --filter @anvil/vtt typecheck
pnpm --filter @anvil/vtt build
```

## Build And Validation

Current local validation status:

| Check | Status | Notes |
|-------|--------|-------|
| `pnpm typecheck` | Passing | Runs Turbo typechecks across `@anvil/types`, `@anvil/data`, `@anvil/ui`, `@anvil/server`, and `@anvil/vtt`. |
| `pnpm deploy:check` | Passing | Runs the Worker dry-run build and the VTT TypeScript/Vite production build. |

There is not yet a committed GitHub Actions workflow, so the README build badge reflects the latest local validation rather than a hosted CI run.

## Scene Modes

| Mode | Description |
|------|-------------|
| **Battle** | PixiJS tactical map with tokens, grid, fog of war, combat tracker |
| **Story** | Cinematic read-aloud text with director notes |
| **Montage** | Collaborative challenges with success/failure tracking |
| **Negotiation** | Interest/patience meters, motivations, argument log |
| **Respite** | Downtime activities and long-term projects |

## Deployment

Deployment notes, required Cloudflare bindings/secrets, environment variables, migration order, and beta smoke checks are tracked in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The VTT frontend is built from `apps/vtt/dist` and deployed to Cloudflare Pages; the API/session backend deploys from `apps/server` to Cloudflare Workers.

```bash
pnpm deploy:check
pnpm db:migrate:remote
pnpm deploy:server
```

## Development Stage

Anvil is in active beta-stage development:

- The main campaign builder and live session workflows are usable.
- Battle, montage, negotiation, story, and respite scenes have working foundations.
- Scene Import now supports structured JSON and bundled demo content.
- Cloudflare deployment paths exist, but production hardening is still ongoing.
- Draw Steel data coverage and automated verification are still being expanded.

## Roadmap

- **Scene Import v2:** schema documentation, validation reports, export support, and markdown-to-scene compilation for easier authoring.
- **Live Play Polish:** stronger scene state persistence, better player visibility controls, combat-state recovery, and director tooling for reinforcements/objectives.
- **Battle Canvas:** token conditions, richer terrain automation, area templates, map calibration, ruler tools, and improved fog workflows.
- **Rules Coverage:** broader Draw Steel data ingestion, audit tests, monster/action coverage, and tighter rules-helper APIs.
- **Hero Experience:** smoother character creation, advancement, campaign handoff, and sheet interactions during live play.
- **Asset Workflows:** richer map/audio/NPC management, tagging, search, import/export, and R2-backed deployment flows.
- **Quality:** end-to-end smoke tests, fixture-backed import tests, accessibility passes, performance profiling, and deployment regression checks.

## License

[MIT](LICENSE)
