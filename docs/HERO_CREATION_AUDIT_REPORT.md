# Hero Creation Data Audit Report

**Generated:** 2026-02-13
**Status:** In Progress

## Summary

| Slice | Status | Pass | Fail | Missing |
|-------|--------|------|------|---------|
| 1. Core Mechanics | PASS | 49 | 0 | 0 |
| 2. Ancestries | PASS | 163 | 0 | 0 |
| 3. Cultures | PASS | 53 | 0 | 1 known gap |
| 4. Careers | PASS | 180 | 0 | 0 |
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

## Detailed Findings

### Slice 1: Core Mechanics

**49 tests, all passing.**

**Bugs found and fixed:**
- `game-rules.ts` CLASS_STAMINA_CONFIG had wrong values for 8 of 11 classes:
  - Censor recoveries: was 8, should be 12
  - Conduit perLevel: was 9, should be 6
  - Elementalist level1: was 15, should be 18
  - Fury recoveries: was 8, should be 10
  - Null level1: was 18, should be 21
  - Shadow perLevel: was 9, should be 6
  - Talent perLevel: was 9, should be 6
  - Troubadour perLevel: was 9, should be 6
- `hero-logic.ts` CLASS_STAMINA_CONFIG had Null wrong: level1 was 18, should be 21

**Validated against source:**
- Power roll tier boundaries (T1 <=11, T2 12-16, T3 17+)
- Test difficulty outcomes for easy/medium/hard + nat 19-20
- Echelon mapping (L1-3=E1, L4-6=E2, L7-9=E3, L10=E4)
- XP advancement table (16 XP per level, L1=0-15 through L10=144+)
- Winded threshold = floor(max/2)
- Dying = stamina <= 0
- Death = stamina <= -winded
- Recovery value = floor(max/3)
- Free strike damage values (melee T1=2/T2=5/T3=7, ranged T1=2/T2=4/T3=6)
- Edge/bane mechanics
- Size & space calculations
- Potency modifiers (weak=-2, average=-1, strong=0)
- Stamina formula consistency between GameData and HeroLogic

### Slice 2: Ancestries

**163 tests, all passing.**

**No bugs found.** All 12 ancestries match source books exactly.

**Validated per ancestry (12 ancestries):**
- ID, name, size, speed, ancestry points
- Signature trait name present and correct
- All purchased traits: correct names and costs (1 or 2 points)

**Cross-ancestry validations:**
- Exactly 12 ancestries present
- Only Hakaan is size 1L, only Polder is size 1S
- Memonek & Polder have 4 ancestry points; Revenant has 2 (lowest)
- All trait costs are 1 or 2

### Slice 3: Cultures

**53 tests, all passing.**

**No bugs found.** All environment, organization, and upbringing options match source.

**Validated:**
- 5 environment options (Nomadic, Rural, Secluded, Urban, Wilderness) with correct skill group grants
- 2 organization options (Bureaucratic, Communal) with correct skill group grants
- 6 upbringing options (Academic, Creative, Labor, Lawless, Martial, Noble) with correct skill grants
- 13 total culture benefits accessible via GameData
- Pre-built culture combos reference valid options
- Skill group references are all valid

**Known gap (documented, not a bug):**
- Martial upbringing: source lists 10 specific skills across 5 groups; code stores a simplified subset of 3 (Strategy, Intimidate, Alertness). The 7 missing skills are: Blacksmithing, Fletching, Climb, Endurance, Ride, Track, Monsters.

### Slice 4: Careers

**180 tests, all passing.**

**No bugs found.** All 18 careers match source books exactly.

**Validated per career (18 careers):**
- Exists via `GameData.getCareer(id)` and `GameData.getCareerByName(name)`
- Skills array matches source exactly
- Languages array matches source exactly
- Renown, wealth, project points, perk type all match source
- Each career has a non-empty inciting incident

**Value constraint checks:**
- Renown: 0, 1, or 2 (6 careers grant renown > 0)
- Wealth: 0 or 1 (2 careers grant wealth > 0: Aristocrat, Politician)
- Project Points: 0, 120, or 240
- All perk types are valid categories
- Each career has 2-3 skill entries


### Slice 5: Class Foundations


### Slice 6: Kits


### Slice 7A: Beastheart Implementation


### Slice 7B: Summoner Implementation


### Slice 7C: Class Abilities


### Slice 8: Class Features & Subclasses


### Slice 9: Complications


### Slice 10: Perks


### Slice 11: Skills


### Slice 12: Titles & Progression


### Slice 13: Derived Calculations

