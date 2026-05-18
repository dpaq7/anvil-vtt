import { cn } from '@anvil/ui';
import type { LucideIcon } from 'lucide-react';
import { Clock3, Crosshair, Gauge, Sparkles, Target, Zap } from 'lucide-react';
import type { DrawSteelAbilityView, DrawSteelEffectBlock, DrawSteelPowerRoll } from './abilityData.js';

interface AbilityBlockProps {
  ability: DrawSteelAbilityView;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const TIER_LABELS = [
  ['≤11', 'tier1'],
  ['12-16', 'tier2'],
  ['17+', 'tier3'],
] as const;

function isSignature(ability: DrawSteelAbilityView): boolean {
  return [ability.abilityType, ability.cost]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes('signature'));
}

function displayType(ability: DrawSteelAbilityView): string | null {
  if (ability.cost) return ability.cost;
  if (ability.abilityType) return ability.abilityType;
  return isSignature(ability) ? 'Signature' : null;
}

function normalizedUsage(usage?: string): string | null {
  if (!usage?.trim()) return null;
  const value = usage
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  const key = value.toLowerCase();
  if (key === 'action' || key === 'main' || key === 'main action') return 'Main Action';
  if (key === 'maneuver') return 'Maneuver';
  if (key === 'triggered' || key === 'triggered action') return 'Triggered Action';
  if (key === 'free triggered' || key === 'free triggered action') return 'Free Triggered Action';
  if (key === 'free maneuver') return 'Free Maneuver';
  return value;
}

function hasPowerRoll(powerRoll: DrawSteelPowerRoll): boolean {
  return Boolean(powerRoll.roll || powerRoll.tier1 || powerRoll.tier2 || powerRoll.tier3);
}

function TierBadge({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded border border-flow-player/30 bg-flow-player/10 font-mono font-black leading-none text-flow-player',
        compact ? 'h-5 min-w-11 px-1.5 text-[10px]' : 'h-7 min-w-14 px-2 text-xs',
      )}
    >
      {label}
    </span>
  );
}

