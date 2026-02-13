/**
 * Kit Audit -- Slice 6
 *
 * Validates all 21 standard hero kits against Draw Steel source books:
 * - Kit exists in code by ID
 * - Name matches source
 * - Stamina per echelon matches source
 * - Speed bonus matches source
 * - Stability bonus matches source
 * - Melee damage bonus (per tier) matches source
 * - Ranged damage bonus (per tier) matches source
 * - Distance bonuses (melee reach, ranged distance) match source
 * - Disengage bonus matches source
 * - Signature ability name matches source
 *
 * Source: docs/rules_data/data-rules-md/Kits/Kits Table.md
 *         docs/rules_data/data-rules-md/Kits/<Kit>.md (individual files)
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';

// ============================================================
// Helper: Kit source data from Kits Table.md
// ============================================================

interface SourceKit {
  id: string;
  name: string;
  armor: string;
  weapons: string[];
  staminaPerEchelon: number;
  speedBonus: number;
  stabilityBonus: number;
  meleeDamageBonus: string | null;
  rangedDamageBonus: string | null;
  meleeDistanceBonus: number;
  rangedDistanceBonus: number;
  disengageBonus: number;
  signatureAbilityName: string;
}

/**
 * Source of truth for all 21 standard kits from Kits Table.md and individual kit MDs.
 *
 * Values transcribed directly from the source:
 * - "-" in the table means 0 for numeric fields, null for damage fields
 * - Stamina is listed as "+N per echelon" in the source
 * - Damage bonuses are "+T1/+T2/+T3" format
 */
