import { useState } from 'react';
import { AbilityCard } from './AbilityCard.js';
import type { AbilityInfo } from './AbilityCard.js';

interface AbilityPanelProps {
  abilities: AbilityInfo[];
  usedActionTypes: string[];
  onUseAbility: (abilityId: string) => void;
}

const ACTION_FILTERS = ['all', 'action', 'maneuver', 'triggered', 'free'] as const;

export function AbilityPanel({ abilities, usedActionTypes, onUseAbility }: AbilityPanelProps) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? abilities
    : abilities.filter((a) => a.actionType === filter);

  return (
    <div className="flex h-full flex-col">
      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-zinc-800 px-3 py-2">
        {ACTION_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-2 py-0.5 text-[10px] capitalize ${
              filter === f ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Ability list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {filtered.map((ability) => (
            <AbilityCard
              key={ability.id}
              ability={ability}
              disabled={usedActionTypes.includes(ability.actionType)}
              onUse={onUseAbility}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-zinc-500">No abilities match filter.</p>
          )}
        </div>
      </div>
    </div>
  );
}
