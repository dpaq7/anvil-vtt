import { Camera, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@anvil/ui';
import type { HeroSummary } from '@anvil/types';
import { HeroPortraitDialog } from './HeroPortraitDialog.js';

export interface HeroGridProps {
  heroes: HeroSummary[];
  onSelect: (heroId: string) => void;
  onPortraitSave?: (heroId: string, assetId: string) => Promise<void>;
  onPortraitRemove?: (heroId: string) => Promise<void>;
  selectedId?: string | null;
  compact?: boolean;
}

function classLabel(hero: HeroSummary): string {
  const cls = hero.heroClass ?? '';
  if (!cls) return 'Unknown Class';
  const base = cls.charAt(0).toUpperCase() + cls.slice(1);
  const sub = hero.subclass ? ` (${hero.subclass})` : '';
  return `${base}${sub}`;
}

function HeroPortrait({ hero, editable }: { hero: HeroSummary; editable?: boolean }) {
  return (
    <div className="group/portrait relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-zinc-800">
      {hero.portraitUrl ? (
        <img
          src={hero.portraitUrl}
          alt={hero.name}
          className="size-12 object-cover"
        />
      ) : (
        <User className="size-6 text-zinc-500" />
      )}
      {editable && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover/portrait:opacity-100">
          <Camera className="size-4 text-zinc-200" />
        </div>
      )}
    </div>
  );
}

export function HeroGrid({
  heroes,
  onSelect,
  onPortraitSave,
  onPortraitRemove,
  selectedId,
  compact,
}: HeroGridProps) {
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
            {onPortraitSave ? (
              <HeroPortraitDialog
                heroName={hero.name}
                currentPortraitUrl={hero.portraitUrl}
                onSave={(assetId) => onPortraitSave(hero.id, assetId)}
                onRemove={onPortraitRemove && hero.portraitUrl ? () => onPortraitRemove(hero.id) : undefined}
              >
                <button
                  type="button"
                  aria-label={`Edit ${hero.name} portrait`}
                  onClick={(event) => event.stopPropagation()}
                  className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  <HeroPortrait hero={hero} editable />
                </button>
              </HeroPortraitDialog>
            ) : (
              <HeroPortrait hero={hero} />
            )}
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-bold">{hero.name}</CardTitle>
              <p className="mt-0.5 text-xs text-zinc-500">{classLabel(hero)}</p>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-4 pt-0">
            {/* Level + Ancestry row */}
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Lv {hero.level}
              </Badge>
              <span className="truncate text-xs text-zinc-400">{hero.ancestry?.name ?? 'Unknown'}</span>
            </div>

            {/* Stat chips */}
            {!compact && (
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  HP {hero.staminaCurrent ?? hero.staminaMax ?? 0}/{hero.staminaMax ?? 0}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Rec {hero.recoveriesCurrent ?? hero.recoveriesMax ?? 0}/{hero.recoveriesMax ?? 0}
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
