# Anvil V2 — Draw Steel Ruleset Implementation

> How game mechanics integrate with the revised real-time architecture

---

## Overview

Anvil V2 implements Draw Steel rules using a **three-layer architecture**:

1. **Static Game Data** (`@anvil/data`) — Compendium of ancestries, classes, abilities, monsters
2. **Pure Logic Modules** (`@anvil/data/logic`) — Stateless calculation functions
3. **Runtime Resolution** (Server + Client) — Where logic meets multiplayer state

The key insight from Forgesteel: **store source data, compute derived data**. Never persist calculated values.

---

## 1. Static Game Data Layer

### 1.1 Data Organization

```
packages/data/
├── src/
│   ├── game-data/           # The compendium
│   │   ├── index.ts         # GameData singleton
│   │   ├── ancestries/      # Ancestry definitions
│   │   ├── classes/         # Class definitions  
│   │   ├── cultures/        # Culture options
│   │   ├── careers/         # Career backgrounds
│   │   ├── kits/            # Equipment kits
│   │   ├── abilities/       # All abilities (class, ancestry, kit)
│   │   ├── conditions/      # The 9 conditions
│   │   ├── monsters/        # Monster stat blocks
│   │   └── skills/          # Skill definitions
│   │
│   ├── logic/               # Pure calculation functions
│   │   ├── hero-logic.ts
│   │   ├── monster-logic.ts
│   │   ├── combat-logic.ts
│   │   ├── roll-logic.ts
│   │   └── ... (see Logic Modules)
│   │
│   └── types/               # TypeScript interfaces
│       ├── hero.ts
│       ├── monster.ts
│       ├── ability.ts
│       └── ...
```

### 1.2 GameData API

The `GameData` singleton provides typed access to all compendium content:

```typescript
// packages/data/src/game-data/index.ts

class GameData {
  private static instance: GameData;
  
  // Lazy-loaded collections
  private _ancestries: Map<string, Ancestry> | null = null;
  private _classes: Map<string, HeroClass> | null = null;
  private _abilities: Map<string, Ability> | null = null;
  private _monsters: Map<string, Monster> | null = null;
  
  // Access methods
  getAncestry(id: string): Ancestry | undefined {
    return this.ancestries.get(id);
  }
  
  getClass(id: string): HeroClass | undefined {
    return this.classes.get(id);
  }
  
  getAbility(id: string): Ability | undefined {
    return this.abilities.get(id);
  }
  
  getMonster(id: string): Monster | undefined {
    return this.monsters.get(id);
  }
  
  // Filtered queries
  getAbilitiesByClass(classId: string): Ability[] {
    return Array.from(this.abilities.values())
      .filter(a => a.sourceClass === classId);
  }
  
  getMonstersByRole(role: MonsterRole): Monster[] {
    return Array.from(this.monsters.values())
      .filter(m => m.role === role);
  }
  
  // Singleton access
  static getInstance(): GameData {
    if (!GameData.instance) {
      GameData.instance = new GameData();
    }
    return GameData.instance;
  }
}

export const gameData = GameData.getInstance();
```

### 1.3 Data Format (Matching Forgesteel)

```typescript
// Ancestry example
interface Ancestry {
  id: string;
  name: string;
  description: string;
  features: Feature[];  // Bonuses, abilities granted
  size: Size;
  speed: number;
  // Forgesteel pattern: features contain ALL mechanical effects
}

// Feature - the universal bonus container
interface Feature {
  id: string;
  name: string;
  description: string;
  type: FeatureType;  // 'bonus' | 'ability' | 'choice' | 'text'
  
  // For bonus type
  field?: string;      // 'stamina' | 'speed' | 'stability' | etc.
  value?: number;
  
  // For ability type  
  abilityId?: string;
  
  // For choice type
  choices?: FeatureChoice[];
  count?: number;
}

// Class example
interface HeroClass {
  id: string;
  name: string;
  description: string;
  heroicResource: HeroicResourceType;
  primaryCharacteristics: Characteristic[];
  baseStamina: number;
  staminaPerLevel: number;
  baseRecoveries: number;
  
  // Features organized by level
  featuresByLevel: {
    level: number;
    features: Feature[];
  }[];
  
  // Subclass options
  subclasses: Subclass[];
  
  // Class abilities
  abilities: Ability[];
}
```

