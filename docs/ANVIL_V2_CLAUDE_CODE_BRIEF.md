# Anvil V2 — Claude Code Project Brief

> Quick-start guide for AI-assisted development on the Anvil VTT

---

## What is Anvil?

Anvil is a **Virtual Tabletop for Draw Steel**, MCDM's tactical TTRPG. It uses a "film director" metaphor where the Director (GM) controls scenes like directing a movie, navigating via a Film Strip.

**Core Concept**: Five scene modes (Battle, Story, Montage, Negotiation, Respite) each transform the entire UI. The Director prepares content in Campaign Builder, then "goes live" to run sessions with players.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  React 19 + TypeScript + PixiJS v8 + Zustand + XState 5.x       │
│  shadcn/ui + Tailwind CSS                                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                               │
│  Workers (API) + Durable Objects (Session State) + D1 + R2      │
└─────────────────────────────────────────────────────────────────┘
```

**Key Architecture Decisions** (from production VTT research):
- **No CRDTs** — Simple WebSocket + last-write-wins (every shipping VTT does this)
- **Client-side fog of war** — Server broadcasts all entities; clients filter visibility
- **Server-side dice** — Fairness and trust
- **Eager loading** — Load all session data on "Go Live" (no lazy hydration races)
- **Manual combat tracking** — Automate math, not judgment calls

---

## Document Map

Read these in order when starting work on a feature:

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `ANVIL_V2_SPEC.md` | Full product spec, database schema, scene types | Starting any feature |
| `ANVIL_V2_REVISED_ARCHITECTURE.md` | Real-time sync, Durable Objects, WebSocket protocol | Building session/multiplayer features |
| `ANVIL_V2_RULESET_IMPLEMENTATION.md` | GameData API, Logic modules, Draw Steel rules | Implementing game mechanics |
| `ANVIL_V2_WEB_FLOWS.md` | User journeys, state management, critical paths | Building UI flows |
| `ANVIL_V2_FRONTEND_DESIGN.md` | Design system, components, layouts | Building any UI |
| `FORGESTEEL_PATTERNS.md` | Logic module patterns from reference codebase | Writing calculation code |
| `KNOWLEDGE_BIBLE.md` | Development guide, Draw Steel rules reference | General reference |

---

## Tech Stack Quick Reference

| Layer | Technology | Notes |
|-------|------------|-------|
| UI Framework | React 19 | Function components, hooks only |
| Language | TypeScript | Strict mode, no `any` |
| Styling | Tailwind CSS | Dark theme, shadcn variables |
| Components | shadcn/ui | Radix primitives underneath |
| Canvas | PixiJS v8 | Battle maps, tokens, fog |
| State (UI) | Zustand | Slices pattern |
| State (Modes) | XState 5.x | Scene type state machine |
| Real-time | Native WebSocket | To Durable Objects |
| Database | D1 (SQLite) | Via Supabase client patterns |
| Auth | Supabase Auth | OAuth + email/password |
| Assets | R2 | Maps, portraits, tokens |
| Server | Cloudflare Workers | API routes |
| Game Server | Durable Objects | Session state, broadcast |

---

## Code Patterns

### 1. Logic Modules (Forgesteel Pattern)

**All calculations live in static Logic classes.** Never calculate in components.

```typescript
// ✅ CORRECT - Logic module
export class HeroLogic {
  static getMaxStamina(hero: Hero): number {
    let stamina = hero.heroClass?.baseStamina ?? 0;
    HeroLogic.getFeatures(hero)
      .filter(f => f.feature.field === 'stamina')
      .forEach(f => stamina += f.feature.value ?? 0);
    return stamina;
  }
}

// ✅ CORRECT - Component delegates to Logic
function HeroCard({ hero }: { hero: Hero }) {
  const maxStamina = HeroLogic.getMaxStamina(hero);
  return <div>{maxStamina}</div>;
}

// ❌ WRONG - Calculation in component
function HeroCard({ hero }: { hero: Hero }) {
  const maxStamina = hero.baseStamina + hero.ancestry.staminaBonus; // NO!
}
```

### 2. Store Source, Compute Derived

**Never persist calculated values.** Store source data, derive on read.

```typescript
// ✅ CORRECT - Derive at render time
const isWinded = HeroLogic.isWinded(hero, hero.stamina.current);

