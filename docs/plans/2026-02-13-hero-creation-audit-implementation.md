# Hero Creation Data Audit — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate every piece of hero creation data against Draw Steel source books, implement missing Beastheart and Summoner class data, and produce a Vitest regression suite + audit report.

**Architecture:** 15 slices executed via Ralph Wiggum loop. Each slice reads source markdown, compares to code, writes Vitest assertions, runs them, fixes discrepancies, and logs results to an audit report. Slices 7A/7B are implementation slices that create new class data files before the full abilities audit runs.

**Tech Stack:** Vitest, TypeScript strict mode, `@anvil/types` interfaces, `@anvil/data` logic modules

---

## Conventions

- **Test location:** Co-located with source. Audit tests go in `packages/data/src/audit/` (new directory — keeps audit tests separate from unit tests)
- **Run tests:** `pnpm --filter @anvil/data test:run` (runs all tests once, no watch)
- **Run specific test:** `pnpm --filter @anvil/data test:run src/audit/core-mechanics-audit.test.ts`
- **Source docs root:** `docs/rules_data/data-rules-md/`
- **Code root:** `packages/data/src/`
- **Types root:** `packages/types/src/`
- **Imports use `.js` extensions** (ESM convention in this project)

---

## Task 1: Scaffold Audit Infrastructure

**Files:**
- Create: `packages/data/src/audit/core-mechanics-audit.test.ts`
- Create: `docs/HERO_CREATION_AUDIT_REPORT.md`

**Step 1: Create audit directory and first test file skeleton**

```typescript
// packages/data/src/audit/core-mechanics-audit.test.ts
import { describe, it, expect } from 'vitest';

describe('Audit: Core Mechanics', () => {
  it('placeholder — audit infrastructure works', () => {
    expect(true).toBe(true);
  });
});
```

**Step 2: Create audit report skeleton**

```markdown
<!-- docs/HERO_CREATION_AUDIT_REPORT.md -->
# Hero Creation Data Audit Report

**Generated:** 2026-02-13
**Status:** In Progress

## Summary

| Slice | Status | Pass | Fail | Missing |
|-------|--------|------|------|---------|
| 1. Core Mechanics | Pending | - | - | - |
| 2. Ancestries | Pending | - | - | - |
| 3. Cultures | Pending | - | - | - |
| 4. Careers | Pending | - | - | - |
| 5. Class Foundations | Pending | - | - | - |
| 6. Kits | Pending | - | - | - |
| 7A. Beastheart Implementation | Pending | - | - | - |
| 7B. Summoner Implementation | Pending | - | - | - |
| 7C. Class Abilities | Pending | - | - | - |
| 8. Class Features & Subclasses | Pending | - | - | - |
| 9. Complications | Pending | - | - | - |
| 10. Perks | Pending | - | - | - |
| 11. Skills | Pending | - | - | - |
| 12. Titles & Progression | Pending | - | - | - |
| 13. Derived Calculations | Pending | - | - | - |

---
```

**Step 3: Run test to verify infrastructure**

Run: `cd "/Users/danpaquin/Desktop/Projects/Anvil v2" && pnpm --filter @anvil/data test:run src/audit/core-mechanics-audit.test.ts`
Expected: 1 test PASS

**Step 4: Commit**

```bash
git add packages/data/src/audit/ docs/HERO_CREATION_AUDIT_REPORT.md
git commit -m "scaffold: audit infrastructure and report skeleton"
```

---

## Task 2: Slice 1 — Core Mechanics Audit

**Files:**
- Modify: `packages/data/src/audit/core-mechanics-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Chapters/Making a Hero.md` (XP table, echelons)
- Read: `docs/rules_data/data-rules-md/Chapters/Combat.md` (free strikes, power rolls)
- Read: `packages/data/src/logic/hero-logic.ts`
- Read: `packages/data/src/game-data/lib/game-rules.ts`

**Step 1: Read source docs and code, write tests**

The agent should read the source markdown for:
- Power Roll tier boundaries (The Basics or Combat chapter)
- Echelon table (Making a Hero)
- XP advancement table (Making a Hero)
- Free strike damage values (Making a Hero)
- Winded/Dying/Recovery formulas (Combat chapter)

Then read the code files and write Vitest assertions comparing every value.