---

## 2. Pure Logic Modules

### 2.1 The Forgesteel Pattern

All calculations live in **static Logic classes** that:
- Take entity as first parameter
- Return computed values
- Handle null/undefined defensively
- Never mutate input
- Have no side effects

```typescript
// packages/data/src/logic/hero-logic.ts

export class HeroLogic {
  /**
   * Collect ALL features from ALL sources for a hero.
   * This is the foundation - other calculations derive from this.
   */
  static getFeatures(hero: Hero): FeatureWithSource[] {
    const features: FeatureWithSource[] = [];
    
    // From ancestry
    if (hero.ancestry) {
      const ancestry = gameData.getAncestry(hero.ancestry.id);
      ancestry?.features.forEach(f => {
        features.push({ feature: f, source: ancestry.name, sourceType: 'ancestry' });
      });
    }
    
    // From culture
    if (hero.culture) {
      hero.culture.features?.forEach(f => {
        features.push({ feature: f, source: hero.culture.name, sourceType: 'culture' });
      });
    }
    
    // From class (level-gated)
    if (hero.heroClass) {
      const cls = gameData.getClass(hero.heroClass.id);
      cls?.featuresByLevel
        .filter(lvl => lvl.level <= hero.level)
        .flatMap(lvl => lvl.features)
        .forEach(f => {
          features.push({ feature: f, source: cls.name, sourceType: 'class' });
        });
    }
    
    // From kit
    if (hero.kit) {
      const kit = gameData.getKit(hero.kit.id);
      kit?.features.forEach(f => {
        features.push({ feature: f, source: kit.name, sourceType: 'kit' });
      });
    }
    
    // From titles, complications, etc.
    // ...
    
    return features;
  }

  /**
   * Calculate max stamina from ALL sources
   */
  static getMaxStamina(hero: Hero): number {
    // Base from class
    let stamina = 0;
    if (hero.heroClass) {
      const cls = gameData.getClass(hero.heroClass.id);
      if (cls) {
        stamina = cls.baseStamina + (cls.staminaPerLevel * (hero.level - 1));
      }
    }
    
    // Add bonuses from features
    HeroLogic.getFeatures(hero)
      .filter(f => f.feature.type === 'bonus' && f.feature.field === 'stamina')
      .forEach(f => {
        stamina += f.feature.value ?? 0;
      });
    
    return stamina;
  }

  /**
   * Calculate recovery value (1/3 of max stamina, rounded down)
   */
  static getRecoveryValue(hero: Hero): number {
    return Math.floor(HeroLogic.getMaxStamina(hero) / 3);
  }

  /**
   * Is the hero winded? (at or below half stamina)
   */
  static isWinded(hero: Hero, currentStamina: number): boolean {
    return currentStamina <= HeroLogic.getMaxStamina(hero) / 2;
  }

  /**
   * Get all abilities available to this hero
   */
  static getAbilities(hero: Hero): AbilityWithSource[] {
    const abilities: AbilityWithSource[] = [];
    
    // From class
    if (hero.heroClass) {
      const cls = gameData.getClass(hero.heroClass.id);
      cls?.abilities
        .filter(a => a.level <= hero.level)
        .forEach(a => {
          abilities.push({ ability: a, source: cls.name });
        });
    }
    
    // From kit signature ability
    if (hero.kit) {
      const kit = gameData.getKit(hero.kit.id);
      if (kit?.signatureAbility) {
        abilities.push({ 
          ability: kit.signatureAbility, 
          source: kit.name,
          isSignature: true 
        });
      }
    }
    
    // From features that grant abilities
    HeroLogic.getFeatures(hero)
      .filter(f => f.feature.type === 'ability' && f.feature.abilityId)
      .forEach(f => {
        const ability = gameData.getAbility(f.feature.abilityId!);
        if (ability) {
          abilities.push({ ability, source: f.source });
        }
      });
    
    return abilities;
  }

  /**
   * Get characteristic modifier
   */
  static getCharacteristicModifier(hero: Hero, char: Characteristic): number {
    const base = hero.characteristics?.[char] ?? 0;
    
    // Add bonuses from features
    const bonus = Collections.sum(
      HeroLogic.getFeatures(hero).filter(
        f => f.feature.type === 'bonus' && f.feature.field === char
      ),
      f => f.feature.value ?? 0
    );
    
    return base + bonus;
  }
}
```

