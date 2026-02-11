import { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input, Badge, ScrollArea } from '@anvil/ui';
import { loadMonsters, isMonsterStatblock, FORGESTEEL_MONSTERS, isMinion } from '@anvil/data';
import type { CompendiumMonster } from '@anvil/data';

interface BestiaryRailProps {
  /** Scene ID for the "Add to Scene" action. */
  sceneId: string;
  /** Callback when the director wants to add a monster to the current scene. */
  onAddToScene?: (monsterName: string, quantity: number) => void;
}

/**
 * Minimalist bestiary panel for the director's left rail.
 * Compact list with search, level badge, role, and quick-add button.
 */
export function BestiaryRail({ sceneId: _sceneId, onAddToScene }: BestiaryRailProps) {
  const [monsters, setMonsters] = useState<CompendiumMonster[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMonsters()
      .then((data) => {
        const statblocks = data.items.filter(isMonsterStatblock) as CompendiumMonster[];
        const ids = new Set(statblocks.map((m) => m._id));
        const supplementary = FORGESTEEL_MONSTERS.filter((m) => !ids.has(m._id));
        setMonsters(
          [...statblocks, ...supplementary].sort((a, b) => a.name.localeCompare(b.name)),
        );
      })
      .catch(() => setMonsters([]));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return monsters;
    const q = search.toLowerCase();
    return monsters.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.ancestry?.some((a) => a.toLowerCase().includes(q)) ||
        m.roles?.some((r) => r.toLowerCase().includes(q)),
    );
  }, [monsters, search]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-zinc-800 px-3 py-2">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Bestiary
        </p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search monsters..."
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Monster list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filtered.length === 0 && (
            <p className="p-4 text-center text-xs text-zinc-600">
              {monsters.length === 0 ? 'Loading...' : 'No matches'}
            </p>
          )}
          {filtered.map((monster) => {
            const expanded = expandedId === monster._id;
            const minionFlag = isMinion(monster);
            const primaryRole = monster.roles?.[0] ?? 'Standard';

            return (
              <div key={monster._id} className="border-b border-zinc-800/50">
                <button
                  onClick={() => setExpandedId(expanded ? null : monster._id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-zinc-800/50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-zinc-200 truncate block">
                      {monster.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {primaryRole}
                      {minionFlag && ' · Minion'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                    Lv{monster.level}
                  </Badge>
                </button>

                {/* Expanded detail */}
                {expanded && (
                  <div className="border-t border-zinc-800/30 bg-zinc-900/50 px-3 py-2 text-[11px] text-zinc-400">
                    <div className="flex items-center gap-3 text-xs">
                      <span>HP {monster.stamina ?? '?'}</span>
                      <span>Spd {monster.speed ?? '?'}</span>
                      <span>EV {monster.ev ?? '?'}</span>
                    </div>
                    {monster.immunities && monster.immunities.length > 0 && (
                      <p className="mt-1">
                        <span className="text-zinc-500">Immune:</span>{' '}
                        {monster.immunities.join(', ')}
                      </p>
                    )}
                    {monster.features && monster.features.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {monster.features.slice(0, 3).map((f, i) => (
                          <p key={i} className="truncate">
                            <span className="font-medium text-zinc-300">{f.name}</span>
                            {f.keywords && f.keywords.length > 0 && (
                              <span className="text-zinc-600"> [{f.keywords.join(', ')}]</span>
                            )}
                          </p>
                        ))}
                        {monster.features.length > 3 && (
                          <p className="text-zinc-600">+{monster.features.length - 3} more...</p>
                        )}
                      </div>
                    )}
                    {onAddToScene && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToScene(monster.name, minionFlag ? 4 : 1);
                        }}
                        className="mt-2 w-full rounded bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300 transition hover:bg-zinc-700"
                      >
                        + Add to Scene
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
