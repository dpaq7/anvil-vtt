import { User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@anvil/ui';
import type { Hero } from '@anvil/types';

export interface HeroGridProps {
  heroes: Hero[];
  onSelect: (heroId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}

function classLabel(hero: Hero): string {
  const base = hero.heroClass.charAt(0).toUpperCase() + hero.heroClass.slice(1);
  // subclass label when available
  const sub = 'subclass' in hero && hero.subclass ? ` (${String(hero.subclass)})` : '';
  return `${base}${sub}`;
}

export function HeroGrid({ heroes, onSelect, selectedId, compact }: HeroGridProps) {
  if (heroes.length === 0) {
    return <p className="p-8 text-center text-zinc-500">No heroes yet.</p>;
  }

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 p-3 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {heroes.map((hero) => (
        <Card
          key={hero.id}
          className={`cursor-pointer transition hover:border-zinc-600 ${
            selectedId === hero.id ? 'ring-2 ring-zinc-400' : ''
          }`}
          onClick={() => onSelect(hero.id)}
        >
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
            {/* Portrait placeholder */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-zinc-800">
              {hero.portraitUrl ? (
                <img
                  src={hero.portraitUrl}
                  alt={hero.name}
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <User className="size-6 text-zinc-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-bold">{hero.name}</CardTitle>
              {hero.title && (
                <p className="truncate text-xs text-zinc-400">{hero.title}</p>
              )}
              <p className="mt-0.5 text-xs text-zinc-500">{classLabel(hero)}</p>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 pt-0">
            {/* Level + Ancestry row */}
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Lv {hero.level}
              </Badge>
              <span className="truncate text-xs text-zinc-400">{hero.ancestry.name}</span>
            </div>

            {/* Stat chips */}
            {!compact && (
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  HP {hero.stamina.current}/{hero.stamina.max}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Rec {hero.recoveries.current}/{hero.recoveries.max}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Vic {hero.victories}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  XP {hero.xp}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