### 2.2 Monster Logic

```typescript
// packages/data/src/logic/monster-logic.ts

export class MonsterLogic {
  /**
   * Get effective stamina based on role
   */
  static getStamina(monster: Monster): number {
    const base = monster.baseStamina;
    const multiplier = MonsterLogic.getRoleMultiplier(monster.role);
    return Math.floor(base * multiplier);
  }
  
  /**
   * Role multipliers for minion/grunt/elite/boss
   */
  static getRoleMultiplier(role: MonsterRole): number {
    switch (role) {
      case 'minion': return 0.25;  // Dies in one hit
      case 'grunt': return 0.5;
      case 'standard': return 1;
      case 'elite': return 2;
      case 'boss': return 4;
      default: return 1;
    }
  }

  /**
   * Calculate Encounter Value (EV) for encounter building
   */
  static getEncounterValue(monster: Monster): number {
    // EV formula from Draw Steel
    const levelFactor = monster.level * 2;
    const roleMultiplier = MonsterLogic.getRoleMultiplier(monster.role);
    return Math.ceil(levelFactor * roleMultiplier);
  }

  /**
   * Get all abilities for a monster
   */
  static getAbilities(monster: Monster): Ability[] {
    return monster.abilities.map(id => gameData.getAbility(id)).filter(Boolean) as Ability[];
  }
}
```

### 2.3 Roll Logic

```typescript
// packages/data/src/logic/roll-logic.ts

export class RollLogic {
  /**
   * Determine result tier from total
   */
  static getTier(total: number): Tier {
    if (total >= 17) return 'tier3';
    if (total >= 12) return 'tier2';
    return 'tier1';
  }

  /**
   * Calculate net edge/bane
   */
  static getNetEdgeBane(edges: number, banes: number): { net: number; type: 'edge' | 'bane' | 'normal' } {
    const net = edges - banes;
    if (net > 0) return { net, type: 'edge' };
    if (net < 0) return { net: Math.abs(net), type: 'bane' };
    return { net: 0, type: 'normal' };
  }

  /**
   * Determine dice pool size
   */
  static getDiceCount(edges: number, banes: number): number {
    const { net, type } = RollLogic.getNetEdgeBane(edges, banes);
    if (type === 'normal') return 2;
    return 2 + net;  // 3 dice for edge/bane, keep best/worst 2
  }

  /**
   * Calculate total damage for a tier
   */
  static calculateTierDamage(ability: Ability, tier: Tier, characteristic: number): number {
    const tierDamage = ability.damage?.[tier];
    if (!tierDamage) return 0;
    
    // Parse damage string like "2d6 + M" where M = characteristic
    return DamageParser.evaluate(tierDamage, { characteristic });
  }
}
```

### 2.4 Combat Logic

```typescript
// packages/data/src/logic/combat-logic.ts

export class CombatLogic {
  /**
   * Calculate malice gained per round
   */
  static getMalicePerRound(enemyCount: number): number {
    // Base 2 + 1 per 3 enemies
    return 2 + Math.floor(enemyCount / 3);
  }

  /**
   * Check if entity can use a specific action type
   */
  static canUseAction(
    economy: ActionEconomy,
    actionType: ActionType,
    currentTurn: boolean
  ): boolean {
    switch (actionType) {
      case 'mainAction':
        return currentTurn && !economy.mainActionUsed;
      case 'maneuver':
        return currentTurn && !economy.maneuverUsed;
      case 'moveAction':
        return currentTurn && !economy.moveActionUsed;
      case 'triggeredAction':
        // Can use triggered action on any turn, but only once per round
        return !economy.triggeredActionUsed;
      default:
        return false;
    }
  }

  /**
   * Apply condition effects to a roll
   */
  static getConditionModifiers(conditions: ConditionInstance[]): RollModifiers {
    let edges = 0;
    let banes = 0;
    
    for (const condition of conditions) {
      switch (condition.name) {
        case 'dazed':
          banes += 1;  // Bane on all rolls
          break;
        case 'frightened':
          // Bane on rolls against the fear source
          if (condition.sourceId) banes += 1;
          break;
        case 'weakened':
          // -2 to damage (handled separately)
          break;
        // ... other conditions
      }
    }
    
    return { edges, banes };
  }

  /**
   * Calculate forced movement distance
   */
  static getForcedMovementDistance(
    ability: Ability,
    tier: Tier,
    characteristic: number
  ): number {
    const movement = ability.forcedMovement?.[tier];
    if (!movement) return 0;
    
    // Parse like "M squares" where M = characteristic
    return movement.baseSquares + (movement.perCharacteristic ? characteristic : 0);
  }
}
```

