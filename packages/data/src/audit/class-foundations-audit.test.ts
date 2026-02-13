/**
 * Class Foundations Audit (Slice 5)
 *
 * Validates all 11 class definitions against Draw Steel source books.
 * Checks stamina, recoveries, characteristics, heroic resource,
 * potency, subclass options, and cross-validates between
 * class-definitions.ts, game-rules.ts, and hero-logic.ts.
 *
 * Source: docs/rules_data/data-rules-md/Classes/*.md
 *         docs/forgesteel-ref/src/data/classes/beastheart/beastheart.ts
 *         docs/rules_data/data-rules-md/summoner v10.md
 */
import { describe, it, expect } from 'vitest';
import { GameData } from '../game-data/lib/game-rules.js';
import { classDefinitions } from '../game-data/data/classes/class-definitions.js';
import * as HeroLogic from '../logic/hero-logic.js';

// ============================================================
// Source-of-truth data extracted from source books
// ============================================================

interface SourceClass {
  id: string;
  name: string;
  role: 'Defender' | 'Controller' | 'Striker' | 'Support';
  masterClass: boolean;

  // Stamina
  startingStamina: number;
  staminaPerLevel: number;
  startingRecoveries: number;

  // Characteristics
  startingCharacteristics: Record<string, number>;
  potencyCharacteristic: string;

  // Heroic resource
  heroicResourceName: string;
  heroicResourceType: string;

  // Subclasses
  subclassName: string;
  subclassSelectCount: number;
  subclassIds: string[];
  subclassNames: string[];
}

/**
 * Ground-truth class data extracted from:
 *   docs/rules_data/data-rules-md/Classes/*.md
 *   docs/forgesteel-ref/src/data/classes/beastheart/beastheart.ts
 *   docs/rules_data/data-rules-md/summoner v10.md
 */