Test structure:
```typescript
import { describe, it, expect } from 'vitest';
import * as HeroLogic from '../logic/hero-logic.js';

describe('Audit: Core Mechanics', () => {
  describe('Echelon mapping', () => {
    it('L1-3 = 1st echelon', () => { ... });
    it('L4-6 = 2nd echelon', () => { ... });
    it('L7-9 = 3rd echelon', () => { ... });
    it('L10 = 4th echelon', () => { ... });
  });

  describe('Stamina thresholds', () => {
    it('winded = floor(max / 2)', () => { ... });
    it('dying = stamina <= 0', () => { ... });
    it('recovery value = floor(max / 3)', () => { ... });
  });

  describe('Power Roll tiers', () => {
    it('tier 1: roll <= 11', () => { ... });
    it('tier 2: roll 12-16', () => { ... });
    it('tier 3: roll >= 17', () => { ... });
  });

  // XP advancement table, free strike values, etc.
});
```

**Step 2: Run tests**

Run: `pnpm --filter @anvil/data test:run src/audit/core-mechanics-audit.test.ts`
Expected: All pass, or failures indicate data bugs to fix

**Step 3: Fix any discrepancies found**

If tests fail, fix the code to match source. Document each fix.

**Step 4: Update audit report**

Update `docs/HERO_CREATION_AUDIT_REPORT.md` Slice 1 row with pass/fail/missing counts.

**Step 5: Commit**

```bash
git add packages/data/src/audit/core-mechanics-audit.test.ts docs/HERO_CREATION_AUDIT_REPORT.md
git commit -m "audit: slice 1 — core mechanics validated"
```

---

## Task 3: Slice 2 — Ancestries Audit

**Files:**
- Create: `packages/data/src/audit/ancestry-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Ancestries/*.md` (12 files: Devil, Dragon Knight, Dwarf, Hakaan, High Elf, Human, Memonek, Orc, Polder, Revenant, Time Raider, Wode Elf)
- Read: ancestry data in `packages/data/src/game-data/`

**Step 1: Read all 12 ancestry source files and code, write tests**

Per ancestry validate:
- Name exists in code
- Size value matches (e.g., "1M" for medium, "1S" for small)
- Speed value matches
- Signature trait name matches
- Purchasable trait names and point costs match
- Total trait points available

Test structure:
```typescript
describe('Audit: Ancestries', () => {
  describe('Devil', () => {
    it('has correct size', () => { ... });
    it('has correct speed', () => { ... });
    it('has correct signature trait', () => { ... });
    it('has all purchasable traits with correct costs', () => { ... });
  });
  // ... repeat for all 12
});
```

**Step 2-5:** Run tests, fix discrepancies, update report, commit.

```bash
git commit -m "audit: slice 2 — all 12 ancestries validated"
```

---

## Task 4: Slice 3 — Cultures Audit

**Files:**
- Create: `packages/data/src/audit/culture-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Cultures/Environments/*.md`
- Read: `docs/rules_data/data-rules-md/Cultures/Organization/*.md`
- Read: `docs/rules_data/data-rules-md/Cultures/Upbringing/*.md`

**Step 1: Read source and code, write tests**

