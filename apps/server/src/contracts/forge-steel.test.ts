import { describe, expect, it } from 'vitest';
import { HERO_LIMITS } from '../policy/limits.js';
import { parseForgeSteelHeroImport } from './forge-steel.js';

function hero(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'forge-1', name: 'Test Hero', picture: null, folder: '',
    ancestry: null, culture: null, career: null, class: null, complication: null,
    features: [], state: {}, abilityCustomizations: [], ...overrides,
  };
}

function nested(levels: number): unknown {
  let value: unknown = 'leaf';
  for (let index = 0; index < levels; index += 1) value = [value];
  return value;
}

describe('parseForgeSteelHeroImport', () => {
  it('accepts the raw file shape', () => {
    const result = parseForgeSteelHeroImport(hero());
    expect(result).toMatchObject({ ok: true, value: { portraitAssetId: null, hero: { name: 'Test Hero' } } });
  });

  it('accepts the UI envelope with a portrait asset', () => {
    const result = parseForgeSteelHeroImport({ hero: hero(), portraitAssetId: 'asset-1' });
    expect(result).toMatchObject({ ok: true, value: { portraitAssetId: 'asset-1' } });
  });

  it('accepts a large file whose bulk is an embedded picture and rules data', () => {
    const result = parseForgeSteelHeroImport(hero({
      picture: `data:image/png;base64,${'A'.repeat(700_000)}`,
      class: { name: 'Unknown', rules: 'r'.repeat(300_000) },
    }));
    expect(result.ok).toBe(true);
  });

  it('rejects unrelated JSON', () => {
    expect(parseForgeSteelHeroImport({ name: 'No state' })).toMatchObject({ ok: false, error: 'File is not a Forge Steel hero export' });
  });

  it('accepts a name at the limit', () => {
    expect(parseForgeSteelHeroImport(hero({ name: 'n'.repeat(HERO_LIMITS.nameLength) })).ok).toBe(true);
  });

  it('rejects a name over the limit', () => {
    const result = parseForgeSteelHeroImport(hero({ name: 'n'.repeat(HERO_LIMITS.nameLength + 1) }));
    expect(result).toMatchObject({ ok: false, error: 'Hero name is too long' });
  });

  it('rejects unsafe object keys nested in the hero', () => {
    const source = hero({ features: [JSON.parse('{"data": {"__proto__": {"admin": true}}}')] });
    expect(parseForgeSteelHeroImport(source)).toMatchObject({ ok: false, error: 'Forge Steel hero contains an unsafe key' });
  });

  it('rejects unsafe object keys in the envelope', () => {
    const source = JSON.parse('{"constructor": {}}') as Record<string, unknown>;
    expect(parseForgeSteelHeroImport({ ...source, hero: hero() }).ok).toBe(false);
  });

  it('rejects nesting past the depth the key check can see', () => {
    const result = parseForgeSteelHeroImport(hero({ features: [nested(HERO_LIMITS.forgeSteelNestingDepth + 1)] }));
    expect(result).toMatchObject({ ok: false, error: 'Forge Steel hero is nested too deeply' });
  });

  it('rejects an inventory over the byte limit', () => {
    const description = 'd'.repeat(1024);
    const inventory = Array.from({ length: 130 }, (_, index) => ({ id: `i${index}`, name: 'Item', description }));
    const result = parseForgeSteelHeroImport(hero({ state: { inventory } }));
    expect(result).toMatchObject({ ok: false, error: 'Forge Steel inventory is too large' });
  });

  it('rejects stored hero data over the normal hero size', () => {
    const selected = Array.from({ length: HERO_LIMITS.forgeSteelListItems }, (_, index) => `${index}`.padEnd(HERO_LIMITS.forgeSteelTextLength, 's'));
    const languages = Array.from({ length: HERO_LIMITS.forgeSteelListItems }, (_, index) => `${index}`.padEnd(HERO_LIMITS.forgeSteelTextLength, 'l'));
    const abilities = Array.from({ length: HERO_LIMITS.forgeSteelListItems }, (_, index) => `${index}`.padEnd(HERO_LIMITS.forgeSteelTextLength, 'a'));
    const result = parseForgeSteelHeroImport(hero({
      state: { inventory: [{ id: 'bulk', name: 'Bulk', description: 'd'.repeat(100 * 1024) }] },
      features: [
        { type: 'Skill Choice', data: { selected } },
        { type: 'Language Choice', data: { selected: languages } },
        { type: 'Class Ability', data: { selectedIDs: abilities } },
      ],
    }));
    expect(result).toMatchObject({ ok: false, error: 'Forge Steel hero is too large' });
  });
});