const SOURCE_CLASSES: SourceClass[] = [
  {
    id: 'beastheart',
    name: 'Beastheart',
    role: 'Striker',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 12,
    startingRecoveries: 12,
    startingCharacteristics: { might: 2, intuition: 2 },
    potencyCharacteristic: 'might',
    heroicResourceName: 'Ferocity',
    heroicResourceType: 'ferocity',
    subclassName: 'Wild Nature',
    subclassSelectCount: 1,
    subclassIds: ['guardian', 'prowler', 'punisher', 'spark'],
    subclassNames: ['Guardian', 'Prowler', 'Punisher', 'Spark'],
  },
  {
    id: 'censor',
    name: 'Censor',
    role: 'Defender',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 12,
    // Source: "You start with a Might of 2 and a Presence of 2"
    startingCharacteristics: { might: 2, presence: 2 },
    // Source: "Weak Potency: Presence − 2" ... "Strong Potency: Presence"
    potencyCharacteristic: 'presence',
    // Source: "Heroic Resource called wrath"
    heroicResourceName: 'Wrath',
    heroicResourceType: 'wrath',
    subclassName: 'Order',
    subclassSelectCount: 1,
    subclassIds: ['exorcist', 'oracle', 'paragon'],
    subclassNames: ['Exorcist', 'Oracle', 'Paragon'],
  },
  {
    id: 'conduit',
    name: 'Conduit',
    role: 'Support',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    // Source: "You start with an Intuition of 2"
    startingCharacteristics: { intuition: 2 },
    // Source: "Weak Potency: Intuition - 2" ... "Strong Potency: Intuition"
    potencyCharacteristic: 'intuition',
    // Source: "Heroic Resource called piety"
    heroicResourceName: 'Piety',
    heroicResourceType: 'piety',
    subclassName: 'Domain',
    subclassSelectCount: 2, // Conduit chooses TWO domains
    subclassIds: [
      'creation', 'death', 'fate', 'knowledge', 'life', 'love',
      'nature', 'protection', 'storm', 'sun', 'trickery', 'war',
    ],
    subclassNames: [
      'Creation', 'Death', 'Fate', 'Knowledge', 'Life', 'Love',
      'Nature', 'Protection', 'Storm', 'Sun', 'Trickery', 'War',
    ],
  },
  {
    id: 'elementalist',
    name: 'Elementalist',
    role: 'Controller',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    // Source: "You start with a Reason of 2"
    startingCharacteristics: { reason: 2 },
    // Source: "Weak Potency: Reason − 2" ... "Strong Potency: Reason"
    potencyCharacteristic: 'reason',
    // Source: "Heroic Resource called essence"
    heroicResourceName: 'Essence',
    heroicResourceType: 'essence',
    subclassName: 'Specialization',
    subclassSelectCount: 1,
    subclassIds: ['earth', 'fire', 'green', 'void'],
    subclassNames: ['Earth', 'Fire', 'Green', 'Void'],
  },
  {
    id: 'fury',
    name: 'Fury',
    role: 'Striker',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 10,
    // Source: "You start with a Might of 2 and an Agility of 2"
    startingCharacteristics: { might: 2, agility: 2 },
    // Source: "Weak Potency: Might − 2" ... "Strong Potency: Might"
    potencyCharacteristic: 'might',
    // Source: "Heroic Resource called ferocity"
    heroicResourceName: 'Ferocity',
    heroicResourceType: 'ferocity',
    subclassName: 'Aspect',
    subclassSelectCount: 1,
    subclassIds: ['berserker', 'reaver', 'stormwight'],
    subclassNames: ['Berserker', 'Reaver', 'Stormwight'],
  },
  {
    id: 'null',
    name: 'Null',
    role: 'Defender',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 8,
    // Source: "You start with an Agility of 2 and an Intuition of 2"
    startingCharacteristics: { agility: 2, intuition: 2 },
    // Source: "Weak Potency: Intuition − 2" ... "Strong Potency: Intuition"
    potencyCharacteristic: 'intuition',
    // Source: "Heroic Resource called discipline"
    heroicResourceName: 'Discipline',
    heroicResourceType: 'discipline',
    subclassName: 'Tradition',
    subclassSelectCount: 1,
    subclassIds: ['chronokinetic', 'cryokinetic', 'metakinetic'],
    subclassNames: ['Chronokinetic', 'Cryokinetic', 'Metakinetic'],
  },
  {
    id: 'shadow',
    name: 'Shadow',
    role: 'Striker',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    // Source: "You start with an Agility of 2"
    startingCharacteristics: { agility: 2 },
    // Source: "Weak Potency: Agility − 2" ... "Strong Potency: Agility"
    potencyCharacteristic: 'agility',
    // Source: "Heroic Resource called insight"
    heroicResourceName: 'Insight',
    heroicResourceType: 'insight',
    subclassName: 'College',
    subclassSelectCount: 1,
    subclassIds: ['black-ash', 'caustic-alchemy', 'harlequin-mask'],
    subclassNames: ['College of Black Ash', 'College of Caustic Alchemy', 'College of the Harlequin Mask'],
  },
  {
    id: 'summoner',
    name: 'Summoner',
    role: 'Controller',
    masterClass: true,
    startingStamina: 15,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    // Source: "Starting Reason: 2"
    startingCharacteristics: { reason: 2 },
    // Source: "Weak: Reason - 2" ... "Strong: Reason"
    potencyCharacteristic: 'reason',
    // Source: "Resource: Essence"
    heroicResourceName: 'Essence',
    heroicResourceType: 'essence',
    subclassName: 'Circle',
    subclassSelectCount: 1,
    subclassIds: ['blight', 'graves', 'spring', 'storms'],
    subclassNames: ['Circle of Blight', 'Circle of Graves', 'Circle of Spring', 'Circle of Storms'],
  },
  {
    id: 'tactician',
    name: 'Tactician',
    role: 'Support',
    masterClass: false,
    startingStamina: 21,
    staminaPerLevel: 9,
    startingRecoveries: 10,
    // Source: "You start with a Might of 2 and a Reason of 2"
    startingCharacteristics: { might: 2, reason: 2 },
    // Source: "Weak Potency: Reason − 2" ... "Strong Potency: Reason"
    potencyCharacteristic: 'reason',
    // Source: "Heroic Resource called focus"
    heroicResourceName: 'Focus',
    heroicResourceType: 'focus',
    subclassName: 'Doctrine',
    subclassSelectCount: 1,
    subclassIds: ['insurgent', 'mastermind', 'vanguard'],
    subclassNames: ['Insurgent', 'Mastermind', 'Vanguard'],
  },
  {
    id: 'talent',
    name: 'Talent',
    role: 'Controller',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    // Source: "You start with a Reason of 2 and a Presence of 2"
    startingCharacteristics: { reason: 2, presence: 2 },
    // Source: "Weak Potency: Reason − 2" ... "Strong Potency: Reason"
    potencyCharacteristic: 'reason',
    // Source: "Heroic Resource called clarity"
    heroicResourceName: 'Clarity',
    heroicResourceType: 'clarity',
    subclassName: 'Tradition',
    subclassSelectCount: 1,
    subclassIds: ['chronopathy', 'telekinesis', 'telepathy'],
    subclassNames: ['Chronopathy', 'Telekinesis', 'Telepathy'],
  },
  {
    id: 'troubadour',
    name: 'Troubadour',
    role: 'Support',
    masterClass: false,
    startingStamina: 18,
    staminaPerLevel: 6,
    startingRecoveries: 8,
    // Source: "You start with an Agility of 2 and a Presence of 2"
    startingCharacteristics: { agility: 2, presence: 2 },
    // Source: "Weak Potency: Presence − 2" ... "Strong Potency: Presence"
    potencyCharacteristic: 'presence',
    // Source: "Heroic Resource called drama"
    heroicResourceName: 'Drama',
    heroicResourceType: 'drama',
    subclassName: 'Class Act',
    subclassSelectCount: 1,
    subclassIds: ['auteur', 'duelist', 'virtuoso'],
    subclassNames: ['Auteur', 'Duelist', 'Virtuoso'],
  },
];

