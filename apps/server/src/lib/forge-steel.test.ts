import { describe, expect, it } from 'vitest';
import type { ForgeSteelHeroFile } from '@anvil/types';
import { HERO_LIMITS } from '../policy/limits.js';
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
  });

  it('keeps a valid external picture URL', () => {
    const result = normalizeForgeSteelHero({ ...hero(), picture: 'https://example.com/hero.png' });
    expect(result.pictureUrl).toBe('https://example.com/hero.png');
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ['plain http', 'http://example.com/hero.png'],
    ['an https prefix that is not a URL', 'https://'],
    ['a URL over the portrait length limit', `https://example.com/${'a'.repeat(HERO_LIMITS.portraitUrlLength)}`],
  ])('drops %s and warns about it', (_label, picture) => {
    const result = normalizeForgeSteelHero({ ...hero(), picture });
    expect(result.pictureUrl).toBeNull();
    expect(result.warnings).toContain('Picture URL was not imported');
  });

  it('does not warn about an embedded picture, which the client uploads as an asset', () => {
    const result = normalizeForgeSteelHero({ ...hero(), picture: 'data:image/png;base64,AAAA' });
    expect(result.pictureUrl).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  it('does not keep any raw source payload', () => {
    const source = hero();
    source['secretField'] = 'raw-marker';
    source.culture = { id: 'local', name: 'raw-marker' };
    source.state.inventory = [{ id: 'rope', name: 'Rope', extra: 'raw-marker' }];
    const result = normalizeForgeSteelHero(source);
    expect(result.data['forgeSteel']).toEqual({ format: 'forge-steel.ds-hero' });
    expect(JSON.stringify(result)).not.toContain('raw-marker');
    expect(JSON.parse(result.culture)).toEqual({ preset: 'local' });
  });

  it('ignores identifiers over the import text limit', () => {
    const long = 'x'.repeat(HERO_LIMITS.forgeSteelTextLength + 1);
    const source = hero();
    source.ancestry = { id: long, name: 'Unknown' };
    source.features = [{ type: 'Skill Choice', data: { selected: [long, 'Short Skill'] } }];
    const result = normalizeForgeSteelHero(source);
    expect(result.ancestry).toBeNull();
    expect(result.skills).toEqual(['Short Skill']);
  });

  it('caps imported lists', () => {
    const source = hero();
    const selected = Array.from({ length: HERO_LIMITS.forgeSteelListItems + 5 }, (_, index) => `Skill ${index}`);
    source.features = [{ type: 'Skill Choice', data: { selected } }];
    expect(normalizeForgeSteelHero(source).skills).toHaveLength(HERO_LIMITS.forgeSteelListItems);
  });

  it('rejects unrelated JSON', () => {
    expect(isForgeSteelHero({ name: 'No state' })).toBe(false);
  });
});
