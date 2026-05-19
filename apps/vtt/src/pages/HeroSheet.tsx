import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  CircleGauge,
  Dumbbell,
  Feather,
  Footprints,
  Gem,
  Hammer,
  HeartPulse,
  Languages,
  Medal,
  Package,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  UserRound,
  Zap,
} from "lucide-react";
import {
  COMPLICATIONS,
  GameData,
  HeroLogic,
  PERKS,
  PERK_CATEGORY_INFO,
  TITLES,
  WizardLogic,
  classPerkAtLevel,
  getAvailablePerkCategories,
} from "@anvil/data";
import type {
  CharacteristicName,
  Characteristics,
  HeroLogic as HeroLogicTypes,
  LevelUpChoice,
} from "@anvil/data";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from "@anvil/ui";
import { CharacterInventoryPanel } from "../components/CharacterInventoryPanel.js";
import { AbilityBlock } from "../components/drawsteel/AbilityBlock.js";
import { drawSteelAbilityFromLike } from "../components/drawsteel/abilityData.js";
import { api } from "../lib/api.js";
import { normalizeInventory } from "../lib/inventory.js";
import type { CharacterInventoryItem } from "../lib/inventory.js";

interface HeroRow {
  id: string;
  name: string;
  ancestry: string | null;
  culture: string | null;
  career: string | null;
  hero_class: string | null;
  subclass: string | null;
  level: number;
  characteristics: string;
  kit: string | null;
  skills: string;
  abilities: string;
  portrait_url: string | null;
  data: string;
}

interface HeroAdvanceResponse {
  ok: boolean;
  level: number;
  abilities: string[];
  skills: string[];
  data: Record<string, unknown>;
}

interface AbilityDisplay {
  id: string;
  name: string;
  ability_type?: string;
  usage?: string;
  cost?: string;
  flavor?: string;
  distance?: string;
  target?: string;
  trigger?: string;
  keywords?: string[];
  effects?: Array<{
    name?: string;
    roll?: string;
    tier1?: string;
    tier2?: string;
    tier3?: string;
    effect?: string;
  }>;
  metadata?: {
    ability_type?: string;
  };
}

interface AbilityLike {
  id?: string;
  name?: string;
  ability_type?: string;
  usage?: string;
  cost?: string;
  flavor?: string;
  distance?: string;
  target?: string;
  trigger?: string;
  keywords?: string[];
  effects?: AbilityDisplay["effects"];
  metadata?: {
    ability_type?: string;
    item_id?: string;
    level?: number;
    scc?: string[];
  };
}

interface CultureSelection {
  environment: string | null;
  organization: string | null;
  upbringing: string | null;
  preset?: string | null;
  language?: string | null;
}

interface ResolvedSkill {
  id: string;
  name: string;
  group: SkillGroupKey;
  description: string | null;
}

interface ResolvedFeature {
  id: string;
  name: string;
  level: number | null;
  description: string | null;
}

interface ResolvedTitle {
  id: string;
  name: string;
  echelon?: string;
  description?: string;
  effect?: string;
}

interface ResolvedAbility {
  id: string;
  ability: AbilityDisplay;
  level: number | null;
  selected: boolean;
}

interface ResolvedProgression {
  level: number;
  features: string[];
  abilities: string;
  aspectAbilities?: string;
}

type SkillGroupKey =
  | "crafting"
  | "exploration"
  | "interpersonal"
  | "intrigue"
  | "lore"
  | "other";

const CHARACTERISTIC_ORDER: Array<{
  key: CharacteristicName;
  short: string;
  label: string;
  icon: LucideIcon;
}> = [
  { key: "might", short: "MIG", label: "Might", icon: Dumbbell },
  { key: "agility", short: "AGI", label: "Agility", icon: Feather },
  { key: "reason", short: "REA", label: "Reason", icon: Brain },
  { key: "intuition", short: "INT", label: "Intuition", icon: Sparkles },
  { key: "presence", short: "PRE", label: "Presence", icon: Star },
];

const CULTURE_FIELDS: Array<{
  key: keyof CultureSelection;
  label: string;
  type: "environment" | "organization" | "upbringing";
}> = [
  { key: "environment", label: "Environment", type: "environment" },
  { key: "organization", label: "Organization", type: "organization" },
  { key: "upbringing", label: "Upbringing", type: "upbringing" },
];

const SKILL_GROUP_ORDER: SkillGroupKey[] = [
  "crafting",
  "exploration",
  "interpersonal",
  "intrigue",
  "lore",
  "other",
];

const SKILL_GROUP_LABELS: Record<SkillGroupKey, string> = {
  crafting: "Crafting",
  exploration: "Exploration",
  interpersonal: "Interpersonal",
  intrigue: "Intrigue",
  lore: "Lore",
  other: "Other",
};

const SHEET_TAB_TRIGGER_CLASS =
  "h-10 gap-2 rounded px-2 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-cyan-100";

const SHEET_TAB_CONTENT_CLASS =
  "mt-0 max-h-[calc(100vh-17rem)] min-h-[520px] overflow-y-auto pr-1 focus-visible:ring-cyan-300";

