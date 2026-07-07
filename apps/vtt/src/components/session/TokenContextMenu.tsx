import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import {
  Minus,
  Plus,
  X,
  Swords,
  Zap,
  Hand,
  Wind,
  ArrowUpFromLine,
  Unlink,
  HeartPulse,
  Shield,
} from 'lucide-react';
import { StaminaBar, Badge, Button } from '@anvil/ui';
import type { EntityData, ClientMessage, TokenActionKind } from '../../types/protocol.js';
import { AbilityBlock } from '../drawsteel/AbilityBlock.js';
import { drawSteelAbilityFromLike, type DrawSteelAbilityView } from '../drawsteel/abilityData.js';
import type { PendingTargetedAction, TargetedActionKind } from '../../lib/targeting.js';

/** Condition emojis for Draw Steel's 9 conditions */
const CONDITION_EMOJIS: Record<string, string> = {
  bleeding: '\u{1FA78}',
  dazed: '\u{1F4AB}',
  frightened: '\u{1F628}',
  grabbed: '\u{270A}',
  prone: '\u{1F53B}',
  restrained: '⛓️',
  slowed: '\u{1F40C}',
  taunted: '\u{1F624}',
  weakened: '\u{1F494}',
};

const ALL_CONDITION_IDS = Object.keys(CONDITION_EMOJIS);

/** Entity type → display badge color */
const TYPE_BADGE_COLORS: Record<string, string> = {
  hero: 'bg-blue-900/60 text-blue-300',
  monster: 'bg-red-900/60 text-red-300',
  npc: 'bg-purple-900/60 text-purple-300',
};

type ActionCategory = 'main' | 'maneuver' | 'triggered' | 'free';

const CATEGORY_ORDER: ActionCategory[] = ['main', 'maneuver', 'triggered', 'free'];
const CATEGORY_LABELS: Record<ActionCategory, string> = {
  main: 'Main Action',
  maneuver: 'Maneuvers',
  triggered: 'Triggered Actions',
  free: 'Free Actions',
};

/** Map a raw ability/usage string onto Draw Steel's turn-economy buckets. */
function normalizeActionCategory(actionType?: string): ActionCategory {
  const v = (actionType ?? '').toLowerCase();
  if (v.includes('maneuver')) return 'maneuver';
  if (v.includes('trigger')) return 'triggered';
  if (v.includes('free')) return 'free';
  if (v === 'move') return 'maneuver';
  return 'main';
}

/** A target-picking ability is anything with a distance that isn't self-only. */
function isTargetedDistance(distance: string | undefined): boolean {
  return Boolean(distance && !/self/i.test(distance));
}

interface MonsterFeature {
  name: string;
  feature_type: string;
  ability_type?: string;
  cost?: string;
  usage?: string;
  distance?: string;
  target?: string;
  keywords?: string[];
  effects?: Array<{
    roll?: string;
    tier1?: string;
    tier2?: string;
    tier3?: string;
    effect?: string;
    cost?: string;
  }>;
}

/** A normalized, renderable action the actor token can take. */
interface AbilityEntry {
  key: string;
  name: string;
  distance: string;
  category: ActionCategory;
  view: DrawSteelAbilityView;
}

interface StandardAction {
  label: string;
  icon: ReactNode;
  kind: TokenActionKind;
  category: ActionCategory;
  targeted: boolean;
  distance?: string;
}

export interface TokenContextMenuProps {
  entity: EntityData;
  x: number;
  y: number;
  isDirector: boolean;
  /** The requesting player's own hero entity id (enables acting on that token). */
  ownHeroEntityId?: string | null;
  send: (msg: ClientMessage) => void;
  /** Begin on-canvas targeting for a targeted action (ability / strike / maneuver). */
  onRequestTargeting?: (action: PendingTargetedAction) => void;
  onClose: () => void;
}

/**
 * Right-click context menu for a token on the battle canvas. The right-clicked
 * token is the actor: its abilities/features and the standard Draw Steel actions
 * are grouped by turn economy (Main / Maneuver / Triggered / Free). Targeted
 * actions start on-canvas targeting; self actions fire immediately. The Director
 * can also track HP and toggle conditions.
 */
