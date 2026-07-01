import { useState } from 'react';
import { AbilityCard } from './AbilityCard.js';
import type { AbilityInfo } from './AbilityCard.js';

interface AbilityPanelProps {
  abilities: AbilityInfo[];
  usedActionTypes: string[];
  onUseAbility: (abilityId: string) => void;
}

const ACTION_FILTERS = ['all', 'action', 'maneuver', 'triggered', 'free'] as const;
type ActionCategory = Exclude<(typeof ACTION_FILTERS)[number], 'all'>;

const ACTION_CATEGORY_LABELS: Record<ActionCategory, string> = {
  action: 'Actions',
  maneuver: 'Maneuvers',
  triggered: 'Triggered Actions',
  free: 'Free Actions',
};

export function AbilityPanel({ abilities, usedActionTypes, onUseAbility }: AbilityPanelProps) {
  const [filter, setFilter] = useState<string>('all');

  const grouped = ACTION_FILTERS.filter((category): category is ActionCategory => category !== 'all')
    .map((category) => ({
      category,
      abilities: abilities.filter((ability) => normalizeActionCategory(ability.actionType) === category),
    }));
  const visibleGroups = filter === 'all'
    ? grouped
    : grouped.filter((group) => group.category === filter);
  const visibleCount = visibleGroups.reduce((sum, group) => sum + group.abilities.length, 0);

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

      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-4">
          {visibleGroups.map((group) => (
            <section key={group.category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {ACTION_CATEGORY_LABELS[group.category]}
                </h3>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {group.abilities.length}
                </span>
              </div>
              {group.abilities.map((ability) => {
                const category = normalizeActionCategory(ability.actionType);
                return (
                  <AbilityCard
                    key={ability.id}
                    ability={{ ...ability, actionType: category }}
                    disabled={usedActionTypes.includes(category)}
                    onUse={onUseAbility}
                  />
                );
              })}
            </section>
          ))}
          {visibleCount === 0 && <p className="text-xs text-zinc-500">No abilities match filter.</p>}
        </div>
      </div>
    </div>
  );
}

function normalizeActionCategory(actionType: string): ActionCategory {
  const value = actionType.toLowerCase();
  if (value.includes('maneuver') || value === 'move') return 'maneuver';
  if (value.includes('trigger')) return 'triggered';
  if (value.includes('free')) return 'free';
  return 'action';
}
