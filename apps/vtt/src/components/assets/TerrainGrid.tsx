import { useState, useMemo } from 'react';
import { Mountain, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@anvil/ui';
import { TERRAIN_CATEGORY_NAMES, getTerrainDescription, getTerrainStaminaDescription } from '@anvil/data';
import type { CompendiumTerrain, TerrainCategory, CustomTerrain } from '@anvil/types';

export interface TerrainGridProps {
  builtInTerrains: CompendiumTerrain[];
  customTerrains: CustomTerrain[];
  onSelectBuiltIn?: (terrainId: string) => void;
  onSelectCustom?: (terrainId: string) => void;
  compact?: boolean;
}

const CATEGORIES: TerrainCategory[] = [
  'environmental',
  'fieldwork',
  'mechanism',
  'siege-engine',
  'power-fixture',
  'supernatural',
];

export function TerrainGrid({
  builtInTerrains,
  customTerrains,
  onSelectBuiltIn,
  onSelectCustom,
  compact,
}: TerrainGridProps) {
  const [categoryFilter, setCategoryFilter] = useState<TerrainCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredBuiltIn = useMemo(() => {
    if (categoryFilter === 'all') return builtInTerrains;
    return builtInTerrains.filter((t) => t.category === categoryFilter);
  }, [builtInTerrains, categoryFilter]);

  const filteredCustom = useMemo(() => {
    if (categoryFilter === 'all') return customTerrains;
    return customTerrains.filter((t) => t.category === categoryFilter);
  }, [customTerrains, categoryFilter]);

  return (
    <div className="flex flex-col">
      {/* Filter bar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <Select
          value={categoryFilter}
          onValueChange={(v: string) => setCategoryFilter(v as TerrainCategory | 'all')}
        >
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-xs">
                {TERRAIN_CATEGORY_NAMES[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-zinc-500">
          {filteredBuiltIn.length} built-in, {filteredCustom.length} custom
        </span>
      </div>

      {/* Grid */}
      <div
        className={
          compact
            ? 'grid grid-cols-1 gap-3 p-3 sm:grid-cols-2'
            : 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }
      >
        {/* Custom terrain cards */}
        {filteredCustom.map((terrain) => (
          <Card
            key={`custom-${terrain.id}`}
            className="cursor-pointer transition hover:border-zinc-600"
            onClick={() => onSelectCustom?.(terrain.id)}
          >
            {compact ? (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-200">{terrain.name}</span>
                  <span className="text-[10px] text-zinc-500">Custom</span>
                </div>
                <Badge variant="outline" className="shrink-0 text-[9px] px-1 py-0 text-amber-400">
                  Custom
                </Badge>
              </div>
            ) : (
              <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-800">
                  {terrain.imageUrl ? (
                    <img
                      src={terrain.imageUrl}
                      alt={terrain.name}
                      className="size-10 rounded-md object-cover"
                    />
                  ) : (
                    <Mountain className="size-5 text-zinc-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-sm font-bold">{terrain.name}</CardTitle>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {TERRAIN_CATEGORY_NAMES[terrain.category]}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {terrain.gridWidth}&times;{terrain.gridHeight}
                    </Badge>
                    {terrain.material && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {terrain.material}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[9px] px-1 py-0 text-amber-400">
                      Custom
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            )}
          </Card>
        ))}

        {/* Built-in terrain cards */}
        {filteredBuiltIn.map((terrain) => {
          if (compact) {
            return (
              <Card
                key={`builtin-${terrain.id}`}
                className="cursor-pointer transition hover:border-zinc-600"
                onClick={() => onSelectBuiltIn?.(terrain.id)}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-200">{terrain.name}</span>
                    <span className="text-[10px] text-zinc-500">{TERRAIN_CATEGORY_NAMES[terrain.category]}</span>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[9px] px-1 py-0">
                    Lv {terrain.level}
                  </Badge>
                </div>
              </Card>
            );
          }

          const isExpanded = expandedId === terrain.id;
          return (
            <Collapsible key={`builtin-${terrain.id}`} open={isExpanded}>
              <Card
                className="cursor-pointer transition hover:border-zinc-600"
                onClick={() => onSelectBuiltIn?.(terrain.id)}
              >
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-zinc-800">
                    <Mountain className="size-5 text-zinc-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <CardTitle className="truncate text-sm font-bold">{terrain.name}</CardTitle>
                      <CollapsibleTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : terrain.id);
                          }}
                          className="shrink-0 rounded p-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                        >
                          {isExpanded ? (
                            <ChevronDown className="size-3.5" />
                          ) : (
                            <ChevronRight className="size-3.5" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                    </div>
                    <p className="text-[10px] text-zinc-500">{getTerrainDescription(terrain)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        Lv {terrain.level}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        EV {terrain.encounterValue}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        HP {getTerrainStaminaDescription(terrain)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {/* Expandable detail */}
                <CollapsibleContent>
                  <CardContent className="space-y-2 px-4 pb-4 pt-0 text-xs text-zinc-300">
                    <p className="italic text-zinc-400">{terrain.description}</p>

                    {terrain.immunities && (
                      <p>
                        <span className="font-semibold text-zinc-400">Immunities: </span>
                        {terrain.immunities}
                      </p>
                    )}

                    {terrain.deactivate && (
                      <p>
                        <span className="font-semibold text-zinc-400">Deactivation: </span>
                        {terrain.deactivate}
                      </p>
                    )}

                    {terrain.features && terrain.features.length > 0 && (
                      <div>
                        <span className="font-semibold text-zinc-400">Features:</span>
                        {terrain.features.map((f) => (
                          <div key={f.id} className="ml-2 mt-1">
                            <span className="font-medium text-zinc-200">{f.name}</span>
                            <span className="ml-1 text-zinc-500">{f.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {terrain.abilities && terrain.abilities.length > 0 && (
                      <div>
                        <span className="font-semibold text-zinc-400">Abilities:</span>
                        {terrain.abilities.map((a) => (
                          <div key={a.id} className="ml-2 mt-1">
                            <span className="font-medium text-zinc-200">{a.name}</span>
                            {a.usage && <span className="ml-1 text-zinc-500">({a.usage})</span>}
                            {a.distance && <span className="ml-1 text-zinc-500">{a.distance}</span>}
                            {a.effectText && <p className="ml-2 text-zinc-400">{a.effectText}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {terrain.upgrades && terrain.upgrades.length > 0 && (
                      <div>
                        <span className="font-semibold text-zinc-400">Upgrades:</span>
                        {terrain.upgrades.map((u) => (
                          <div key={u.id} className="ml-2 mt-1">
                            <span className="font-medium text-zinc-200">{u.name}</span>
                            <span className="ml-1 text-zinc-500">(+{u.cost} EV)</span>
                            <p className="ml-2 text-zinc-400">{u.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {filteredBuiltIn.length === 0 && filteredCustom.length === 0 && (
        <p className="p-8 text-center text-zinc-500">No terrain matches your filter.</p>
      )}
    </div>
  );
}
