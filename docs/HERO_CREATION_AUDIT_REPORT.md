# Hero Creation Data Audit Report

**Generated:** 2026-02-13
**Status:** In Progress

## Summary

| Slice | Status | Pass | Fail | Missing |
|-------|--------|------|------|---------|
| 1. Core Mechanics | PASS | 49 | 0 | 0 |
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


### Slice 3: Cultures


### Slice 4: Careers


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

