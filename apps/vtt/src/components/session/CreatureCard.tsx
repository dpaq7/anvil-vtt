import { useState, type MouseEvent } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';
import { StaminaBar, Badge, Button } from '@anvil/ui';
import type { EntityData, ClientMessage } from '../../types/protocol.js';
import { conditionNames } from '../../lib/conditions.js';

/** Compact condition ID → emoji mapping (Draw Steel 9 conditions) */
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

/** Color ring for monster type/role */
const MONSTER_RING = 'ring-red-500/70';

export interface CreatureCardProps {
  entity: EntityData;
  isActive: boolean;
  selected?: boolean;
  onSelect?: (event: MouseEvent<HTMLButtonElement>) => void;
  send: (msg: ClientMessage) => void;
}

export function CreatureCard({ entity, isActive, selected = false, onSelect, send }: CreatureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [damageInput, setDamageInput] = useState('');

  const maxStamina = (entity['maxStamina'] as number) ?? 0;
  const currentStamina = (entity['currentStamina'] as number) ?? maxStamina;
  const level = (entity['level'] as number) ?? 1;
  const conditions = conditionNames(entity) as string[];

  const handleDamage = (amount: number) => {
    if (amount <= 0) return;
    send({
      type: 'combat_action',
      action: { type: 'APPLY_DAMAGE', entityId: entity.id, amount },
    });
  };

  const handleHeal = (amount: number) => {
    if (amount <= 0) return;
    send({
      type: 'combat_action',
      action: { type: 'APPLY_HEALING', entityId: entity.id, amount },
    });
  };

  const handleToggleCondition = (conditionId: string) => {
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
  };

  const handleRemove = () => {
    send({ type: 'delete_entity', entityId: entity.id });
  };

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

  return (
    <div
      className={`border-b border-zinc-800/50 ${isActive ? 'bg-red-950/20' : ''} ${selected ? 'bg-sky-500/10 ring-1 ring-inset ring-sky-400/50' : ''}`}
    >
      {/* Header row */}
      <button
        onClick={(event) => {
          onSelect?.(event);
          if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
            setExpanded((v) => !v);
          }
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-zinc-800/50"
      >
        {/* Color ring avatar */}
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ring-2 ${MONSTER_RING} bg-red-950/40`}
        >
          <span className="text-xs">
            {expanded ? (
              <ChevronDown className="size-3 text-zinc-400" />
            ) : (
              <ChevronRight className="size-3 text-zinc-400" />
            )}
          </span>
        </div>

        {/* Name + level */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-zinc-200">
            {entity.name}
          </span>
          {/* Condition emoji row (compact) */}
          {conditions.length > 0 && (
            <span className="text-[10px]">
              {conditions.map((c) => CONDITION_EMOJIS[c] ?? c).join(' ')}
            </span>
          )}
        </div>

        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
          Lv{level}
        </Badge>
      </button>

      {/* Stamina bar (always visible) */}
      {maxStamina > 0 && (
        <div className="px-3 pb-1">
          <StaminaBar current={currentStamina} max={maxStamina} className="h-2" />
        </div>
      )}

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-2 border-t border-zinc-800/30 bg-zinc-900/50 px-3 py-2">
          {/* Quick damage/heal */}
          <div className="flex items-center gap-1">
            {/* size-9 keeps these frequent combat controls tappable on tablets */}
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => handleDamage(1)}
              title="1 damage"
            >
              <Minus className="size-3.5 text-red-400" />
            </Button>
            <input
              type="number"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickDamageHeal();
              }}
              placeholder="+/-"
              className="h-9 w-14 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-center text-xs text-zinc-200 placeholder:text-zinc-600"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => handleHeal(1)}
              title="1 heal"
            >
              <Plus className="size-3.5 text-emerald-400" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-9 text-zinc-500 hover:text-red-400"
              onClick={handleRemove}
              title="Remove creature"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {/* Condition toggles */}
          <div className="flex flex-wrap gap-1">
            {ALL_CONDITION_IDS.map((id) => {
              const active = conditions.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleToggleCondition(id)}
                  title={id}
                  className={`rounded px-1 py-0.5 text-[10px] transition ${
                    active
                      ? 'bg-amber-900/50 text-amber-300 ring-1 ring-amber-600/50'
                      : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {CONDITION_EMOJIS[id]} {id.slice(0, 4)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
