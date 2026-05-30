import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Minus, Plus, X, Sword } from 'lucide-react';
import { StaminaBar, Badge, Button, ScrollArea } from '@anvil/ui';
import type { EntityData, ClientMessage } from '../../types/protocol.js';
import { AbilityBlock } from '../drawsteel/AbilityBlock.js';
import { drawSteelAbilityFromLike } from '../drawsteel/abilityData.js';

/** Condition emojis for Draw Steel's 9 conditions */
const CONDITION_EMOJIS: Record<string, string> = {
  bleeding: '\u{1FA78}',
  dazed: '\u{1F4AB}',
  frightened: '\u{1F628}',
  grabbed: '\u{270A}',
  prone: '\u{1F53B}',
  restrained: '\u26D3\uFE0F',
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

export interface TokenContextMenuProps {
  entity: EntityData;
  entities: EntityData[];
  selectedTargetId?: string | null;
  x: number;
  y: number;
  isDirector: boolean;
  send: (msg: ClientMessage) => void;
  onClose: () => void;
}

/**
 * Right-click context menu for a token on the battle canvas.
 * Shows HP tracking, condition toggles, quick damage/heal, and monster abilities.
 * Positioned at click coordinates, clamped to viewport.
 */
export function TokenContextMenu({ entity, entities, selectedTargetId, x, y, isDirector, send, onClose }: TokenContextMenuProps) {
  const [damageInput, setDamageInput] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const maxStamina = typeof entity['maxStamina'] === 'number' ? (entity['maxStamina'] as number) : 0;
  const currentStamina = typeof entity['currentStamina'] === 'number' ? (entity['currentStamina'] as number) : maxStamina;
  const level = typeof entity['level'] === 'number' ? (entity['level'] as number) : 1;
  const conditions = useMemo(
    () => Array.isArray(entity['conditions']) ? (entity['conditions'] as string[]) : [],
    [entity],
  );
  const features = useMemo(
    () => Array.isArray(entity['features']) ? (entity['features'] as MonsterFeature[]) : [],
    [entity],
  );
  const abilities = useMemo(
    () => features.filter((f) => f.feature_type === 'ability'),
    [features],
  );
  const abilityTargets = useMemo(
    () => entities.filter((candidate) =>
      candidate.id !== entity.id && ['hero', 'monster', 'npc'].includes(candidate.type),
    ),
    [entities, entity.id],
  );
  const defaultTargetId = useMemo(() => {
    if (selectedTargetId && abilityTargets.some((candidate) => candidate.id === selectedTargetId)) {
      return selectedTargetId;
    }
    const preferredTarget = entity.type === 'hero'
      ? abilityTargets.find((candidate) => candidate.type === 'monster' || candidate.type === 'npc')
      : abilityTargets.find((candidate) => candidate.type === 'hero');
    return preferredTarget?.id ?? abilityTargets[0]?.id ?? entity.id;
  }, [abilityTargets, entity.id, entity.type, selectedTargetId]);

  useEffect(() => {
    setTargetId((current) => {
      if (current && abilityTargets.some((candidate) => candidate.id === current)) return current;
      return defaultTargetId;
    });
  }, [abilityTargets, defaultTargetId, entity.id]);

  // Click-outside to close (left-click only — right-click is handled by canvas contextmenu)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      // Only close on primary (left) button; right-click reopens via canvas contextmenu handler
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
      send({
        type: 'token_action',
        action: { kind: 'manual-damage', targetId: entity.id, amount },
      });
    },
    [send, entity.id],
  );

  const handleHeal = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      send({
        type: 'token_action',
        action: { kind: 'manual-heal', targetId: entity.id, amount },
      });
    },
    [send, entity.id],
  );

  const handleToggleCondition = useCallback(
    (conditionId: string) => {
      const has = conditions.includes(conditionId);
      if (has) {
        send({
          type: 'token_action',
          action: { kind: 'remove-condition', targetId: entity.id, condition: conditionId },
        });
      } else {
        send({
          type: 'token_action',
          action: { kind: 'apply-condition', targetId: entity.id, condition: conditionId },
        });
      }
    },
    [send, entity.id, conditions],
  );

  const handleUseAbility = useCallback(
    (abilityName: string) => {
      send({
        type: 'token_action',
        action: {
          kind: 'ability',
          sourceId: entity.id,
          targetId: targetId ?? defaultTargetId,
          abilityId: abilityName,
        },
      });
    },
    [send, entity.id, targetId, defaultTargetId],
  );

  const handleQuickDamageHeal = () => {
    const val = parseInt(damageInput, 10);
    if (!val || val === 0) return;
    if (val > 0) {
      handleDamage(val);
    } else {
      handleHeal(Math.abs(val));
    }
    setDamageInput('');
  };

  // Clamp position to viewport so menu doesn't overflow off-screen
  const menuWidth = 260;
  const menuHeight = abilities.length > 0 ? 400 : 280;
  const clampedX = Math.min(Math.max(8, x), window.innerWidth - menuWidth - 8);
  const clampedY = Math.min(Math.max(8, y), window.innerHeight - menuHeight - 8);

  const badgeColor = TYPE_BADGE_COLORS[entity.type] ?? TYPE_BADGE_COLORS['npc'];

  return (
    <div
      ref={menuRef}
      className="absolute z-40 w-[260px] overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm"
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Header */}
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
        <Button
          variant="ghost"
          size="icon"
          className="size-6 shrink-0 text-zinc-500 hover:text-zinc-300"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <ScrollArea className="max-h-[360px]">
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

        {/* Quick damage/heal row */}
        {isDirector && (
          <div className="flex items-center gap-1 px-3 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => handleDamage(1)}
              title="1 damage"
            >
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
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => handleHeal(1)}
              title="1 heal"
            >
              <Plus className="size-3 text-emerald-400" />
            </Button>
          </div>
        )}

        {/* Monster abilities */}
        {isDirector && abilities.length > 0 && (
          <div className="border-t border-zinc-800/50 px-3 py-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-zinc-500">
              <Sword className="size-3" /> Actions
            </p>
            {abilityTargets.length > 0 && (
              <label className="mb-2 block text-[10px] font-medium text-zinc-500">
                Target
                <select
                  value={targetId ?? defaultTargetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="mt-1 h-7 w-full rounded border border-zinc-700 bg-zinc-950 px-2 text-xs text-zinc-100"
                >
                  {abilityTargets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex flex-col gap-1">
              {abilities.map((ability) => (
                <AbilityBlock
                  key={ability.name}
                  ability={drawSteelAbilityFromLike(ability)}
                  compact
                  onClick={() => handleUseAbility(ability.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Condition toggles */}
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
      </ScrollArea>
    </div>
  );
}
