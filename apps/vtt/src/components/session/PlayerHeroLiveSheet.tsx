import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  Dumbbell,
  Feather,
  Footprints,
  HeartPulse,
  Medal,
  Shield,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Zap,
} from 'lucide-react';
import { Badge, Button, cn } from '@anvil/ui';
import { GameData, HeroLogic } from '@anvil/data';
import type { CharacteristicId, EntityData } from '../../types/protocol.js';

type RollCharacteristicHandler = (label: string, modifier: number) => void;

interface PlayerHeroCommandBarProps {
  hero: EntityData | null;
  combatActive: boolean;
  onCatchBreath: () => void;
  onRollCharacteristic: RollCharacteristicHandler;
  onRollResource: () => void;
  onOpenSheet: () => void;
}

interface PlayerHeroSheetPanelProps {
  hero: EntityData | null;
  combatActive: boolean;
  isMyTurn: boolean;
  abilityCount: number;
  onRollCharacteristic: RollCharacteristicHandler;
  onRollResource: () => void;
  onCatchBreath: () => void;
  onDefend: () => void;
  onStandUp: () => void;
  onEscapeGrab: () => void;
  onOpenAbilities: () => void;
}

type CharacteristicConfig = {
  key: CharacteristicId;
  short: string;
  label: string;
  Icon: LucideIcon;
};

type CultureEntry = {
  label: string;
  name: string;
  effect: string | null;
  skills: string[];
};

type ResolvedSkill = {
  id: string;
  name: string;
  group: string;
  description: string | null;
};

const CHARACTERISTICS: CharacteristicConfig[] = [
  { key: 'might', short: 'MIG', label: 'Might', Icon: Dumbbell },
  { key: 'agility', short: 'AGI', label: 'Agility', Icon: Feather },
  { key: 'reason', short: 'REA', label: 'Reason', Icon: Brain },
  { key: 'intuition', short: 'INT', label: 'Intuition', Icon: Sparkles },
  { key: 'presence', short: 'PRE', label: 'Presence', Icon: Star },
];

const CULTURE_FIELDS: Array<{
  key: 'environment' | 'organization' | 'upbringing';
  label: string;
}> = [
  { key: 'environment', label: 'Environment' },
  { key: 'organization', label: 'Organization' },
  { key: 'upbringing', label: 'Upbringing' },
];

const SKILL_GROUP_LABELS: Record<string, string> = {
  crafting: 'Crafting',
  exploration: 'Exploration',
  interpersonal: 'Interpersonal',
  intrigue: 'Intrigue',
  lore: 'Lore',
  other: 'Other',
};

