import { isForgeSteelHero, normalizeForgeSteelHero, type NormalizedForgeSteelHero } from '../lib/forge-steel.js';
import { HERO_LIMITS } from '../policy/limits.js';
import { exceedsJsonDepth, hasUnsafeObjectKey, isRecord, jsonByteLength, trimString, type ValidationResult } from '../security/validation.js';

export interface ForgeSteelHeroImport {
  hero: NormalizedForgeSteelHero;
  portraitAssetId: string | null;
}

/**
 * Validates a raw Forge Steel file or the UI's `{ hero, portraitAssetId }`
 * envelope. The file limit is larger than the stored hero limit because exports
 * embed pictures and rules text that are not kept, so the size limits apply to
 * the normalized hero.
 */
export function parseForgeSteelHeroImport(value: unknown): ValidationResult<ForgeSteelHeroImport> {
  const envelope = isRecord(value) && isRecord(value['hero']) ? value : null;
  const source = envelope?.['hero'] ?? value;
  if (!isForgeSteelHero(source)) return { ok: false, error: 'File is not a Forge Steel hero export' };
  if (exceedsJsonDepth(value, HERO_LIMITS.forgeSteelNestingDepth)) return { ok: false, error: 'Forge Steel hero is nested too deeply' };
  if (hasUnsafeObjectKey(value)) return { ok: false, error: 'Forge Steel hero contains an unsafe key' };
  if (source.name.trim().length > HERO_LIMITS.nameLength) return { ok: false, error: 'Hero name is too long' };

  const hero = normalizeForgeSteelHero(source);
  if (jsonByteLength(hero.data['inventory']) > HERO_LIMITS.inventoryBytes) return { ok: false, error: 'Forge Steel inventory is too large' };
  if (jsonByteLength(hero) > HERO_LIMITS.jsonBodyBytes) return { ok: false, error: 'Forge Steel hero is too large' };
  return { ok: true, value: { hero, portraitAssetId: trimString(envelope?.['portraitAssetId'], HERO_LIMITS.forgeSteelTextLength) } };
}