export function TokenContextMenu({
  entity,
  x,
  y,
  isDirector,
  ownHeroEntityId,
  send,
  onRequestTargeting,
  onClose,
}: TokenContextMenuProps) {
  const [damageInput, setDamageInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const maxStamina = typeof entity['maxStamina'] === 'number' ? (entity['maxStamina'] as number) : 0;
  const currentStamina = typeof entity['currentStamina'] === 'number' ? (entity['currentStamina'] as number) : maxStamina;
  const level = typeof entity['level'] === 'number' ? (entity['level'] as number) : 1;
  const conditions = useMemo(
    () => (Array.isArray(entity['conditions']) ? (entity['conditions'] as string[]) : []),
    [entity],
  );
  const isHero = entity.type === 'hero';

  // The requester may act with this token if they're the Director or it's their
  // own hero. Otherwise the action list is shown read-only (reference).
  const canAct = isDirector || (ownHeroEntityId != null && entity.id === ownHeroEntityId);

  // The actor's own abilities (heroes) / features (monsters), grouped by economy.
  const abilityEntries = useMemo<AbilityEntry[]>(() => {
    const raw: Array<Record<string, unknown>> = isHero
      ? (Array.isArray(entity['abilities']) ? (entity['abilities'] as Record<string, unknown>[]) : [])
      : (Array.isArray(entity['features'])
          ? (entity['features'] as MonsterFeature[]).filter(
              (f) => f.feature_type === 'ability',
            ) as unknown as Record<string, unknown>[]
          : []);
    return raw.map((item) => {
      const view = drawSteelAbilityFromLike(item as Parameters<typeof drawSteelAbilityFromLike>[0]);
      const id = typeof item['id'] === 'string' ? (item['id'] as string) : undefined;
      const name = typeof item['name'] === 'string' ? (item['name'] as string) : undefined;
      const distance = typeof item['distance'] === 'string' ? (item['distance'] as string) : undefined;
      const usage =
        (typeof item['actionType'] === 'string' ? (item['actionType'] as string) : undefined) ??
        (typeof item['usage'] === 'string' ? (item['usage'] as string) : undefined);
      return {
        key: id ?? name ?? view.name,
        name: view.name,
        distance: distance ?? view.distance ?? '',
        category: normalizeActionCategory(usage ?? view.usage),
        view,
      };
    });
  }, [entity, isHero]);

  // Standard Draw Steel actions available to the actor, gated by state.
  const standardActions = useMemo<StandardAction[]>(() => {
    const list: StandardAction[] = [
      { label: 'Free Strike', icon: <Swords className="size-3.5 text-zinc-300" />, kind: 'free-strike', category: 'main', targeted: true, distance: 'Melee 1' },
      { label: 'Charge', icon: <Zap className="size-3.5 text-red-400" />, kind: 'charge', category: 'main', targeted: true, distance: 'Melee 1' },
      { label: 'Grab', icon: <Hand className="size-3.5 text-amber-400" />, kind: 'grab', category: 'maneuver', targeted: true, distance: 'Melee 1' },
      { label: 'Knockback', icon: <Wind className="size-3.5 text-sky-400" />, kind: 'knockback', category: 'maneuver', targeted: true, distance: 'Melee 1' },
    ];
    if (conditions.includes('prone')) {
      list.push({ label: 'Stand Up', icon: <ArrowUpFromLine className="size-3.5 text-emerald-400" />, kind: 'stand-up', category: 'maneuver', targeted: false });
    }
    if (conditions.includes('grabbed') || conditions.includes('restrained')) {
      list.push({ label: 'Escape Grab', icon: <Unlink className="size-3.5 text-emerald-400" />, kind: 'escape-grab', category: 'maneuver', targeted: false });
    }
    if (isHero) {
      list.push({ label: 'Catch Breath', icon: <HeartPulse className="size-3.5 text-emerald-400" />, kind: 'catch-breath', category: 'maneuver', targeted: false });
      list.push({ label: 'Defend', icon: <Shield className="size-3.5 text-blue-400" />, kind: 'defend', category: 'main', targeted: false });
    }
    return list;
  }, [conditions, isHero]);

  // Click-outside to close (left-click only — right-click reopens via canvas)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDamage = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      send({ type: 'token_action', action: { kind: 'manual-damage', targetId: entity.id, amount } });
    },
    [send, entity.id],
  );

  const handleHeal = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      send({ type: 'token_action', action: { kind: 'manual-heal', targetId: entity.id, amount } });
    },
    [send, entity.id],
  );

  const handleToggleCondition = useCallback(
    (conditionId: string) => {
      const has = conditions.includes(conditionId);
      send({
        type: 'token_action',
        action: {
          kind: has ? 'remove-condition' : 'apply-condition',
          targetId: entity.id,
          condition: conditionId,
        },
      });
    },
    [send, entity.id, conditions],
  );

  const runStandard = useCallback(
    (action: StandardAction) => {
      if (!canAct) return;
      if (action.targeted) {
        onRequestTargeting?.({
          sourceId: entity.id,
          kind: action.kind as TargetedActionKind,
          label: action.label,
          distance: action.distance ?? 'Melee 1',
        });
      } else {
        send({ type: 'token_action', action: { kind: action.kind, sourceId: entity.id, targetId: entity.id } });
      }
      onClose();
    },
    [canAct, entity.id, onClose, onRequestTargeting, send],
  );

  const runAbility = useCallback(
    (ability: AbilityEntry) => {
      if (!canAct) return;
      if (isTargetedDistance(ability.distance)) {
        onRequestTargeting?.({
          sourceId: entity.id,
          kind: 'ability',
          abilityId: ability.key,
          label: ability.name,
          distance: ability.distance,
        });
      } else {
        send({
          type: 'token_action',
          action: { kind: 'ability', sourceId: entity.id, targetId: entity.id, abilityId: ability.key },
        });
      }
      onClose();
    },
    [canAct, entity.id, onClose, onRequestTargeting, send],
  );

  const handleQuickDamageHeal = () => {
    const val = parseInt(damageInput, 10);
    if (!val || val === 0) return;
    if (val > 0) handleDamage(val);
    else handleHeal(Math.abs(val));
    setDamageInput('');
  };

  const hasActions = abilityEntries.length > 0 || (canAct && standardActions.length > 0);

  // Clamp position to viewport so menu doesn't overflow off-screen
  const menuWidth = 260;
  const menuHeight = hasActions ? 520 : 260;
  const clampedX = Math.min(Math.max(8, x), window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(Math.max(8, y), window.innerHeight - menuHeight - 8);

  const badgeColor = TYPE_BADGE_COLORS[entity.type] ?? TYPE_BADGE_COLORS['npc'];

  return (
    <div
      ref={menuRef}
      className="absolute z-40 flex max-h-[520px] w-[260px] flex-col overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{entity.name}</p>
          <div className="flex items-center gap-1.5">
            <span className={`inline-block rounded px-1 py-0.5 text-[10px] font-medium ${badgeColor}`}>
              {entity.type}
            </span>
            <Badge variant="secondary" className="px-1 py-0 text-[10px]">
              Lv{level}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-zinc-500 hover:text-zinc-300"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Stamina bar */}
        {maxStamina > 0 && (
          <div className="px-3 pt-2">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-medium text-zinc-500">Stamina</span>
              <span className="text-[10px] text-zinc-400">
                {currentStamina} / {maxStamina}
              </span>
            </div>
            <StaminaBar current={currentStamina} max={maxStamina} className="h-2" />
          </div>
        )}

        {/* Quick damage/heal row (director) */}
        {isDirector && (
          <div className="flex items-center gap-1 px-3 py-2">
            <Button variant="ghost" size="icon" className="size-6" onClick={() => handleDamage(1)} title="1 damage">
              <Minus className="size-3 text-red-400" />
            </Button>
            <input
              type="number"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickDamageHeal();
              }}
              placeholder="+/- HP"
              className="h-6 flex-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-center text-xs text-zinc-200 placeholder:text-zinc-600"
            />
            <Button variant="ghost" size="icon" className="size-6" onClick={() => handleHeal(1)} title="1 heal">
              <Plus className="size-3 text-emerald-400" />
            </Button>
          </div>
        )}

        {/* Actions — abilities + standard actions grouped by turn economy */}
        {hasActions && (
          <div className="border-t border-zinc-800/50 px-3 py-2">
            {!canAct && (
              <p className="mb-2 rounded bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-500">
                Reference only — you don't control this token.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {CATEGORY_ORDER.map((category) => {
                const standards = canAct
                  ? standardActions.filter((a) => a.category === category)
                  : [];
                const abilities = abilityEntries.filter((a) => a.category === category);
                if (standards.length === 0 && abilities.length === 0) return null;
                return (
                  <section key={category} className="flex flex-col gap-1.5">
                    <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    {standards.length > 0 && (
                      <div className="grid grid-cols-2 gap-1">
                        {standards.map((action) => (
                          <Button
                            key={action.label}
                            variant="ghost"
                            size="sm"
                            className="h-auto flex-col gap-0.5 py-1.5 text-[10px] text-zinc-300"
                            title={action.targeted ? `${action.label} — pick a target` : action.label}
                            onClick={() => runStandard(action)}
                          >
                            {action.icon} {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    {abilities.map((ability) => (
                      <AbilityBlock
                        key={ability.key}
                        ability={ability.view}
                        compact
                        disabled={!canAct}
                        onClick={() => runAbility(ability)}
                      />
                    ))}
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {/* Condition toggles (director) */}
        {isDirector && (
          <div className="border-t border-zinc-800/50 px-3 py-2">
            <p className="mb-1 text-[10px] font-medium text-zinc-500">Conditions</p>
            <div className="flex flex-wrap gap-1">
              {ALL_CONDITION_IDS.map((id) => {
                const active = conditions.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleToggleCondition(id)}
                    title={id}
                    className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                      active
                        ? 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-600/50'
                        : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {CONDITION_EMOJIS[id]} {id.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