// ❌ WRONG - Storing derived state
const [isWinded, setIsWinded] = useState(false); // NO!
```

### 3. Component Structure

```typescript
// Standard component structure
interface EntityCardProps {
  entity: Entity;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function EntityCard({ entity, selected, onSelect }: EntityCardProps) {
  // 1. Hooks first
  const stats = useEntityStats(entity);
  
  // 2. Derived values
  const isWinded = stats.currentStamina <= stats.maxStamina / 2;
  
  // 3. Callbacks
  const handleClick = useCallback(() => {
    onSelect?.(entity.id);
  }, [entity.id, onSelect]);
  
  // 4. Render
  return (
    <Card 
      className={cn("cursor-pointer", selected && "border-primary")}
      onClick={handleClick}
    >
      {/* ... */}
    </Card>
  );
}
```

### 4. WebSocket Messages

```typescript
// Client → Server
type ClientMessage =
  | { type: 'request_state' }
  | { type: 'move_token'; entityId: string; x: number; y: number }
  | { type: 'use_ability'; sourceId: string; targetId: string; abilityId: string }
  | { type: 'combat_action'; action: CombatAction }
  | { type: 'switch_scene'; sceneId: string }; // Director only

// Server → Client
type ServerMessage =
  | { type: 'state'; state: SessionState }
  | { type: 'entity_moved'; entityId: string; x: number; y: number }
  | { type: 'ability_resolved'; result: AbilityResult }
  | { type: 'combat_updated'; combat: CombatState }
  | { type: 'scene_changed'; sceneId: string };
```

### 5. Error Handling

```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Show errors with recovery actions
function ErrorBanner({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{error.message}</AlertDescription>
      {error.recoveryAction === 'retry' && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
      )}
    </Alert>
  );
}
```

---

## UI Layout (Unified)

Campaign Builder and Live Session share the same layout:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Top Bar (48px)                                                        │
├────┬───────────────────────────────────────────────────────────────┬───┤
│    │                                                               │   │
│ L  │                                                               │ R │
│ e  │                       S T A G E                               │ i │
│ f  │                                                               │ g │
│ t  │         (Battle Canvas / Story Text / etc.)                   │ h │
│    │                                                               │ t │
│ R  │                                                               │   │
│ a  │                                                               │ R │
│ i  │                                                               │ a │
│ l  │                                                               │ i │
│    │                                                               │ l │
│48px│                                                               │48px
├────┴───────────────────────────────────────────────────────────────┴───┤
│  Film Strip (56px) - Scene cards, Director only in live               │
├────────────────────────────────────────────────────────────────────────┤
│  Status Bar (32px)                                                     │
└────────────────────────────────────────────────────────────────────────┘
```

**Icon Rails**: 48px collapsed, expand to show panels on click.

---

## File Organization

```
packages/
├── data/                    # Game data & logic (runs on client AND server)
│   └── src/
│       ├── game-data/       # Compendium (ancestries, classes, monsters)
│       ├── logic/           # Pure calculation functions
│       │   ├── hero-logic.ts
│       │   ├── monster-logic.ts
│       │   ├── combat-logic.ts
│       │   └── roll-logic.ts
│       └── types/           # TypeScript interfaces
│
├── ui/                      # React components
│   └── src/
│       ├── components/      # Shared components
│       │   ├── layout/      # AppShell, IconRail, FilmStrip
│       │   ├── common/      # StaminaBar, EntityCard, etc.
│       │   └── shadcn/      # shadcn/ui primitives
│       ├── features/        # Feature-specific components
│       │   ├── campaign/    # Campaign Builder
│       │   ├── session/     # Live Session
│       │   ├── combat/      # Battle UI
│       │   └── wizard/      # Character Wizard
│       └── hooks/           # Custom hooks
│
apps/
├── vtt/                     # Main VTT application
│   └── src/
│       ├── routes/          # Page components
│       ├── stores/          # Zustand stores
│       └── machines/        # XState machines
│
└── server/                  # Cloudflare Workers
    └── src/
        ├── routes/          # API routes
        └── durable-objects/ # SessionRoom DO
```

---

## Development Workflow

### Before Starting Any Task

1. **Read relevant documents** from the Document Map above
2. **Check existing patterns** in similar features
3. **Plan the approach** before writing code

