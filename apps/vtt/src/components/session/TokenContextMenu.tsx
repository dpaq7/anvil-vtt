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
  Crosshair,
  ChevronRight,
} from 'lucide-react';
import { StaminaBar, Badge, Button } from '@anvil/ui';
import type { EntityData, ClientMessage, TokenActionKind } from '../../types/protocol.js';
import type { ConditionName } from '@anvil/types';
import { drawSteelAbilityFromLike, type DrawSteelAbilityView } from '../drawsteel/abilityData.js';
import type { PendingTargetedAction, TargetedActionKind } from '../../lib/targeting.js';
import {
  readConditions,
  defaultEndType,
  endTypeLabel,
  CONDITION_IDS,
  type ConditionEndType,
} from '../../lib/conditions.js';

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
  const conditionObjects = useMemo(() => readConditions(entity), [entity]);
  const conditions = useMemo(() => conditionObjects.map((c) => c.name), [conditionObjects]);
  const isHero = entity.type === 'hero';

  // Stamina-derived states (Draw Steel): winded at ≤ half, dying at ≤ 0.
  const dying = maxStamina > 0 && currentStamina <= 0;
  const winded = maxStamina > 0 && currentStamina > 0 && currentStamina <= maxStamina / 2;

  // Add-condition form state (end type defaults to the condition's natural rule).
  const [addCondition, setAddCondition] = useState<ConditionName>('bleeding');
  const [addEndType, setAddEndType] = useState<ConditionEndType>('save');

  // Which category flyout is open (start-menu style nesting keeps the top level
  // compact and off the screen edges).
  const [openPanel, setOpenPanel] = useState<'actions' | 'status' | 'hp' | null>(null);

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

  const applyStatus = useCallback(
    (condition: ConditionName, endType: ConditionEndType) => {
      send({
        type: 'token_action',
        action: { kind: 'apply-condition', targetId: entity.id, condition, endType },
      });
    },
    [send, entity.id],
  );

  const removeStatus = useCallback(
    (condition: string) => {
      send({
        type: 'token_action',
        action: { kind: 'remove-condition', targetId: entity.id, condition },
      });
    },
    [send, entity.id],
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

  // Compact top level + a flyout panel beside it. Flip the flyout left when it
  // would overrun the right edge; the flyout scrolls so it never runs off-screen.
  const TOP_W = 190;
  const FLYOUT_W = 244;
  const flipLeft = x + TOP_W + FLYOUT_W + 16 > window.innerWidth;
  const totalW = openPanel ? TOP_W + FLYOUT_W + 8 : TOP_W;
  const clampedX = Math.min(Math.max(8, x), Math.max(8, window.innerWidth - totalW - 8));
  const clampedY = Math.min(Math.max(8, y), Math.max(8, window.innerHeight - 140));

  const badgeColor = TYPE_BADGE_COLORS[entity.type] ?? TYPE_BADGE_COLORS['npc'];

  const categoryRow = (id: 'actions' | 'status' | 'hp', label: string, Icon: typeof Swords) => (
    <button
      type="button"
      onClick={() => setOpenPanel((p) => (p === id ? null : id))}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition ${
        openPanel === id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-800/60'
      }`}
    >
      <Icon className="size-3.5 shrink-0 text-zinc-400" />
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight className="size-3.5 shrink-0 text-zinc-500" />
    </button>
  );

  return (
    <div
      ref={menuRef}
      className={`absolute z-40 flex items-start gap-1 ${flipLeft ? 'flex-row-reverse' : ''}`}
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Top level — compact */}
      <div className="flex w-[190px] flex-col overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
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
          {isDirector && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0 text-zinc-500 hover:text-amber-300"
              title="Pull everyone's view here"
              onClick={() => {
                send({ type: 'director_focus', entityId: entity.id });
                onClose();
              }}
            >
              <Crosshair className="size-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 text-zinc-500 hover:text-zinc-300"
            onClick={onClose}
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {maxStamina > 0 && (
          <div className="px-3 pt-2">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] font-medium text-zinc-500">Stamina</span>
              <span className="text-[10px] text-zinc-400">
                {currentStamina} / {maxStamina}
              </span>
            </div>
            <StaminaBar current={currentStamina} max={maxStamina} className="h-2" />
            {(dying || winded) && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {dying && (
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-red-300 ring-1 ring-red-500/40">
                    💀 Dying
                  </span>
                )}
                {winded && !dying && (
                  <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300 ring-1 ring-orange-500/40">
                    🫁 Winded
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-0.5 p-1.5">
          {hasActions && categoryRow('actions', 'Actions', Swords)}
          {categoryRow('status', 'Status', HeartPulse)}
          {isDirector && categoryRow('hp', 'Adjust HP', Plus)}
        </div>
      </div>

      {/* Flyout panel */}
      {openPanel && (
        <div className="max-h-[70vh] w-[244px] overflow-y-auto rounded-lg border border-zinc-700/60 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-sm">
          {openPanel === 'actions' && (
            <div className="flex flex-col gap-3">
              {!canAct && (
                <p className="rounded bg-zinc-800/60 px-2 py-1 text-[10px] text-zinc-500">
                  Reference only — you don't control this token.
                </p>
              )}
              {CATEGORY_ORDER.map((category) => {
                const standards = canAct ? standardActions.filter((a) => a.category === category) : [];
                const abilities = abilityEntries.filter((a) => a.category === category);
                if (standards.length === 0 && abilities.length === 0) return null;
                return (
                  <section key={category} className="flex flex-col gap-0.5">
                    <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    {standards.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => runStandard(action)}
                        title={action.targeted ? `${action.label} — pick a target` : action.label}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-zinc-300 hover:bg-zinc-800/60"
                      >
                        {action.icon}
                        <span className="flex-1 truncate">{action.label}</span>
                        {action.targeted && <span className="shrink-0 text-[9px] text-zinc-500">target</span>}
                      </button>
                    ))}
                    {abilities.map((ability) => (
                      <button
                        key={ability.key}
                        type="button"
                        disabled={!canAct}
                        onClick={() => runAbility(ability)}
                        title={ability.name}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[11px] text-zinc-200 hover:bg-zinc-800/60 disabled:opacity-50 disabled:hover:bg-transparent"
                      >
                        <span className="flex-1 truncate">{ability.name}</span>
                        {ability.distance && (
                          <span className="shrink-0 text-[9px] text-zinc-500">{ability.distance}</span>
                        )}
                      </button>
                    ))}
                  </section>
                );
              })}
            </div>
          )}

          {openPanel === 'status' && (
            <div className="flex flex-col gap-2">
              <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Status</h3>
              {conditionObjects.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {conditionObjects.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center gap-1.5 rounded bg-zinc-800/50 px-1.5 py-1 text-[11px]"
                    >
                      <span>{CONDITION_EMOJIS[c.name] ?? '•'}</span>
                      <span className="capitalize text-zinc-200">{c.name}</span>
                      <span
                        className={`rounded px-1 text-[9px] ${
                          c.endType === 'save'
                            ? 'bg-amber-500/15 text-amber-300'
                            : c.endType === 'eot'
                              ? 'bg-sky-500/15 text-sky-300'
                              : 'bg-zinc-700/60 text-zinc-400'
                        }`}
                      >
                        {endTypeLabel(c.endType)}
                      </span>
                      {canAct && (
                        <button
                          type="button"
                          className="ml-auto text-zinc-500 hover:text-red-400"
                          title={`Remove ${c.name}`}
                          onClick={() => removeStatus(c.name)}
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-600">No conditions.</p>
              )}
              {canAct && (
                <div className="flex items-center gap-1">
                  <select
                    value={addCondition}
                    onChange={(e) => {
                      const next = e.target.value as ConditionName;
                      setAddCondition(next);
                      setAddEndType(defaultEndType(next));
                    }}
                    className="h-7 min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-1 text-[11px] capitalize text-zinc-100"
                  >
                    {CONDITION_IDS.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <select
                    value={addEndType}
                    onChange={(e) => setAddEndType(e.target.value as ConditionEndType)}
                    className="h-7 rounded border border-zinc-700 bg-zinc-950 px-1 text-[10px] text-zinc-100"
                    title="How the condition ends"
                  >
                    <option value="save">save 6+</option>
                    <option value="eot">end turn</option>
                    <option value="manual">manual</option>
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => applyStatus(addCondition, addEndType)}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          )}

          {openPanel === 'hp' && isDirector && (
            <div className="flex flex-col gap-2">
              <h3 className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Adjust HP</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDamage(1)} title="1 damage">
                  <Minus className="size-3.5 text-red-400" />
                </Button>
                <input
                  type="number"
                  value={damageInput}
                  onChange={(e) => setDamageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickDamageHeal();
                  }}
                  placeholder="+/- HP"
                  className="h-7 flex-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-center text-xs text-zinc-200 placeholder:text-zinc-600"
                />
                <Button variant="ghost" size="icon" className="size-7" onClick={() => handleHeal(1)} title="1 heal">
                  <Plus className="size-3.5 text-emerald-400" />
                </Button>
              </div>
              <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={handleQuickDamageHeal}>
                Apply
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
