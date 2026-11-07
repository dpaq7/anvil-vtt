import { GameData, HeroLogic } from '@anvil/data';
import type { Characteristics, HeroClass } from '@anvil/data';
import type { ForgeSteelHeroFile } from '@anvil/types';

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

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function resolveNamed<T extends { id: string; name: string }>(source: JsonRecord | null, choices: T[]): T | null {
  const id = text(source?.['id']);
  const name = text(source?.['name']);
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
  return values.filter((value, index) => value && values.indexOf(value) === index);
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
      forgeSteelItem: item,
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
  const kit = selections.kitNames
    .map((name) => GameData.getKitByName(name))
    .find((choice) => !!choice) ?? null;

  const idNames = new Map<string, string>();
  walk(hero, (item) => { const id = text(item['id']); const name = text(item['name']); if (id && name) idNames.set(id, name); });
  const sourceAbilities = [
    ...selections.directAbilities.map((ability) => ({ id: text(ability['id']), name: text(ability['name']) })),
    ...selections.abilityIds.map((id) => ({ id, name: idNames.get(id) ?? null })),
  ];
  const anvilAbilities = GameData.getAllAbilities();
  const abilities = unique(sourceAbilities.flatMap((source) => {
    const match = anvilAbilities.find((ability) => ability.metadata.item_id === source.id)
      ?? anvilAbilities.find((ability) => source.name && normalized(ability.name) === normalized(source.name));
    return match?.metadata.item_id ?? source.id ?? [];
  }));
  const state = record(hero.state) ?? {};
  const culture = record(hero.culture);
  const picture = text(hero.picture);
  const warnings: string[] = [];
  if (hero.ancestry && !ancestry) warnings.push(`Unknown ancestry: ${text(record(hero.ancestry)?.['name']) ?? 'unnamed'}`);
  if (hero.career && !career) warnings.push(`Unknown career: ${text(record(hero.career)?.['name']) ?? 'unnamed'}`);
  if (hero.class && !heroClass) warnings.push(`Unknown class: ${text(classSource?.['name']) ?? 'unnamed'}`);
  if (selections.kitNames.length && !kit) warnings.push(`Unknown kit: ${selections.kitNames[0]}`);

  return {
    name: hero.name.trim().slice(0, 160),
    ancestry: ancestry?.id ?? text(record(hero.ancestry)?.['id']),
    culture: JSON.stringify(culture ? { preset: text(culture['id']), forgeSteel: culture } : null),
    career: career?.id ?? text(record(hero.career)?.['id']),
    heroClass,
    subclass: text(selectedSubclass?.['name']) ?? text(selectedSubclass?.['id']),
    level,
    characteristics,
    kit: kit?.id ?? null,
    skills: unique(selections.skills),
    abilities,
    pictureUrl: picture?.startsWith('https://') ? picture : null,
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
      forgeSteel: { format: 'forge-steel.ds-hero', hero },
    },
    warnings,
  };
}
