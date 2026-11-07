import { GameData, HeroLogic } from '@anvil/data';
import type { Characteristics, HeroClass } from '@anvil/data';
import type { ForgeSteelHeroFile } from '@anvil/types';
import { HERO_LIMITS } from '../policy/limits.js';
import { normalizeExternalPortraitUrl } from '../services/hero-rules.js';

type JsonRecord = Record<string, unknown>;

export interface NormalizedForgeSteelHero {
  name: string;
  ancestry: string | null;
  culture: string;
  career: string | null;
  heroClass: HeroClass | null;
  subclass: string | null;
  level: number;
  characteristics: Characteristics;
  kit: string | null;
  skills: string[];
  abilities: string[];
  pictureUrl: string | null;
  data: Record<string, unknown>;
  warnings: string[];
}

interface AbilitySource {
  id: string | null;
  name: string | null;
}

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function shortText(value: unknown): string | null {
  const result = text(value);
  return result && result.length <= HERO_LIMITS.forgeSteelTextLength ? result : null;
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function resolveNamed<T extends { id: string; name: string }>(source: JsonRecord | null, choices: T[]): T | null {
  const id = text(source?.['id']);
  const name = shortText(source?.['name']);
  return choices.find((choice) => choice.id === id)
    ?? choices.find((choice) => name && normalized(choice.name) === normalized(name))
    ?? null;
}

function walk(value: unknown, visitor: (item: JsonRecord) => void): void {
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
    return;
  }
  const item = record(value);
  if (!item) return;
  visitor(item);
  for (const child of Object.values(item)) walk(child, visitor);
}

function featureSelections(hero: ForgeSteelHeroFile): {
  skills: string[];
  languages: string[];
  kitNames: string[];
  abilityIds: string[];
  directAbilities: JsonRecord[];
} {
  const skills: string[] = [];
  const languages: string[] = [];
  const kitNames: string[] = [];
  const abilityIds: string[] = [];
  const directAbilities: JsonRecord[] = [];
  walk(hero, (item) => {
    const type = item['type'];
    const data = record(item['data']);
    if (!data) return;
    if (type === 'Skill Choice' && Array.isArray(data['selected'])) {
      skills.push(...data['selected'].flatMap((value) => text(value) ?? []));
    } else if (type === 'Language') {
      const language = text(data['language']); if (language) languages.push(language);
    } else if (type === 'Language Choice' && Array.isArray(data['selected'])) {
      languages.push(...data['selected'].flatMap((value) => text(value) ?? []));
    } else if (type === 'Kit' && Array.isArray(data['selected'])) {
      for (const selected of data['selected']) { const name = text(record(selected)?.['name']); if (name) kitNames.push(name); }
    } else if (type === 'Ability') {
      const ability = record(data['ability']); if (ability) directAbilities.push(ability);
    } else if (type === 'Class Ability' && Array.isArray(data['selectedIDs'])) {
      abilityIds.push(...data['selectedIDs'].flatMap((value) => text(value) ?? []));
    }
  });
  return { skills, languages, kitNames, abilityIds, directAbilities };
}

function unique(values: string[]): string[] {
  const kept = values.filter((value) => value && value.length <= HERO_LIMITS.forgeSteelTextLength);
  return [...new Set(kept)].slice(0, HERO_LIMITS.forgeSteelListItems);
}

function uniqueAbilitySources(sources: AbilitySource[]): AbilitySource[] {
  const byKey = new Map<string, AbilitySource>();
  for (const source of sources) {
    const key = source.id ?? source.name;
    if (key && !byKey.has(key)) byKey.set(key, source);
  }
  return [...byKey.values()].slice(0, HERO_LIMITS.forgeSteelListItems);
}

function inventoryFromState(state: JsonRecord): Record<string, unknown>[] {
  if (!Array.isArray(state['inventory'])) return [];
  return state['inventory'].flatMap((raw, index) => {
    const item = record(raw);
    if (!item) return [];
    const name = text(item['name']) ?? `Imported item ${index + 1}`;
    return [{
      id: text(item['id']) ?? `forge-steel-${index + 1}`,
      source: 'custom',
      name,
      category: 'misc',
      quantity: Math.max(1, Math.round(finite(item['quantity'], 1))),
      description: text(item['description']) ?? '',
      notes: 'Imported from Forge Steel',
    }];
  });
}

export function isForgeSteelHero(value: unknown): value is ForgeSteelHeroFile {
  const hero = record(value);
  return !!hero && !!text(hero['name']) && !!record(hero['state'])
    && Array.isArray(hero['features']) && Array.isArray(hero['abilityCustomizations']);
}

