import React, { useState, useMemo } from 'react';
import { Camera, ChevronDown, ChevronRight, Swords } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@anvil/ui';
import { isMinion as checkIsMinion } from '@anvil/data';
import type { CompendiumMonster } from '@anvil/data';
import type { MonsterPortrait } from '@anvil/types';
import { getMonsterPortraitUrl } from '../../stores/assetsStore.js';
import { AddToSceneMenu } from './AddToSceneMenu.js';
import { MonsterPortraitDialog } from './MonsterPortraitDialog.js';
import { BestiaryFilterBar } from './BestiaryFilterBar.js';
import type { BestiaryFilters } from './BestiaryFilterBar.js';
import { resolveApiUrl } from '../../lib/api.js';

export interface BestiaryTableProps {
  monsters: CompendiumMonster[];
  compact?: boolean;
  onAddToScene?: (monsterName: string, quantity: number, sceneId: string) => void;
  availableScenes?: Array<{ id: string; name: string; sceneType: string }>;
  monsterPortraits?: MonsterPortrait[];
  onPortraitSave?: (monsterName: string, assetId: string) => Promise<void>;
  onPortraitRemove?: (monsterName: string) => Promise<void>;
}

function charMod(value: number | undefined): string {
  if (value === undefined) return '-';
  return value >= 0 ? `+${value}` : String(value);
}

/** Token-style circle matching the canvas token aesthetic. Shows portrait if available, otherwise a placeholder glyph. */
function MonsterToken({ portraitUrl, editable }: { portraitUrl?: string | null; editable?: boolean }) {
  const resolvedPortraitUrl = resolveApiUrl(portraitUrl);

  return (
    <div className="group/token relative flex size-7 shrink-0 items-center justify-center">
      {/* Outer black ring */}
      <div className="absolute inset-0 rounded-full bg-zinc-950 ring-2 ring-zinc-950" />
      {/* Inner colored ring */}
      <div className="absolute inset-[2px] rounded-full ring-[1.5px] ring-red-500" />
      {/* Content: portrait or placeholder */}
      {resolvedPortraitUrl ? (
        <img
          src={resolvedPortraitUrl}
          alt=""
          className="relative size-[22px] rounded-full object-cover"
        />
      ) : (
        <Swords className="relative size-3 text-red-400" />
      )}
      {/* Hover overlay for editable tokens */}
      {editable && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover/token:opacity-100">
          <Camera className="size-3 text-zinc-300" />
        </div>
      )}
    </div>
  );
}

