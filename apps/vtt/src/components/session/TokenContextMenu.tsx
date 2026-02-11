import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Minus, Plus, X, Sword } from 'lucide-react';
import { StaminaBar, Badge, Button, ScrollArea } from '@anvil/ui';
import type { EntityData, ClientMessage } from '../../types/protocol.js';

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
  x: number;
  y: number;
  send: (msg: ClientMessage) => void;
  onClose: () => void;
}

/**
 * Right-click context menu for a token on the battle canvas.
 * Shows HP tracking, condition toggles, quick damage/heal, and monster abilities.
 * Positioned at click coordinates, clamped to viewport.
 */
export function TokenContextMenu({ entity, x, y, send, onClose }: TokenContextMenuProps) {
  const [damageInput, setDamageInput] = useState('');
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

  // Click-outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
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
        type: 'combat_action',
        action: { type: 'APPLY_DAMAGE', entityId: entity.id, amount },
      });
    },
    [send, entity.id],
  );

  const handleHeal = useCallback(
    (amount: number) => {
      if (amount <= 0) return;
      send({
        type: 'combat_action',
        action: { type: 'APPLY_HEALING', entityId: entity.id, amount },
      });
    },
    [send, entity.id],
  );

  const handleToggleCondition = useCallback(
    (conditionId: string) => {
      const has = conditions.includes(conditionId);
      if (has) {
        send({
          type: 'combat_action',
          action: { type: 'REMOVE_CONDITION', entityId: entity.id, conditionId },
        });
      } else {
        send({
          type: 'combat_action',
          action: { type: 'APPLY_CONDITION', entityId: entity.id, condition: conditionId },
        });
      }
    },
    [send, entity.id, conditions],
  );

  const handleUseAbility = useCallback(
    (abilityName: string) => {
      send({
        type: 'use_ability',
        sourceId: entity.id,
        targetId: entity.id, // Director picks target later; default self
        abilityId: abilityName,
      });
    },
    [send, entity.id],
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

        {/* Monster abilities */}
        {abilities.length > 0 && (
          <div className="border-t border-zinc-800/50 px-3 py-2">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-zinc-500">
              <Sword className="size-3" /> Actions
            </p>
            <div className="flex flex-col gap-1">
              {abilities.map((ability) => (
                <button
                  key={ability.name}
                  type="button"
                  onClick={() => handleUseAbility(ability.name)}
                  className="group rounded border border-zinc-800 bg-zinc-800/50 px-2 py-1.5 text-left transition hover:border-zinc-600 hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-200 group-hover:text-zinc-100">
                      {ability.name}
                    </span>
                    {ability.usage && (
                      <span className="text-[9px] text-zinc-600">{ability.usage}</span>
                    )}
                  </div>
                  {ability.distance && (
                    <span className="text-[10px] text-zinc-500">
                      {ability.distance}{ability.target ? ` • ${ability.target}` : ''}
                    </span>
                  )}
                  {ability.keywords && ability.keywords.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {ability.keywords.slice(0, 4).map((kw) => (
                        <span key={kw} className="rounded bg-zinc-700/50 px-1 py-0 text-[8px] text-zinc-500">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Condition toggles */}
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
      </ScrollArea>
    </div>
  );
}
