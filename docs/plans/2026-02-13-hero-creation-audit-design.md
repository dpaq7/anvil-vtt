# Hero Creation Data Audit — Design Document

**Date:** 2026-02-13
**Status:** Draft — awaiting approval

## Goal

Validate every piece of hero creation data in `@anvil/data` and `@anvil/types` against the Draw Steel source books (`docs/rules_data/data-rules-md/`). Produce a comprehensive Vitest regression suite and a markdown audit report documenting all findings. This is critical for demo readiness — hero creation is the primary player-facing feature and informs all battle scene mechanics.

## Scope

**All 11 classes:** Censor, Conduit, Elementalist, Fury, Null, Shadow, Tactician, Talent, Troubadour + Beastheart (from Forgesteel ref data) + Summoner (from `summoner v10.md`)

**Full number audit:** Every ability's damage values, ranges, conditions, durations, keywords validated line-by-line against source text.

**Outputs:** Vitest test suite + markdown audit report

## Key Discovery: Missing Implementation Files

The exploration revealed two classes are structurally incomplete:
- **Beastheart** — No `packages/data/src/rules/classes/beastheart/` directory. Only has class-definitions.ts entry. Full data in `docs/forgesteel-ref/src/data/classes/beastheart/` (Forgesteel FactoryLogic format).
- **Summoner** — No `packages/data/src/rules/classes/summoner/` directory. Only has class-definitions.ts entry + type files. Source in `docs/rules_data/data-rules-md/summoner v10.md`.

**Both classes will be implemented as part of this plan** (Slices 7A and 7B) before the abilities audit runs, so that all 11 classes can be audited uniformly.

## Approach: Domain-Layer-at-a-Time (Approach A)

Audit each domain slice end-to-end before moving to the next. Each slice produces:
1. A Vitest test file in `packages/data/src/__tests__/audit/`
2. A section in the audit report

### Audit Slices (in dependency order)

Each slice lists what's checked and the source-of-truth document.

---

### Slice 1: Core Mechanics
**Source:** `Chapters/The Basics.md`, `Chapters/Making a Hero.md`, `Chapters/Combat.md`
**Code:** `packages/data/src/logic/hero-logic.ts`, `packages/data/src/game-data/lib/game-rules.ts`
**Test file:** `core-mechanics-audit.test.ts`

Validate:
- [ ] Power Roll tiers: T1 <=11, T2 12-16, T3 17+
- [ ] Edge/Bane: 3d10 keep highest/lowest 2
- [ ] Echelon mapping: L1-3 = 1st, L4-6 = 2nd, L7-9 = 3rd, L10 = 4th
- [ ] Winded threshold: current stamina <= 50% max
- [ ] Dying threshold: stamina <= 0
- [ ] Recovery value: floor(maxStamina / 3)
- [ ] Free strike damage formulas (melee: 2/5/7 + char, ranged: 2/4/6 + char)
- [ ] XP advancement table (10 levels)
- [ ] Size categories and their square counts

---

### Slice 2: Ancestries (12 ancestries)
**Source:** `Ancestries/*.md` (12 files), `Chapters/Ancestries.md`
**Code:** `packages/data/src/game-data/` (ancestry definitions), `packages/types/src/hero/ancestry.ts`
**Test file:** `ancestry-audit.test.ts`

Per ancestry validate:
- [ ] Name matches
- [ ] Size (e.g., 1M for medium, 1S for small)
- [ ] Speed value
- [ ] Signature trait name and effect text
- [ ] Purchasable traits: names, point costs, effect descriptions
- [ ] Total available trait points
- [ ] Any ancestry-specific mechanics (e.g., Revenant undead rules, Dragon Knight breath)

---

### Slice 3: Cultures
**Source:** `Cultures/Environments/*.md`, `Cultures/Organization/*.md`, `Cultures/Upbringing/*.md`, `Chapters/Background.md`
**Code:** Culture definitions in game data
**Test file:** `culture-audit.test.ts`

Validate:
- [ ] All environment options exist with correct skill grants
- [ ] All organization options exist with correct skill grants
- [ ] All upbringing options exist with correct skill/language grants
- [ ] Characteristic bonuses from culture selections
- [ ] Language options