Validate all environment, organization, and upbringing options exist with correct:
- Skill grants
- Language grants
- Characteristic bonuses

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 3 — cultures validated"
```

---

## Task 5: Slice 4 — Careers Audit

**Files:**
- Create: `packages/data/src/audit/career-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Careers/*.md` (18 files: Agent, Aristocrat, Artisan, Beggar, Criminal, Disciple, Explorer, Farmer, Gladiator, Laborer, Mages Apprentice, Performer, Politician, Sage, Sailor, Soldier, Warden, Watch Officer)

**Step 1: Read all 18 career source files and code, write tests**

Per career validate:
- Skills granted (specific list)
- Languages (if any)
- Renown value
- Wealth tier
- Perk granted
- Inciting incident options

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 4 — all 18 careers validated"
```

---

## Task 6: Slice 5 — Class Foundations Audit

**Files:**
- Create: `packages/data/src/audit/class-foundations-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Classes/*.md` (9 class files)
- Read: `docs/forgesteel-ref/src/data/classes/beastheart/beastheart.ts` (Beastheart source)
- Read: `docs/rules_data/data-rules-md/summoner v10.md` (Summoner source)
- Read: `packages/data/src/game-data/data/classes/class-definitions.ts`
- Read: `packages/data/src/logic/hero-logic.ts` (CLASS_STAMINA_CONFIG, CLASS_HEROIC_RESOURCE, CLASS_POTENCY_CHARACTERISTICS)

**Step 1: Read all class source docs and class-definitions.ts, write tests**

Per class (all 11) validate:
- `startingStamina` matches source
- `staminaPerLevel` matches source
- `startingRecoveries` matches source
- Starting characteristics (M/A/R/I/P) match source
- `potencyCharacteristic` matches source
- Heroic resource name and type match source
- Skill grants match source
- Subclass options list matches source
- `CLASS_STAMINA_CONFIG` in hero-logic.ts matches class-definitions.ts
- `CLASS_HEROIC_RESOURCE` in hero-logic.ts matches class-definitions.ts
- `CLASS_POTENCY_CHARACTERISTICS` in hero-logic.ts matches class-definitions.ts

Test structure:
```typescript
describe('Audit: Class Foundations', () => {
  describe('Censor', () => {
    it('starting stamina = 21', () => { ... });
    it('stamina per level = 9', () => { ... });
    it('starting recoveries = 8', () => { ... });
    it('heroic resource = Wrath', () => { ... });
    it('potency = Presence', () => { ... });
    it('starting characteristics: M2/A0/R0/I1/P2', () => { ... });
    it('subclass options: Exorcist, Oracle, Paragon', () => { ... });
  });
  // ... repeat for all 11 classes

  describe('Cross-validation: hero-logic.ts configs', () => {
    it('CLASS_STAMINA_CONFIG matches classDefinitions for all classes', () => { ... });
    it('CLASS_HEROIC_RESOURCE matches classDefinitions for all classes', () => { ... });
    it('CLASS_POTENCY_CHARACTERISTICS matches classDefinitions for all classes', () => { ... });
  });
});
```

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 5 — class foundations for all 11 classes validated"
```

---

## Task 7: Slice 6 — Kits Audit

**Files:**
- Create: `packages/data/src/audit/kit-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Kits/*.md` (22 kit files)
- Read: `docs/rules_data/data-rules-md/Kits/Kits Table.md` (summary table)
- Read: kit data in code

**Step 1: Read all 22 kit source files and code, write tests**

Per kit validate:
- Type (martial/caster/hybrid)
- Equipment granted
- Stamina bonus, Speed bonus, Stability bonus
- Melee damage bonus (per tier), Ranged damage bonus (per tier)
- Distance bonuses (melee reach, ranged distance)
- Signature ability: name, keywords, range, target, T1/T2/T3 damage

Kits to validate: Arcane Archer, Battlemind, Cloak and Dagger, Dual Wielder, Guisarmier, Martial Artist, Mountain, Panther, Pugilist, Raider, Ranger, Rapid Fire, Retiarius, Shining Armor, Sniper, Spellsword, Stick and Robe, Swashbuckler, Sword and Board, Warrior Priest, Whirlwind.

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 6 — all 22 kits validated"
```

---

## Task 8: Slice 7A — Implement Beastheart Rules Data

**This is an IMPLEMENTATION slice, not just an audit.**

**Files:**
- Create: `packages/data/src/rules/classes/beastheart/index.ts`
- Create: `packages/data/src/rules/classes/beastheart/abilities.ts`
- Create: `packages/data/src/rules/classes/beastheart/features.ts`
- Create: `packages/data/src/rules/classes/beastheart/subclasses.ts`
- Create: `packages/data/src/rules/classes/beastheart/companions.ts`
- Modify: `packages/data/src/rules/classes/class-abilities.ts`
- Read: `docs/forgesteel-ref/src/data/classes/beastheart/*.ts` (5 source files)

**Source-to-code translation:**
- Forgesteel `FactoryLogic.createAbility()` → Anvil `Ability` objects
- Forgesteel `FactoryLogic.feature.create*()` → Anvil `Feature` objects
- Forgesteel subclass files → Anvil `subclasses.ts` + per-subclass feature arrays

**Step 1: Create abilities.ts**

Read the complete Forgesteel `beastheart.ts` file (lines ~1468-1985 are the 24 abilities). Translate each ability from FactoryLogic format to the declarative `Ability[]` pattern matching Fury's structure.

Export arrays: `beastheartSignatureAbilities`, `beastheartThreeRageAbilities`, `beastheartFiveRageAbilities`, `beastheartSevenRageAbilities`, `beastheartNineRageAbilities`, `beastheartElevenRageAbilities`

Include aspect-specific abilities from guardian.ts, prowler.ts, punisher.ts, spark.ts.

**Step 2: Create features.ts**

Read Forgesteel source for level 1-10 features. Translate to `Feature[]` arrays:
- `beastheartFeatures` — core features all Wild Natures share
- `guardianFeatures`, `prowlerFeatures`, `punisherFeatures`, `sparkFeatures`

**Step 3: Create subclasses.ts**

Define `BeastheartWildNatureDefinition` interface and export `beastheartWildNatures: Record<BeastheartWildNature, Definition>` with Guardian, Prowler, Punisher, Spark.

**Step 4: Create companions.ts**

Define companion data structure and export all companion definitions (Basilisk, Bear, Boar, Condor, Deinonychus, Drake, Gummy Ball, Hellhound, Lightbender, Panther, Spider, Sporeling, Wolf) with:
- Stats (stamina, speed, stability, size)
- Characteristics
- Base abilities
- Rampage scaling (level 3/6/10 upgrades)

**Step 5: Create index.ts**

```typescript
export * from './subclasses';
export * from './companions';
export * from './features';
export * from './abilities';
```

**Step 6: Register in class-abilities.ts**

Add imports for Beastheart abilities and create `getBeastheartAbilities(wildNature?: string): AbilitiesByTier` function. Add 'beastheart' case to `getClassAbilities` switch.

**Step 7: Verify build**

Run: `pnpm --filter @anvil/data build`
Expected: Build succeeds with no type errors

**Step 8: Commit**

```bash
git add packages/data/src/rules/classes/beastheart/ packages/data/src/rules/classes/class-abilities.ts
git commit -m "feat: implement Beastheart class rules data (abilities, features, subclasses, companions)"
```

---

## Task 9: Slice 7B — Implement Summoner Rules Data

**This is an IMPLEMENTATION slice, not just an audit.**

**Files:**
- Create: `packages/data/src/rules/classes/summoner/index.ts`
- Create: `packages/data/src/rules/classes/summoner/abilities.ts`
- Create: `packages/data/src/rules/classes/summoner/features.ts`
- Create: `packages/data/src/rules/classes/summoner/subclasses.ts`
- Create: `packages/data/src/rules/classes/summoner/minions.ts`
- Create: `packages/data/src/rules/classes/summoner/formations.ts`
- Modify: `packages/data/src/rules/classes/class-abilities.ts`
- Read: `docs/rules_data/data-rules-md/summoner v10.md`

**Source data (from summoner v10.md):**
- Starting stats: Stamina 15, +6/level, 8 recoveries, Reason 2
- Heroic resource: Essence (start = victories, +2/turn, +1 on first minion death/round)
- 4 Circles: Blight (Demons), Graves (Undead), Spring (Fey), Storms (Elementals)
- 4 Formations: Horde, Platoon, Elite, Leader
- Quick Commands: Focus Fire!, Halt!, Not Yet!, Shield!
- Per-circle portfolios with Signature (1-essence), 3-cost, 5-cost, 7-cost, 9-cost minions + Champions

**Step 1: Create abilities.ts**

Parse summoner v10.md for all class abilities. These include both hero abilities AND minion summoning abilities. Export by cost tier:
- `summonerSignatureAbilities` — Summoner Strike, Strike For Me, Call Forth, Minion Bridge
- `summonerThreeEssenceAbilities`, `summonerFiveEssenceAbilities`, etc.

**Step 2: Create features.ts**

Parse level progression from summoner v10.md. Export `summonerFeatures: Feature[]` with all level 1-10 features.

**Step 3: Create subclasses.ts**

Define circle definitions with per-circle portfolio references:
```typescript
export const summonerCircles: Record<SummonerCircle, CircleDefinition>
```

**Step 4: Create minions.ts**

This is the largest file — define all minion stat blocks per circle per cost tier:
- Signature minions (1 Essence): 4 per circle
- 3-Essence minions: per circle
- 5-Essence minions: per circle
- 7-Essence minions: per circle
- Champions (9 Essence): per circle

**Step 5: Create formations.ts**

Define all 4 formations with their mechanical effects.

**Step 6: Create index.ts**

```typescript
export * from './subclasses';
export * from './minions';
export * from './formations';
export * from './features';
export * from './abilities';
```

**Step 7: Register in class-abilities.ts**

Add `getSummonerAbilities(circle?: string): AbilitiesByTier`. Add 'summoner' case to switch.

**Step 8: Verify build**

Run: `pnpm --filter @anvil/data build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add packages/data/src/rules/classes/summoner/ packages/data/src/rules/classes/class-abilities.ts
git commit -m "feat: implement Summoner class rules data (abilities, features, circles, minions, formations)"
```

---

## Task 10: Slice 7C — Class Abilities Audit (All 11 Classes)

**Files:**
- Create: `packages/data/src/audit/class-abilities-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Classes By Level/*.md` or `Classes/*.md` for ability lists
- Read: Forgesteel beastheart source for Beastheart abilities
- Read: `summoner v10.md` for Summoner abilities
- Read: `packages/data/src/rules/classes/*/abilities.ts` for all 11 classes

**Step 1: For each of the 11 classes, read source and code, write tests**

Per class, per ability tier, validate EVERY ability:
- Name matches source exactly
- Cost tier is correct
- Keywords match (Strike, Magic, Ranged, Area, Melee, Weapon, etc.)
- Distance/range value matches
- Target matches
- Power Roll characteristic matches
- T1 (<=11) damage/effect matches source
- T2 (12-16) damage/effect matches source
- T3 (17+) damage/effect matches source
- Damage type matches
- Conditions, durations, spend effects match
- Effect text matches

This is the largest test file. It may need to be split per-class if it exceeds maintainable size. Consider:
- `packages/data/src/audit/class-abilities/censor-abilities-audit.test.ts`
- `packages/data/src/audit/class-abilities/fury-abilities-audit.test.ts`
- etc.

**Step 2-5:** Run, fix data bugs, report, commit.

```bash
git commit -m "audit: slice 7C — class abilities validated for all 11 classes"
```

---

## Task 11: Slice 8 — Class Features & Subclasses Audit

**Files:**
- Create: `packages/data/src/audit/class-features-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Features/*.md`
- Read: `docs/rules_data/data-rules-md/Classes/*.md` (subclass sections)
- Read: `packages/data/src/rules/classes/*/features.ts` and `*/subclasses.ts`

**Step 1: For each class, validate features and subclasses**

Per class:
- Correct features exist at each level (1-10)
- Feature names match source
- Feature descriptions match source
- Subclass-specific features at correct levels
- Per-subclass unique abilities match source
- Resource interaction features (e.g., Growing Ferocity tiers for Fury)

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 8 — class features and subclasses validated"
```