// ============================================================
// Tests
// ============================================================

describe('Audit: Class Foundations — All 11 present', () => {
  it('should have exactly 11 classes', () => {
    const all = GameData.getAllClasses();
    expect(all.length).toBe(11);
  });

  it('should contain all expected class IDs', () => {
    const ids = GameData.getAllClasses().map((c) => c.id);
    for (const source of SOURCE_CLASSES) {
      expect(ids).toContain(source.id);
    }
  });
});

// Per-class detailed validation
for (const source of SOURCE_CLASSES) {
  describe(`Audit: Class — ${source.name}`, () => {
    it(`should exist via getClass("${source.id}")`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls).toBeDefined();
    });

    it(`should have name "${source.name}"`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.name).toBe(source.name);
    });

    it(`should have role "${source.role}"`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.role).toBe(source.role);
    });

    it(`should have masterClass=${source.masterClass}`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.masterClass).toBe(source.masterClass);
    });

    // Stamina validation
    it(`should have starting stamina ${source.startingStamina}`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.baseStats.stamina.level1).toBe(source.startingStamina);
    });

    it(`should have stamina per level ${source.staminaPerLevel}`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.baseStats.stamina.perLevel).toBe(source.staminaPerLevel);
    });

    it(`should have ${source.startingRecoveries} recoveries`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.baseStats.recoveries).toBe(source.startingRecoveries);
    });

    // Potency characteristic
    it(`should have potency characteristic "${source.potencyCharacteristic}"`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.potencyCharacteristic).toBe(source.potencyCharacteristic);
    });

    // Starting characteristics
    it(`should have correct starting characteristics`, () => {
      const cls = GameData.getClass(source.id as any);
      const chars = cls?.startingCharacteristics ?? {};

      // Check each expected characteristic
      for (const [key, value] of Object.entries(source.startingCharacteristics)) {
        expect(chars[key as keyof typeof chars]).toBe(value);
      }

      // Ensure no extra characteristics with value > 0
      const codeChars = Object.entries(chars).filter(([, v]) => v !== undefined && v > 0);
      expect(codeChars.length).toBe(Object.keys(source.startingCharacteristics).length);
    });

    // Heroic resource
    it(`should have heroic resource name "${source.heroicResourceName}"`, () => {
      const cls = GameData.getClass(source.id as any) as any;
      expect(cls?.heroicResourceDef?.name).toBe(source.heroicResourceName);
    });

    it(`should have heroic resource type "${source.heroicResourceType}"`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.heroicResource).toBe(source.heroicResourceType);
    });

    // Subclass info
    it(`should have subclass name "${source.subclassName}"`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.subclassName).toBe(source.subclassName);
    });

    it(`should have subclass select count ${source.subclassSelectCount}`, () => {
      const cls = GameData.getClass(source.id as any);
      expect(cls?.subclassSelectCount).toBe(source.subclassSelectCount);
    });

    it(`should have ${source.subclassIds.length} subclass options`, () => {
      const subs = GameData.getSubclasses(source.id as any);
      expect(subs.length).toBe(source.subclassIds.length);
    });

    // Validate each subclass
    for (let i = 0; i < source.subclassIds.length; i++) {
      it(`subclass "${source.subclassIds[i]}" should exist with name "${source.subclassNames[i]}"`, () => {
        const sub = GameData.getSubclass(source.id as any, source.subclassIds[i]);
        expect(sub).toBeDefined();
        expect(sub?.name).toBe(source.subclassNames[i]);
      });
    }
  });
}

// ============================================================
// Cross-validation: class-definitions.ts matches game-rules.ts CLASS_STAMINA_CONFIG
// ============================================================

