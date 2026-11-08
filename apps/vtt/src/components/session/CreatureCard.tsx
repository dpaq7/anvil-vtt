import { useState, type MouseEvent } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus, Trash2 } from 'lucide-react';
import { StaminaBar, Badge, Button } from '@anvil/ui';
import type { EntityData, ClientMessage } from '../../types/protocol.js';
import { conditionNames } from '../../lib/conditions.js';
import { conditionLine } from '../../lib/faces.js';
import { TokenFace } from './battle/TokenFace.js';
import { CONDITION_ICONS } from './battle/condition-icons.js';
import { useSessionConnection } from './shell/connection-context.js';

const ALL_CONDITION_IDS = Object.keys(CONDITION_ICONS);

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
  const { paused } = useSessionConnection();

  const handleDamage = (amount: number) => {
    if (amount <= 0 || paused) return;
    send({
      type: 'combat_action',
      action: { type: 'APPLY_DAMAGE', entityId: entity.id, amount },
    });
  };

  const handleHeal = (amount: number) => {
    if (amount <= 0 || paused) return;
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
      className={`border-b border-zinc-800/50 ${isActive ? 'bg-active-soft' : ''} ${selected ? 'outline outline-2 -outline-offset-2 outline-text' : ''}`}
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
        <TokenFace entity={entity} size={28} />
        {expanded ? <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" /> : <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}

        {/* Name + level */}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-zinc-200">
            {entity.name}
          </span>
          {/* Condition emoji row (compact) */}
          {conditions.length > 0 && (
            <span className="text-[13px]">
              {conditionLine(entity).join(', ')}
            </span>
          )}
        </div>

        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[13px]">
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
              disabled={paused}
              aria-label="1 damage"
              onClick={() => handleDamage(1)}
              title="1 damage"
            >
              <Minus className="size-3.5" />
            </Button>
            <input
              type="number"
              value={damageInput}
              onChange={(e) => setDamageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickDamageHeal();
              }}
              aria-label="Change in stamina"
              disabled={paused}
              placeholder={paused ? 'Back' : '+/-'}
              className="h-9 w-14 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-center text-xs text-zinc-200 placeholder:text-zinc-600"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              disabled={paused}
              aria-label="1 heal"
              onClick={() => handleHeal(1)}
              title="1 heal"
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-9 text-zinc-500 hover:text-red-400"
              disabled={paused}
              aria-label="Remove creature"
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
              const Icon = CONDITION_ICONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  disabled={paused}
                  aria-pressed={active}
                  onClick={() => handleToggleCondition(id)}
                  title={id}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[13px] font-bold capitalize ${
                    active
                      ? 'bg-text text-surface'
                      : 'text-text-soft shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)] hover:bg-well'
                  }`}
                >
                  {Icon && <Icon size={13} strokeWidth={2.6} aria-hidden="true" />}
                  {id}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
