import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HeroLogic, GameData } from '@anvil/data';
import type { HeroLogic as HeroLogicTypes, Characteristics } from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import { api } from '../lib/api.js';

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

interface AbilityDisplay {
  id: string;
  name: string;
  usage?: string;
  cost?: string;
  distance?: string;
  target?: string;
  keywords?: string[];
}

interface AbilityLike {
  name?: string;
  usage?: string;
  cost?: string;
  distance?: string;
  target?: string;
  keywords?: string[];
  metadata?: {
    item_id?: string;
    scc?: string[];
  };
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function titleCaseId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function stringFromData(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function normalizeSubclassValue(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return value.split(',').map((part) => part.trim()).filter(Boolean);
}

function inferHeroClassFromSubclass(subclassIds: string[]): HeroLogicTypes.HeroClass | null {
  const classIds: HeroLogicTypes.HeroClass[] = [
    'beastheart',
    'censor',
    'conduit',
    'elementalist',
    'fury',
    'null',
    'shadow',
    'summoner',
    'tactician',
    'talent',
    'troubadour',
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

function resolveHeroClass(hero: HeroRow, data: Record<string, unknown>): HeroLogicTypes.HeroClass | null {
  const raw = hero.hero_class ?? stringFromData(data, 'heroClass');
  if (raw && HeroLogic.isValidHeroClass(raw)) {
    return raw;
  }

  const subclassIds = normalizeSubclassValue(hero.subclass ?? data['subclass'] as string | string[] | null);
  return inferHeroClassFromSubclass(subclassIds);
}

function resolveSubclassNames(heroClass: HeroLogicTypes.HeroClass | null, subclassIds: string[]): string[] {
  return subclassIds.map((subclassId) => {
    if (!heroClass) return titleCaseId(subclassId);
    return GameData.getSubclass(heroClass, subclassId)?.name ?? titleCaseId(subclassId);
  });
}

function resolveAbility(id: string): AbilityDisplay {
  const slug = id.includes(':') ? id.split(':').pop() ?? id : id;
  const ability =
    (GameData.getByScc(id) as AbilityLike | undefined) ??
    (GameData.getAbility(id) as AbilityLike | undefined) ??
    (GameData.getAbility(slug) as AbilityLike | undefined) ??
    (GameData.getFeature(id) as AbilityLike | undefined) ??
    (GameData.getFeature(slug) as AbilityLike | undefined) ??
    ((GameData.getAllAbilities() as AbilityLike[]).find((candidate) =>
      candidate.metadata?.item_id === id ||
      candidate.metadata?.item_id === slug ||
      candidate.metadata?.scc?.includes(id)
    ));

  return {
    id,
    name: ability?.name ?? titleCaseId(slug),
    usage: ability?.usage,
    cost: ability?.cost,
    distance: ability?.distance,
    target: ability?.target,
    keywords: ability?.keywords,
  };
}

export function HeroSheet() {
  const { id } = useParams<{ id: string }>();
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<HeroRow>(`/api/heroes/${id}`)
      .then(setHero)
      .catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!hero) return <div className="p-8 text-zinc-500">Loading...</div>;

  const chars: Characteristics = parseJson(hero.characteristics, {} as Characteristics);
  const skills: string[] = parseJson(hero.skills, []);
  const abilities: string[] = parseJson(hero.abilities, []);
  const data: Record<string, unknown> = parseJson(hero.data, {});
  const heroClass = resolveHeroClass(hero, data);
  const subclassIds = normalizeSubclassValue(hero.subclass ?? data['subclass'] as string | string[] | null);
  const subclassNames = resolveSubclassNames(heroClass, subclassIds);
  const ancestryName = hero.ancestry
    ? GameData.getAncestry(hero.ancestry)?.name ?? titleCaseId(hero.ancestry)
    : null;
  const careerName = hero.career
    ? GameData.getCareer(hero.career)?.name ?? titleCaseId(hero.career)
    : null;
  const kitName = hero.kit
    ? GameData.getKit(hero.kit)?.name ?? titleCaseId(hero.kit)
    : null;
  const className = heroClass
    ? GameData.getClass(heroClass)?.name ?? titleCaseId(heroClass)
    : null;

  let maxStamina: number | null = null;
  let recoveryValue: number | null = null;
  let maxRecoveries: number | null = null;
  let heroicResource: string | null = null;

  if (heroClass && HeroLogic.isValidHeroClass(heroClass)) {
    const kit = hero.kit ? GameData.getKit(hero.kit) : undefined;
    maxStamina = HeroLogic.getMaxStaminaWithKit(heroClass, hero.level, kit?.staminaPerEchelon ?? 0);
    recoveryValue = HeroLogic.getRecoveryValue(maxStamina);
    maxRecoveries = HeroLogic.getMaxRecoveries(heroClass);
    heroicResource = HeroLogic.getHeroicResourceName(HeroLogic.getHeroicResourceType(heroClass));
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        {hero.portrait_url ? (
          <img src={hero.portrait_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-2xl text-zinc-500">
            {(hero.name?.[0] ?? '?').toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{hero.name}</h1>
          <p className="text-sm text-zinc-400">
            {[className, ...subclassNames].filter(Boolean).join(' — ') || 'Hero'} · Level {hero.level}
          </p>
          {ancestryName && <p className="text-xs text-zinc-500">{ancestryName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Vitals */}
        {maxStamina != null && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Vitals</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
              <Stat label="Stamina" value={maxStamina} />
              <Stat label="Recovery" value={recoveryValue!} />
              <Stat label="Recoveries" value={maxRecoveries!} />
              {heroicResource && <Stat label={heroicResource} value="—" />}
            </CardContent>
          </Card>
        )}

        {/* Characteristics */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Characteristics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {(Object.entries(chars) as [string, number][]).map(([name, val]) => (
                <div key={name} className="flex flex-col items-center rounded bg-zinc-800 px-2 py-1">
                  <span className="text-[10px] uppercase text-zinc-500">{name.slice(0, 3)}</span>
                  <span className="font-mono text-zinc-200">{val >= 0 ? `+${val}` : val}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        {skills.length > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s} className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                    {s}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Background */}
        {(ancestryName || careerName || kitName) && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {ancestryName && <Detail label="Ancestry" value={ancestryName} />}
              {careerName && <Detail label="Career" value={careerName} />}
              {kitName && <Detail label="Kit" value={kitName} />}
            </CardContent>
          </Card>
        )}

        {/* Abilities */}
        {abilities.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Abilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {abilities.map((abilityId) => {
                  const ability = resolveAbility(abilityId);
                  return (
                    <div key={abilityId} className="rounded bg-zinc-800 p-3">
                      <p className="text-sm font-medium text-zinc-200">{ability.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {[ability.usage, ability.cost, ability.distance, ability.target]
                          .filter(Boolean)
                          .map((label) => (
                            <span key={label} className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                              {label}
                            </span>
                          ))}
                      </div>
                      {ability.keywords && ability.keywords.length > 0 && (
                        <p className="mt-2 text-xs text-zinc-500">{ability.keywords.join(', ')}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal */}
        {(Boolean(data['backstory']) || Boolean(data['appearance'])) && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Personal</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {Boolean(data['pronouns']) && <p className="text-zinc-400">Pronouns: {String(data['pronouns'])}</p>}
              {Boolean(data['backstory']) && (
                <div>
                  <p className="text-zinc-500">Backstory</p>
                  <p className="text-zinc-300">{String(data['backstory'])}</p>
                </div>
              )}
              {Boolean(data['appearance']) && (
                <div>
                  <p className="text-zinc-500">Appearance</p>
                  <p className="text-zinc-300">{String(data['appearance'])}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-zinc-500">{label}</div>
      <div className="text-zinc-200">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase text-zinc-500">{label}</div>
      <div className="font-mono text-lg text-zinc-200">{value}</div>
    </div>
  );
}