describe('Audit: Class Foundations — class-definitions.ts ↔ GameData consistency', () => {
  for (const source of SOURCE_CLASSES) {
    it(`${source.name}: classDefinitions stamina matches GameData`, () => {
      const def = classDefinitions[source.id as keyof typeof classDefinitions];
      const cls = GameData.getClass(source.id as any);

      expect(def.startingStamina).toBe(cls?.baseStats.stamina.level1);
      expect(def.staminaPerLevel).toBe(cls?.baseStats.stamina.perLevel);
      expect(def.startingRecoveries).toBe(cls?.baseStats.recoveries);
    });

    it(`${source.name}: classDefinitions heroic resource type matches GameData`, () => {
      const def = classDefinitions[source.id as keyof typeof classDefinitions];
      const cls = GameData.getClass(source.id as any);

      expect(def.heroicResource.type).toBe(cls?.heroicResource);
    });

    it(`${source.name}: classDefinitions potency matches GameData`, () => {
      const def = classDefinitions[source.id as keyof typeof classDefinitions];
      const cls = GameData.getClass(source.id as any);

      expect(def.potencyCharacteristic).toBe(cls?.potencyCharacteristic);
    });
  }
});

// ============================================================
// Cross-validation: hero-logic.ts CONFIG maps
// ============================================================

describe('Audit: Class Foundations — hero-logic.ts cross-checks', () => {
  for (const source of SOURCE_CLASSES) {
    it(`${source.name}: HeroLogic stamina config matches source`, () => {
      const maxStamina = HeroLogic.getMaxStaminaForClass(source.id as any, 1);
      expect(maxStamina).toBe(source.startingStamina);
    });

    it(`${source.name}: HeroLogic recoveries matches source`, () => {
      const recoveries = HeroLogic.getMaxRecoveries(source.id as any);
      expect(recoveries).toBe(source.startingRecoveries);
    });

    it(`${source.name}: HeroLogic primary potency matches source`, () => {
      const potency = HeroLogic.getPotencyCharacteristic(source.id as any);
      expect(potency).toBe(source.potencyCharacteristic);
    });
  }
});

// ============================================================
// Cross-class validations
// ============================================================

describe('Audit: Class Foundations — Cross-class checks', () => {
  it('only Summoner should be a master class', () => {
    const masterClasses = GameData.getAllClasses().filter((c) => c.masterClass);
    expect(masterClasses.length).toBe(1);
    expect(masterClasses[0].id).toBe('summoner');
  });

  it('each class role should be one of Defender/Controller/Striker/Support', () => {
    const validRoles = ['Defender', 'Controller', 'Striker', 'Support'];
    for (const cls of GameData.getAllClasses()) {
      expect(validRoles).toContain(cls.role);
    }
  });

  it('all classes should have at least 1 subclass option', () => {
    for (const cls of GameData.getAllClasses()) {
      const subs = GameData.getSubclasses(cls.id);
      expect(subs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('only Conduit should have subclassSelectCount > 1', () => {
    const multiSelect = GameData.getAllClasses().filter((c) => c.subclassSelectCount > 1);
    expect(multiSelect.length).toBe(1);
    expect(multiSelect[0].id).toBe('conduit');
  });

  it('stamina level1 values should match known tiers (15, 18, or 21)', () => {
    for (const cls of GameData.getAllClasses()) {
      expect([15, 18, 21]).toContain(cls.baseStats.stamina.level1);
    }
  });

  it('stamina perLevel values should match known tiers (6, 9, or 12)', () => {
    for (const cls of GameData.getAllClasses()) {
      expect([6, 9, 12]).toContain(cls.baseStats.stamina.perLevel);
    }
  });

  it('recoveries should be 8, 10, or 12', () => {
    for (const cls of GameData.getAllClasses()) {
      expect([8, 10, 12]).toContain(cls.baseStats.recoveries);
    }
  });

  it('potency characteristic should be a valid characteristic', () => {
    const validChars = ['might', 'agility', 'reason', 'intuition', 'presence'];
    for (const cls of GameData.getAllClasses()) {
      expect(validChars).toContain(cls.potencyCharacteristic);
    }
  });

  it('heroic resource types should all be valid', () => {
    const validTypes = [
      'ferocity', 'piety', 'focus', 'insight', 'discipline',
      'wrath', 'clarity', 'drama', 'essence', 'rage', 'heroic',
    ];
    for (const cls of GameData.getAllClasses()) {
      expect(validTypes).toContain(cls.heroicResource);
    }
  });

  it('Elementalist and Summoner should share essence resource type', () => {
    const elem = GameData.getClass('elementalist' as any);
    const summ = GameData.getClass('summoner' as any);
    expect(elem?.heroicResource).toBe('essence');
    expect(summ?.heroicResource).toBe('essence');
  });
});