---

### Slice 4: Careers (18 careers)
**Source:** `Careers/*.md` (18 files)
**Code:** Career definitions in game data
**Test file:** `career-audit.test.ts`

Per career validate:
- [ ] Name matches
- [ ] Skills granted (list + count)
- [ ] Languages granted (if any)
- [ ] Renown value (if any)
- [ ] Wealth tier
- [ ] Perk granted
- [ ] Inciting incident options (names and descriptions)
- [ ] Any special career features

---

### Slice 5: Class Foundations (11 classes)
**Source:** `Classes/*.md` (9 files), Forgesteel beastheart data, `summoner v10.md`
**Code:** `packages/data/src/game-data/data/classes/class-definitions.ts`, `packages/data/src/logic/hero-logic.ts`
**Test file:** `class-foundations-audit.test.ts`

Per class validate:
- [ ] Starting characteristics (M/A/R/I/P values)
- [ ] Starting stamina
- [ ] Stamina per level
- [ ] Starting recoveries
- [ ] Speed
- [ ] Stability
- [ ] Heroic resource name and type
- [ ] Heroic resource gain triggers
- [ ] Potency characteristic
- [ ] Skill grants (fixed + choice groups)
- [ ] Subclass name (e.g., "Order" for Censor, "Domain" for Conduit)
- [ ] List of subclass options
- [ ] CLASS_STAMINA_CONFIG matches source
- [ ] CLASS_HEROIC_RESOURCE matches source
- [ ] CLASS_POTENCY_CHARACTERISTICS matches source

---

### Slice 6: Kits (22 kits)
**Source:** `Kits/*.md` (22 files), `Kits/Kits Table.md`
**Code:** Kit definitions in game data, `packages/data/src/logic/kit-logic.ts`
**Test file:** `kit-audit.test.ts`

Per kit validate:
- [ ] Name matches
- [ ] Type (martial, caster, hybrid)
- [ ] Equipment granted (weapons, armor, shield)
- [ ] Stamina bonus
- [ ] Speed bonus
- [ ] Stability bonus
- [ ] Melee damage bonus (per tier)
- [ ] Ranged damage bonus (per tier)
- [ ] Distance bonuses (melee reach, ranged distance)
- [ ] Signature ability: name, keywords, range, target, damage per tier, effects
- [ ] Kit-specific special rules
- [ ] Ward bonuses (if any, at higher levels)

---

### Slice 7A: Implement Beastheart Rules Data
**Source:** `docs/forgesteel-ref/src/data/classes/beastheart/` (FactoryLogic format — 5 files, ~3,100 lines)
**Output:** `packages/data/src/rules/classes/beastheart/` (new directory)

Translate Forgesteel FactoryLogic format into the project's declarative pattern (matching Fury's structure):

- [ ] Create `beastheart/index.ts` — barrel exports
- [ ] Create `beastheart/abilities.ts` — All abilities by cost tier (signature, 3-rage, 5-rage, 7-rage, 9-rage, 11-rage)
- [ ] Create `beastheart/features.ts` — Level 1-10 features
- [ ] Create `beastheart/subclasses.ts` — Wild Nature definitions (Guardian, Prowler, Punisher, Spark) with per-subclass features and abilities
- [ ] Create `beastheart/companions.ts` — Companion definitions (Basilisk, Dragon, Wolf, etc.) with stamina inheritance mechanics
- [ ] Register in `class-abilities.ts` — Add Beastheart to central ability switch
- [ ] Validate `class-definitions.ts` entry — Starting stamina (21), stamina/level (12), recoveries (12), heroic resource (Ferocity→Rage mapping), characteristics, skills
- [ ] Verify type coverage — Ensure `HeroClass` union includes 'beastheart', resource types include 'rage'

---

### Slice 7B: Implement Summoner Rules Data
**Source:** `docs/rules_data/data-rules-md/summoner v10.md` (markdown prose with formulas)
**Output:** `packages/data/src/rules/classes/summoner/` (new directory)

Parse markdown mechanical descriptions into TypeScript data matching the project pattern:

- [ ] Create `summoner/index.ts` — barrel exports
- [ ] Create `summoner/abilities.ts` — All abilities by cost tier (signature, 3-essence, 5-essence, 7-essence, 9-essence, 11-essence)
- [ ] Create `summoner/features.ts` — Level 1-10 features
- [ ] Create `summoner/subclasses.ts` — Circle definitions (Blight, Graves, Spring, Storms) with per-circle features
- [ ] Create `summoner/minions.ts` — Minion portfolio definitions (Fixture, Squad, Champion) with summoning mechanics
- [ ] Register in `class-abilities.ts` — Add Summoner to central ability switch
- [ ] Validate `class-definitions.ts` entry — Starting stamina, stamina/level, recoveries, heroic resource (Essence), characteristics, skills
- [ ] Validate `packages/types/src/hero/summoner.ts` — Ensure type definitions match source (Formation, Portfolio, etc.)
- [ ] Validate `packages/data/src/game-data/types/summoner.ts` — Ensure game data types align

---

### Slice 7C: Class Abilities Audit (all 11 classes)
**Source:** `Classes By Level/*.md`, per-class ability markdown in source
**Code:** `packages/data/src/rules/classes/*/abilities.ts`
**Test file:** `class-abilities-audit.test.ts` (one per class or grouped)

Per class (all 11), per ability tier (signature, 3-cost, 5-cost, 7-cost, 9-cost, 11-cost):
- [ ] Ability name matches
- [ ] Cost tier matches
- [ ] Keywords (Strike, Magic, Ranged, Area, etc.)
- [ ] Range/distance value
- [ ] Target specification
- [ ] Power Roll characteristic (which characteristic is used)
- [ ] Tier 1 (<=11) damage/effect
- [ ] Tier 2 (12-16) damage/effect
- [ ] Tier 3 (17+) damage/effect
- [ ] Damage type (fire, cold, psychic, etc.)
- [ ] Conditions applied (name, duration, save mechanism)
- [ ] Spend/resource effects
- [ ] Persistent effects
- [ ] Special triggers or reactions
- [ ] Effect text accuracy

---

### Slice 8: Class Features & Subclasses (all 11 classes)
**Source:** `Features/*.md`, `Classes/*.md` subclass sections
**Code:** `packages/data/src/rules/classes/*/features.ts`, `packages/data/src/rules/classes/*/subclasses.ts` (or equivalent)
**Test file:** `class-features-audit.test.ts`

Per class validate:
- [ ] Features granted at each level (1-10)
- [ ] Feature names match
- [ ] Feature effects/descriptions match
- [ ] Subclass features at correct levels
- [ ] Per-subclass unique abilities and modifications
- [ ] Resource interaction features (e.g., Growing Ferocity tiers for Fury)

---

### Slice 9: Complications (~100 complications)
**Source:** `Complications/*.md` (~100 files)
**Code:** `packages/data/src/rules/complications.ts`
**Test file:** `complications-audit.test.ts`

Per complication validate:
- [ ] Name matches
- [ ] Benefit feature name and effect
- [ ] Drawback feature name and effect
- [ ] All complications from source exist in code
- [ ] No extra complications in code that aren't in source

---

### Slice 10: Perks (60+ perks)
**Source:** `Perks/Crafting Perks/*.md`, `Perks/Exploration Perks/*.md`, etc.
**Code:** `packages/data/src/rules/perks/perks-data.ts`, `packages/data/src/rules/perks/class-perk-restrictions.ts`
**Test file:** `perks-audit.test.ts`

Per perk validate:
- [ ] Name matches
- [ ] Category (crafting, exploration, interpersonal, intrigue, lore, supernatural)
- [ ] Prerequisites (if any)
- [ ] Effect description
- [ ] Class perk restrictions (which classes get perks at which levels)

---

### Slice 11: Skills
**Source:** `Skills/*.md` (5 group files)
**Code:** `packages/data/src/rules/skills.ts`
**Test file:** `skills-audit.test.ts`

Validate:
- [ ] All skill groups present (Crafting, Exploration, Interpersonal, Intrigue, Lore)
- [ ] All skills within each group
- [ ] Skill names match exactly
- [ ] Skill descriptions/mechanics match