const SOURCE_KITS: SourceKit[] = [
  {
    id: 'arcane-archer',
    name: 'Arcane Archer',
    armor: 'None',
    weapons: ['Bow'],
    staminaPerEchelon: 0,
    speedBonus: 1,
    stabilityBonus: 0,
    meleeDamageBonus: null,
    rangedDamageBonus: '+2/+2/+2',
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 10,
    disengageBonus: 1,
    signatureAbilityName: 'Exploding Arrow',
  },
  {
    id: 'battlemind',
    name: 'Battlemind',
    armor: 'Light',
    weapons: ['Medium'],
    staminaPerEchelon: 3,
    speedBonus: 2,
    stabilityBonus: 1,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Unmooring',
  },
  {
    id: 'cloak-and-dagger',
    name: 'Cloak and Dagger',
    armor: 'Light',
    weapons: ['Light', 'Light'], // Source: "one or two light weapons"; code encodes as two
    staminaPerEchelon: 3,
    speedBonus: 2,
    stabilityBonus: 0,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: '+1/+1/+1',
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 5,
    disengageBonus: 1,
    signatureAbilityName: 'Fade',
  },
  {
    id: 'dual-wielder',
    name: 'Dual Wielder',
    armor: 'Medium',
    weapons: ['Light', 'Medium'],
    staminaPerEchelon: 6,
    speedBonus: 2,
    stabilityBonus: 0,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Double Strike',
  },
  {
    id: 'guisarmier',
    name: 'Guisarmier',
    armor: 'Medium',
    weapons: ['Polearm'],
    staminaPerEchelon: 6,
    speedBonus: 0,
    stabilityBonus: 1,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Forward Thrust, Backward Smash',
  },
  {
    id: 'martial-artist',
    name: 'Martial Artist',
    armor: 'None',
    weapons: ['Unarmed strikes'],
    staminaPerEchelon: 3,
    speedBonus: 3,
    stabilityBonus: 0,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Battle Grace',
  },
  {
    id: 'mountain',
    name: 'Mountain',
    armor: 'Heavy',
    weapons: ['Heavy'],
    staminaPerEchelon: 9,
    speedBonus: 0,
    stabilityBonus: 2,
    meleeDamageBonus: '+0/+0/+4',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Pain for Pain',
  },
  {
    id: 'panther',
    name: 'Panther',
    armor: 'None',
    weapons: ['Heavy'],
    staminaPerEchelon: 6,
    speedBonus: 1,
    stabilityBonus: 1,
    meleeDamageBonus: '+0/+0/+4',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Devastating Rush',
  },
  {
    id: 'pugilist',
    name: 'Pugilist',
    armor: 'None',
    weapons: ['Unarmed strikes'],
    staminaPerEchelon: 6,
    speedBonus: 2,
    stabilityBonus: 1,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: "Let's Dance",
  },
  {
    id: 'raider',
    name: 'Raider',
    armor: 'Light, shield',
    weapons: ['Light'],
    staminaPerEchelon: 6,
    speedBonus: 1,
    stabilityBonus: 0,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: '+1/+1/+1',
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 5,
    disengageBonus: 1,
    signatureAbilityName: "Raider's Awe",
  },
  {
    id: 'ranger',
    name: 'Ranger',
    armor: 'Medium',
    weapons: ['Bow', 'Medium'],
    staminaPerEchelon: 6,
    speedBonus: 1,
    stabilityBonus: 0,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: '+1/+1/+1',
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 5,
    disengageBonus: 1,
    signatureAbilityName: 'Hamstring Shot',
  },
  {
    id: 'rapid-fire',
    name: 'Rapid-Fire',
    armor: 'Light',
    weapons: ['Bow'],
    staminaPerEchelon: 3,
    speedBonus: 1,
    stabilityBonus: 0,
    meleeDamageBonus: null,
    rangedDamageBonus: '+2/+2/+2',
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 7,
    disengageBonus: 1,
    signatureAbilityName: 'Two Shot',
  },
  {
    id: 'retiarius',
    name: 'Retiarius',
    armor: 'Light',
    weapons: ['Ensnaring', 'Polearm'],
    staminaPerEchelon: 3,
    speedBonus: 1,
    stabilityBonus: 0,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Net and Stab',
  },
  {
    id: 'shining-armor',
    name: 'Shining Armor',
    armor: 'Heavy, shield',
    weapons: ['Medium'],
    staminaPerEchelon: 12,
    speedBonus: 0,
    stabilityBonus: 1,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Protective Attack',
  },
  {
    id: 'sniper',
    name: 'Sniper',
    armor: 'None',
    weapons: ['Bow'],
    staminaPerEchelon: 0,
    speedBonus: 1,
    stabilityBonus: 0,
    meleeDamageBonus: null,
    rangedDamageBonus: '+0/+0/+4',
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 10,
    disengageBonus: 1,
    signatureAbilityName: 'Patient Shot',
  },
  {
    id: 'spellsword',
    name: 'Spellsword',
    armor: 'Light, shield',
    weapons: ['Medium'],
    staminaPerEchelon: 6,
    speedBonus: 1,
    stabilityBonus: 1,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Leaping Lightning',
  },
  {
    id: 'stick-and-robe',
    name: 'Stick and Robe',
    armor: 'Light',
    weapons: ['Polearm'],
    staminaPerEchelon: 3,
    speedBonus: 2,
    stabilityBonus: 0,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: null,
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Where I Want You',
  },
  {
    id: 'swashbuckler',
    name: 'Swashbuckler',
    armor: 'Light',
    weapons: ['Medium'],
    staminaPerEchelon: 3,
    speedBonus: 3,
    stabilityBonus: 0,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Fancy Footwork',
  },
  {
    id: 'sword-and-board',
    name: 'Sword and Board',
    armor: 'Medium, shield',
    weapons: ['Medium'],
    staminaPerEchelon: 9,
    speedBonus: 0,
    stabilityBonus: 1,
    meleeDamageBonus: '+2/+2/+2',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Shield Bash',
  },
  {
    id: 'warrior-priest',
    name: 'Warrior Priest',
    armor: 'Heavy',
    weapons: ['Light'],
    staminaPerEchelon: 9,
    speedBonus: 1,
    stabilityBonus: 1,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: null,
    meleeDistanceBonus: 0,
    rangedDistanceBonus: 0,
    disengageBonus: 0,
    signatureAbilityName: 'Weakening Brand',
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    armor: 'None',
    weapons: ['Whip'],
    staminaPerEchelon: 0,
    speedBonus: 3,
    stabilityBonus: 0,
    meleeDamageBonus: '+1/+1/+1',
    rangedDamageBonus: null,
    meleeDistanceBonus: 1,
    rangedDistanceBonus: 0,
    disengageBonus: 1,
    signatureAbilityName: 'Extension of My Arm',
  },
];