function MonsterDetailRow({ monster }: { monster: CompendiumMonster }) {
  return (
    <div className="space-y-2 px-4 py-3 text-xs text-zinc-300">
      {/* Flavor text */}
      {monster.flavor && (
        <p className="italic text-zinc-400">{monster.flavor}</p>
      )}

      {/* Immunities & Weaknesses */}
      {monster.immunities && monster.immunities.length > 0 && (
        <p>
          <span className="font-semibold text-zinc-400">Immunities: </span>
          {monster.immunities.join(', ')}
        </p>
      )}
      {monster.weaknesses && monster.weaknesses.length > 0 && (
        <p>
          <span className="font-semibold text-zinc-400">Weaknesses: </span>
          {monster.weaknesses.join(', ')}
        </p>
      )}

      {/* Features */}
      {monster.features && monster.features.length > 0 && (
        <div className="space-y-1">
          <span className="font-semibold text-zinc-400">Features:</span>
          {monster.features.map((feature, i) => (
            <div key={i} className="ml-2">
              <span className="font-medium text-zinc-200">{feature.name}</span>
              {feature.keywords && feature.keywords.length > 0 && (
                <span className="ml-1 text-zinc-500">
                  [{feature.keywords.join(', ')}]
                </span>
              )}
              {feature.usage && (
                <span className="ml-1 text-zinc-500">({feature.usage})</span>
              )}
              {feature.distance && (
                <span className="ml-1 text-zinc-500">{feature.distance}</span>
              )}
              {feature.effects && feature.effects.map((eff, j) => (
                <div key={j} className="ml-4 text-zinc-400">
                  {eff.effect && <span>{eff.effect}</span>}
                  {eff.tier1 && (
                    <div className="ml-2">
                      <span className="text-zinc-500">T1: </span>{eff.tier1}
                      {eff.tier2 && <><br /><span className="text-zinc-500">T2: </span>{eff.tier2}</>}
                      {eff.tier3 && <><br /><span className="text-zinc-500">T3: </span>{eff.tier3}</>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BestiaryTable({
  monsters,
  compact,
  onAddToScene,
  availableScenes = [],
  monsterPortraits = [],
  onPortraitSave,
  onPortraitRemove,
}: BestiaryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<BestiaryFilters>({
    search: '',
    minLevel: null,
    maxLevel: null,
    role: null,
  });

  const filtered = useMemo(() => {
    let result = monsters;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.ancestry?.some((a) => a.toLowerCase().includes(q)),
      );
    }

    if (filters.minLevel !== null) {
      result = result.filter((m) => m.level >= (filters.minLevel ?? 0));
    }

    if (filters.maxLevel !== null) {
      result = result.filter((m) => m.level <= (filters.maxLevel ?? 99));
    }

    if (filters.role) {
      const r = filters.role.toLowerCase();
      result = result.filter((m) =>
        m.roles?.some((role) => role.toLowerCase().includes(r)),
      );
    }

    return result;
  }, [monsters, filters]);

  const handleFilterChange = (partial: Partial<BestiaryFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', minLevel: null, maxLevel: null, role: null });
  };

  return (
    <div className="flex flex-col">
      <BestiaryFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-zinc-500">No monsters match your filters.</p>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Name</TableHead>
                <TableHead className="w-12 text-center">Lv</TableHead>
                <TableHead className="w-24">Role</TableHead>
                {!compact && (
                  <>
                    <TableHead className="w-14 text-center">EV</TableHead>
                    <TableHead className="w-14 text-center">HP</TableHead>
                    <TableHead className="w-14 text-center">Spd</TableHead>
                    <TableHead className="w-10 text-center">MGT</TableHead>
                    <TableHead className="w-10 text-center">AGI</TableHead>
                    <TableHead className="w-10 text-center">RSN</TableHead>
                    <TableHead className="w-10 text-center">INT</TableHead>
                    <TableHead className="w-10 text-center">PRE</TableHead>
                  </>
                )}
                {onAddToScene && <TableHead className="w-10" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((monster) => {
                const isExpanded = expandedId === monster._id;
                const minionFlag = checkIsMinion(monster);
                const primaryRole = monster.roles?.[0] ?? 'Standard';

                return (
                  <React.Fragment key={monster._id}>
                    <TableRow
                      className="cursor-pointer hover:bg-zinc-800/50"
                      onClick={() => setExpandedId(isExpanded ? null : monster._id)}
                    >
                      <TableCell className="px-2">
                        {isExpanded ? (
                          <ChevronDown className="size-3.5 text-zinc-500" />
                        ) : (
                          <ChevronRight className="size-3.5 text-zinc-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {onPortraitSave ? (
                            <MonsterPortraitDialog
                              monsterName={monster.name}
                              currentPortraitUrl={getMonsterPortraitUrl(monsterPortraits, monster.name)}
                              onSave={(assetId) => onPortraitSave(monster.name, assetId)}
                              onRemove={onPortraitRemove ? () => onPortraitRemove(monster.name) : undefined}
                            >
                              <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MonsterToken
                                  portraitUrl={getMonsterPortraitUrl(monsterPortraits, monster.name)}
                                  editable
                                />
                              </button>
                            </MonsterPortraitDialog>
                          ) : (
                            <MonsterToken portraitUrl={getMonsterPortraitUrl(monsterPortraits, monster.name)} />
                          )}
                          <div>
                            <span className="font-medium">{monster.name}</span>
                            {monster.ancestry && monster.ancestry.length > 0 && (
                              <span className="ml-1.5 text-xs text-zinc-500">
                                {monster.ancestry.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {monster.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">{primaryRole}</TableCell>
                      {!compact && (
                        <>
                          <TableCell className="text-center text-xs">{monster.ev ?? '-'}</TableCell>
                          <TableCell className="text-center text-xs">{monster.stamina ?? '-'}</TableCell>
                          <TableCell className="text-center text-xs">
                            {monster.speed ?? '-'}
                            {monster.movement && (
                              <span className="ml-0.5 text-zinc-500" title={monster.movement}>*</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-xs text-zinc-400">{charMod(monster.might)}</TableCell>
                          <TableCell className="text-center text-xs text-zinc-400">{charMod(monster.agility)}</TableCell>
                          <TableCell className="text-center text-xs text-zinc-400">{charMod(monster.reason)}</TableCell>
                          <TableCell className="text-center text-xs text-zinc-400">{charMod(monster.intuition)}</TableCell>
                          <TableCell className="text-center text-xs text-zinc-400">{charMod(monster.presence)}</TableCell>
                        </>
                      )}
                      {onAddToScene && (
                        <TableCell>
                          <AddToSceneMenu
                            monsterName={monster.name}
                            isMinion={minionFlag}
                            availableScenes={availableScenes}
                            onAdd={onAddToScene}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                    {isExpanded && (
                      <tr>
                        <td colSpan={compact ? 5 : 14} className="bg-zinc-900/50">
                          <MonsterDetailRow monster={monster} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