### 2.5 Scene-Specific Logic

```typescript
// Montage Logic
export class MontageLogic {
  static getEffectiveSuccessLimit(montage: MontageState, heroCount: number): number {
    const base = montage.baseSuccessLimit;
    if (montage.heroCountAdjustment) {
      return base + Math.floor(heroCount / 2);
    }
    return base;
  }

  static calculateOutcome(montage: MontageState): MontageOutcome {
    const successLimit = MontageLogic.getEffectiveSuccessLimit(montage, montage.heroCount);
    
    if (montage.currentSuccesses >= successLimit) return 'total_success';
    if (montage.currentFailures >= montage.baseFailureLimit) return 'total_failure';
    if (montage.currentSuccesses > 0) return 'partial_success';
    return 'total_failure';
  }
}

// Negotiation Logic
export class NegotiationLogic {
  static getInterestChange(argument: NegotiationArgument, npc: NegotiationNPC): number {
    // Check if argument hits a motivation
    if (npc.motivations.some(m => m.id === argument.motivationId)) {
      return +1;
    }
    // Check if argument hits a pitfall
    if (npc.pitfalls.some(p => p.id === argument.pitfallId)) {
      return -1;
    }
    return 0;
  }

  static getOfferQuality(interest: number): OfferQuality {
    if (interest <= 0) return 'hostile';      // "No, and..."
    if (interest <= 2) return 'reluctant';    // "No, but..."
    if (interest <= 3) return 'conditional';  // "Yes, but..."
    return 'generous';                         // "Yes, and..."
  }
}
```

---

## 3. Runtime Resolution

### 3.1 Where Logic Runs

| Calculation | Location | Why |
|-------------|----------|-----|
| Max stamina | Client | Display only, no trust needed |
| Damage dealt | Server | Must be authoritative |
| Dice rolls | Server | Fairness, trust |
| Visibility | Client | Performance (see revised architecture) |
| Condition effects | Both | Client for UI hints, server for validation |
| Turn order | Server | Authoritative |
| Action economy | Server | Prevent cheating |

### 3.2 Server-Side Rules Enforcement

The Durable Object runs the same Logic modules but validates actions:

```typescript
// apps/server/src/durable-objects/SessionRoom.ts

import { HeroLogic, MonsterLogic, CombatLogic, RollLogic } from '@anvil/data';

class SessionRoom {
  private handleAbilityUse(
    userId: string,
    sourceEntityId: string,
    targetEntityId: string,
    abilityId: string
  ) {
    // 1. Get entities
    const source = this.getEntity(sourceEntityId);
    const target = this.getEntity(targetEntityId);
    const ability = gameData.getAbility(abilityId);
    
    if (!source || !ability) {
      return this.sendError(userId, 'INVALID_ABILITY', 'Ability not found');
    }
    
    // 2. Validate ownership
    if (!this.canControl(userId, sourceEntityId)) {
      return this.sendError(userId, 'PERMISSION_DENIED', 'Not your entity');
    }
    
    // 3. Validate action economy
    const economy = this.combat!.actionEconomy[sourceEntityId];
    const actionType = ability.actionType as ActionType;
    
    if (!CombatLogic.canUseAction(economy, actionType, this.isCurrentTurn(sourceEntityId))) {
      return this.sendError(userId, 'ACTION_UNAVAILABLE', `Cannot use ${actionType}`);
    }
    
    // 4. Roll dice (server-side)
    const characteristic = source.type === 'hero' 
      ? HeroLogic.getCharacteristicModifier(source as Hero, ability.characteristic)
      : source.characteristics[ability.characteristic] ?? 0;
    
    const conditions = source.conditions ?? [];
    const { edges, banes } = CombatLogic.getConditionModifiers(conditions);
    const diceCount = RollLogic.getDiceCount(edges, banes);
    
    // Roll using crypto random
    const rolls = this.rollDice(10, diceCount);
    const kept = RollLogic.getNetEdgeBane(edges, banes).type === 'bane'
      ? rolls.sort((a, b) => a - b).slice(0, 2)
      : rolls.sort((a, b) => b - a).slice(0, 2);
    
    const total = kept[0] + kept[1] + characteristic;
    const tier = RollLogic.getTier(total);
    
    // 5. Calculate effects
    const damage = RollLogic.calculateTierDamage(ability, tier, characteristic);
    const forcedMovement = CombatLogic.getForcedMovementDistance(ability, tier, characteristic);
    
    // 6. Apply effects
    if (target && damage > 0) {
      target.stamina.current = Math.max(0, target.stamina.current - damage);
    }
    
    // 7. Mark action used
    this.combat!.actionEconomy[sourceEntityId][`${actionType}Used`] = true;
    
    // 8. Broadcast result
    this.broadcast({
      type: 'ability_resolved',
      sourceEntityId,
      targetEntityId,
      abilityId,
      roll: { dice: rolls, kept, total, tier },
      damage,
      forcedMovement,
    });
    
    // 9. Persist combat action
    this.persistence.persistCombatAction({
      type: 'ability',
      sourceEntityId,
      targetEntityId,
      abilityId,
      result: { tier, damage, forcedMovement },
    });
  }
}
```

### 3.3 Client-Side Display

Clients use the same Logic modules for display, but don't trust local calculations for actions:

```typescript
// apps/vtt/src/hooks/useHeroStats.ts

import { HeroLogic } from '@anvil/data';
import { useMemo } from 'react';

export function useHeroStats(hero: Hero | null) {
  const stats = useMemo(() => {
    if (!hero) return null;
    
    return {
      maxStamina: HeroLogic.getMaxStamina(hero),
      recoveryValue: HeroLogic.getRecoveryValue(hero),
      isWinded: HeroLogic.isWinded(hero, hero.stamina?.current ?? 0),
      speed: HeroLogic.getSpeed(hero),
      stability: HeroLogic.getStability(hero),
      abilities: HeroLogic.getAbilities(hero),
      features: HeroLogic.getFeatures(hero),
      
      // Characteristic modifiers
      might: HeroLogic.getCharacteristicModifier(hero, 'might'),
      agility: HeroLogic.getCharacteristicModifier(hero, 'agility'),
      reason: HeroLogic.getCharacteristicModifier(hero, 'reason'),
      intuition: HeroLogic.getCharacteristicModifier(hero, 'intuition'),
      presence: HeroLogic.getCharacteristicModifier(hero, 'presence'),
    };
  }, [hero]);
  
  return stats;
}
```

### 3.4 Handling Rule Ambiguity

Draw Steel has rules that require GM adjudication. Anvil's approach:

| Situation | Anvil Behavior |
|-----------|----------------|
| Ability targets | Show valid targets, let player pick |
| Cover calculation | **Not automated** - GM sets cover manually |
| Triggered action timing | GM invokes via UI when appropriate |
| Free strikes | GM triggers manually |
| Condition duration | System tracks rounds, GM removes |
| Monster special abilities | Listed in UI, GM adjudicates |

**Principle:** Automate the math, not the judgment calls.

---

## 4. Schema Migration (UpdateLogic)

As Draw Steel evolves and we update data structures, old saved heroes/scenes need migration:

```typescript
// packages/data/src/logic/update-logic.ts

export class HeroUpdateLogic {
  /**
   * Migrate hero data to current schema version.
   * Called on every load from database.
   */
  static update(hero: any): Hero {
    // Version 1 → 2: Added kit system
    if (!hero.version || hero.version < 2) {
      hero.kit = hero.kit ?? null;
      hero.version = 2;
    }
    
    // Version 2 → 3: Characteristics restructure
    if (hero.version < 3) {
      if (hero.might !== undefined) {
        hero.characteristics = {
          might: hero.might,
          agility: hero.agility,
          reason: hero.reason,
          intuition: hero.intuition,
          presence: hero.presence,
        };
        delete hero.might;
        delete hero.agility;
        // ...
      }
      hero.version = 3;
    }
    
    // Version 3 → 4: Added heroic resource tracking
    if (hero.version < 4) {
      hero.heroicResource = hero.heroicResource ?? { current: 0, max: 0 };
      hero.version = 4;
    }
    
    // Always ensure required fields exist
    hero.conditions = hero.conditions ?? [];
    hero.selectedAbilities = hero.selectedAbilities ?? [];
    
    return hero as Hero;
  }
}

export class SceneUpdateLogic {
  static update(scene: any): Scene {
    // Similar pattern for scene migrations
    // ...
    return scene as Scene;
  }
}
```

**Usage:** Always run UpdateLogic when loading from database:

```typescript
// In Durable Object
const heroRow = await this.env.DB.prepare('SELECT * FROM heroes WHERE id = ?').bind(id).first();
const hero = HeroUpdateLogic.update(snakeToCamel(heroRow));
```

---

## 5. Module Summary

### Logic Module Responsibilities

| Module | Responsibility | Key Functions |
|--------|---------------|---------------|
| `HeroLogic` | Hero stat derivation | `getMaxStamina`, `getAbilities`, `getFeatures`, `getCharacteristicModifier` |
| `MonsterLogic` | Monster stats, EV | `getStamina`, `getEncounterValue`, `getRoleMultiplier` |
| `RollLogic` | Dice mechanics | `getTier`, `getNetEdgeBane`, `calculateTierDamage` |
| `CombatLogic` | Combat rules | `canUseAction`, `getConditionModifiers`, `getMalicePerRound` |
| `MontageLogic` | Montage outcomes | `getEffectiveSuccessLimit`, `calculateOutcome` |
| `NegotiationLogic` | Interest/patience | `getInterestChange`, `getOfferQuality` |
| `EncounterLogic` | Encounter building | `getPartyEVBudget`, `calculateEncounterEV` |
| `FactoryLogic` | Entity creation | `createHero`, `createBattleScene` |
| `SessionLogic` | Template → instance | `hydrateBattleScene`, `startMontage` |
| `FormatLogic` | Display strings | `getSignedNumber`, `formatTier` |
| `HeroUpdateLogic` | Schema migration | `update` |
| `Collections` | Array utilities | `sum`, `max`, `distinct`, `sort` |

### Decision Framework

```
Where does this code belong?

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

Does it need network/database?
  → Service or Durable Object
```

---

## 6. Integration with Revised Architecture

### Client Flow

```
User clicks ability
    ↓
Client validates locally (can I use this action?)
    ↓
Send to server: { type: 'use_ability', sourceId, targetId, abilityId }
    ↓
Server validates with Logic modules
    ↓
Server rolls dice (crypto random)
    ↓
Server calculates damage with RollLogic
    ↓
Server updates combat state
    ↓
Server broadcasts result to ALL clients
    ↓
Clients update UI from server state
```

### What's Computed Where

```
CLIENT                          SERVER
───────────────────────────────────────────
Display stats (stamina, speed)  Validate actions
Show abilities available        Roll dice  
UI hints (can I click this?)    Calculate damage
Fog of war visibility           Update authoritative state
Animation/interpolation         Persist to D1
                                Broadcast to all
```

### Shared Code

The `@anvil/data` package runs identically on client and server:
- Same Logic modules
- Same GameData compendium
- Same TypeScript types

This ensures calculations are consistent and testable in isolation.

---

*Document Version: 1.0*
*Based on: Forgesteel patterns, Draw Steel rules, Anvil V2 revised architecture*
