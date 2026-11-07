import { describe, expect, it } from 'vitest';
import type { ForgeSteelHeroFile } from '@anvil/types';
import { isForgeSteelHero, normalizeForgeSteelHero } from './forge-steel.js';

function hero(): ForgeSteelHeroFile {
  return {
    id: 'forge-1', name: 'Test Hero', picture: null, folder: '', settingIDs: [],
    ancestry: { id: 'dwarf', name: 'Dwarf' },
    culture: { id: 'local', name: 'Local' },
    career: { id: 'criminal', name: 'Criminal' },
    class: {
      id: 'fury', name: 'Fury', level: 3,
      characteristics: [
        { characteristic: 'Might', value: 2 }, { characteristic: 'Agility', value: 1 },
        { characteristic: 'Reason', value: -1 }, { characteristic: 'Intuition', value: 0 },
        { characteristic: 'Presence', value: 1 },
      ],
      subclasses: [{ id: 'berserker', name: 'Berserker', selected: true }],
    },
    complication: null,
    features: [
      { id: 'skills', name: 'Skills', type: 'Skill Choice', data: { selected: ['Criminal Underworld'] } },
      { id: 'kit', name: 'Kit', type: 'Kit', data: { selected: [{ id: 'mountain', name: 'Mountain' }] } },
      { id: 'ability', name: 'Ability', type: 'Ability', data: { ability: { id: 'unquiet-ground', name: 'Unquiet Ground' } } },
    ],
    state: { staminaDamage: 5, recoveriesUsed: 1, victories: 2, xp: 3, inventory: [{ id: 'rope', name: 'Rope', description: 'Useful' }] },
    abilityCustomizations: [],
  };
}

describe('Forge Steel hero compatibility', () => {
  it('recognizes and maps the raw .ds-hero shape', () => {
    const source = hero();
    expect(isForgeSteelHero(source)).toBe(true);
    const result = normalizeForgeSteelHero(source);
    expect(result).toMatchObject({ name: 'Test Hero', ancestry: 'dwarf', career: 'criminal', heroClass: 'fury', level: 3, kit: 'mountain' });
    expect(result.characteristics.might).toBe(2);
    expect(result.skills).toContain('Criminal Underworld');
    expect(result.abilities).toContain('unquiet-ground');
    expect(result.data['inventory']).toEqual([expect.objectContaining({ name: 'Rope', source: 'custom' })]);
    expect((result.data['forgeSteel'] as { hero: unknown }).hero).toBe(source);
  });

  it('rejects unrelated JSON', () => {
    expect(isForgeSteelHero({ name: 'No state' })).toBe(false);
  });
});