export function PlayerHeroCommandBar({
  hero,
  combatActive,
  onCatchBreath,
  onRollCharacteristic,
  onRollResource,
  onOpenSheet,
}: PlayerHeroCommandBarProps) {
  const name = getString(hero, 'name') ?? 'Hero';
  const className = resolveClassName(hero);
  const level = getNumber(hero, 'level', 1);
  const currentStamina = getNumber(hero, 'currentStamina', 0);
  const maxStamina = getNumber(hero, 'maxStamina', currentStamina);
  const recoveriesCurrent = getNumber(hero, 'recoveriesCurrent', 0);
  const recoveriesMax = getNumber(hero, 'recoveriesMax', recoveriesCurrent);
  const heroicResource = getNumber(hero, 'heroicResource', 0);
  const resourceName = getString(hero, 'heroicResourceName') ?? 'Resource';
  const victories = getNumber(hero, 'victories', 0);
  const xp = getNumber(hero, 'xp', 0);
  const useCatchBreath = combatActive ? onCatchBreath : onOpenSheet;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 pr-1">
      <button
        type="button"
        className="flex h-9 min-w-44 shrink-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-2 text-left transition hover:border-cyan-700/70 hover:bg-zinc-900"
        onClick={onOpenSheet}
        title="Open character sheet"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded border border-cyan-800/60 bg-cyan-950/20 text-sm font-black text-cyan-100">
          {name[0]?.toUpperCase() ?? '?'}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-zinc-100">{name}</span>
          <span className="block truncate text-[10px] text-zinc-500">
            L{level} {className ?? 'Hero'}
          </span>
        </span>
      </button>

      <CommandTile
        Icon={HeartPulse}
        label="Stamina"
        value={`${currentStamina}/${maxStamina}`}
        accent="text-rose-300"
        onClick={useCatchBreath}
        title={combatActive ? 'Catch Breath' : 'Open sheet'}
      />
      <CommandTile
        Icon={Activity}
        label="Recoveries"
        value={`${recoveriesCurrent}/${recoveriesMax}`}
        accent="text-emerald-300"
        onClick={useCatchBreath}
        title={combatActive ? 'Catch Breath' : 'Open sheet'}
      />
      <CommandTile
        Icon={Zap}
        label={resourceName}
        value={String(heroicResource)}
        accent="text-amber-300"
        onClick={onRollResource}
        disabled={!hero}
        title={`Roll ${resourceName}`}
      />
      <CommandTile
        Icon={Trophy}
        label="Victories"
        value={`${victories}/${xp}`}
        accent="text-cyan-300"
        onClick={onOpenSheet}
        title="Open progression"
      />
      <CommandTile
        Icon={Medal}
        label="Level"
        value={`L${level}`}
        accent="text-violet-300"
        onClick={onOpenSheet}
        title="Open progression"
      />

      <div className="flex h-9 shrink-0 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950/40 px-1">
        {CHARACTERISTICS.map(({ key, short, label, Icon }) => {
          const value = getNumber(hero, key, 0);
          return (
            <button
              key={key}
              type="button"
              className="flex h-7 min-w-12 items-center justify-center gap-1 rounded px-1.5 text-[10px] text-zinc-400 transition hover:bg-zinc-800 hover:text-cyan-100 disabled:opacity-50"
              disabled={!hero}
              onClick={() => onRollCharacteristic(label, value)}
              title={`Roll ${label}`}
            >
              <Icon className="size-3 text-cyan-400" />
              <span className="font-semibold">{short}</span>
              <span className="font-mono text-zinc-100">{formatModifier(value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PlayerHeroSheetPanel({
  hero,
  combatActive,
  isMyTurn,
  abilityCount,
  onRollCharacteristic,
  onRollResource,
  onCatchBreath,
  onDefend,
  onStandUp,
  onEscapeGrab,
  onOpenAbilities,
}: PlayerHeroSheetPanelProps) {
  if (!hero) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-xs text-zinc-500">
        No player hero is assigned to this live session.
      </div>
    );
  }

  const name = getString(hero, 'name') ?? 'Hero';
  const ancestryName = resolveAncestryName(hero);
  const className = resolveClassName(hero);
  const classDef = resolveClassDefinition(hero);
  const subclassName = resolveSubclassName(hero, classDef);
  const kitName = resolveKitName(hero);
  const career = resolveCareer(hero);
  const cultureEntries = resolveCultureEntries(hero);
  const skills = resolveSkills(getStringArray(hero, 'skills'));
  const groupedSkills = groupSkills(skills);
  const level = getNumber(hero, 'level', 1);
  const maxStamina = getNumber(hero, 'maxStamina', 0);
  const currentStamina = getNumber(hero, 'currentStamina', maxStamina);
  const recoveriesMax = getNumber(hero, 'recoveriesMax', 0);
  const recoveriesCurrent = getNumber(hero, 'recoveriesCurrent', recoveriesMax);
  const recoveryValue = maxStamina > 0 ? HeroLogic.getRecoveryValue(maxStamina) : null;
  const heroicResource = getNumber(hero, 'heroicResource', 0);
  const resourceName = getString(hero, 'heroicResourceName') ?? 'Resource';
  const victories = getNumber(hero, 'victories', 0);
  const xp = getNumber(hero, 'xp', 0);
  const speed = getNumber(hero, 'speed', 0);
  const conditions = getStringArray(hero, 'conditions');
  const isProne = conditions.includes('prone');
  const isGrabbed = conditions.includes('grabbed') || conditions.includes('restrained');

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-900/60">
      <div className="shrink-0 border-b border-zinc-800 p-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-cyan-800/60 bg-zinc-950 text-lg font-black text-cyan-100">
            {name[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-zinc-100">{name}</p>
            <p className="mt-0.5 text-xs text-zinc-400">
              L{level} {className ?? 'Hero'}{subclassName ? ` / ${subclassName}` : ''}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {[ancestryName, career?.name].filter(Boolean).join(' / ') || 'No identity recorded'}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <RailSection title="Vitals" Icon={HeartPulse}>
          <div className="grid grid-cols-2 gap-2">
            <MetricButton
              label="Stamina"
              value={`${currentStamina}/${maxStamina}`}
              sublabel="catch breath"
              onClick={onCatchBreath}
              disabled={!combatActive}
            />
            <MetricButton
              label="Recoveries"
              value={`${recoveriesCurrent}/${recoveriesMax}`}
              sublabel={recoveryValue === null ? 'recovery' : `${recoveryValue} each`}
              onClick={onCatchBreath}
              disabled={!combatActive}
            />
            <MetricButton
              label={resourceName}
              value={String(heroicResource)}
              sublabel="roll"
              onClick={onRollResource}
            />
            <MetricButton
              label="Victories / XP"
              value={`${victories}/${xp}`}
              sublabel="progress"
            />
            <MetricButton
              label="Speed"
              value={speed > 0 ? String(speed) : '-'}
              sublabel="squares"
            />
            <MetricButton
              label="Abilities"
              value={String(abilityCount)}
              sublabel="open"
              onClick={onOpenAbilities}
              disabled={abilityCount === 0}
            />
          </div>
        </RailSection>

        <RailSection title="Characteristics" Icon={Activity}>
          <div className="grid grid-cols-5 gap-1.5">
            {CHARACTERISTICS.map(({ key, short, label, Icon }) => {
              const value = getNumber(hero, key, 0);
              return (
                <button
                  key={key}
                  type="button"
                  className="rounded border border-zinc-800 bg-zinc-950/50 p-2 text-center transition hover:border-cyan-800 hover:bg-cyan-950/20"
                  onClick={() => onRollCharacteristic(label, value)}
                  title={`Roll ${label}`}
                >
                  <Icon className="mx-auto mb-1 size-3.5 text-cyan-400" />
                  <div className="text-[9px] font-semibold uppercase text-zinc-500">{short}</div>
                  <div className="font-mono text-sm font-bold text-zinc-100">{formatModifier(value)}</div>
                </button>
              );
            })}
          </div>
        </RailSection>

        <RailSection title="Live Actions" Icon={Swords}>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 justify-start gap-1.5 text-xs"
              onClick={onCatchBreath}
              disabled={!combatActive || !isMyTurn}
              title="Spend a recovery to regain stamina"
            >
              <HeartPulse className="size-3.5 text-emerald-300" />
              Catch Breath
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 justify-start gap-1.5 text-xs"
              onClick={onDefend}
              disabled={!combatActive || !isMyTurn}
              title="Spend your main action to defend"
            >
              <Shield className="size-3.5 text-blue-300" />
              Defend
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 justify-start gap-1.5 text-xs"
              onClick={onStandUp}
              disabled={!combatActive || !isMyTurn || !isProne}
              title="Use a maneuver to stand up"
            >
              <Footprints className="size-3.5 text-amber-300" />
              Stand Up
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 justify-start gap-1.5 text-xs"
              onClick={onEscapeGrab}
              disabled={!combatActive || !isMyTurn || !isGrabbed}
              title="Use a maneuver to escape a grab"
            >
              <Zap className="size-3.5 text-violet-300" />
              Escape
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {conditions.length > 0 ? (
              conditions.map((condition) => (
                <Badge key={condition} variant="destructive" className="text-[10px] capitalize">
                  {condition}
                </Badge>
              ))
            ) : (
              <span className="text-[11px] text-zinc-600">No active conditions.</span>
            )}
          </div>
        </RailSection>

        <RailSection title="Class & Kit" Icon={Award}>
          <DetailRow label="Class" value={className} />
          <DetailRow label="Role" value={classDef?.role ?? null} />
          <DetailRow label="Subclass" value={subclassName} />
          <DetailRow label="Kit" value={kitName} />
          <DetailRow label="Primary" value={classDef?.primaryCharacteristic ?? null} />
          <DetailRow label="Potency" value={classDef?.potencyCharacteristic ?? null} />
          {classDef?.description && (
            <p className="mt-2 rounded border border-zinc-800 bg-zinc-950/40 p-2 text-[11px] leading-relaxed text-zinc-400">
              {classDef.description}
            </p>
          )}
          {classDef?.levelProgression && (
            <div className="mt-2 space-y-1.5">
              {classDef.levelProgression
                .filter((row) => row.level <= level)
                .slice(-3)
                .map((row) => (
                  <div key={row.level} className="rounded border border-zinc-800 bg-zinc-950/30 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Level {row.level}</span>
                      <span className="text-[10px] text-cyan-300">{row.abilities}</span>
                    </div>
                    {row.features.length > 0 && (
                      <p className="mt-1 text-[11px] leading-snug text-zinc-300">{row.features.join(', ')}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </RailSection>

        <RailSection title="Skills" Icon={BookOpen}>
          {skills.length > 0 ? (
            <div className="space-y-2">
              {Object.entries(groupedSkills).map(([group, groupSkills]) => (
                groupSkills.length > 0 && (
                  <div key={group}>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {SKILL_GROUP_LABELS[group] ?? titleCaseId(group)}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {groupSkills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="rounded text-[10px]" title={skill.description ?? undefined}>
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <EmptyText>No trained skills recorded.</EmptyText>
          )}
          {(career || cultureEntries.length > 0) && (
            <div className="mt-3 space-y-1.5 border-t border-zinc-800 pt-2">
              {career && (
                <SourceNote
                  label={`Career: ${career.name}`}
                  value={career.skills.join(', ') || '-'}
                  description={career.description}
                />
              )}
              {cultureEntries.map((entry) => (
                <SourceNote
                  key={`${entry.label}-${entry.name}`}
                  label={`${entry.label}: ${entry.name}`}
                  value={entry.skills.join(', ') || '-'}
                  description={entry.effect ?? undefined}
                />
              ))}
            </div>
          )}
        </RailSection>
      </div>
    </div>
  );
}

function CommandTile({
  Icon,
  label,
  value,
  accent,
  onClick,
  title,
  disabled = false,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="flex h-9 min-w-24 shrink-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 px-2 text-left transition hover:border-cyan-800/70 hover:bg-zinc-900 disabled:opacity-50"
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      <Icon className={cn('size-4 shrink-0', accent)} />
      <span className="min-w-0">
        <span className="block truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
        <span className="block font-mono text-xs font-bold text-zinc-100">{value}</span>
      </span>
    </button>
  );
}

function RailSection({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="mb-2 flex items-center gap-2 border-b border-zinc-800 pb-2">
        <Icon className="size-3.5 text-cyan-400" />
        <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function MetricButton({
  label,
  value,
  sublabel,
  onClick,
  disabled = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="rounded border border-zinc-800 bg-zinc-900/70 p-2 text-left transition hover:border-cyan-800 hover:bg-cyan-950/20 disabled:opacity-50"
      onClick={onClick}
      disabled={disabled || !onClick}
    >
      <div className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 font-mono text-sm font-bold text-zinc-100">{value}</div>
      {sublabel && <div className="mt-0.5 truncate text-[10px] text-zinc-500">{sublabel}</div>}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-800/60 py-1.5 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="min-w-0 text-right text-xs text-zinc-200">{value || '-'}</span>
    </div>
  );
}

function SourceNote({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-[11px] text-zinc-200">{value}</div>
      {description && <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-zinc-500">{description}</p>}
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/30 p-2 text-[11px] text-zinc-600">
      {children}
    </div>
  );
}

function getString(hero: EntityData | null | undefined, key: string): string | null {
  const value = hero?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getNumber(hero: EntityData | null | undefined, key: string, fallback: number): number {
  const value = hero?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getStringArray(hero: EntityData | null | undefined, key: string): string[] {
  const value = hero?.[key];
  return stringArray(value);
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch {
    // Fall through to comma-separated text.
  }
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function titleCaseId(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function resolveClassDefinition(hero: EntityData | null) {
  const heroClass = getString(hero, 'heroClass');
  if (!heroClass) return null;
  return GameData.getAllClasses().find((candidate) => candidate.id === heroClass) ?? null;
}

function resolveClassName(hero: EntityData | null): string | null {
  const heroClass = getString(hero, 'heroClass');
  if (!heroClass) return null;
  return resolveClassDefinition(hero)?.name ?? titleCaseId(heroClass);
}

function resolveSubclassName(hero: EntityData | null, classDef: ReturnType<typeof resolveClassDefinition>): string | null {
  const subclass = getString(hero, 'subclass');
  if (!subclass) return null;
  return classDef?.subclasses.find((candidate) => candidate.id === subclass)?.name ?? titleCaseId(subclass);
}

function resolveAncestryName(hero: EntityData | null): string | null {
  const ancestryId = getString(hero, 'ancestry');
  if (!ancestryId) return null;
  return GameData.getAncestry(ancestryId)?.name ?? titleCaseId(ancestryId);
}

function resolveKitName(hero: EntityData | null): string | null {
  const kitId = getString(hero, 'kit');
  if (!kitId) return null;
  return GameData.getKit(kitId)?.name ?? titleCaseId(kitId);
}

function resolveCareer(hero: EntityData | null) {
  const careerId = getString(hero, 'career');
  if (!careerId) return null;
  return GameData.getCareer(careerId) ?? {
    id: careerId,
    name: titleCaseId(careerId),
    description: undefined,
    skills: [],
    languages: [],
    renown: 0,
    wealth: 0,
    projectPoints: 0,
  };
}

function resolveCultureEntries(hero: EntityData | null): CultureEntry[] {
  const raw = hero?.['culture'];
  const selection = parseCultureSelection(raw);
  if (!selection) {
    const fallback = typeof raw === 'string' && raw.trim() && !raw.trim().startsWith('{')
      ? raw.trim()
      : null;
    return fallback
      ? [{ label: 'Culture', name: titleCaseId(fallback), effect: null, skills: [] }]
      : [];
  }

  return CULTURE_FIELDS.flatMap((field) => {
    const cultureId = selection[field.key];
    if (typeof cultureId !== 'string' || !cultureId.trim()) return [];
    const culture = GameData.getCulture(cultureId);
    return [{
      label: field.label,
      name: culture?.name ?? titleCaseId(cultureId),
      effect: culture?.effect ?? null,
      skills: culture?.skills ?? [],
    }];
  });
}

function parseCultureSelection(value: unknown): Record<'environment' | 'organization' | 'upbringing', unknown> | null {
  if (isRecord(value)) {
    return {
      environment: value['environment'],
      organization: value['organization'],
      upbringing: value['upbringing'],
    };
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed)) return null;
    return {
      environment: parsed['environment'],
      organization: parsed['organization'],
      upbringing: parsed['upbringing'],
    };
  } catch {
    return null;
  }
}

function resolveSkills(skillNames: string[]): ResolvedSkill[] {
  return unique(skillNames).map((skillName) => {
    const skill = GameData.getSkill(skillName) ?? GameData.getAllSkills().find((candidate) => slugify(candidate.name) === slugify(skillName));
    return {
      id: slugify(skill?.name ?? skillName),
      name: skill?.name ?? titleCaseId(skillName),
      group: skill?.group ?? 'other',
      description: skill?.description ?? null,
    };
  });
}

function groupSkills(skills: ResolvedSkill[]): Record<string, ResolvedSkill[]> {
  return skills.reduce<Record<string, ResolvedSkill[]>>((groups, skill) => {
    const key = SKILL_GROUP_LABELS[skill.group] ? skill.group : 'other';
    groups[key] = groups[key] ?? [];
    groups[key].push(skill);
    return groups;
  }, { crafting: [], exploration: [], interpersonal: [], intrigue: [], lore: [], other: [] });
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