---

## Task 12: Slice 9 — Complications Audit

**Files:**
- Create: `packages/data/src/audit/complications-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Complications/*.md` (~100 files)
- Read: `packages/data/src/rules/complications.ts`

**Step 1: Read all ~100 complication source files, compare to code**

Validate:
- Every complication from source exists in code (completeness)
- No extra complications in code that aren't in source
- Per complication: benefit feature name/effect matches, drawback feature name/effect matches

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 9 — all complications validated"
```

---

## Task 13: Slice 10 — Perks Audit

**Files:**
- Create: `packages/data/src/audit/perks-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Perks/Crafting Perks/*.md`, `Exploration Perks/*.md`, `Interpersonal Perks/*.md`, `Intrigue Perks/*.md`, `Lore Perks/*.md`, `Supernatural Perks/*.md`
- Read: `packages/data/src/rules/perks/perks-data.ts`
- Read: `packages/data/src/rules/perks/class-perk-restrictions.ts`

**Step 1: Read all perk source files, compare to code**

Validate:
- All perks exist by name
- Correct category assignment
- Prerequisites match (if any)
- Effect descriptions match
- Class perk restriction table matches source (which classes get perks at which levels)

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 10 — all perks validated"
```

---

## Task 14: Slice 11 — Skills Audit

**Files:**
- Create: `packages/data/src/audit/skills-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Skills/*.md` (5 group files)
- Read: `packages/data/src/rules/skills.ts`

**Step 1: Read skill source files, compare to code**

Validate:
- All 5 skill groups present (Crafting, Exploration, Interpersonal, Intrigue, Lore)
- All skills within each group exist
- Skill names match exactly
- No extra or missing skills

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 11 — all skills validated"
```

---

## Task 15: Slice 12 — Titles & Progression Audit

**Files:**
- Create: `packages/data/src/audit/titles-progression-audit.test.ts`
- Read: `docs/rules_data/data-rules-md/Titles/1st Echelon/*.md` through `4th Echelon/*.md`
- Read: `docs/rules_data/data-rules-md/Chapters/Making a Hero.md` (XP table)
- Read: `packages/data/src/rules/titles.ts`
- Read: `packages/data/src/rules/progression.ts`

**Step 1: Read title and progression source, compare to code**

Validate:
- All titles exist per echelon with correct names
- Title effects match source
- XP advancement table matches (L1=0-15, L2=16-31, ..., L10=144+)
- Ward progression at correct levels
- Essence ability upgrades at correct levels

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 12 — titles and progression validated"
```

---

## Task 16: Slice 13 — Derived Calculations Audit

**Files:**
- Create: `packages/data/src/audit/derived-calculations-audit.test.ts`
- Read: `packages/data/src/logic/hero-logic.ts`
- Read: `packages/data/src/logic/entity-status-logic.ts`

**Step 1: Write tests using concrete hero builds**

Build 3-4 sample heroes across different classes and validate all derived stats:

```typescript
describe('Audit: Derived Calculations', () => {
  describe('Fury L1 with Mountain kit', () => {
    it('max stamina = startingStamina + kitBonus', () => { ... });
    it('winded threshold = floor(maxStamina / 2)', () => { ... });
    it('recovery value = floor(maxStamina / 3)', () => { ... });
    it('echelon = 1', () => { ... });
    it('heroic resource type = ferocity', () => { ... });
  });

  describe('Conduit L5 with Warrior Priest kit', () => { ... });
  describe('Summoner L3 with Battlemind kit', () => { ... });
  describe('Beastheart L7 with Panther kit', () => { ... });

  describe('All classes: stamina formula consistency', () => {
    it.each(ALL_CLASSES)('%s: getMaxStaminaForClass matches classDefinitions', (cls) => { ... });
  });

  describe('All classes: resource type consistency', () => {
    it.each(ALL_CLASSES)('%s: getHeroicResourceType returns correct type', (cls) => { ... });
  });
});
```

**Step 2-5:** Run, fix, report, commit.

```bash
git commit -m "audit: slice 13 — derived calculations validated with sample hero builds"
```

---

## Task 17: Finalize Audit Report

**Files:**
- Modify: `docs/HERO_CREATION_AUDIT_REPORT.md`

**Step 1: Update summary table with final counts**

Fill in all pass/fail/missing counts from each slice.

**Step 2: Add findings section**

Document:
- Any data corrections made (typos, wrong values)
- Any structural issues found
- Beastheart/Summoner implementation status
- Recommendations for future maintenance

**Step 3: Run full test suite**

Run: `pnpm --filter @anvil/data test:run`
Expected: All audit tests pass

**Step 4: Commit**

```bash
git add docs/HERO_CREATION_AUDIT_REPORT.md
git commit -m "docs: finalize hero creation audit report — all slices complete"
```

---

## Parallel Execution Strategy

**Independent slices (can run in parallel):**
- Slices 2, 3, 4 (Ancestries, Cultures, Careers) — no dependencies on each other
- Slices 9, 10, 11 (Complications, Perks, Skills) — no dependencies on each other

**Sequential dependencies:**
- Slice 1 (Core Mechanics) → must complete first (validates shared formulas)
- Slice 5 (Class Foundations) → before Slices 7A, 7B (confirms class-definitions.ts is correct before building on it)
- Slices 7A, 7B (Implementation) → before Slice 7C (abilities audit needs the data to exist)
- Slice 7C (Abilities) → before Slice 8 (features reference abilities)
- Slice 13 (Derived Calculations) → last (needs everything else correct)

**Recommended execution order:**

```
Phase 1: [1]
Phase 2: [2, 3, 4] in parallel
Phase 3: [5, 6] in parallel
Phase 4: [7A, 7B] in parallel
Phase 5: [7C]
Phase 6: [8, 9, 10, 11, 12] in parallel
Phase 7: [13]
Phase 8: [Finalize Report]
```