// ============================================================
// Kit Completeness
// ============================================================
describe('Audit: Kits -- Completeness', () => {
  it('GameData has all 21 standard kits from the Kits Table', () => {
    const allKits = GameData.getAllKits();
    for (const source of SOURCE_KITS) {
      const found = allKits.find((k) => k.id === source.id);
      expect(found, `Kit '${source.name}' (id=${source.id}) not found in GameData`).toBeDefined();
    }
  });

  it('all 21 standard kits are present (by count)', () => {
    // Standard kits only -- the codebase may also include stormwight and beastheart kits
    const standardKitIds = SOURCE_KITS.map((k) => k.id);
    const allKits = GameData.getAllKits();
    const matchingCount = allKits.filter((k) => standardKitIds.includes(k.id)).length;
    expect(matchingCount).toBe(21);
  });

  it('each kit can be retrieved by name (case-insensitive)', () => {
    for (const source of SOURCE_KITS) {
      const kit = GameData.getKitByName(source.name);
      expect(kit, `getKitByName('${source.name}') should find the kit`).toBeDefined();
    }
  });

  it('each kit can be retrieved by id', () => {
    for (const source of SOURCE_KITS) {
      const kit = GameData.getKit(source.id);
      expect(kit, `getKit('${source.id}') should find the kit`).toBeDefined();
    }
  });
});

// ============================================================
// Per-Kit Validation
// ============================================================
describe('Audit: Kits -- Per-Kit Data Validation', () => {
  for (const source of SOURCE_KITS) {
    describe(`Kit: ${source.name}`, () => {
      it('name matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.name).toBe(source.name);
      });

      it('armor matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.armor).toBe(source.armor);
      });

      it('stamina per echelon matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.staminaPerEchelon).toBe(source.staminaPerEchelon);
      });

      it('speed bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.speedBonus).toBe(source.speedBonus);
      });

      it('stability bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.stabilityBonus).toBe(source.stabilityBonus);
      });

      it('melee damage bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.meleeDamageBonus).toBe(source.meleeDamageBonus);
      });

      it('ranged damage bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.rangedDamageBonus).toBe(source.rangedDamageBonus);
      });

      it('melee distance bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.meleeDistanceBonus).toBe(source.meleeDistanceBonus);
      });

      it('ranged distance bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.rangedDistanceBonus).toBe(source.rangedDistanceBonus);
      });

      it('disengage bonus matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.disengageBonus).toBe(source.disengageBonus);
      });

      it('signature ability name matches source', () => {
        const kit = GameData.getKit(source.id) as any;
        expect(kit).toBeDefined();
        expect(kit.signatureAbility).toBeDefined();
        expect(kit.signatureAbility.name).toBe(source.signatureAbilityName);
      });
    });
  }
});

// ============================================================
// Kit Bonuses: Cross-Checks
// ============================================================
describe('Audit: Kits -- Bonus Consistency', () => {
  it('stamina per echelon is always one of 0, 3, 6, 9, or 12', () => {
    const allKits = GameData.getAllKits();
    const validValues = [0, 3, 6, 9, 12];
    for (const kit of allKits) {
      expect(
        validValues.includes((kit as any).staminaPerEchelon),
        `Kit '${(kit as any).name}' has staminaPerEchelon=${(kit as any).staminaPerEchelon}, expected one of [0,3,6,9,12]`
      ).toBe(true);
    }
  });

  it('speed bonus is always 0, 1, 2, or 3', () => {
    const allKits = GameData.getAllKits();
    for (const kit of allKits) {
      expect(
        [0, 1, 2, 3].includes((kit as any).speedBonus),
        `Kit '${(kit as any).name}' has speedBonus=${(kit as any).speedBonus}`
      ).toBe(true);
    }
  });

  it('stability bonus is always 0, 1, 2, or 3', () => {
    const allKits = GameData.getAllKits();
    for (const kit of allKits) {
      expect(
        [0, 1, 2, 3].includes((kit as any).stabilityBonus),
        `Kit '${(kit as any).name}' has stabilityBonus=${(kit as any).stabilityBonus}`
      ).toBe(true);
    }
  });

  it('disengage bonus is always 0 or 1', () => {
    const allKits = GameData.getAllKits();
    for (const kit of allKits) {
      expect(
        [0, 1].includes((kit as any).disengageBonus),
        `Kit '${(kit as any).name}' has disengageBonus=${(kit as any).disengageBonus}`
      ).toBe(true);
    }
  });

  it('damage bonuses follow +T1/+T2/+T3 format or are null', () => {
    const validPattern = /^\+\d+\/\+\d+\/\+\d+$/;
    const allKits = GameData.getAllKits();
    for (const kit of allKits) {
      const melee = (kit as any).meleeDamageBonus;
      const ranged = (kit as any).rangedDamageBonus;
      if (melee !== null) {
        expect(
          validPattern.test(melee),
          `Kit '${(kit as any).name}' melee damage '${melee}' does not match +N/+N/+N pattern`
        ).toBe(true);
      }
      if (ranged !== null) {
        expect(
          validPattern.test(ranged),
          `Kit '${(kit as any).name}' ranged damage '${ranged}' does not match +N/+N/+N pattern`
        ).toBe(true);
      }
    }
  });

  it('melee distance bonus is always 0 or 1', () => {
    const standardKitIds = SOURCE_KITS.map((k) => k.id);
    const allKits = GameData.getAllKits().filter((k) => standardKitIds.includes(k.id));
    for (const kit of allKits) {
      expect(
        [0, 1].includes((kit as any).meleeDistanceBonus),
        `Kit '${(kit as any).name}' has meleeDistanceBonus=${(kit as any).meleeDistanceBonus}`
      ).toBe(true);
    }
  });

  it('ranged distance bonus is always 0, 5, 7, or 10', () => {
    const standardKitIds = SOURCE_KITS.map((k) => k.id);
    const allKits = GameData.getAllKits().filter((k) => standardKitIds.includes(k.id));
    for (const kit of allKits) {
      expect(
        [0, 5, 7, 10].includes((kit as any).rangedDistanceBonus),
        `Kit '${(kit as any).name}' has rangedDistanceBonus=${(kit as any).rangedDistanceBonus}`
      ).toBe(true);
    }
  });
});