function KeywordPills({ keywords, compact }: { keywords?: string[]; compact?: boolean }) {
  if (!keywords?.length) return null;
  return (
    <div className={cn('flex flex-wrap', compact ? 'gap-1' : 'gap-1.5')}>
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className={cn(
            'rounded border border-zinc-700 bg-zinc-950/55 font-semibold uppercase tracking-wide text-zinc-300',
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[11px]',
          )}
        >
          {keyword}
        </span>
      ))}
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  compact?: boolean;
}) {
  if (!value?.trim()) return null;

  return (
    <div
      className={cn(
        'min-w-0 rounded-md border border-zinc-800 bg-zinc-950/55',
        compact ? 'p-2' : 'p-3',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('shrink-0 text-flow-player/70', compact ? 'size-3' : 'size-4')} />
        <span className={cn('font-black uppercase tracking-[0.12em] text-zinc-500', compact ? 'text-[9px]' : 'text-[10px]')}>
          {label}
        </span>
      </div>
      <p className={cn('mt-1.5 break-words font-medium leading-snug text-zinc-200', compact ? 'text-[11px]' : 'text-sm')}>
        {value}
      </p>
    </div>
  );
}

function ActionBlock({ ability, compact }: { ability: DrawSteelAbilityView; compact?: boolean }) {
  const usage = normalizedUsage(ability.usage);
  const hasDetails = usage || ability.distance || ability.target || ability.trigger;
  if (!hasDetails) return null;

  return (
    <section className={cn('grid gap-2', compact ? 'grid-cols-1' : 'sm:grid-cols-2')}>
      <InfoItem icon={Zap} label="Action" value={usage ?? undefined} compact={compact} />
      <InfoItem icon={Gauge} label="Range" value={ability.distance} compact={compact} />
      <InfoItem icon={Target} label="Target" value={ability.target} compact={compact} />
      <InfoItem icon={Clock3} label="Trigger" value={ability.trigger} compact={compact} />
    </section>
  );
}

function PowerRollBlock({ powerRoll, compact }: { powerRoll: DrawSteelPowerRoll; compact?: boolean }) {
  if (!hasPowerRoll(powerRoll)) return null;

  return (
    <section className={cn('rounded-md border border-amber-400/20 bg-amber-400/[0.04]', compact ? 'p-2' : 'p-3')}>
      <div className="flex items-center gap-2">
        <Crosshair className={cn('shrink-0 text-amber-200/75', compact ? 'size-3.5' : 'size-4')} />
        <div className={cn('font-black uppercase tracking-[0.08em] text-amber-100', compact ? 'text-[11px]' : 'text-sm')}>
          {powerRoll.roll || 'Power Roll'}
        </div>
      </div>
      <div className={cn('mt-3 grid overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/45', compact ? 'text-[11px]' : 'text-sm')}>
          {TIER_LABELS.map(([label, key]) => {
            const text = powerRoll[key];
            if (!text) return null;
            return (
              <div key={key} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-zinc-800 px-2 py-2 last:border-b-0">
                <TierBadge label={label} compact={compact} />
                <p className="min-w-0 leading-relaxed text-zinc-200">{text}</p>
              </div>
            );
          })}
      </div>
    </section>
  );
}

function EffectsBlock({ effects, compact }: { effects?: DrawSteelEffectBlock[]; compact?: boolean }) {
  const visible = effects?.filter((effect) => effect.text.trim()) ?? [];
  if (visible.length === 0) return null;

  return (
    <section className={cn('rounded-md border border-zinc-800 bg-zinc-950/45', compact ? 'p-2' : 'p-3')}>
      <div className="grid gap-2">
        {visible.map((effect, index) => (
          <div key={`${effect.name ?? 'effect'}-${index}`}>
            {effect.name ? (
              <div className="flex items-center gap-2">
                <Sparkles className={cn('shrink-0 text-rose-200/70', compact ? 'size-3' : 'size-4')} />
                <div className={cn('font-black uppercase tracking-[0.1em] text-zinc-200', compact ? 'text-[10px]' : 'text-xs')}>{effect.name}</div>
              </div>
            ) : null}
            <p className={cn('whitespace-pre-wrap leading-relaxed text-zinc-300', compact ? 'mt-1 text-[11px]' : 'mt-2 text-sm')}>
              {effect.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AbilityBlock({ ability, className, compact = false, disabled = false, selected = false, onClick }: AbilityBlockProps) {
  const Component = onClick ? 'button' : 'div';
  const type = displayType(ability);
  const signature = isSignature(ability);

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      className={cn(
        'block w-full overflow-hidden rounded-md border bg-zinc-900/80 text-left text-zinc-100 shadow-sm shadow-black/20',
        compact ? 'p-2.5' : 'p-4',
        selected ? 'border-flow-player/70 ring-1 ring-flow-player/45' : 'border-zinc-800',
        onClick && 'transition hover:border-flow-player/45 hover:bg-zinc-900',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <header className={cn('flex min-w-0 items-start justify-between gap-3', compact ? 'mb-2' : 'mb-3')}>
        <div className="min-w-0">
          <h3
            className={cn(
              'min-w-0 break-words font-black uppercase tracking-[0.08em] text-zinc-100',
              compact ? 'text-sm leading-tight' : 'text-xl leading-tight',
            )}
          >
            {ability.name}
          </h3>
          {ability.flavor ? (
            <p className={cn('mt-2 text-zinc-400', compact ? 'line-clamp-2 text-xs italic leading-5' : 'text-sm italic leading-6')}>
              {ability.flavor}
            </p>
          ) : null}
        </div>

        {type ? (
          <span
            className={cn(
              'shrink-0 rounded border px-2 py-1 text-center font-black uppercase tracking-wide leading-none',
              signature
                ? 'border-flow-player/40 bg-flow-player/10 text-flow-player'
                : 'border-creator-highlight/40 bg-creator-highlight/10 text-creator-highlight',
              compact ? 'max-w-24 text-[9px]' : 'max-w-32 text-[10px]',
            )}
          >
            {signature ? 'Signature' : type}
          </span>
        ) : null}
      </header>

      <div className={cn('border-t border-zinc-800', compact ? 'mb-2' : 'mb-3')} />

      <div className={cn('grid', compact ? 'gap-2' : 'gap-4')}>
        <KeywordPills keywords={ability.keywords} compact={compact} />
        <ActionBlock ability={ability} compact={compact} />
        {ability.powerRolls?.map((powerRoll, index) => (
          <PowerRollBlock key={`${powerRoll.roll ?? 'roll'}-${index}`} powerRoll={powerRoll} compact={compact} />
        ))}
        <EffectsBlock effects={ability.effects} compact={compact} />
      </div>
    </Component>
  );
}
