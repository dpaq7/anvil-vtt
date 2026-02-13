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

  const chars: Characteristics = JSON.parse(hero.characteristics || '{}');
  const skills: string[] = JSON.parse(hero.skills || '[]');
  const abilities: string[] = JSON.parse(hero.abilities || '[]');
  const data: Record<string, unknown> = JSON.parse(hero.data || '{}');
  const heroClass = hero.hero_class as HeroLogicTypes.HeroClass | null;

  let maxStamina: number | null = null;
  let recoveryValue: number | null = null;
  let maxRecoveries: number | null = null;
  let heroicResource: string | null = null;

  if (heroClass && HeroLogic.isValidHeroClass(heroClass)) {
    maxStamina = HeroLogic.getMaxStaminaForClass(heroClass, hero.level);
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
            {[heroClass ? GameData.getClass(heroClass)?.name ?? hero.hero_class : null, hero.subclass].filter(Boolean).join(' — ')} · Level {hero.level}
          </p>
          {hero.ancestry && <p className="text-xs text-zinc-500">{hero.ancestry}</p>}
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

        {/* Abilities */}
        {abilities.length > 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Abilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {abilities.map((abilityId) => {
                  const ability = GameData.getByScc(abilityId) ?? GameData.getAbility(abilityId);
                  return (
                    <div key={abilityId} className="rounded bg-zinc-800 p-3">
                      <p className="text-sm font-medium text-zinc-200">{ability?.name ?? abilityId}</p>
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase text-zinc-500">{label}</div>
      <div className="font-mono text-lg text-zinc-200">{value}</div>
    </div>
  );
}
