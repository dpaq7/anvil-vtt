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
  Skull,
} from 'lucide-react';
import { Button } from '@anvil/ui';
import { cleanName } from '../../lib/faces.js';
import { Meter } from './battle/HeroRow.js';
import { CONDITION_ICONS } from './battle/condition-icons.js';
import { useSessionConnection } from './shell/connection-context.js';
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
  /** The token's width on screen, so a menu that flips left clears the token. */
  tokenWidth?: number;
  stageWidth?: number;
  stageHeight?: number;
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
  tokenWidth = 0,
  stageWidth = window.innerWidth,
  stageHeight = window.innerHeight,
  isDirector,
  ownHeroEntityId,
  send,
  onRequestTargeting,
  onClose,
}: TokenContextMenuProps) {
  const { paused } = useSessionConnection();
  const [damageInput, setDamageInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const maxStamina = typeof entity['maxStamina'] === 'number' ? (entity['maxStamina'] as number) : 0;
  const currentStamina = typeof entity['currentStamina'] === 'number' ? (entity['currentStamina'] as number) : maxStamina;
  const level = typeof entity['level'] === 'number' ? (entity['level'] as number) : 1;
  const conditionObjects = useMemo(() => readConditions(entity), [entity]);
  const conditions = useMemo(() => conditionObjects.map((c) => c.name), [conditionObjects]);
  const isHero = entity.type === 'hero';
  // A Player never reads a creature's stamina, level or stat block (DESIGN.md section 7).
  const creatureForPlayer = !isDirector && !isHero;

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
    if (creatureForPlayer) return [];
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
  }, [entity, isHero, creatureForPlayer]);

  // Standard Draw Steel actions available to the actor, gated by state.
  const standardActions = useMemo<StandardAction[]>(() => {
    const list: StandardAction[] = [
      { label: 'Free Strike', icon: <Swords className="size-3.5" />, kind: 'free-strike', category: 'main', targeted: true, distance: 'Melee 1' },
      { label: 'Charge', icon: <Zap className="size-3.5" />, kind: 'charge', category: 'main', targeted: true, distance: 'Melee 1' },
      { label: 'Grab', icon: <Hand className="size-3.5" />, kind: 'grab', category: 'maneuver', targeted: true, distance: 'Melee 1' },
      { label: 'Knockback', icon: <Wind className="size-3.5" />, kind: 'knockback', category: 'maneuver', targeted: true, distance: 'Melee 1' },
    ];
    if (conditions.includes('prone')) {
      list.push({ label: 'Stand Up', icon: <ArrowUpFromLine className="size-3.5" />, kind: 'stand-up', category: 'maneuver', targeted: false });
    }
    if (conditions.includes('grabbed') || conditions.includes('restrained')) {
      list.push({ label: 'Escape Grab', icon: <Unlink className="size-3.5" />, kind: 'escape-grab', category: 'maneuver', targeted: false });
    }
    if (isHero) {
      list.push({ label: 'Catch Breath', icon: <HeartPulse className="size-3.5" />, kind: 'catch-breath', category: 'maneuver', targeted: false });
      list.push({ label: 'Defend', icon: <Shield className="size-3.5" />, kind: 'defend', category: 'main', targeted: false });
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
      if (amount <= 0 || paused) return;
      send({ type: 'token_action', action: { kind: 'manual-damage', targetId: entity.id, amount } });
    },
    [send, entity.id, paused],
  );

  const handleHeal = useCallback(
    (amount: number) => {
      if (amount <= 0 || paused) return;
      send({ type: 'token_action', action: { kind: 'manual-heal', targetId: entity.id, amount } });
    },
    [send, entity.id, paused],
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
      if (!canAct || paused) return;
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
    [canAct, paused, entity.id, onClose, onRequestTargeting, send],
  );

  const runAbility = useCallback(
    (ability: AbilityEntry) => {
      if (!canAct || paused) return;
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
    [canAct, paused, entity.id, onClose, onRequestTargeting, send],
  );

  const handleQuickDamageHeal = () => {
    const val = parseInt(damageInput, 10);
    if (!val || val === 0 || paused) return;
    if (val > 0) handleDamage(val);
    else handleHeal(Math.abs(val));
    setDamageInput('');
  };

  const hasActions = abilityEntries.length > 0 || (canAct && standardActions.length > 0);

  // Compact top level + a flyout panel beside it. Both flip left when they would run off the stage;
  // the flyout scrolls so it never runs off-screen. x and y are relative to the stage.
  const TOP_W = stageWidth < 720 ? 148 : 178;
  const FLYOUT_W = 244;
  const flipLeft = x + TOP_W + (openPanel ? FLYOUT_W + 6 : 0) > stageWidth - 4;
  const clampedX = Math.max(4, flipLeft ? Math.min(x, stageWidth) - TOP_W - tokenWidth - 16 - (openPanel ? FLYOUT_W + 6 : 0) : x);
  const clampedY = Math.min(Math.max(4, y), Math.max(4, stageHeight - 180));
  // The stage clips what overflows it, so both boxes scroll inside what is left of it.
  const maxHeight = Math.max(120, stageHeight - clampedY - 8);

  const categoryRow = (id: 'actions' | 'status' | 'hp', label: string) => (
    <button
      type="button"
      className="sb-pop__row"
      data-on={openPanel === id || undefined}
      aria-expanded={openPanel === id}
      onClick={() => setOpenPanel((p) => (p === id ? null : id))}
    >
      <span>{label}</span>
      <ChevronRight size={15} strokeWidth={3} aria-hidden="true" />
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="sb-menu"
      data-map-panel
      data-flip={flipLeft || undefined}
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Top level, compact */}
      <div className="sb-pop" style={{ maxHeight }}>
        <div className="flex items-start gap-1">
          <strong className="min-w-0 flex-1 [overflow-wrap:break-word]">{cleanName(entity.name)}</strong>
          <Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label="Close menu" onClick={onClose}>
            <X className="size-3.5" />
          </Button>
        </div>
        {!creatureForPlayer && <div className="sb-note capitalize">{entity.type}, level {level}</div>}

        {maxStamina > 0 && !creatureForPlayer && (
          <>
            <div className="sb-pop__st"><span>Stamina</span><b>{currentStamina} / {maxStamina}</b></div>
            <Meter cur={currentStamina} max={maxStamina} winded={winded} />
            {dying && isHero && (
              <p className="sb-note flex items-center gap-1"><Skull size={13} strokeWidth={3} aria-hidden="true" /><b>Dying</b></p>
            )}
            {winded && (
              <p className="pt-1"><em className="sb-winded ml-0">Winded</em></p>
            )}
          </>
        )}
        {paused && <p className="sb-note">Actions wait until the table is back.</p>}

        <div className="mt-1.5 flex flex-col">
          {hasActions && categoryRow('actions', 'Actions')}
          {categoryRow('status', 'Status')}
          {isDirector && categoryRow('hp', 'Adjust HP')}
          {isDirector && (
            <button
              type="button"
              className="sb-pop__row"
              title="Pull everyone's view here"
              disabled={paused}
              onClick={() => {
                send({ type: 'director_focus', entityId: entity.id });
                onClose();
              }}
            >
              <span>Pull view here</span>
              <Crosshair size={15} strokeWidth={2.6} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Flyout panel */}
      {openPanel && (
        <div className="sb-pop sb-pop--fly" style={{ maxHeight }}>
          {openPanel === 'actions' && (
            <div className="flex flex-col gap-2">
              {!canAct && <p className="sb-note">Reference only. You do not control this token.</p>}
              {CATEGORY_ORDER.map((category) => {
                const standards = canAct ? standardActions.filter((a) => a.category === category) : [];
                const abilities = abilityEntries.filter((a) => a.category === category);
                if (standards.length === 0 && abilities.length === 0) return null;
                return (
                  <section key={category} className="flex flex-col">
                    <h3 className="sb-pop__h3">{CATEGORY_LABELS[category]}</h3>
                    {standards.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        className="sb-pop__row"
                        disabled={paused}
                        onClick={() => runStandard(action)}
                        title={action.targeted ? `${action.label}: pick a target` : action.label}
                      >
                        <span className="flex items-center gap-1.5">{action.icon}{action.label}</span>
                        {action.targeted && <small>target</small>}
                      </button>
                    ))}
                    {abilities.map((ability) => (
                      <button
                        key={ability.key}
                        type="button"
                        className="sb-pop__row"
                        disabled={!canAct || paused}
                        onClick={() => runAbility(ability)}
                        title={ability.name}
                      >
                        <span>{ability.name}</span>
                        {ability.distance && <small>{ability.distance}</small>}
                      </button>
                    ))}
                  </section>
                );
              })}
            </div>
          )}

          {openPanel === 'status' && (
            <div className="flex flex-col gap-2">
              <h3 className="sb-pop__h3">Status</h3>
              {conditionObjects.length > 0 ? (
                <div className="flex flex-col">
                  {conditionObjects.map((c) => {
                    const Icon = CONDITION_ICONS[c.name];
                    return (
                      <div key={c.name} className="sb-pop__row font-normal">
                        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                          {Icon && <Icon size={14} strokeWidth={2.5} aria-hidden="true" />}
                          <b className="capitalize">{c.name}</b>
                          <small>{endTypeLabel(c.endType)}</small>
                        </span>
                        {canAct && (
                          <button type="button" aria-label={`Remove ${c.name}`} title={`Remove ${c.name}`} disabled={paused} onClick={() => removeStatus(c.name)}>
                            <X className="size-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="sb-note">No conditions.</p>
              )}
              {canAct && (
                <div className="flex items-center gap-1">
                  <select
                    aria-label="Condition"
                    value={addCondition}
                    onChange={(e) => {
                      const next = e.target.value as ConditionName;
                      setAddCondition(next);
                      setAddEndType(defaultEndType(next));
                    }}
                    className="h-7 min-w-0 flex-1 bg-raised px-1 capitalize text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]"
                  >
                    {CONDITION_IDS.map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                  <select
                    aria-label="How the condition ends"
                    value={addEndType}
                    onChange={(e) => setAddEndType(e.target.value as ConditionEndType)}
                    className="h-7 w-[74px] bg-raised px-1 text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]"
                    title="How the condition ends"
                  >
                    <option value="save">save 6+</option>
                    <option value="eot">end turn</option>
                    <option value="manual">manual</option>
                  </select>
                  <Button size="sm" variant="secondary" className="h-7 px-2" disabled={paused} onClick={() => applyStatus(addCondition, addEndType)}>
                    {paused ? 'When back' : 'Add'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {openPanel === 'hp' && isDirector && (
            <div className="flex flex-col gap-2">
              <h3 className="sb-pop__h3">Adjust HP</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-7" disabled={paused} onClick={() => handleDamage(1)} title="1 damage" aria-label="1 damage">
                  <Minus className="size-3.5" />
                </Button>
                <input
                  type="number"
                  aria-label="Change in stamina"
                  value={damageInput}
                  onChange={(e) => setDamageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickDamageHeal();
                  }}
                  placeholder="+/- HP"
                  className="h-7 min-w-0 flex-1 bg-raised px-1.5 text-center text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] placeholder:text-text-soft"
                />
                <Button variant="ghost" size="icon" className="size-7" disabled={paused} onClick={() => handleHeal(1)} title="1 heal" aria-label="1 heal">
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <Button size="sm" variant="secondary" className="h-7" disabled={paused} onClick={handleQuickDamageHeal}>
                {paused ? 'Apply, when back' : 'Apply'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