---

### Slice 12: Titles & Progression
**Source:** `Titles/1st Echelon/*.md` through `4th Echelon/*.md`, `Chapters/Making a Hero.md` (advancement table)
**Code:** `packages/data/src/rules/titles.ts`, `packages/data/src/rules/progression.ts`
**Test file:** `titles-progression-audit.test.ts`

Validate:
- [ ] All titles exist per echelon
- [ ] Title names match
- [ ] Title effects match
- [ ] XP advancement table values
- [ ] Per-level feature grants align with class progression
- [ ] Ward progression (L3, L9)
- [ ] Essence ability upgrades (L3: 7-essence, L6: 9-essence)

---

### Slice 13: Derived Calculations (HeroLogic validation)
**Source:** Formulas defined across multiple chapters
**Code:** `packages/data/src/logic/hero-logic.ts`, `packages/data/src/logic/entity-status-logic.ts`
**Test file:** `derived-calculations-audit.test.ts`

Validate with concrete hero builds:
- [ ] `getMaxStaminaForClass()` matches class table
- [ ] `getMaxStaminaWithKit()` correctly adds kit bonus
- [ ] `getWindedThreshold()` = floor(maxStamina / 2)
- [ ] `getRecoveryValue()` = floor(maxStamina / 3)
- [ ] `getMaxRecoveries()` matches class value
- [ ] `getEchelon()` maps levels correctly
- [ ] `isWinded()`, `isDying()`, `isDead()` thresholds correct
- [ ] `getHeroicResourceType()` returns correct type per class
- [ ] `getHeroicResourceName()` returns correct display name per class
- [ ] Build 2-3 sample heroes end-to-end and verify all derived stats

---

## Execution Strategy: Ralph Wiggum Loop

Each slice is executed as an iteration of the Ralph Wiggum loop:

1. **Read source** — Agent reads the relevant source markdown files
2. **Read code** — Agent reads the corresponding code files
3. **Write tests** — Agent writes Vitest assertions comparing code data to source values
4. **Run tests** — Execute `pnpm --filter @anvil/data test:run` to find failures
5. **Document findings** — Add results to the audit report (pass/fail/missing)
6. **Fix or implement** — Simple data fixes (typos, wrong numbers) are fixed immediately. For slices 7A/7B, full implementation of Beastheart and Summoner rules data is performed.
7. **Move to next slice** — Repeat

The loop continues until all 15 slices are complete and all tests pass (or failures are documented as known gaps).

## File Structure

```
packages/data/src/rules/classes/
  beastheart/                         # NEW — Slice 7A
    index.ts
    abilities.ts
    features.ts
    subclasses.ts
    companions.ts
  summoner/                           # NEW — Slice 7B
    index.ts
    abilities.ts
    features.ts
    subclasses.ts
    minions.ts

packages/data/src/__tests__/audit/
  core-mechanics-audit.test.ts        # Slice 1
  ancestry-audit.test.ts              # Slice 2
  culture-audit.test.ts               # Slice 3
  career-audit.test.ts                # Slice 4
  class-foundations-audit.test.ts     # Slice 5
  kit-audit.test.ts                   # Slice 6
  class-abilities-audit.test.ts      # Slice 7C — may split per-class if too large
  class-features-audit.test.ts       # Slice 8
  complications-audit.test.ts        # Slice 9
  perks-audit.test.ts                # Slice 10
  skills-audit.test.ts               # Slice 11
  titles-progression-audit.test.ts   # Slice 12
  derived-calculations-audit.test.ts # Slice 13

docs/
  HERO_CREATION_AUDIT_REPORT.md      # Living audit report
```

## Success Criteria

1. **All 11 classes fully implemented** — Beastheart and Summoner have complete rules/classes/ directories matching the existing class pattern
2. All 13 test files pass (or failures are documented as known gaps with tickets)
3. Audit report covers every facet of hero creation for all 11 classes
4. No silent data discrepancies between source books and code
5. Beastheart and Summoner are registered in `class-abilities.ts` and integrated into the central class system
6. Derived calculation tests prove the math is correct for sample hero builds across multiple classes