const DEFAULT_CHARACTERISTICS: Characteristics = {
  might: 0,
  agility: 0,
  reason: 0,
  intuition: 0,
  presence: 0,
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function unique(values: string[]): string[] {
  return values.filter(
    (value, index, self) => value && self.indexOf(value) === index,
  );
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeLevelUpChoices(
  value: unknown,
): HeroLogicTypes.LevelAdvancementChoices {
  if (!isRecord(value)) return {};

  const choices: HeroLogicTypes.LevelAdvancementChoices = {};
  for (const [key, rawChoices] of Object.entries(value)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 2 || level > 10) continue;
    if (!Array.isArray(rawChoices)) continue;

    choices[level] = rawChoices.filter((choice): choice is LevelUpChoice => {
      return (
        isRecord(choice) &&
        typeof choice["featureId"] === "string" &&
        typeof choice["choiceId"] === "string" &&
        (choice["category"] === undefined || typeof choice["category"] === "string")
      );
    });
  }

  return choices;
}

function titleCaseId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function formatCharacteristicName(value: string): string {
  return (
    CHARACTERISTIC_ORDER.find((item) => item.key === value)?.label ??
    titleCaseId(value)
  );
}

function normalizeCharacteristics(
  value: Partial<Characteristics>,
): Characteristics {
  return {
    might:
      typeof value.might === "number"
        ? value.might
        : DEFAULT_CHARACTERISTICS.might,
    agility:
      typeof value.agility === "number"
        ? value.agility
        : DEFAULT_CHARACTERISTICS.agility,
    reason:
      typeof value.reason === "number"
        ? value.reason
        : DEFAULT_CHARACTERISTICS.reason,
    intuition:
      typeof value.intuition === "number"
        ? value.intuition
        : DEFAULT_CHARACTERISTICS.intuition,
    presence:
      typeof value.presence === "number"
        ? value.presence
        : DEFAULT_CHARACTERISTICS.presence,
  };
}

function stringFromData(
  data: Record<string, unknown>,
  key: string,
): string | null {
  return stringValue(data[key]);
}

function numberFromData(
  data: Record<string, unknown>,
  key: string,
): number | null {
  return numberValue(data[key]);
}

function normalizeSubclassValue(
  value: string | string[] | null | undefined,
): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function inferHeroClassFromSubclass(
  subclassIds: string[],
): HeroLogicTypes.HeroClass | null {
  const classIds: HeroLogicTypes.HeroClass[] = [
    "beastheart",
    "censor",
    "conduit",
    "elementalist",
    "fury",
    "null",
    "shadow",
    "summoner",
    "tactician",
    "talent",
    "troubadour",
  ];

  for (const classId of classIds) {
    for (const subclassId of subclassIds) {
      if (GameData.getSubclass(classId, subclassId)) {
        return classId;
      }
    }
  }

  return null;
}

function resolveHeroClass(
  hero: HeroRow,
  data: Record<string, unknown>,
): HeroLogicTypes.HeroClass | null {
  const raw = hero.hero_class ?? stringFromData(data, "heroClass");
  if (raw && HeroLogic.isValidHeroClass(raw)) {
    return raw;
  }

  const subclassIds = normalizeSubclassValue(
    hero.subclass ?? (data["subclass"] as string | string[] | null),
  );
  return inferHeroClassFromSubclass(subclassIds);
}

function resolveSubclassNames(
  heroClass: HeroLogicTypes.HeroClass | null,
  subclassIds: string[],
): string[] {
  return subclassIds.map((subclassId) => {
    if (!heroClass) return titleCaseId(subclassId);
    return (
      GameData.getSubclass(heroClass, subclassId)?.name ??
      titleCaseId(subclassId)
    );
  });
}

function resolveAbility(id: string): AbilityDisplay {
  const slug = id.includes(":") ? (id.split(":").pop() ?? id) : id;
  const ability =
    (GameData.getByScc(id) as AbilityLike | undefined) ??
    (GameData.getAbility(id) as AbilityLike | undefined) ??
    (GameData.getAbility(slug) as AbilityLike | undefined) ??
    (GameData.getFeature(id) as AbilityLike | undefined) ??
    (GameData.getFeature(slug) as AbilityLike | undefined) ??
    (GameData.getAllAbilities() as AbilityLike[]).find(
      (candidate) =>
        candidate.metadata?.item_id === id ||
        candidate.metadata?.item_id === slug ||
        candidate.metadata?.scc?.includes(id),
    );

  return {
    id,
    name: ability?.name ?? titleCaseId(slug),
    ability_type: ability?.ability_type,
    usage: ability?.usage,
    cost: ability?.cost,
    flavor: ability?.flavor,
    distance: ability?.distance,
    target: ability?.target,
    trigger: ability?.trigger,
    keywords: ability?.keywords,
    effects: ability?.effects,
    metadata: ability?.metadata,
  };
}

function abilityIdentity(ability: AbilityLike, fallbackId: string): string {
  return (
    ability.metadata?.item_id ??
    ability.id ??
    slugify(ability.name ?? fallbackId)
  );
}

function resolveAbilityLike(
  ability: AbilityLike,
  fallbackId: string,
): AbilityDisplay {
  const id = abilityIdentity(ability, fallbackId);
  return {
    id,
    name: ability.name ?? titleCaseId(id),
    ability_type: ability.ability_type,
    usage: ability.usage,
    cost: ability.cost,
    flavor: ability.flavor,
    distance: ability.distance,
    target: ability.target,
    trigger: ability.trigger,
    keywords: ability.keywords,
    effects: ability.effects,
    metadata: ability.metadata,
  };
}

function selectedAbilityKeys(abilityIds: string[]): Set<string> {
  const keys = new Set<string>();
  for (const id of abilityIds) {
    keys.add(id);
    keys.add(slugify(id.includes(":") ? (id.split(":").pop() ?? id) : id));
  }
  return keys;
}

function resolveClassAbilities(
  heroClass: HeroLogicTypes.HeroClass | null,
  level: number,
  abilityIds: string[],
): ResolvedAbility[] {
  if (!heroClass) return [];

  const selectedKeys = selectedAbilityKeys(abilityIds);
  const abilities: ResolvedAbility[] = [];
  const seen = new Set<string>();

  for (let abilityLevel = 1; abilityLevel <= level; abilityLevel += 1) {
    for (const ability of GameData.getAbilitiesByClassAndLevel(
      heroClass,
      abilityLevel,
    ) as AbilityLike[]) {
      const id = abilityIdentity(ability, `${heroClass}-${abilityLevel}`);
      const slug = slugify(id);
      if (seen.has(slug)) continue;
      seen.add(slug);
      abilities.push({
        id,
        ability: resolveAbilityLike(ability, id),
        level: ability.metadata?.level ?? abilityLevel,
        selected: selectedKeys.has(id) || selectedKeys.has(slug),
      });
    }
  }

  return abilities;
}

function resolveClassProgression(
  classDef: ReturnType<typeof GameData.getClass> | null,
  level: number,
  classFeatures: ResolvedFeature[],
  classAbilities: ResolvedAbility[],
): ResolvedProgression[] {
  const definedProgression =
    classDef?.levelProgression?.filter((entry) => entry.level <= level) ?? [];
  if (definedProgression.length > 0) {
    return definedProgression.map((entry) => ({
      level: entry.level,
      features: entry.features,
      abilities: entry.abilities,
      aspectAbilities: entry.aspectAbilities,
    }));
  }

  const rows: ResolvedProgression[] = [];
  for (let currentLevel = 1; currentLevel <= level; currentLevel += 1) {
    const featureNames = unique(
      classFeatures
        .filter((feature) => feature.level === currentLevel)
        .map((feature) => feature.name),
    );
    const abilityNames = unique(
      classAbilities
        .filter((entry) => entry.level === currentLevel)
        .map((entry) => entry.ability.name),
    );

    if (featureNames.length === 0 && abilityNames.length === 0) continue;

    rows.push({
      level: currentLevel,
      features: featureNames,
      abilities:
        abilityNames.length > 0
          ? `${abilityNames.length} class abilities`
          : "Class features",
      aspectAbilities:
        abilityNames.length > 0
          ? abilityNames.slice(0, 8).join(", ")
          : undefined,
    });
  }

  return rows;
}

function resolveCultureSelection(
  hero: HeroRow,
  data: Record<string, unknown>,
): CultureSelection | null {
  const fromData = data["culture"];
  if (isRecord(fromData)) {
    return {
      environment: stringValue(fromData["environment"]),
      organization: stringValue(fromData["organization"]),
      upbringing: stringValue(fromData["upbringing"]),
      preset: stringValue(fromData["preset"]),
      language: stringValue(fromData["language"]),
    };
  }

  const parsed = parseJson<Partial<CultureSelection> | null>(
    hero.culture,
    null,
  );
  if (parsed && isRecord(parsed)) {
    return {
      environment: stringValue(parsed["environment"]),
      organization: stringValue(parsed["organization"]),
      upbringing: stringValue(parsed["upbringing"]),
      preset: stringValue(parsed["preset"]),
      language: stringValue(parsed["language"]),
    };
  }

  return null;
}

function resolveSkill(skillName: string): ResolvedSkill {
  const skill =
    GameData.getSkill(skillName) ??
    GameData.getAllSkills().find(
      (candidate) => slugify(candidate.name) === slugify(skillName),
    );
  const group =
    skill?.group && SKILL_GROUP_ORDER.includes(skill.group as SkillGroupKey)
      ? (skill.group as SkillGroupKey)
      : "other";

  return {
    id: slugify(skill?.name ?? skillName),
    name: skill?.name ?? titleCaseId(skillName),
    group,
    description: skill?.description ?? null,
  };
}

function groupSkills(
  skills: ResolvedSkill[],
): Record<SkillGroupKey, ResolvedSkill[]> {
  return skills.reduce<Record<SkillGroupKey, ResolvedSkill[]>>(
    (groups, skill) => {
      groups[skill.group].push(skill);
      return groups;
    },
    {
      crafting: [],
      exploration: [],
      interpersonal: [],
      intrigue: [],
      lore: [],
      other: [],
    },
  );
}

function effectToText(effect: unknown): string | null {
  if (typeof effect === "string") return effect;
  if (!isRecord(effect)) return null;

  const text =
    stringValue(effect["effect"]) ??
    stringValue(effect["description"]) ??
    stringValue(effect["text"]);
  const name = stringValue(effect["name"]);
  const tierTexts = [
    stringValue(effect["tier1"]) ? `<=11: ${String(effect["tier1"])}` : null,
    stringValue(effect["tier2"]) ? `12-16: ${String(effect["tier2"])}` : null,
    stringValue(effect["tier3"]) ? `17+: ${String(effect["tier3"])}` : null,
  ].filter(Boolean);

  const parts = [
    text ? (name ? `${name}: ${text}` : text) : name,
    ...tierTexts,
  ].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );

  return parts.length > 0 ? parts.join(" ") : null;
}

