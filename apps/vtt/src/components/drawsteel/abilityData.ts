export interface DrawSteelPowerRoll {
  roll?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
}

export interface DrawSteelEffectBlock {
  name?: string;
  text: string;
}

export interface DrawSteelAbilityView {
  id?: string;
  name: string;
  abilityType?: string;
  cost?: string;
  flavor?: string;
  keywords?: string[];
  usage?: string;
  distance?: string;
  target?: string;
  trigger?: string;
  powerRolls?: DrawSteelPowerRoll[];
  effects?: DrawSteelEffectBlock[];
}

interface EffectLike {
  [key: string]: unknown;
  name?: string;
  roll?: string;
  tier1?: string;
  tier2?: string;
  tier3?: string;
  effect?: string;
  damage?: string;
}

interface AbilityLikeInput {
  id?: string;
  name?: string;
  ability_type?: string;
  abilityType?: string;
  cost?: string;
  essenceCost?: number;
  flavor?: string;
  flavorText?: string;
  keywords?: string[];
  usage?: string;
  actionType?: string;
  distance?: string;
  target?: string;
  trigger?: string;
  effects?: unknown[];
  powerRoll?: {
    characteristic?: string;
    tier1?: string;
    tier2?: string;
    tier3?: string;
  };
  effect?: string;
  damage?: string;
  tier1Effect?: string;
  tier2Effect?: string;
  tier3Effect?: string;
  metadata?: Record<string, unknown>;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function compact(parts: Array<string | number | undefined | null>, separator = ' '): string {
  return parts
    .filter((part) => part !== undefined && part !== null && String(part).trim())
    .map(String)
    .join(separator);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function normalizePowerRollLabel(characteristic?: string): string {
  if (!characteristic?.trim()) return 'Power Roll';
  return `Power Roll + ${titleCase(characteristic)}`;
}

function hasPowerRoll(powerRoll: DrawSteelPowerRoll): boolean {
  return Boolean(powerRoll.roll || powerRoll.tier1 || powerRoll.tier2 || powerRoll.tier3);
}

export function drawSteelAbilityFromLike(input: AbilityLikeInput, fallbackName = 'Ability'): DrawSteelAbilityView {
  const effects = (input.effects ?? []).filter(isRecord) as EffectLike[];
  const metadataAbilityType = stringValue(input.metadata?.['ability_type']);
  const effectPowerRolls = effects
    .filter((effect) => effect.tier1 || effect.tier2 || effect.tier3)
    .map((effect) => ({
      roll: effect.roll || 'Power Roll',
      tier1: effect.tier1,
      tier2: effect.tier2,
      tier3: effect.tier3,
    }));

  const directPowerRoll = input.powerRoll
    ? [{
        roll: normalizePowerRollLabel(input.powerRoll.characteristic),
        tier1: input.powerRoll.tier1,
        tier2: input.powerRoll.tier2,
        tier3: input.powerRoll.tier3,
      }]
    : [];

  const panelPowerRoll = input.tier1Effect || input.tier2Effect || input.tier3Effect
    ? [{
        roll: 'Power Roll',
        tier1: input.tier1Effect,
        tier2: input.tier2Effect,
        tier3: input.tier3Effect,
      }]
    : [];

  const effectBlocks = [
    ...effects
      .filter((effect) => !effect.tier1 && !effect.tier2 && !effect.tier3)
      .map((effect) => ({
        name: effect.name,
        text: compact([effect.effect, effect.damage], ' '),
      })),
    ...(input.effect ? [{ text: input.effect }] : []),
    ...(input.damage ? [{ name: 'Damage', text: input.damage }] : []),
  ].filter((effect) => effect.text.trim());

  return {
    id: input.id,
    name: input.name ?? fallbackName,
    abilityType: input.ability_type ?? input.abilityType ?? metadataAbilityType,
    cost: input.cost ?? (typeof input.essenceCost === 'number' ? String(input.essenceCost) : undefined),
    flavor: input.flavor ?? input.flavorText,
    keywords: input.keywords,
    usage: input.usage ?? input.actionType,
    distance: input.distance,
    target: input.target,
    trigger: input.trigger,
    powerRolls: [...effectPowerRolls, ...directPowerRoll, ...panelPowerRoll].filter(hasPowerRoll),
    effects: effectBlocks,
  };
}