// ============================================================
// Kit Signature Abilities
// ============================================================
describe('Audit: Kits -- Signature Abilities', () => {
  it('every standard kit has a signature ability', () => {
    for (const source of SOURCE_KITS) {
      const kit = GameData.getKit(source.id) as any;
      expect(kit, `Kit '${source.name}' should exist`).toBeDefined();
      expect(
        kit.signatureAbility,
        `Kit '${source.name}' should have a signatureAbility`
      ).toBeDefined();
    }
  });

  it('every signature ability has keywords, distance, target, and power roll tiers', () => {
    for (const source of SOURCE_KITS) {
      const kit = GameData.getKit(source.id) as any;
      const sig = kit?.signatureAbility;
      if (!sig) continue;

      expect(sig.keywords, `${source.name}: keywords should be an array`).toBeInstanceOf(Array);
      expect(sig.keywords.length, `${source.name}: keywords should be non-empty`).toBeGreaterThan(0);
      expect(sig.distance, `${source.name}: distance should be defined`).toBeDefined();
      expect(sig.target, `${source.name}: target should be defined`).toBeDefined();
      expect(sig.tier1, `${source.name}: tier1 should be defined`).toBeDefined();
      expect(sig.tier2, `${source.name}: tier2 should be defined`).toBeDefined();
      expect(sig.tier3, `${source.name}: tier3 should be defined`).toBeDefined();
    }
  });

  it('getKitAbility returns the same ability as the kit.signatureAbility', () => {
    for (const source of SOURCE_KITS) {
      const directAbility = GameData.getKitAbility(source.id);
      const kit = GameData.getKit(source.id) as any;
      expect(directAbility, `getKitAbility('${source.id}') should find the ability`).toBeDefined();
      expect(directAbility?.name).toBe(kit?.signatureAbility?.name);
    }
  });
});

// ============================================================
// Kit Weapons Validation
// ============================================================
describe('Audit: Kits -- Weapons Match Source', () => {
  for (const source of SOURCE_KITS) {
    it(`${source.name}: weapons match source`, () => {
      const kit = GameData.getKit(source.id) as any;
      expect(kit).toBeDefined();
      // The code may store weapons differently from the table (e.g. two "Light" entries
      // for Cloak and Dagger). We validate the sorted arrays match.
      const codeWeapons = [...(kit.weapons as string[])].sort();
      const sourceWeapons = [...source.weapons].sort();
      expect(codeWeapons).toEqual(sourceWeapons);
    });
  }
});

// ============================================================
// Summary: Kit Count
// ============================================================
describe('Audit: Kits -- Total Count', () => {
  it('GameData includes at least 21 standard kits (may also include stormwight/beastheart kits)', () => {
    const allKits = GameData.getAllKits();
    expect(allKits.length).toBeGreaterThanOrEqual(21);
  });

  it('GameData exposes exactly 21 standard kits (stormwight/beastheart kits are in rules/reference-data only)', () => {
    const allKits = GameData.getAllKits();
    // GameData imports from game-data/data/reference-data.ts which has only 21 standard kits.
    // Stormwight (4) and Beastheart (4) kits are in rules/reference-data.ts, a separate module.
    expect(allKits.length).toBe(21);
  });
});