### For UI Features

1. Check `ANVIL_V2_FRONTEND_DESIGN.md` for component patterns
2. Use shadcn/ui components as base
3. Follow the spacing/color system
4. Test keyboard navigation

### For Game Logic

1. Check `FORGESTEEL_PATTERNS.md` for Logic module patterns
2. Put calculations in Logic modules, not components
3. Write unit tests for edge cases
4. Handle null/undefined defensively

### For Real-time Features

1. Check `ANVIL_V2_REVISED_ARCHITECTURE.md` for sync patterns
2. Server validates, broadcasts; clients display
3. Use the defined WebSocket message types
4. Handle reconnection gracefully

---

## Critical Rules

### DO ✅

- **Use Logic modules** for all calculations
- **Store source data**, derive values at render
- **Follow shadcn patterns** for UI components
- **Handle errors** with clear recovery paths
- **Write defensive code** (null checks, defaults)
- **Keep components small** (<200 lines)

### DON'T ❌

- **Don't calculate in components** — use Logic modules
- **Don't store derived state** — compute on render
- **Don't mutate directly** — use events/actions
- **Don't skip error handling** — always show recovery
- **Don't create "god components"** — decompose
- **Don't use `any`** — type everything

---

## Quick Commands

```bash
# Development
pnpm dev              # Start all packages
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint all packages

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed test data
pnpm db:reset         # Reset database

# Cloudflare
pnpm wrangler dev     # Local Workers dev
pnpm wrangler deploy  # Deploy to Cloudflare
```

---

## Getting Oriented on a Task

When you receive a task, follow this process:

### 1. Understand the Context

```
What feature area is this?
├── UI/Components      → Read FRONTEND_DESIGN.md
├── Game Logic         → Read RULESET_IMPLEMENTATION.md + FORGESTEEL_PATTERNS.md
├── Real-time/Sync     → Read REVISED_ARCHITECTURE.md
├── User Flow          → Read WEB_FLOWS.md
└── Database/Schema    → Read ANVIL_V2_SPEC.md Section 4
```

### 2. Find Similar Code

Look for existing implementations of similar features. Common locations:
- Components: `packages/ui/src/`
- Logic: `packages/data/src/logic/`
- Hooks: `packages/ui/src/hooks/`
- Types: `packages/data/src/types/`

### 3. Plan Before Coding

For anything non-trivial:
1. List the files that need to change
2. Identify the data flow
3. Note any edge cases
4. Consider error states

### 4. Implement Incrementally

- Small, focused commits
- Test as you go
- Ask questions if unclear

---

## Scene Mode Reference

| Mode | Stage Content | Left Rail | Right Rail | Key State |
|------|---------------|-----------|------------|-----------|
| **Battle** | PixiJS canvas, tokens, fog | Combat tracker | Party/Enemies | `round`, `turn`, `malice` |
| **Story** | Read-aloud text, images | Notes | NPCs | `readAloudText` |
| **Montage** | Progress tracker | Test log | Challenges | `successes`, `failures` |
| **Negotiation** | NPC + meters | Argument log | Motivations | `interest`, `patience` |
| **Respite** | Activity cards | Projects | Party status | `activities` |

---

## Draw Steel Quick Reference

| Concept | Rule |
|---------|------|
| **Power Roll** | 2d10 + characteristic |
| **Tier 1** | ≤11 (weak) |
| **Tier 2** | 12-16 (moderate) |
| **Tier 3** | 17+ (strong) |
| **Edge** | Roll 3d10, keep highest 2 |
| **Bane** | Roll 3d10, keep lowest 2 |
| **Winded** | ≤50% max stamina |
| **Dying** | ≤0 stamina |
| **Recovery** | Heal floor(maxStamina / 3) |
| **Malice** | Director resource, +2/round |

---

## Summary

1. **Read the docs** before starting
2. **Logic in modules**, not components
3. **Store source**, derive computed
4. **shadcn + Tailwind** for all UI
5. **Server validates**, clients display
6. **Handle errors** with recovery
7. **Keep it simple** — no premature optimization

When in doubt, ask: "How would Foundry/Owlbear do this?" and choose the simpler approach.

---

*Brief Version: 1.0*
*Last Updated: Session creating V2 architecture documents*