function resolveFeature(
  feature: unknown,
  fallbackLevel: number,
): ResolvedFeature | null {
  if (!isRecord(feature)) return null;

  const metadata = isRecord(feature["metadata"]) ? feature["metadata"] : {};
  const id =
    stringValue(metadata["item_id"]) ??
    stringValue(feature["id"]) ??
    stringValue(feature["name"]);
  const name = stringValue(feature["name"]);
  if (!id || !name) return null;

  const effects = Array.isArray(feature["effects"])
    ? feature["effects"]
        .map(effectToText)
        .filter((part): part is string => Boolean(part))
    : [];

  return {
    id,
    name,
    level: numberValue(metadata["level"]) ?? fallbackLevel,
    description: effects.join("\n") || stringValue(feature["description"]),
  };
}

function resolveClassFeatures(
  heroClass: HeroLogicTypes.HeroClass | null,
  level: number,
  subclass: string | string[] | null = null,
): ResolvedFeature[] {
  if (!heroClass) return [];

  const features: ResolvedFeature[] = [];
  const seen = new Set<string>();

  for (let featureLevel = 1; featureLevel <= level; featureLevel += 1) {
    for (const feature of GameData.getFeaturesByClassAndLevel(
      heroClass,
      featureLevel,
    )) {
      if (feature.feature_type === "ability") continue;
      const resolved = resolveFeature(feature, featureLevel);
      if (!resolved || seen.has(resolved.id)) continue;
      seen.add(resolved.id);
      features.push(resolved);
    }

    const hasGeneratedLevelFeatures = features.some(
      (feature) => feature.level === featureLevel,
    );
    if (!hasGeneratedLevelFeatures && featureLevel >= 2) {
      const character = WizardLogic.createEmptyCharacter();
      character.heroClass = heroClass;
      character.level = level;
      character.subclass = subclass;
      for (const feature of WizardLogic.getLevelUpFeatures(character, featureLevel)) {
        if (seen.has(feature.id)) continue;
        seen.add(feature.id);
        features.push({
          id: feature.id,
          name: feature.name,
          level: featureLevel,
          description: feature.description,
        });
      }
    }
  }

  return features;
}

function resolveLanguages(
  data: Record<string, unknown>,
  careerId: string | null,
): string[] {
  const languages: string[] = [];
  const defaultLanguage = GameData.getDefaultLanguage();
  if (defaultLanguage) languages.push(defaultLanguage.name);

  const culture = isRecord(data["culture"]) ? data["culture"] : null;
  const cultureLanguageId = culture ? stringValue(culture["language"]) : null;
  if (cultureLanguageId) {
    const cultureLanguage =
      GameData.getLanguage(cultureLanguageId) ??
      GameData.getLanguageByName(cultureLanguageId);
    languages.push(cultureLanguage?.name ?? titleCaseId(cultureLanguageId));
  }

  const career = careerId ? GameData.getCareer(careerId) : null;
  for (const language of career?.languages ?? []) {
    if (!/^\d+\s+Languages?$/i.test(language)) {
      languages.push(language);
    }
  }

  for (const languageId of stringArray(data["selectedLanguages"])) {
    const language =
      GameData.getLanguage(languageId) ??
      GameData.getLanguageByName(languageId);
    languages.push(language?.name ?? titleCaseId(languageId));
  }

  return unique(languages);
}

function resolvePerks(data: Record<string, unknown>) {
  return stringArray(data["selectedPerks"])
    .filter(Boolean)
    .map((perkId) => {
      const perk = PERKS.find((candidate) => candidate.id === perkId);
      return perk
        ? {
            id: perk.id,
            name: perk.name,
            category: PERK_CATEGORY_INFO[perk.category].name,
            description: perk.description,
          }
        : {
            id: perkId,
            name: titleCaseId(perkId),
            category: "Perk",
            description: null,
          };
    });
}

function resolveTitles(data: Record<string, unknown>): ResolvedTitle[] {
  const value = data["selectedTitles"];
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((title, index) => {
    const id = stringValue(title["id"]) ?? `title-${index}`;
    const catalogTitle = TITLES.find((candidate) => candidate.id === id);
    const selectedFeatureId = stringValue(title["selectedFeatureId"]);
    const selectedChoice = catalogTitle?.choices?.find(
      (choice) => slugify(choice.name) === selectedFeatureId,
    );

    return {
      id,
      name: stringValue(title["name"]) ?? catalogTitle?.name ?? titleCaseId(id),
      echelon: catalogTitle?.echelon,
      description:
        stringValue(title["description"]) ?? catalogTitle?.flavorText,
      effect:
        stringValue(title["effect"]) ??
        selectedChoice?.description ??
        catalogTitle?.effects?.[0]?.description,
    };
  });
}

function resolveComplication(data: Record<string, unknown>) {
  const value = data["complication"];
  if (!isRecord(value)) return null;

  const id = stringValue(value["id"]);
  const catalog = id ? COMPLICATIONS.find((item) => item.id === id) : null;
  const catalogRecord = catalog as Record<string, unknown> | null;

  return {
    name:
      stringValue(value["name"]) ??
      stringValue(catalogRecord?.["name"]) ??
      (id ? titleCaseId(id) : "Complication"),
    description:
      stringValue(value["description"]) ??
      stringValue(catalogRecord?.["description"]),
    benefit: stringValue(catalogRecord?.["benefit"]),
    drawback: stringValue(catalogRecord?.["drawback"]),
  };
}

function resolveAncestryTraits(
  ancestryId: string | null,
  data: Record<string, unknown>,
) {
  const ancestry = ancestryId ? GameData.getAncestry(ancestryId) : null;
  if (!ancestry) return [];

  const selectedIds = new Set(stringArray(data["ancestryTraits"]));
  const traits: Array<{
    id: string;
    name: string;
    source: string;
    cost: number | null;
    effect: string;
  }> = [];

  if (ancestry.signatureTrait) {
    traits.push({
      id:
        ancestry.signatureTrait.id ??
        `signature-${slugify(ancestry.signatureTrait.name)}`,
      name: ancestry.signatureTrait.name,
      source: "Signature",
      cost: null,
      effect: ancestry.signatureTrait.effect,
    });
  }

  for (const trait of ancestry.purchasedTraits ?? []) {
    if (!selectedIds.has(trait.id)) continue;
    traits.push({
      id: trait.id,
      name: trait.name,
      source: "Purchased",
      cost: trait.pointCost ?? null,
      effect: trait.effect,
    });
  }

  return traits;
}

function resolveAvailableAncestryTraits(ancestryId: string | null) {
  const ancestry = ancestryId ? GameData.getAncestry(ancestryId) : null;
  return ancestry?.purchasedTraits ?? [];
}

function resolveResourceValue(
  data: Record<string, unknown>,
  resourceName: string | null,
): number | string {
  if (!resourceName) return "-";
  const slug = slugify(resourceName);
  const candidates = [
    "heroicResourceCurrent",
    "resourceCurrent",
    `${slug}Current`,
    slug,
  ];

  for (const key of candidates) {
    const value = numberFromData(data, key);
    if (value !== null) return value;
  }

  return "-";
}

function clampCurrentValue(
  value: number | null,
  max: number | null,
): number | null {
  if (value === null) return max;
  if (max === null) return value;
  return Math.min(value, max);
}

function kitSignatureAsAbility(
  kit: NonNullable<ReturnType<typeof GameData.getKit>>,
): AbilityLike {
  const signature = kit.signatureAbility;
  const effects: NonNullable<AbilityLike["effects"]> = [
    {
      roll: signature.powerRoll
        ? `Power Roll + ${signature.powerRoll}`
        : "Power Roll",
      tier1: signature.tier1,
      tier2: signature.tier2,
      tier3: signature.tier3,
    },
  ];

  if (signature.effect) {
    effects.push({ name: "Effect", effect: signature.effect });
  }

  return {
    id: `kit:${kit.id}`,
    name: signature.name,
    ability_type: "Signature Ability",
    usage: signature.type,
    flavor: signature.description,
    distance: signature.distance,
    target: signature.target,
    keywords: signature.keywords,
    effects,
  };
}

