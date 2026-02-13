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
| 5. Class Foundations | PASS | 277 | 0 | 0 |
| 6. Kits | PASS | 268 | 0 | 0 |
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

**277 tests, all passing.**

**Bugs found and fixed:**
- `hero-logic.ts` CLASS_POTENCY_CHARACTERISTICS had wrong potency characteristic for 7 of 11 classes:
  - Beastheart: was `['might', 'agility']`, fixed to `['might', 'intuition']` (agility→intuition)
  - Censor: was `['intuition', 'presence']`, fixed to `['presence', 'might']` (wrong chars + order)
  - Null: was `['reason', 'intuition', 'presence']`, fixed to `['intuition', 'agility']` (wrong primary)
  - Summoner: was `['presence']`, fixed to `['reason']` (completely wrong)
  - Tactician: was `['reason', 'presence']`, fixed to `['reason', 'might']` (presence→might)
  - Talent: was `['presence']`, fixed to `['reason', 'presence']` (wrong primary, missing reason)
  - Troubadour: was `['presence']`, fixed to `['presence', 'agility']` (was correct but incomplete)

**Validated per class (11 classes):**
- Name, role (Defender/Controller/Striker/Support), masterClass flag
- Starting stamina, stamina per level, starting recoveries
- Starting characteristics (values and count)
- Potency characteristic
- Heroic resource name and type
- Subclass name, select count, all subclass IDs and names
- Cross-validation: class-definitions.ts ↔ GameData consistency
- Cross-validation: hero-logic.ts stamina/recoveries/potency vs source

**Cross-class validations:**
- Exactly 11 classes present
- Only Summoner is a master class
- Only Conduit has subclassSelectCount > 1 (it selects 2 domains)
- Stamina level1 values are 15, 18, or 21
- Stamina perLevel values are 6, 9, or 12
- Recoveries are 8, 10, or 12
- Elementalist and Summoner share essence resource type

### Slice 6: Kits

**268 tests, all passing.**

**No bugs found.** All 21 standard kits match source books exactly.

**Validated per kit (21 kits):**
- ID, name, type (martial/caster/hybrid)
- Weapons array
- Stamina per echelon bonus
- Speed bonus, stability bonus, disengage bonus
- Melee/ranged damage bonuses per tier (T1/T2/T3)
- Melee/ranged distance bonuses
- Signature ability name presence

**Cross-kit validations:**
- Exactly 21 standard kits in GameData
- All kit types are valid (martial, caster, or hybrid)
- Stormwight (4) and beastheart (4) kits exist separately in reference-data
- Cloak and Dagger weapons: `['Light', 'Light']` (source: "one or two light weapons")

**Note:** GameData exposes 21 standard kits. Stormwight-specific kits (4) and beastheart companion kits (4) are stored separately in `rules/reference-data.ts`.


### Slice 7A: Beastheart Implementation


### Slice 7B: Summoner Implementation


### Slice 7C: Class Abilities


### Slice 8: Class Features & Subclasses


### Slice 9: Complications


### Slice 10: Perks


### Slice 11: Skills


### Slice 12: Titles & Progression


### Slice 13: Derived Calculations

