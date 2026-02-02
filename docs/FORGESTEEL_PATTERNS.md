# Forgesteel Architecture Patterns for Anvil VTT

> Reference guide capturing architectural patterns from Andy Aiken's Forgesteel codebase.
> Use this when designing new features, debugging issues, or making architectural decisions.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Logic Layer Architecture](#logic-layer-architecture)
3. [Pattern Catalog](#pattern-catalog)
4. [Decision Framework](#decision-framework)
5. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
6. [Module Responsibilities](#module-responsibilities)
7. [Testing Strategy](#testing-strategy)
8. [Quick Reference](#quick-reference)

---

## Core Philosophy

### The Prime Directive

> **UI is "dumb" — components render, hooks orchestrate, Logic calculates.**

Every calculation, derivation, or business rule belongs in a Logic module. React components should only:

- Render UI based on props/state
- Call Logic functions to get computed values
- Dispatch actions through hooks/orchestrators

### Why This Matters

| Without Logic Layer                         | With Logic Layer                |
| ------------------------------------------- | ------------------------------- |
| Calculations scattered across 4+ components | Single source of truth          |
| Duplicate bug fixes                         | Fix once, works everywhere      |
| Hard to test (need React testing)           | Pure functions, easy unit tests |
| Business rules mixed with rendering         | Clear separation of concerns    |

---

## Logic Layer Architecture

### Dependency Flow

```
@anvil/types (interfaces only, no logic)
    ↓
@anvil/data (game-data/ + logic/ + factories/)
    ↓
@anvil/core (orchestration, side effects)
    ↓
@anvil/ui (React hooks, components)
```

**Rule:** Dependencies flow DOWN only. Logic never imports from UI.

### Package Responsibilities

| Package        | Contains                                  | Never Contains              |
| -------------- | ----------------------------------------- | --------------------------- |
| `@anvil/types` | TypeScript interfaces, enums              | Functions, classes, React   |
| `@anvil/data`  | Logic modules, factories, game data       | React, side effects, async  |
| `@anvil/core`  | Orchestrators, services, state management | React components            |
| `@anvil/ui`    | Components, hooks, pages                  | Business logic calculations |

### Logic Module Anatomy

```typescript
// packages/data/src/logic/example-logic.ts

import type { Example, Options } from '@anvil/types';
import { Collections } from './collections';

export class ExampleLogic {
  /**
   * Pure function - same input always produces same output
   * No side effects, no async, no external state
   */
  static calculate(example: Example, options: Options): number {
    // All calculations happen here
    return result;
  }

  /**
   * Derivation - compute value from entity state
   */
  static getDerivedValue(example: Example): DerivedType {
    // Extract, transform, compute
    return derived;
  }

  /**
   * Predicate - boolean check
   */
  static isCondition(example: Example): boolean {
    return example.value > threshold;
  }
}
```

---

## Pattern Catalog

### 1. Template → Instance (SessionLogic)

**When to use:** Any content that gets "started" or "run" - scenes, encounters, campaigns.

**Pattern:**

```typescript
// Template = what you design (immutable blueprint)
interface SceneTemplate {
  id: string;
  title: string;
  config: SceneConfig;
}

// Instance = what you run (mutable runtime state)
interface SceneInstance extends SceneTemplate {
  templateId: string; // Reference back to template
  startedAt: string;
  state: RuntimeState; // Mutable during play
}

// SessionLogic handles the transformation
class SessionLogic {
  static startScene(template: SceneTemplate, party?: Party): SceneInstance {
    const instance = Utils.deepCopy(template); // NEVER mutate template
    instance.id = Utils.generateId(); // New ID for instance
    instance.templateId = template.id; // Track origin
    instance.state = initializeState(); // Runtime state
    return instance;
  }
}
```

**Benefits:**

- Reuse templates across campaigns
- Reset without losing template
- Track "this party ran this scene 3 times"

### 2. UpdateLogic (Schema Migration)

**When to use:** Loading ANY data from database or storage.

**Pattern:**

```typescript
class HeroUpdateLogic {
  static update(hero: Hero): void {
    // Add missing fields with defaults
    if (hero.folder === undefined) hero.folder = '';
    if (hero.features === undefined) hero.features = [];

    // Update nested structures
    if (hero.state) {
      HeroUpdateLogic.updateState(hero.state);
    }

    // Migrate deprecated fields
    if ((hero as any).oldField !== undefined) {
      hero.newField = (hero as any).oldField;
      delete (hero as any).oldField;
    }
  }
}

// Integration point - call after every database fetch
async function getHero(id: string): Promise<Hero> {
  const { data } = await supabase.from('heroes').select().eq('id', id).single();
  const hero = snakeToCamel(data);
  HeroUpdateLogic.update(hero); // ← Always call this
  return hero;
}
```

**Rules:**

- Never throw - gracefully handle any input
- Mutate in place (Forgesteel pattern)
- Idempotent - safe to call multiple times
- Call on EVERY load, not just "old" data

### 3. Entity Feature Extraction

**When to use:** Entities with features from multiple sources (ancestry, class, kit, etc.)

**Pattern:**

```typescript
class HeroLogic {
  // Collect features from ALL sources
  static getFeatures(hero: Hero): FeatureWithSource[] {
    const features: FeatureWithSource[] = [];

    // From ancestry
    if (hero.ancestry) {
      hero.ancestry.features.forEach((f) => {
        features.push({ feature: f, source: hero.ancestry.name });
      });
    }

    // From class
    if (hero.class) {
      hero.class.featuresByLevel
        .filter((lvl) => lvl.level <= hero.level)
        .flatMap((lvl) => lvl.features)
        .forEach((f) => {
          features.push({ feature: f, source: hero.class.name });
        });
    }

    // From kit, titles, complications, etc.
    // ...

    return features;
  }

  // Then derive stats FROM features
  static getMaxStamina(hero: Hero): number {
    let stamina = hero.baseStamina ?? 0;

    HeroLogic.getFeatures(hero)
      .filter((f) => f.feature.type === 'bonus' && f.feature.field === 'stamina')
      .forEach((f) => {
        stamina += f.feature.value ?? 0;
      });

    return stamina;
  }
}
```

**Key insight:** Always extract features FIRST, then derive stats FROM features.

### 4. Factory Pattern

**When to use:** Creating new entities with proper defaults.

**Pattern:**

```typescript
class FactoryLogic {
  // Entity creation
  static createHero(sourcebooks: Sourcebook[]): Hero {
    return {
      id: Utils.generateId(),
      name: '',
      level: 1,
      ancestry: null,
      class: null,
      // ... all required fields with sensible defaults
      state: FactoryLogic.createHeroState(),
    };
  }

  // Nested structure creation
  static createHeroState(): HeroState {
    return {
      currentStamina: 0,
      conditions: [],
      // ... all state fields
    };
  }

  // Scene creation (per type)
  static createBattleScene(options: BattleSceneOptions): BattleSceneTemplate {
    return {
      id: Utils.generateId(),
      type: 'battle',
      title: options.title ?? 'New Battle',
      encounterSlots: [],
      // ...
    };
  }
}
```

**Rules:**

- Factories create TEMPLATES, SessionLogic creates INSTANCES
- All required fields must have values (no undefined)
- Generate IDs at creation time

### 5. Collections Utilities

**When to use:** Array operations that get repeated.

**Pattern:**

```typescript
// packages/data/src/logic/collections.ts
export class Collections {
  static sum<T>(arr: T[], fn: (item: T) => number): number {
    return arr.reduce((total, item) => total + fn(item), 0);
  }

  static max<T>(arr: T[], fn: (item: T) => number): number {
    return arr.reduce((max, item) => Math.max(max, fn(item)), Number.MIN_SAFE_INTEGER);
  }

  static distinct<T>(arr: T[], fn: (item: T) => string): T[] {
    const seen = new Set<string>();
    return arr.filter((item) => {
      const key = fn(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  static sort<T>(arr: T[], fn: (item: T) => string | number): T[] {
    return [...arr].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      if (typeof va === 'string') return va.localeCompare(vb as string);
      return va - (vb as number);
    });
  }
}

// Usage
const totalStamina = Collections.sum(monsters, (m) => MonsterLogic.getStamina(m));
const uniqueConditions = Collections.distinct(conditions, (c) => c.name);
```

### 6. Entity Guards (Type Narrowing)

**When to use:** Functions that work on multiple entity types.

**Pattern:**

```typescript
// packages/data/src/logic/entity-guards.ts
export function isHero(entity: Entity): entity is Hero {
  return entity.type === 'hero' || 'class' in entity;
}

export function isMonster(entity: Entity): entity is Monster {
  return entity.type === 'monster' || 'role' in entity;
}

export function isCharacter(entity: Entity): entity is Hero | Monster {
  return isHero(entity) || isMonster(entity);
}

// Usage - type narrows after guard
function getMaxStamina(entity: Entity): number {
  if (isHero(entity)) {
    return HeroLogic.getMaxStamina(entity); // TypeScript knows it's Hero
  }
  if (isMonster(entity)) {
    return MonsterLogic.getStamina(entity); // TypeScript knows it's Monster
  }
  return 0;
}
```

### 7. FormatLogic (Display Strings)

**When to use:** Any text formatting that appears in multiple places.

### 8. Scene Stage Routing

**When to use:** Rendering different UI based on active scene type.

**Pattern:**

```typescript
// Scene type → Component mapping
const SCENE_STAGES: Record<SceneType, ComponentType> = {
  battle: BattleStage,
  montage: MontageStage,
  negotiation: NegotiationStage,
  respite: RespiteStage,
  story: StoryStage,
};

// Router component selects based on scene.state.type
function SceneStageRouter({ scene, isDirector, heroes, ... }: Props) {
  if (!scene) return <NoSceneState />;

  const sceneType = scene.state?.type;

  switch (sceneType) {
    case 'battle':
      return isDirector
        ? <ConnectedBattleStage ... />  // Full combat integration
        : <BattleStage ... />;          // Simplified player view
    case 'montage':
      return <MontageStage state={scene.state} isDirector={isDirector} ... />;
    // ... etc
  }
}
```

**Benefits:**

- Single routing point for all scene types
- Type-safe scene → component mapping
- Different views for Director vs Player
- Lazy loading for code splitting

**Location:** `packages/ui/src/components/SceneStageRouter.tsx`

### 9. Scene Pane Contract (Left/Right Sidebars)

**When to use:** Rendering different sidebar content based on scene mode.

**Pattern:**

```typescript
// ConnectedPanes routes left/right sidebars based on scene mode
function ConnectedPanes({ session, isDirector, ... }: Props) {
  const mode = getSceneMode(session.activeScene);  // 'battle' | 'montage' | etc.

  const renderLeftPane = () => {
    switch (mode) {
      case 'battle':
        return <BattleLeftPane enemies={enemies} malice={malice} ... />;
      case 'montage':
        return isDirector
          ? <MontageDirectorLeftPane state={montageState} ... />
          : <MontagePlayerLeftPane state={montageState} ... />;
      // ...
    }
  };

  // Similar for renderRightPane()
}
```

**Pane Contents by Mode:**

| Mode        | Left Pane          | Right Pane         |
| ----------- | ------------------ | ------------------ |
| Story       | NPCs/Scripts       | Party Members      |
| Battle      | Enemies/Malice     | Party (live stats) |
| Montage     | Challenge/Progress | Party + Skills     |
| Negotiation | NPC/Interest       | Party + Skills     |
| Respite     | Location/Projects  | Party + Activities |

**Location:** `packages/ui/src/panes/ConnectedPanes.tsx`

### 10. Director vs Player Views

**When to use:** Features that show different UI based on user role.

**Pattern:**

```typescript
// Director gets full control, Player gets read-only or limited view
interface MontageStageProps {
  state: MontageState;
  isDirector: boolean;  // Determines which view to show
  heroCount?: number;
  // Director-only callbacks
  onRecordTest?: () => void;
  onSetOutcome?: () => void;
}

function MontageStage({ state, isDirector, ... }: Props) {
  // Director gets full control panel
  if (isDirector) {
    return <MontageDirectorSheet state={state} ... />;
  }
  // Player gets read-only progress view
  return <MontagePlayerStage state={state} ... />;
}
```

**Key principle:** Director-only callbacks are optional props, only provided when `isDirector=true`.

### 11. Presentation System (Go Live)

**When to use:** Director needs to control what players see without exposing work-in-progress.

**Pattern:**

```typescript
// Director edits working state, players see presented snapshot
interface SessionMetadata {
  activeSceneId: string; // Director's working scene
  presentedSceneId: string | null; // What players see (null = waiting)
  presentedSceneState: PresentedSceneSnapshot | null; // Frozen snapshot
  presentedAt: number | null; // When last presented
  lastPresentedSnapshot: PresentedSceneSnapshot | null; // For restore after hide
}

// Go Live creates immutable snapshot
const snapshot = PresentationLogic.createSnapshot(scene, entities);

// Status derived from state comparison
const status = PresentationLogic.getStatus(activeId, presentedId, isDirty);
// → 'live' | 'draft' | 'modified' | 'hidden'

// UI helpers for player-aware routing
const showWaiting = useShouldShowWaitingScreen(isDirector);
const scene = usePlayerScene(isDirector); // activeScene or presentedScene
```

**Flow:**

```
Director edits activeScene
        │
        ▼ [Go Live]
Creates PresentedSceneSnapshot (frozen copy)
        │
        ▼
Players see presentedScene (or PlayerWaitingScreen if null)
        │
        ▼ [Hide]
Sets presentedScene to null, caches to lastPresentedSnapshot
        │
        ▼ [Restore]
Restores from lastPresentedSnapshot
```

**Location:**

- Types: `packages/types/src/presentation.ts`
- Logic: `packages/data/src/logic/presentation-logic.ts`
- Hooks: `packages/ui/src/hooks/useSession.ts` (`useShouldShowWaitingScreen`, `usePlayerScene`)
- UI: `packages/ui/src/shell/PresentationControls.tsx`, `packages/ui/src/components/PlayerWaitingScreen.tsx`

### 12. Role-Based Stage Routing

**When to use:** Stages that show different content based on user role.

**Pattern:**

```typescript
// Stages accept isDirector prop for conditional rendering
interface NegotiationStageProps {
  state: NegotiationState;
  isDirector?: boolean;
  motivations?: MotivationCard[];
  // ...scene-specific props
}

function NegotiationStage({ isDirector = true, motivations, ... }: Props) {
  // Internal filtering, not separate components
  const visibleMotivations = isDirector
    ? motivations
    : motivations.filter(m => m.isRevealed);

  // Conditional interaction
  const canReveal = isDirector && !motivation.isRevealed;

  return (
    <div>
      {visibleMotivations.map(m => (
        <MotivationCard
          key={m.id}
          disabled={!canReveal}
          onClick={() => canReveal && onReveal(m.id)}
        />
      ))}
    </div>
  );
}

// SceneStageRouter passes isDirector to all stages
<NegotiationStage isDirector={isDirector} motivations={mapped} />
<RespiteStage isDirector={isDirector} locationName={location} />
<StoryStage isDirector={isDirector} directorNotes={notes} />
```

**Player View Behaviors:**

| Scene       | Players See                                           | Players Don't See                                |
| ----------- | ----------------------------------------------------- | ------------------------------------------------ |
| Battle      | Initiative panel, action bar (their turn), combat log | Director controls, fog mode, malice manipulation |
| Negotiation | NPC, meters, revealed motivations                     | Unrevealed motivations, reveal buttons           |
| Respite     | Activities (view-only), location                      | Selection buttons, "assigned by Director"        |
| Story       | Background, portraits, read-aloud text                | Director notes                                   |
| Montage     | Progress, revealed test results                       | Director sheet, adjust controls                  |

**Key principle:** Use internal filtering over separate components for simple stages. Only create separate player components (like `MontagePlayerStage`) when the UI is substantially different.

**Pattern:**

```typescript
class FormatLogic {
  // Numbers
  static getSignedNumber(value: number): string {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  // Game concepts
  static formatTier(tier: Tier): string {
    const num = tier === 'tier1' ? 1 : tier === 'tier2' ? 2 : 3;
    return `Tier ${num}`;
  }

  // Lists
  static joinWithAnd(items: string[]): string {
    if (items.length <= 1) return items[0] ?? '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
  }
}
```

---

## Decision Framework

### "Where does this code belong?"

```
Is it a calculation or derivation?
  → Logic module (HeroLogic, MonsterLogic, etc.)

Is it creating a new entity?
  → FactoryLogic

Is it transforming template → instance?
  → SessionLogic

Is it formatting text for display?
  → FormatLogic

Is it handling schema migrations?
  → UpdateLogic

Is it managing async operations or side effects?
  → Core orchestrator or service

Is it rendering UI?
  → React component

Is it connecting UI to Logic?
  → React hook (useHeroStats, useSceneOutcome, etc.)

Is it routing based on scene type?
  → SceneStageRouter (center stage)
  → ConnectedPanes (left/right sidebars)

Is it starting/stopping a scene?
  → SessionLogic (startBattle, startMontage, completeScene)

Is it scene-specific UI?
  → Scene stage component (BattleStage, MontageStage, etc.)

Is it shared across scene types?
  → Shared pane component (packages/ui/src/panes/shared/)
```

### "Should I create a new Logic module?"

Create a new module when:

- [ ] 3+ functions relate to the same entity/concept
- [ ] Logic is duplicated across 2+ files
- [ ] Complex calculations need unit testing
- [ ] Business rules should be documented in one place

Don't create a new module when:

- [ ] Only 1-2 simple functions
- [ ] Logic is truly UI-specific (animations, layout)
- [ ] It would be a "junk drawer" of unrelated functions

### "Static class vs exported functions?"

**Forgesteel uses static classes:**

```typescript
export class HeroLogic {
  static getMaxStamina(hero: Hero): number { ... }
}
// Usage: HeroLogic.getMaxStamina(hero)
```

**Alternative: named exports:**

```typescript
export function getMaxStamina(hero: Hero): number { ... }
// Usage: import { getMaxStamina } from './hero-logic';
```

**Recommendation:** Match Forgesteel (static classes) for:

- Consistency with reference implementation
- Clear namespacing (HeroLogic._ vs MonsterLogic._)
- Easier to discover related functions

---

## Anti-Patterns to Avoid

### ❌ Calculations in Components

```typescript
// BAD - calculation in component
function HeroCard({ hero }) {
  const maxStamina = hero.baseStamina +
    hero.ancestry.staminaBonus +
    hero.class.staminaPerLevel * hero.level;
  return <div>{maxStamina}</div>;
}

// GOOD - delegate to Logic
function HeroCard({ hero }) {
  const maxStamina = HeroLogic.getMaxStamina(hero);
  return <div>{maxStamina}</div>;
}
```

### ❌ Mutating Templates

```typescript
// BAD - mutates the template
function startScene(template) {
  template.state = { started: true }; // Mutates original!
  return template;
}

// GOOD - deep copy first
function startScene(template) {
  const instance = Utils.deepCopy(template);
  instance.id = Utils.generateId();
  instance.state = { started: true };
  return instance;
}
```

### ❌ Nullable Field Assumptions

```typescript
// BAD - assumes field exists
function getSpeed(hero: Hero): number {
  return hero.kit.speed + hero.ancestry.speedBonus; // 💥 if kit is null
}

// GOOD - defensive with defaults
function getSpeed(hero: Hero): number {
  let speed = hero.baseSpeed ?? 5;
  if (hero.kit) speed += hero.kit.speedBonus ?? 0;
  if (hero.ancestry) speed += hero.ancestry.speedBonus ?? 0;
  return speed;
}
```

### ❌ Logic in Hooks (Beyond Orchestration)

```typescript
// BAD - complex calculation in hook
function useHeroStats(hero: Hero) {
  const maxStamina = useMemo(() => {
    let stamina = hero.baseStamina;
    hero.features.forEach((f) => {
      if (f.type === 'bonus' && f.field === 'stamina') {
        stamina += f.value;
      }
    });
    return stamina;
  }, [hero]);

  return { maxStamina };
}

// GOOD - hook delegates to Logic
function useHeroStats(hero: Hero) {
  const maxStamina = useMemo(() => HeroLogic.getMaxStamina(hero), [hero]);

  return { maxStamina };
}
```

### ❌ Skipping UpdateLogic

```typescript
// BAD - assumes data has all fields
async function getHero(id: string) {
  const { data } = await supabase.from('heroes').select().single();
  return snakeToCamel(data); // 💥 if old data missing new fields
}

// GOOD - always update
async function getHero(id: string) {
  const { data } = await supabase.from('heroes').select().single();
  const hero = snakeToCamel(data);
  HeroUpdateLogic.update(hero); // Safe for any data version
  return hero;
}
```

---

## Module Responsibilities

### Current Logic Modules

| Module              | Responsibility                 | Key Functions                                       |
| ------------------- | ------------------------------ | --------------------------------------------------- |
| `HeroLogic`         | Hero stat derivation, features | `getMaxStamina`, `getFeatures`, `getAbilities`      |
| `MonsterLogic`      | Monster stats, role handling   | `getStamina`, `getRoleMultiplier`, `getCombatState` |
| `RollLogic`         | Power roll resolution          | `getTier`, `getNetEdgeBane`, `getDiceCount`         |
| `ConditionLogic`    | Condition effects              | `getConditionEffect`, `getConditionDescription`     |
| `MontageLogic`      | Montage test limits/outcomes   | `getEffectiveSuccessLimit`, `calculateOutcome`      |
| `NegotiationLogic`  | Interest, patience, phases     | `getInterestChange`, `getPhase`                     |
| `RespiteLogic`      | Activity resolution            | `getProjectProgress`, `getActivityOutcome`          |
| `BattleLogic`       | Turn economy, malice           | `getMalicePerRound`, `canUseAction`                 |
| `EncounterLogic`    | EV calculation, difficulty     | `getPartyEVBudget`, `calculateEncounterEV`          |
| `WizardLogic`       | Character creation validation  | `validateStep`, `canProceed`                        |
| `KitLogic`          | Kit bonuses                    | `getKitBonuses`, `getSignatureAbility`              |
| `AbilityLogic`      | Distance/damage parsing        | `parseDistance`, `calculateTierDamage`              |
| `EntityStatusLogic` | Stamina display, colors        | `getStaminaColor`, `getHealthStatus`                |
| `SessionLogic`      | Template → instance            | `startBattle`, `startMontage`, `resetScene`         |
| `FactoryLogic`      | Entity creation                | `createHero`, `createBattleScene`                   |
| `FormatLogic`       | Text formatting                | `getSignedNumber`, `formatTier`                     |
| `UpdateLogic`       | Schema migration               | `HeroUpdateLogic.update`, `SceneUpdateLogic.update` |
| `PresentationLogic` | Presentation snapshot, status  | `createSnapshot`, `getStatus`, `hasUnsyncedChanges` |

### UI Routing Components

| Component                   | Responsibility                    | Location                      |
| --------------------------- | --------------------------------- | ----------------------------- |
| `SceneStageRouter`          | Routes center stage by scene type | `packages/ui/src/components/` |
| `ConnectedSceneStageRouter` | Presentation-aware routing        | `packages/ui/src/components/` |
| `ConnectedPanes`            | Routes left/right panes by mode   | `packages/ui/src/panes/`      |
| `ConnectedShell`            | Main layout with navigation       | `packages/ui/src/shell/`      |
| `PresentationControls`      | Go Live/Hide/Update UI (Director) | `packages/ui/src/shell/`      |
| `PlayerWaitingScreen`       | Shown when no scene presented     | `packages/ui/src/components/` |

### When to Add to Existing vs Create New

**Add to existing module when:**

- Function operates on same entity type
- Function is closely related to existing functions
- Would be confusing if in separate module

**Create new module when:**

- New entity type or concept
- Would make existing module too large (>500 lines)
- Distinct responsibility that deserves isolation

---

## Testing Strategy

### Unit Test Logic Modules

```typescript
describe('HeroLogic', () => {
  describe('getMaxStamina', () => {
    it('returns base stamina when no bonuses', () => {
      const hero = createTestHero({ baseStamina: 20 });
      expect(HeroLogic.getMaxStamina(hero)).toBe(20);
    });

    it('includes ancestry bonus', () => {
      const hero = createTestHero({
        baseStamina: 20,
        ancestry: { features: [{ type: 'bonus', field: 'stamina', value: 5 }] },
      });
      expect(HeroLogic.getMaxStamina(hero)).toBe(25);
    });

    it('handles missing ancestry gracefully', () => {
      const hero = createTestHero({ baseStamina: 20, ancestry: null });
      expect(HeroLogic.getMaxStamina(hero)).toBe(20); // No crash
    });
  });
});
```

### Test Patterns

1. **Happy path** - Normal inputs produce expected outputs
2. **Edge cases** - Empty arrays, null values, zero, negative numbers
3. **Boundary conditions** - Exactly at thresholds (winded at 50%)
4. **Idempotence** - UpdateLogic produces same result when called twice

### What NOT to Test in Logic

- React rendering (test in component tests)
- Database operations (test in integration tests)
- UI interactions (test in E2E tests)

---

## Quick Reference

### Creating a New Feature

1. **Define types** in `@anvil/types`
2. **Create Logic module** in `@anvil/data/logic/`
3. **Add factory functions** if creating new entities
4. **Add UpdateLogic** for the new entity type
5. **Create hook** in `@anvil/ui` that delegates to Logic
6. **Build components** that use the hook

### Adding a Derived Stat

1. Add function to appropriate Logic module
2. Function should:
   - Take entity as first parameter
   - Return computed value
   - Handle null/undefined defensively
   - Use Collections utilities for array operations
3. Add tests covering edge cases
4. Export from logic index

### Debugging Calculation Issues

1. **Check Logic module** - Is the calculation correct?
2. **Check UpdateLogic** - Is old data missing fields?
3. **Check hook** - Is it calling Logic correctly?
4. **Check component** - Is it using hook result correctly?

### Common Imports

```typescript
// In Logic modules
import { Collections } from './collections';
import type { Hero, Monster, Ability } from '@anvil/types';

// In hooks
import { HeroLogic, MonsterLogic, FormatLogic } from '@anvil/data';
import { useMemo, useCallback } from 'react';

// In services
import { HeroUpdateLogic, SceneUpdateLogic } from '@anvil/data';
```

---

## Battle Scene Implementation Notes

### Existing Infrastructure (January 2026)

When implementing Battle scene UI, we found extensive existing infrastructure:

**What existed (20+ components):**

- `BattleScene.tsx` - Full layout with BattleProvider
- `BattleContext.tsx` - State management via useReducer
- `TopBar`, `LeftPanel`, `RightPanel`, `BottomBar`, `CenterStage` - Layout components
- `InitiativePanel`, `ActionBar`, `CombatLog`, `TurnIndicator` - Combat UI
- `MaliceTracker`, `DirectorCombatControls`, `PowerRollDialog` - Director features
- `TargetingOverlay`, `SlideDirectionPicker`, `ForcedMovementResult` - Action resolution
- `AttackResolutionPanel`, `OpportunityAttackPrompt` - Attack workflow

**What was added to fill gaps:**

- `BattleSetupPanel.tsx` - Pre-combat configuration, initiative rolling
- `DamageDialog.tsx` - Apply damage with types/immunities/weaknesses
- `HealDialog.tsx` - Healing via recovery, direct, or temp stamina
- `ConditionManager.tsx` - Add/remove Draw Steel conditions

### Key Patterns Used in Battle

1. **All health checks via Logic:**

   ```typescript
   EntityStatusLogic.isWinded(current, max);
   EntityStatusLogic.isDying(current);
   EntityStatusLogic.getStaminaColorVar(current, max);
   EntityStatusLogic.getStaminaPercentage(current, max);
   ```

2. **Malice display via Logic:**

   ```typescript
   BattleLogic.getMalicePerRound(heroCount);
   BattleLogic.getMaliceColorClass(malice);
   BattleLogic.getMaliceLevelDescription(malice);
   ```

3. **Monster instantiation via SessionLogic:**

   ```typescript
   SessionLogic.startBattle(template, party);
   SessionLogic.instantiateMonsters(encounterSlots);
   SessionLogic.createHeroBattleState(hero);
   SessionLogic.createMonsterBattleState(monster);
   ```

4. **Damage calculation:**
   ```typescript
   BattleLogic.calculateDamage(rawDamage, damageType, target);
   BattleLogic.calculateFreeStrikeDamage(attacker);
   BattleLogic.calculateBleedingDamage(entity);
   ```

### Lesson Learned

**Check existing code before building.** The `packages/ui/src/battle/` folder had most infrastructure already. Initial task document assumed building from scratch, but exploration revealed we only needed gap-filling.

### Scene Routing Pattern

The `SceneStageRouter` component (`packages/ui/src/components/SceneStageRouter.tsx`) provides:

- Lazy loading of stage components
- Director vs Player view switching
- Type-safe scene → component routing
- Empty state handling

Usage:

```typescript
<SceneStageRouter
  scene={activeScene}
  heroes={heroes}
  isDirector={true}
  onUpdateScene={handleUpdate}
  onEndScene={handleEnd}
/>
```

---

## Appendix: Forgesteel Source Locations

Reference locations in `andyaiken-forgesteel_gitingest.txt`:

| Module                | Approximate Lines |
| --------------------- | ----------------- |
| HeroLogic             | 140000-141500     |
| MonsterLogic          | 143500-143700     |
| AbilityLogic          | 141800-142200     |
| SessionLogic          | 145130-145267     |
| MontageLogic          | 144070-144165     |
| NegotiationLogic      | 144170-144250     |
| FactoryLogic          | 128000-138000     |
| HeroUpdateLogic       | 151373-151600     |
| SourcebookUpdateLogic | 152400-152800     |
| Collections           | 125400-125500     |

---

_Last updated: January 2026 - Added Presentation System (Pattern #11), Role-Based Stage Routing (Pattern #12)_
_Reference codebase: andyaiken/forgesteel_