export function HeroSheet() {
  const { id } = useParams<{ id: string }>();
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingInventory, setSavingInventory] = useState(false);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelUpChoices, setLevelUpChoices] = useState<LevelUpChoice[]>([]);
  const [levelUpPerkId, setLevelUpPerkId] = useState("");
  const [savingLevelUp, setSavingLevelUp] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<HeroRow>(`/api/heroes/${id}`)
      .then(setHero)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const sheet = useMemo(() => {
    if (!hero) return null;

    const data: Record<string, unknown> = parseJson(hero.data, {});
    const heroClass = resolveHeroClass(hero, data);
    const baseChars = normalizeCharacteristics(
      parseJson<Partial<Characteristics>>(hero.characteristics, {}),
    );
    const levelUpChoices = normalizeLevelUpChoices(data["levelUpChoices"]);
    const chars = heroClass
      ? HeroLogic.applyLevelAdvancementCharacteristics(
          heroClass,
          hero.level,
          baseChars,
          levelUpChoices,
        )
      : baseChars;
    const skills = unique(
      parseJson<string[]>(hero.skills, [])
        .map((skill) => skill.trim())
        .filter(Boolean),
    );
    const abilityChoiceIds = isRecord(data["abilityChoices"])
      ? Object.values(data["abilityChoices"]).filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    const abilities = unique(
      [
        ...parseJson<string[]>(hero.abilities, []),
        ...stringArray(data["selectedAbilities"]),
        ...abilityChoiceIds,
      ]
        .map((ability) => ability.trim())
        .filter(Boolean),
    );
    const subclassIds = normalizeSubclassValue(
      hero.subclass ?? (data["subclass"] as string | string[] | null),
    );
    const subclassNames = resolveSubclassNames(heroClass, subclassIds);
    const ancestry = hero.ancestry ? GameData.getAncestry(hero.ancestry) : null;
    const career = hero.career ? GameData.getCareer(hero.career) : null;
    const kit = hero.kit ? GameData.getKit(hero.kit) : null;
    const secondaryKitId =
      heroClass === "tactician" ? stringFromData(data, "secondaryKit") : null;
    const secondaryKit = secondaryKitId ? GameData.getKit(secondaryKitId) : null;
    const kits = [kit, secondaryKit].filter(
      (entry): entry is NonNullable<ReturnType<typeof GameData.getKit>> =>
        Boolean(entry),
    );
    const classDef = heroClass ? GameData.getClass(heroClass) : null;
    const cultureSelection = resolveCultureSelection(hero, data);
    const cultureEntries = cultureSelection
      ? CULTURE_FIELDS.map((field) => {
          const cultureId = cultureSelection[field.key];
          const culture = cultureId ? GameData.getCulture(cultureId) : null;
          return cultureId
            ? {
                label: field.label,
                name: culture?.name ?? titleCaseId(cultureId),
                effect: culture?.effect ?? null,
                skills: culture?.skills ?? [],
              }
            : null;
        }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      : [];
    const cultureFallback =
      cultureEntries.length === 0 &&
      hero.culture &&
      !hero.culture.trim().startsWith("{")
        ? titleCaseId(hero.culture)
        : null;
    const culturePreset = cultureSelection?.preset
      ? GameData.getPrebuiltCulture(cultureSelection.preset)
      : null;
    const cultureComponentDisplay =
      cultureEntries.length > 0
        ? cultureEntries.map((entry) => entry.name).join(" / ")
        : null;
    let cultureDisplay = cultureComponentDisplay ?? cultureFallback;
    if (culturePreset?.type === "professional") {
      cultureDisplay = culturePreset.name;
    } else if (culturePreset?.type === "bespoke") {
      cultureDisplay = cultureComponentDisplay
        ? `${culturePreset.name}: ${cultureComponentDisplay}`
        : cultureComponentDisplay;
    }
    const className =
      classDef?.name ?? (heroClass ? titleCaseId(heroClass) : null);
    const ancestryName =
      ancestry?.name ?? (hero.ancestry ? titleCaseId(hero.ancestry) : null);
    const careerName =
      career?.name ?? (hero.career ? titleCaseId(hero.career) : null);
    const kitName =
      kits.length > 0
        ? kits.map((entry) => entry.name).join(", ")
        : hero.kit
          ? titleCaseId(hero.kit)
          : null;
    const resolvedSkills = skills.map(resolveSkill);
    const groupedSkills = groupSkills(resolvedSkills);
    const classFeatures = resolveClassFeatures(
      heroClass,
      hero.level,
      subclassIds.length > 1 ? subclassIds : subclassIds[0] ?? null,
    );
    const languages = resolveLanguages(data, hero.career);
    const perks = resolvePerks(data);
    const titles = resolveTitles(data);
    const inventory = normalizeInventory(data["inventory"]);
    const complication = resolveComplication(data);
    const ancestryTraits = resolveAncestryTraits(hero.ancestry, data);
    const availableAncestryTraits = resolveAvailableAncestryTraits(
      hero.ancestry,
    );
    const abilityDisplays = abilities.map(resolveAbility);
    const classAbilities = resolveClassAbilities(
      heroClass,
      hero.level,
      abilities,
    );
    const classProgression = resolveClassProgression(
      classDef,
      hero.level,
      classFeatures,
      classAbilities,
    );
    const selectedClassAbilities = classAbilities.filter(
      (ability) => ability.selected,
    );
    const shownAbilities =
      abilityDisplays.length > 0
        ? abilityDisplays
        : classAbilities.map((ability) => ability.ability);

    let maxStamina: number | null = null;
    let recoveryValue: number | null = null;
    let maxRecoveries: number | null = null;
    let heroicResource: string | null = null;
    let echelon: number | null = null;

    if (heroClass && HeroLogic.isValidHeroClass(heroClass)) {
      maxStamina = HeroLogic.getMaxStaminaWithAdvancements(
        heroClass,
        hero.level,
        kits.reduce((total, entry) => total + entry.staminaPerEchelon, 0),
        levelUpChoices,
      );
      recoveryValue = HeroLogic.getRecoveryValue(maxStamina);
      maxRecoveries = HeroLogic.getMaxRecoveries(heroClass);
      heroicResource = HeroLogic.getHeroicResourceName(
        HeroLogic.getHeroicResourceType(heroClass),
      );
      echelon = HeroLogic.getEchelon(hero.level);
    }

    const staminaCurrent = clampCurrentValue(
      numberFromData(data, "staminaCurrent"),
      maxStamina,
    );
    const recoveriesCurrent = clampCurrentValue(
      numberFromData(data, "recoveriesCurrent"),
      maxRecoveries,
    );
    const victories = numberFromData(data, "victories") ?? 0;
    const xp = numberFromData(data, "xp") ?? 0;
    const speed = ancestry
      ? ancestry.speed + kits.reduce((total, entry) => total + entry.speedBonus, 0)
      : null;
    const size = ancestry?.size ?? null;
    const stability = kits.reduce((total, entry) => total + entry.stabilityBonus, 0);
    const incitingIncident = stringFromData(data, "incitingIncident");

    return {
      abilities: abilityDisplays,
      abilityIds: abilities,
      ancestry,
      ancestryName,
      ancestryTraits,
      availableAncestryTraits,
      career,
      careerName,
      chars,
      classAbilities,
      classDef,
      classFeatures,
      classProgression,
      className,
      complication,
      cultureDisplay,
      cultureEntries,
      cultureFallback,
      data,
      echelon,
      heroClass,
      heroicResource,
      inventory,
      kit,
      kits,
      kitName,
      languages,
      maxRecoveries,
      maxStamina,
      perks,
      recoveryValue,
      recoveriesCurrent,
      resolvedSkills,
      groupedSkills,
      selectedClassAbilities,
      selectedPerkIds: stringArray(data["selectedPerks"]),
      shownAbilities,
      size,
      skillNames: skills,
      speed,
      stability,
      staminaCurrent,
      subclassIds,
      subclassNames,
      titles,
      victories,
      xp,
      incitingIncident,
      levelUpChoices,
    };
  }, [hero]);

  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!hero || !sheet)
    return <div className="p-8 text-zinc-500">Loading...</div>;

  const summary = [
    sheet.className,
    sheet.subclassNames.length > 0 ? sheet.subclassNames.join(", ") : null,
    sheet.ancestryName,
  ]
    .filter(Boolean)
    .join(" / ");

  const nextLevel = hero.level < 10 ? hero.level + 1 : null;
  const nextLevelXP = nextLevel ? HeroLogic.getMinXPForLevel(nextLevel) : null;
  const xpNeeded =
    nextLevel !== null
      ? HeroLogic.getXPNeededForNextLevel(hero.level, sheet.xp)
      : null;
  const canAdvance =
    nextLevel !== null && HeroLogic.canAdvanceLevel(hero.level, sheet.xp);

  const buildLevelUpCharacter = (
    choices: LevelUpChoice[],
  ): ReturnType<typeof WizardLogic.createEmptyCharacter> => {
    const character = WizardLogic.createEmptyCharacter();
    character.level = nextLevel ?? hero.level;
    character.heroClass = sheet.heroClass;
    character.subclass =
      sheet.subclassIds.length > 1
        ? sheet.subclassIds
        : sheet.subclassIds[0] ?? null;
    character.levelUpChoices = {
      ...sheet.levelUpChoices,
      ...(nextLevel ? { [nextLevel]: choices } : {}),
    };
    return character;
  };

  const targetLevelFeatures =
    nextLevel !== null
      ? WizardLogic.getLevelUpFeatures(
          buildLevelUpCharacter(levelUpChoices),
          nextLevel,
        )
      : [];
  const levelUpValidationErrors =
    nextLevel !== null
      ? WizardLogic.getLevelUpValidationErrors(
          buildLevelUpCharacter(levelUpChoices),
          nextLevel,
        )
      : [];
  const gainsPerk =
    Boolean(sheet.heroClass && nextLevel && classPerkAtLevel(sheet.heroClass, nextLevel));
  const perkOptions =
    sheet.heroClass && nextLevel && gainsPerk
      ? PERKS.filter((perk) => {
          const categories = getAvailablePerkCategories(sheet.heroClass!, nextLevel);
          return (
            categories.includes(perk.category) &&
            (!sheet.selectedPerkIds.includes(perk.id) || perk.id === levelUpPerkId)
          );
        })
      : [];

  const openLevelUpDialog = () => {
    if (!nextLevel || !canAdvance) return;
    setLevelUpChoices(sheet.levelUpChoices[nextLevel] ?? []);
    setLevelUpPerkId("");
    setLevelUpOpen(true);
  };

  const setLevelUpChoice = (
    featureId: string,
    choiceId: string,
    category?: string,
  ) => {
    setLevelUpChoices((current) => [
      ...current.filter((choice) => choice.featureId !== featureId),
      { featureId, choiceId, category },
    ]);
  };

  const handleAdvanceLevel = async () => {
    if (!hero || !sheet || !nextLevel || !canAdvance || savingLevelUp) return;

    const validationCharacter = buildLevelUpCharacter(levelUpChoices);
    const errors = WizardLogic.getLevelUpValidationErrors(
      validationCharacter,
      nextLevel,
    );
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    if (gainsPerk && !levelUpPerkId) {
      toast.error("Select a perk for this level.");
      return;
    }

    setSavingLevelUp(true);
    try {
      const result = await api.post<HeroAdvanceResponse>(`/api/heroes/${hero.id}/advance`, {
        choices: levelUpChoices,
        perkId: levelUpPerkId || null,
      });
      setHero({
        ...hero,
        level: result.level,
        abilities: JSON.stringify(result.abilities),
        skills: JSON.stringify(result.skills),
        data: JSON.stringify(result.data),
      });
      setLevelUpOpen(false);
      toast.success(`Advanced to level ${result.level}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Level up failed");
    } finally {
      setSavingLevelUp(false);
    }
  };

  const handleInventoryChange = async (inventory: CharacterInventoryItem[]) => {
    if (!hero || !sheet || savingInventory) return;

    const previousHero = hero;
    const nextData = { ...sheet.data, inventory };
    const nextHero = { ...hero, data: JSON.stringify(nextData) };
    setHero(nextHero);
    setSavingInventory(true);

    try {
      await api.put(`/api/heroes/${hero.id}`, { data: nextData });
    } catch (err) {
      setHero(previousHero);
      toast.error(err instanceof Error ? err.message : "Inventory update failed");
    } finally {
      setSavingInventory(false);
    }
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 p-5 lg:p-8">
        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/25">
          <div className="border-b border-zinc-800 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(244,63,94,0.10)_48%,rgba(234,179,8,0.09))] p-5 lg:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                {hero.portrait_url ? (
                  <img
                    src={hero.portrait_url}
                    alt=""
                    className="size-24 rounded-md border border-zinc-700 object-cover shadow-lg shadow-black/30"
                  />
                ) : (
                  <div className="flex size-24 shrink-0 items-center justify-center rounded-md border border-zinc-700 bg-zinc-950/60 text-4xl font-semibold text-cyan-200">
                    {(hero.name?.[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-cyan-200/80">
                    <span>Level {hero.level}</span>
                    {sheet.echelon && <span>Echelon {sheet.echelon}</span>}
                    {sheet.classDef?.role && <span>{sheet.classDef.role}</span>}
                  </div>
                  <h1 className="mt-2 break-words text-3xl font-black tracking-normal text-zinc-50 lg:text-4xl">
                    {hero.name}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
                    {summary || "Hero"}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:w-[460px]">
                <HeroMetric
                  icon={HeartPulse}
                  label="Stamina"
                  value={sheet.staminaCurrent ?? "-"}
                  subvalue={
                    sheet.maxStamina ? `of ${sheet.maxStamina}` : undefined
                  }
                  tone="rose"
                />
                <HeroMetric
                  icon={Activity}
                  label="Recovery"
                  value={sheet.recoveryValue ?? "-"}
                  subvalue={
                    sheet.maxRecoveries
                      ? `${sheet.recoveriesCurrent ?? "-"} / ${sheet.maxRecoveries}`
                      : undefined
                  }
                  tone="emerald"
                />
                <HeroMetric
                  icon={Zap}
                  label={sheet.heroicResource ?? "Resource"}
                  value={resolveResourceValue(sheet.data, sheet.heroicResource)}
                  tone="amber"
                />
                <HeroMetric
                  icon={Medal}
                  label="Victories / XP"
                  value={`${sheet.victories} / ${sheet.xp}`}
                  tone="cyan"
                />
                <div className="sm:col-span-2">
                  {nextLevel ? (
                    <Button
                      type="button"
                      className="h-10 w-full"
                      variant={canAdvance ? "default" : "outline"}
                      disabled={!canAdvance}
                      onClick={openLevelUpDialog}
                    >
                      <Star className="size-4" />
                      Advance to Level {nextLevel}
                    </Button>
                  ) : (
                    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      Maximum Level
                    </div>
                  )}
                  {nextLevel && !canAdvance && (
                    <p className="mt-1 text-center text-[11px] text-zinc-500">
                      {xpNeeded} XP needed. Level {nextLevel} requires {nextLevelXP} XP.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="grid content-start gap-4">
            <SheetPanel icon={CircleGauge} title="Combat Snapshot">
              <div className="grid grid-cols-3 gap-2">
                <CompactStat
                  label="Speed"
                  value={sheet.speed ?? "-"}
                  icon={Footprints}
                />
                <CompactStat
                  label="Size"
                  value={sheet.size ?? "-"}
                  icon={Target}
                />
                <CompactStat
                  label="Stability"
                  value={sheet.stability}
                  icon={Shield}
                />
              </div>
            </SheetPanel>

            <SheetPanel icon={Brain} title="Characteristics">
              <div className="grid grid-cols-5 gap-2">
                {CHARACTERISTIC_ORDER.map((item) => (
                  <CharacteristicTile
                    key={item.key}
                    item={item}
                    value={sheet.chars[item.key]}
                  />
                ))}
              </div>
            </SheetPanel>

            <SheetPanel icon={UserRound} title="Identity">
              <div className="grid gap-3">
                <Detail label="Ancestry" value={sheet.ancestryName} />
                <Detail
                  label="Culture"
                  value={sheet.cultureDisplay}
                />
                <Detail label="Career" value={sheet.careerName} />
                <Detail label="Class" value={sheet.className} />
                <Detail
                  label={sheet.classDef?.subclassName ?? "Subclass"}
                  value={sheet.subclassNames.join(", ") || null}
                />
                <Detail label="Kit" value={sheet.kitName} />
              </div>
            </SheetPanel>

            <SheetPanel icon={Languages} title="Languages">
              {sheet.languages.length > 0 ? (
                <PillList items={sheet.languages} />
              ) : (
                <EmptyText>No languages recorded.</EmptyText>
              )}
            </SheetPanel>

            <SheetPanel icon={ScrollText} title="Personal">
              <div className="grid gap-4">
                <Detail
                  label="Pronouns"
                  value={stringFromData(sheet.data, "pronouns")}
                />
                <TextDetail
                  label="Appearance"
                  value={stringFromData(sheet.data, "appearance")}
                />
                <TextDetail
                  label="Backstory"
                  value={stringFromData(sheet.data, "backstory")}
                />
              </div>
            </SheetPanel>
          </aside>

          <main className="min-w-0">
            <Tabs defaultValue="class" className="grid content-start gap-3">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-zinc-800 bg-zinc-950/55 p-1 sm:grid-cols-4 xl:grid-cols-8">
                <TabsTrigger value="class" className={SHEET_TAB_TRIGGER_CLASS}>
                  <Swords size={14} />
                  Class
                </TabsTrigger>
                <TabsTrigger value="skills" className={SHEET_TAB_TRIGGER_CLASS}>
                  <BookOpen size={14} />
                  Skills
                </TabsTrigger>
                <TabsTrigger
                  value="abilities"
                  className={SHEET_TAB_TRIGGER_CLASS}
                >
                  <Zap size={14} />
                  Abilities
                </TabsTrigger>
                <TabsTrigger value="kit" className={SHEET_TAB_TRIGGER_CLASS}>
                  <Hammer size={14} />
                  Kit
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className={SHEET_TAB_TRIGGER_CLASS}
                >
                  <Package size={14} />
                  Inventory
                </TabsTrigger>
                <TabsTrigger
                  value="background"
                  className={SHEET_TAB_TRIGGER_CLASS}
                >
                  <BriefcaseBusiness size={14} />
                  Background
                </TabsTrigger>
                <TabsTrigger value="traits" className={SHEET_TAB_TRIGGER_CLASS}>
                  <Sparkles size={14} />
                  Traits
                </TabsTrigger>
                <TabsTrigger
                  value="rewards"
                  className={SHEET_TAB_TRIGGER_CLASS}
                >
                  <Medal size={14} />
                  Perks
                </TabsTrigger>
              </TabsList>

              <TabsContent value="class" className={SHEET_TAB_CONTENT_CLASS}>
                <SheetPanel
                  icon={Swords}
                  title="Class & Progression"
                  className="border-red-900/40"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="grid gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-black text-zinc-50">
                            {sheet.className ?? "Class"}
                          </h2>
                          {sheet.classDef?.role && (
                            <span className="rounded border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-200">
                              {sheet.classDef.role}
                            </span>
                          )}
                        </div>
                        {sheet.classDef?.description && (
                          <p className="mt-2 text-sm leading-6 text-zinc-300">
                            {sheet.classDef.description}
                          </p>
                        )}
                      </div>

                      {sheet.subclassNames.length > 0 && (
                        <div className="grid gap-3 md:grid-cols-2">
                          {sheet.subclassNames.map((name) => (
                            <div
                              key={name}
                              className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                                {sheet.classDef?.subclassName ?? "Subclass"}
                              </p>
                              <p className="mt-1 font-semibold text-zinc-100">
                                {name}
                              </p>
                              {sheet.classDef && (
                                <p className="mt-2 text-xs leading-5 text-zinc-400">
                                  {GameData.getSubclass(
                                    sheet.classDef.id,
                                    slugify(name),
                                  )?.description ?? null}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {sheet.classProgression.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-200">
                            Progression Through Level {hero.level}
                          </h3>
                          <div className="mt-3 grid gap-2">
                            {sheet.classProgression.map((entry) => (
                              <div
                                key={entry.level}
                                className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                    Level {entry.level}
                                  </span>
                                  {entry.abilities && (
                                    <span className="text-xs font-semibold text-cyan-200/80">
                                      {entry.abilities}
                                    </span>
                                  )}
                                </div>
                                {entry.features.length > 0 && (
                                  <p className="mt-2 text-xs leading-5 text-zinc-400">
                                    {entry.features.join(", ")}
                                  </p>
                                )}
                                {entry.aspectAbilities && (
                                  <p className="mt-1 text-xs leading-5 text-amber-200/80">
                                    {entry.aspectAbilities}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200">
                          Class Features
                        </h3>
                        {sheet.classFeatures.length > 0 ? (
                          <div className="mt-3 grid gap-2">
                            {sheet.classFeatures.map((feature) => (
                              <FeatureRow key={feature.id} feature={feature} />
                            ))}
                          </div>
                        ) : (
                          <EmptyText>
                            No class features resolved for this hero yet.
                          </EmptyText>
                        )}
                      </div>
                    </div>

                    <div className="grid content-start gap-3">
                      <DetailCard
                        label="Primary"
                        value={
                          sheet.classDef?.primaryCharacteristic
                            ? formatCharacteristicName(
                                sheet.classDef.primaryCharacteristic,
                              )
                            : null
                        }
                      />
                      <DetailCard
                        label="Potency"
                        value={
                          sheet.classDef?.potencyCharacteristic
                            ? formatCharacteristicName(
                                sheet.classDef.potencyCharacteristic,
                              )
                            : null
                        }
                      />
                      <DetailCard
                        label="Resource Gain"
                        value={
                          sheet.classDef?.heroicResourceDef?.gainPerTurn
                            ? `${sheet.classDef.heroicResourceDef.gainPerTurn} ${sheet.heroicResource ?? ""}`.trim()
                            : null
                        }
                        description={
                          sheet.classDef?.heroicResourceDef?.gainTrigger
                        }
                      />
                      <DetailCard
                        label="Starting Skills"
                        value={sheet.classDef?.fixedSkills?.join(", ") || null}
                      />
                    </div>
                  </div>
                </SheetPanel>
              </TabsContent>

              <TabsContent value="skills" className={SHEET_TAB_CONTENT_CLASS}>
                <SheetPanel icon={BookOpen} title="Skills">
                  <div className="grid gap-5">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Trained Skills
                      </h3>
                      {sheet.resolvedSkills.length > 0 ? (
                        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {SKILL_GROUP_ORDER.map((group) => {
                            const groupSkills = sheet.groupedSkills[group];
                            if (groupSkills.length === 0) return null;
                            return (
                              <div
                                key={group}
                                className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                              >
                                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
                                  {SKILL_GROUP_LABELS[group]}
                                </h3>
                                <div className="mt-3 grid gap-2">
                                  {groupSkills.map((skill) => (
                                    <div key={skill.id}>
                                      <p className="text-sm font-semibold text-zinc-100">
                                        {skill.name}
                                      </p>
                                      {skill.description && (
                                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                                          {skill.description}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyText>No trained skills recorded.</EmptyText>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Skill Sources
                      </h3>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {sheet.classDef?.fixedSkills?.length ? (
                          <DetailCard
                            label={`Class: ${sheet.classDef.name}`}
                            value={sheet.classDef.fixedSkills.join(", ")}
                          />
                        ) : null}
                        {sheet.classDef?.skillGroupChoices.map(
                          (choice, index) => (
                            <DetailCard
                              key={`${choice.groups.join("-")}-${index}`}
                              label={`Class choice ${index + 1}`}
                              value={`${choice.count} from ${choice.groups.join(", ")}`}
                            />
                          ),
                        )}
                        {sheet.career && (
                          <DetailCard
                            label={`Career: ${sheet.career.name}`}
                            value={sheet.career.skills.join(", ") || "-"}
                            description={sheet.career.description}
                          />
                        )}
                        {sheet.cultureEntries.map((entry) => (
                          <DetailCard
                            key={`${entry.label}-${entry.name}-skills`}
                            label={entry.label}
                            value={
                              entry.skills.length > 0
                                ? entry.skills.join(", ")
                                : entry.name
                            }
                            description={entry.effect ?? undefined}
                          />
                        ))}
                        {!sheet.classDef?.fixedSkills?.length &&
                          !sheet.classDef?.skillGroupChoices.length &&
                          !sheet.career &&
                          sheet.cultureEntries.length === 0 && (
                            <EmptyText>
                              No class, culture, or career skill sources are
                              recorded.
                            </EmptyText>
                          )}
                      </div>
                    </div>
                  </div>
                </SheetPanel>
              </TabsContent>

              <TabsContent
                value="abilities"
                className={SHEET_TAB_CONTENT_CLASS}
              >
                <SheetPanel icon={Zap} title="Abilities">
                  {sheet.shownAbilities.length > 0 ? (
                    <div className="grid gap-5">
                      {sheet.abilities.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-200">
                            Selected Abilities
                          </h3>
                          <div className="mt-3 grid gap-3 xl:grid-cols-2">
                            {sheet.abilities.map((ability) => (
                              <AbilityBlock
                                key={ability.id}
                                ability={drawSteelAbilityFromLike(ability)}
                                compact
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {sheet.classAbilities.length > 0 && (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-zinc-200">
                              Class Abilities Through Level {hero.level}
                            </h3>
                            {sheet.selectedClassAbilities.length > 0 && (
                              <span className="text-xs text-cyan-200/80">
                                {sheet.selectedClassAbilities.length} selected
                              </span>
                            )}
                          </div>
                          <div className="mt-3 grid gap-3 xl:grid-cols-2">
                            {sheet.classAbilities.map((entry) => (
                              <div key={entry.id} className="grid gap-2">
                                <div className="flex items-center gap-2">
                                  {entry.level && (
                                    <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                      L{entry.level}
                                    </span>
                                  )}
                                  {entry.selected && (
                                    <span className="rounded border border-cyan-400/40 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <AbilityBlock
                                  ability={drawSteelAbilityFromLike(
                                    entry.ability,
                                  )}
                                  selected={entry.selected}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyText>No abilities resolved for this hero.</EmptyText>
                  )}
                </SheetPanel>
              </TabsContent>

              <TabsContent value="kit" className={SHEET_TAB_CONTENT_CLASS}>
                <SheetPanel icon={Hammer} title="Kit & Equipment">
                  {sheet.kits.length > 0 ? (
                    <div className="grid gap-4">
                      {sheet.kits.map((kit, index) => (
                        <div key={kit.id} className="grid gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500">
                              {sheet.kits.length > 1 && index === 1 ? "Second Kit" : "Kit"}
                            </div>
                            <h3 className="text-lg font-black text-zinc-50">
                              {kit.name}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                              {kit.description}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <DetailCard label="Armor" value={kit.armor} />
                            <DetailCard
                              label="Weapons"
                              value={kit.weapons.join(", ")}
                            />
                            <DetailCard
                              label="Stamina"
                              value={`+${kit.staminaPerEchelon} / echelon`}
                            />
                            <DetailCard
                              label="Speed"
                              value={formatModifier(kit.speedBonus)}
                            />
                            <DetailCard
                              label="Stability"
                              value={formatModifier(kit.stabilityBonus)}
                            />
                            <DetailCard
                              label="Disengage"
                              value={formatModifier(kit.disengageBonus)}
                            />
                          </div>
                          <AbilityBlock
                            ability={drawSteelAbilityFromLike(
                              kitSignatureAsAbility(kit),
                            )}
                            compact
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                        <DetailCard label="Armor" value="-" />
                        <DetailCard label="Weapons" value="-" />
                        <DetailCard label="Stamina" value="+0 / echelon" />
                        <DetailCard label="Speed" value="+0" />
                        <DetailCard label="Stability" value="+0" />
                        <DetailCard label="Disengage" value="+0" />
                      </div>
                      <EmptyText>
                        No kit is recorded for this hero, so combat totals use
                        class and ancestry values only.
                      </EmptyText>
                    </div>
                  )}
                </SheetPanel>
              </TabsContent>

              <TabsContent
                value="inventory"
                className={SHEET_TAB_CONTENT_CLASS}
              >
                <SheetPanel icon={Package} title="Inventory">
                  <div className="grid gap-4">
                    <div className="grid gap-2 md:grid-cols-3">
                      <DetailCard
                        label="Entries"
                        value={sheet.inventory.length}
                      />
                      <DetailCard
                        label="Carried"
                        value={sheet.inventory.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}
                      />
                      <DetailCard
                        label="Equipped"
                        value={
                          sheet.inventory.filter((item) => item.equipped)
                            .length
                        }
                      />
                    </div>
                    {savingInventory && (
                      <p className="rounded border border-cyan-800/60 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100">
                        Saving inventory...
                      </p>
                    )}
                    <CharacterInventoryPanel
                      inventory={sheet.inventory}
                      onInventoryChange={handleInventoryChange}
                    />
                  </div>
                </SheetPanel>
              </TabsContent>

              <TabsContent
                value="background"
                className={SHEET_TAB_CONTENT_CLASS}
              >
                <SheetPanel icon={BriefcaseBusiness} title="Background">
                  <div className="grid gap-4">
                    {sheet.ancestry && (
                      <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              Ancestry
                            </p>
                            <h3 className="mt-1 font-semibold text-zinc-100">
                              {sheet.ancestry.name}
                            </h3>
                          </div>
                          <div className="flex gap-2">
                            <span className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                              Speed {sheet.ancestry.speed}
                            </span>
                            <span className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                              Size {sheet.ancestry.size}
                            </span>
                            <span className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                              {sheet.ancestry.totalPoints} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {sheet.career && (
                      <div>
                        <h3 className="font-semibold text-zinc-100">
                          {sheet.career.name}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">
                          {sheet.career.description}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <CompactStat
                            label="Renown"
                            value={formatModifier(sheet.career.renown)}
                            icon={Medal}
                          />
                          <CompactStat
                            label="Wealth"
                            value={formatModifier(sheet.career.wealth)}
                            icon={Gem}
                          />
                          <CompactStat
                            label="Projects"
                            value={sheet.career.projectPoints}
                            icon={Hammer}
                          />
                        </div>
                      </div>
                    )}

                    {!sheet.career && (
                      <EmptyText>
                        No career is recorded for this hero.
                      </EmptyText>
                    )}

                    {sheet.incitingIncident && (
                      <TextDetail
                        label="Inciting Incident"
                        value={sheet.incitingIncident}
                      />
                    )}

                    {sheet.cultureEntries.length > 0 ? (
                      <div className="grid gap-2">
                        {sheet.cultureEntries.map((entry) => (
                          <div
                            key={`${entry.label}-${entry.name}`}
                            className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                              {entry.label}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-100">
                              {entry.name}
                            </p>
                            {entry.skills.length > 0 && (
                              <p className="mt-1 text-xs text-cyan-200/80">
                                {entry.skills.join(", ")}
                              </p>
                            )}
                            {entry.effect && (
                              <p className="mt-2 text-xs leading-5 text-zinc-500">
                                {entry.effect}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyText>No culture selections are recorded.</EmptyText>
                    )}

                    {sheet.complication && (
                      <div className="rounded-md border border-amber-700/40 bg-amber-950/10 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
                          Complication
                        </p>
                        <p className="mt-1 text-sm font-semibold text-zinc-100">
                          {sheet.complication.name}
                        </p>
                        {sheet.complication.description && (
                          <p className="mt-2 text-xs leading-5 text-zinc-400">
                            {sheet.complication.description}
                          </p>
                        )}
                        {sheet.complication.benefit && (
                          <p className="mt-2 text-xs leading-5 text-zinc-300">
                            <span className="font-semibold text-emerald-200">
                              Benefit:{" "}
                            </span>
                            {sheet.complication.benefit}
                          </p>
                        )}
                        {sheet.complication.drawback && (
                          <p className="mt-2 text-xs leading-5 text-zinc-300">
                            <span className="font-semibold text-red-200">
                              Drawback:{" "}
                            </span>
                            {sheet.complication.drawback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </SheetPanel>
              </TabsContent>

              <TabsContent value="traits" className={SHEET_TAB_CONTENT_CLASS}>
                <SheetPanel icon={Sparkles} title="Ancestry Traits">
                  <div className="grid gap-5">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Active Traits
                      </h3>
                      {sheet.ancestryTraits.length > 0 ? (
                        <div className="mt-3 grid gap-3">
                          {sheet.ancestryTraits.map((trait) => (
                            <div
                              key={trait.id}
                              className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-zinc-100">
                                    {trait.name}
                                  </p>
                                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-cyan-200/70">
                                    {trait.source}
                                    {trait.cost !== null
                                      ? ` - ${trait.cost} pts`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-zinc-400">
                                {trait.effect}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyText>No ancestry traits recorded.</EmptyText>
                      )}
                    </div>

                    {sheet.availableAncestryTraits.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-200">
                          Ancestry Trait Options
                        </h3>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {sheet.availableAncestryTraits.map((trait) => (
                            <div
                              key={trait.id}
                              className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-zinc-100">
                                  {trait.name}
                                </p>
                                {trait.pointCost != null && (
                                  <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                    {trait.pointCost} pts
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-xs leading-5 text-zinc-400">
                                {trait.effect}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SheetPanel>
              </TabsContent>

              <TabsContent value="rewards" className={SHEET_TAB_CONTENT_CLASS}>
                <SheetPanel icon={Medal} title="Perks & Titles">
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-3">
                      <DetailCard
                        label="Hero Level"
                        value={`Level ${hero.level}`}
                      />
                      <DetailCard
                        label="Languages"
                        value={
                          sheet.languages.length > 0
                            ? sheet.languages.join(", ")
                            : "-"
                        }
                      />
                      <DetailCard
                        label="Recorded Rewards"
                        value={`${sheet.perks.length} perks / ${sheet.titles.length} titles`}
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Perks
                      </h3>
                      {sheet.perks.length > 0 ? (
                        <div className="mt-2 grid gap-2">
                          {sheet.perks.map((perk) => (
                            <div
                              key={perk.id}
                              className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                            >
                              <p className="text-sm font-semibold text-zinc-100">
                                {perk.name}
                              </p>
                              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-cyan-200/70">
                                {perk.category}
                              </p>
                              {perk.description && (
                                <p className="mt-2 text-xs leading-5 text-zinc-400">
                                  {perk.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyText>No perks selected.</EmptyText>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-zinc-200">
                        Titles
                      </h3>
                      {sheet.titles.length > 0 ? (
                        <div className="mt-2 grid gap-2">
                          {sheet.titles.map((title) => (
                            <div
                              key={title.id}
                              className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                            >
                              <p className="text-sm font-semibold text-zinc-100">
                                {title.name}
                              </p>
                              {title.echelon && (
                                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-amber-200/70">
                                  {title.echelon} echelon
                                </p>
                              )}
                              {title.description && (
                                <p className="mt-2 text-xs italic leading-5 text-zinc-500">
                                  {title.description}
                                </p>
                              )}
                              {title.effect && (
                                <p className="mt-2 text-xs leading-5 text-zinc-400">
                                  {title.effect}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyText>No titles recorded.</EmptyText>
                      )}
                    </div>
                  </div>
                </SheetPanel>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      <Dialog open={levelUpOpen} onOpenChange={setLevelUpOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogTitle>Advance to Level {nextLevel ?? hero.level}</DialogTitle>
          <div className="mt-4 grid gap-5">
            <div className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-950/45 p-3 text-sm text-zinc-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-semibold text-zinc-100">
                  {hero.name} gains level {nextLevel ?? hero.level}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-cyan-200/80">
                  {sheet.xp} XP
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Automatic features are gained immediately. Choose each required option before advancing.
              </p>
            </div>

            <div className="grid gap-4">
              {targetLevelFeatures.length > 0 ? (
                targetLevelFeatures.map((feature) => {
                  const selectedChoice = levelUpChoices.find(
                    (choice) => choice.featureId === feature.id,
                  )?.choiceId;
                  const hasChoices =
                    feature.type === "choice" && (feature.choices?.length ?? 0) > 0;

                  return (
                    <div
                      key={feature.id}
                      className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {!hasChoices || selectedChoice ? (
                            <CheckCircle2 className="size-4 text-cyan-300" />
                          ) : (
                            <Circle className="size-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-100">
                            {feature.name}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {hasChoices && feature.choices && (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {feature.choices.map((choice) => {
                            const isSelected = selectedChoice === choice.id;
                            return (
                              <button
                                key={choice.id}
                                type="button"
                                className={cn(
                                  "rounded-md border p-3 text-left transition",
                                  isSelected
                                    ? "border-cyan-400/70 bg-cyan-400/10"
                                    : "border-zinc-800 bg-zinc-900/70 hover:border-cyan-700/70 hover:bg-zinc-900",
                                )}
                                onClick={() =>
                                  setLevelUpChoice(
                                    feature.id,
                                    choice.id,
                                    feature.category,
                                  )
                                }
                              >
                                <span className="block text-sm font-semibold text-zinc-100">
                                  {choice.name}
                                </span>
                                <span className="mt-1 block whitespace-pre-wrap text-xs leading-5 text-zinc-500">
                                  {choice.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyText>No level-up choices are required for this level.</EmptyText>
              )}
            </div>

            {gainsPerk && (
              <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
                <label className="text-sm font-semibold text-zinc-100">
                  Level {nextLevel} Perk
                </label>
                <select
                  value={levelUpPerkId}
                  onChange={(event) => setLevelUpPerkId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="">Select a perk...</option>
                  {perkOptions.map((perk) => (
                    <option key={perk.id} value={perk.id}>
                      {perk.name} ({PERK_CATEGORY_INFO[perk.category].name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {levelUpValidationErrors.length > 0 && (
              <div className="rounded-md border border-amber-700/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
                {levelUpValidationErrors[0]}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLevelUpOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={
                  savingLevelUp ||
                  levelUpValidationErrors.length > 0 ||
                  (gainsPerk && !levelUpPerkId)
                }
                onClick={handleAdvanceLevel}
              >
                {savingLevelUp ? "Advancing..." : `Advance to Level ${nextLevel ?? hero.level}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SheetPanel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-900/72 p-4 shadow-lg shadow-black/20",
        className,
      )}
    >
      <header className="mb-4 flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Icon className="size-4 text-cyan-200/80" />
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-zinc-200">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
  subvalue,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  subvalue?: string;
  tone: "rose" | "emerald" | "amber" | "cyan";
}) {
  const toneClass = {
    rose: "border-rose-400/30 bg-rose-400/10 text-rose-200",
    emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950/65 p-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md border",
          toneClass,
        )}
      >
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </p>
        <div className="mt-1 flex min-w-0 items-baseline gap-2">
          <p className="text-xl font-black leading-none text-zinc-50">
            {value}
          </p>
          {subvalue && (
            <p className="truncate text-xs text-zinc-500">{subvalue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacteristicTile({
  item,
  value,
}: {
  item: { short: string; label: string; icon: LucideIcon };
  value: number;
}) {
  const Icon = item.icon;
  return (
    <div className="flex min-h-24 flex-col items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/55 p-2 text-center">
      <Icon className="size-4 text-cyan-200/70" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {item.short}
        </p>
        <p className="mt-1 font-mono text-xl font-semibold text-zinc-100">
          {formatModifier(value)}
        </p>
      </div>
      <p className="text-[10px] text-zinc-600">{item.label}</p>
    </div>
  );
}

function CompactStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/55 p-2 text-center">
      <Icon className="mx-auto size-4 text-cyan-200/70" />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-sm text-zinc-200">{value || "-"}</div>
    </div>
  );
}

function TextDetail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return <Detail label={label} value={null} />;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number | null | undefined;
  description?: string;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-100">{value ?? "-"}</p>
      {description && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
      )}
    </div>
  );
}

function FeatureRow({ feature }: { feature: ResolvedFeature }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold text-zinc-100">{feature.name}</p>
        {feature.level && (
          <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
            L{feature.level}
          </span>
        )}
      </div>
      {feature.description && (
        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400">
          {feature.description}
        </p>
      )}
    </div>
  );
}

function PillList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded border border-zinc-700 bg-zinc-950/50 px-2 py-1 text-xs font-medium text-zinc-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-zinc-800 bg-zinc-950/35 px-3 py-4 text-sm text-zinc-500">
      {children}
    </p>
  );
}
