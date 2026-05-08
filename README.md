# Anvil VTT

Anvil is a virtual tabletop for **Draw Steel**, built around a director-style campaign workflow. Directors organize campaigns into modules, sessions, and playable scenes, then run those scenes live for players through focused interfaces for battle, story, montage, negotiation, and respite play.

The app is currently in active product development. Core workflows are functional, but the project is still pre-release: data coverage, import/export workflows, deployment hardening, and broad test coverage are still evolving.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS, shared `@anvil/ui` components
- **Canvas:** PixiJS 8 for tactical maps, grid rendering, token layers, terrain, drawings, and fog
- **State:** React state, Zustand stores, and XState scene flow where it fits
- **Backend:** Cloudflare Workers, Hono, Durable Objects, D1, and R2
- **Real-time:** WebSockets through Durable Objects for live sessions
- **Auth:** Discord OAuth, with development-only local login
- **Data:** Workspace packages for Draw Steel rules data, compendium data, typed scene/session/campaign models, and reusable game logic
- **Tooling:** pnpm workspaces, TypeScript project builds, Wrangler, Vite, ESLint, Vitest

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

Directors can import the bundled **MCDM Draw Steel Demo Scenes** pack from the campaign list, or append imported scenes from inside an existing campaign.

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
pnpm --filter @anvil/types typecheck
pnpm --filter @anvil/data typecheck
pnpm --filter @anvil/server typecheck
pnpm --filter @anvil/vtt typecheck
pnpm --filter @anvil/vtt build
```

## Deployment

Deployment notes, required Cloudflare bindings/secrets, environment variables, migration order, and beta smoke checks are tracked in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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