export function normalizeForgeSteelHero(hero: ForgeSteelHeroFile): NormalizedForgeSteelHero {
  const ancestry = resolveNamed(record(hero.ancestry), GameData.getAllAncestries());
  const career = resolveNamed(record(hero.career), GameData.getAllCareers());
  const classSource = record(hero.class);
  const classDef = resolveNamed(classSource, GameData.getAllClasses());
  const heroClass = classDef && HeroLogic.isValidHeroClass(classDef.id) ? classDef.id : null;
  const level = Math.max(1, Math.min(10, Math.round(finite(classSource?.['level'], 1))));
  const characteristics: Characteristics = { might: 0, agility: 0, reason: 0, intuition: 0, presence: 0 };
  if (Array.isArray(classSource?.['characteristics'])) {
    for (const raw of classSource['characteristics']) {
      const entry = record(raw);
      const key = text(entry?.['characteristic'])?.toLowerCase();
      if (key && key in characteristics) characteristics[key as keyof Characteristics] = finite(entry?.['value']);
    }
  }
  const selectedSubclass = Array.isArray(classSource?.['subclasses'])
    ? classSource['subclasses'].map(record).find((item) => item?.['selected'] === true)
    : null;
  const selections = featureSelections(hero);
  const kit = unique(selections.kitNames)
    .map((name) => GameData.getKitByName(name))
    .find((choice) => !!choice) ?? null;

  const idNames = new Map<string, string>();
  walk(hero, (item) => { const id = shortText(item['id']); const name = shortText(item['name']); if (id && name) idNames.set(id, name); });
  const sourceAbilities = uniqueAbilitySources([
    ...selections.directAbilities.map((ability) => ({ id: shortText(ability['id']), name: shortText(ability['name']) })),
    ...selections.abilityIds.map((id) => ({ id: shortText(id), name: idNames.get(id) ?? null })),
  ]);
  const abilitiesById = new Map<string, string>();
  const abilitiesByName = new Map<string, string>();
  for (const { name, metadata: { item_id: id } } of GameData.getAllAbilities()) {
    if (!abilitiesById.has(id)) abilitiesById.set(id, id);
    if (!abilitiesByName.has(normalized(name))) abilitiesByName.set(normalized(name), id);
  }
  const abilities = unique(sourceAbilities.flatMap((source) => (
    (source.id ? abilitiesById.get(source.id) : undefined)
      ?? (source.name ? abilitiesByName.get(normalized(source.name)) : undefined)
      ?? source.id
      ?? []
  )));
  const state = record(hero.state) ?? {};
  const culture = record(hero.culture);
  const picture = text(hero.picture);
  const pictureUrl = normalizeExternalPortraitUrl(picture);
  const warnings: string[] = [];
  if (hero.ancestry && !ancestry) warnings.push(`Unknown ancestry: ${shortText(record(hero.ancestry)?.['name']) ?? 'unnamed'}`);
  if (hero.career && !career) warnings.push(`Unknown career: ${shortText(record(hero.career)?.['name']) ?? 'unnamed'}`);
  if (hero.class && !heroClass) warnings.push(`Unknown class: ${shortText(classSource?.['name']) ?? 'unnamed'}`);
  if (selections.kitNames.length && !kit) warnings.push(`Unknown kit: ${shortText(selections.kitNames[0]) ?? 'unnamed'}`);
  // An embedded data: picture is not a URL to keep: the client uploads it as an asset.
  if (picture && !pictureUrl && !picture.startsWith('data:')) warnings.push('Picture URL was not imported');

  return {
    name: hero.name.trim(),
    ancestry: ancestry?.id ?? shortText(record(hero.ancestry)?.['id']),
    culture: JSON.stringify(culture ? { preset: shortText(culture['id']) } : null),
    career: career?.id ?? shortText(record(hero.career)?.['id']),
    heroClass,
    subclass: shortText(selectedSubclass?.['name']) ?? shortText(selectedSubclass?.['id']),
    level,
    characteristics,
    kit: kit?.id ?? null,
    skills: unique(selections.skills),
    abilities,
    pictureUrl,
    data: {
      selectedLanguages: unique(selections.languages),
      inventory: inventoryFromState(state),
      staminaDamage: Math.max(0, finite(state['staminaDamage'])),
      staminaTemp: Math.max(0, finite(state['staminaTemp'])),
      recoveriesUsed: Math.max(0, finite(state['recoveriesUsed'])),
      victories: Math.max(0, finite(state['victories'])),
      xp: Math.max(0, finite(state['xp'])),
      surges: Math.max(0, finite(state['surges'])),
      heroTokens: Math.max(0, finite(state['heroTokens'])),
      renown: Math.max(0, finite(state['renown'])),
      wealth: Math.max(0, finite(state['wealth'])),
      projectPoints: Math.max(0, finite(state['projectPoints'])),
      forgeSteel: { format: 'forge-steel.ds-hero' },
    },
    warnings,
  };
}
