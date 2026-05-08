import { useState, useMemo } from "react";
import { GameData } from "@anvil/data";
import type { CharacterInProgress } from "@anvil/data";
import type { HeroClass } from "@anvil/types";
import { CardContent, cn, Input } from "@anvil/ui";
import {
  SplitViewSelector,
  SelectionCard,
  DetailPanel,
} from "../creator/index.js";
import {
  Check,
  Search,
  Zap,
  Target,
  Swords,
  Sparkles,
  CircleDot,
  Timer,
  Hand,
} from "lucide-react";

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

// The Feature type from GameData - we use a minimal interface
interface GameDataFeature {
  type: "feature";
  name: string;
  feature_type: "ability" | "trait";
  metadata: {
    scc: string[];
    class?: HeroClass;
    level?: number;
  };
  effects: GameDataEffect[];
  keywords?: string[];
  usage?: string;
  distance?: string;
  target?: string;
  cost?: string;
  trigger?: string;
  ability_type?: string;
  flavor?: string;
}

// Effects can be various types
type GameDataEffect =
  | { effect: string }
  | {
      name?: string;
      effect: string;
      tier1?: string;
      tier2?: string;
      tier3?: string;
      roll?: string;
    }
  | { features: GameDataFeature[] };

// Helper to check if effect has power roll tiers
function isPowerRollEffect(
  effect: GameDataEffect,
): effect is {
  roll?: string;
  effect: string;
  tier1: string;
  tier2: string;
  tier3: string;
} {
  return "tier1" in effect && "tier2" in effect && "tier3" in effect;
}

// Get feature ID for tracking selection
function getFeatureId(feature: GameDataFeature): string {
  return feature.metadata.scc[0] ?? feature.name;
}

// Map action types to display labels and icons

const DEFAULT_ABILITY_SELECTION_LIMIT = 1;
const CLASS_ABILITY_SELECTION_LIMITS: Partial<Record<HeroClass, number>> = {
  conduit: 3,
  elementalist: 2,
  null: 2,
  talent: 2,
};

function getAbilitySelectionLimit(heroClass: HeroClass | null): number {
  if (!heroClass) return DEFAULT_ABILITY_SELECTION_LIMIT;
  return CLASS_ABILITY_SELECTION_LIMITS[heroClass] ?? DEFAULT_ABILITY_SELECTION_LIMIT;
}

const ACTION_TYPE_INFO: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  "Main action": { label: "Action", icon: Zap },
  Maneuver: { label: "Maneuver", icon: Hand },
  "Move action": { label: "Move", icon: Target },
  "Triggered action": { label: "Triggered", icon: Timer },
  "Free triggered action": { label: "Free Triggered", icon: Timer },
  "Free maneuver": { label: "Free Maneuver", icon: Hand },
  "-": { label: "No Action", icon: CircleDot },
};

export function AbilitiesStep({ character, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewedAbility, setPreviewedAbility] =
    useState<GameDataFeature | null>(null);

  const heroClass = character.heroClass as HeroClass | null;
  const level = character.level ?? 1;
  const selectionLimit = getAbilitySelectionLimit(heroClass);
  const selectedCount = character.selectedAbilities.length;

  // Get abilities for this class at the character's level
  const abilityFeatures = useMemo(() => {
    if (!heroClass) return [];

    // Get all features at each level up to and including current level
    const features: GameDataFeature[] = [];
    for (let l = 1; l <= level; l++) {
      const levelFeatures = GameData.getAbilitiesByClassAndLevel(
        heroClass,
        l,
      ) as unknown as GameDataFeature[];
      for (const feature of levelFeatures) {
        if (feature.feature_type === "ability") {
          features.push(feature);
        }
      }
    }
    return features;
  }, [heroClass, level]);

  // Filter by search
  const filteredAbilities = useMemo(() => {
    if (!searchQuery.trim()) return abilityFeatures;
    const query = searchQuery.toLowerCase();
    return abilityFeatures.filter((ability) => {
      if (ability.name.toLowerCase().includes(query)) return true;
      if (ability.keywords?.some((k) => k.toLowerCase().includes(query)))
        return true;
      // Search in effects
      for (const effect of ability.effects) {
        if ("effect" in effect && effect.effect.toLowerCase().includes(query))
          return true;
      }
      return false;
    });
  }, [abilityFeatures, searchQuery]);

  const toggle = (id: string) => {
    const current = character.selectedAbilities;
    if (current.includes(id)) {
      onChange({ selectedAbilities: current.filter((a) => a !== id) });
    } else if (current.length < selectionLimit) {
      onChange({ selectedAbilities: [...current, id] });
    }
  };

  const renderCard = (
    ability: GameDataFeature,
    isSelected: boolean,
    isPreviewed: boolean,
  ) => {
    const actionInfo = ability.usage
      ? (ACTION_TYPE_INFO[ability.usage] ?? { label: ability.usage, icon: Zap })
      : null;
    const isSignature = ability.ability_type
      ?.toLowerCase()
      .includes("signature");

    return (
      <SelectionCard
        selected={isSelected}
        onClick={() => setPreviewedAbility(ability)}
        className={cn(isPreviewed && !isSelected && "border-zinc-500")}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {actionInfo && (
                  <actionInfo.icon className="h-4 w-4 text-zinc-400 shrink-0" />
                )}
                <h4 className="font-medium text-zinc-100 truncate">
                  {ability.name}
                </h4>
              </div>

              {/* Cost and Action Type */}
              <div className="flex items-center gap-2 mt-1">
                {ability.cost && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-creator-highlight/20 text-creator-highlight border border-creator-highlight/50">
                    {ability.cost}
                  </span>
                )}
                {isSignature && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-800/50">
                    Signature
                  </span>
                )}
                {actionInfo && (
                  <span className="text-xs text-zinc-500">
                    {actionInfo.label}
                  </span>
                )}
              </div>

              {/* Keywords */}
              {ability.keywords && ability.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {ability.keywords.slice(0, 4).map((keyword) => (
                    <span
                      key={keyword}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
                    >
                      {keyword}
                    </span>
                  ))}
                  {ability.keywords.length > 4 && (
                    <span className="text-[10px] text-zinc-500">
                      +{ability.keywords.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
            {isSelected && (
              <Check className="h-5 w-5 text-creator-highlight shrink-0 ml-2" />
            )}
          </div>
        </CardContent>
      </SelectionCard>
    );
  };

  const renderDetail = (ability: GameDataFeature) => {
    const id = getFeatureId(ability);
    const isSelected = character.selectedAbilities.includes(id);
    const actionInfo = ability.usage
      ? (ACTION_TYPE_INFO[ability.usage] ?? { label: ability.usage, icon: Zap })
      : null;
    const isSignature = ability.ability_type
      ?.toLowerCase()
      .includes("signature");

    // Find power roll effects
    const powerRollEffects = ability.effects.filter(isPowerRollEffect);
    // Find regular effects (non-power-roll)
    const regularEffects = ability.effects.filter(
      (e) => "effect" in e && !isPowerRollEffect(e),
    );

    return (
      <DetailPanel
        title={ability.name}
        onSelect={() => toggle(id)}
        selectLabel={isSelected ? "Selected" : `Select ${ability.name}`}
      >
        {/* Action Type, Cost Row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {actionInfo && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-600 text-xs font-medium text-zinc-300">
              <actionInfo.icon className="h-3.5 w-3.5" />
              {actionInfo.label}
            </span>
          )}
          {ability.cost ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-creator-highlight/60 bg-creator-highlight/15 text-xs font-medium text-creator-highlight">
              <Sparkles className="h-3.5 w-3.5" />
              {ability.cost}
            </span>
          ) : isSignature ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-700 bg-green-900/20 text-xs font-medium text-green-400">
              Signature
            </span>
          ) : null}
        </div>

        {/* Distance and Target */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Distance
            </div>
            <div className="text-sm text-zinc-200">
              {ability.distance || "Self"}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Target
            </div>
            <div className="text-sm text-zinc-200">{ability.target || "—"}</div>
          </div>
        </div>

        {/* Keywords */}
        {ability.keywords && ability.keywords.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Keywords
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ability.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trigger (for triggered actions) */}
        {ability.trigger && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Trigger
            </div>
            <div className="rounded-lg bg-purple-950/30 border border-purple-900/50 p-3">
              <p className="text-sm text-zinc-300">{ability.trigger}</p>
            </div>
          </div>
        )}

        {/* Power Roll / Tier Effects */}
        {powerRollEffects.length > 0 && (
          <div className="mb-4">
            {powerRollEffects.map((effect, i) => (
              <div key={i}>
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  Power Roll{effect.roll ? ` (${effect.roll})` : ""}
                </div>
                <div className="space-y-2">
                  {/* Tier 1 */}
                  <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
                        T1
                      </span>
                      <span className="text-xs text-zinc-500">≤11</span>
                    </div>
                    <p className="text-sm text-zinc-300">{effect.tier1}</p>
                  </div>
                  {/* Tier 2 */}
                  <div className="rounded-lg bg-blue-950/30 border border-blue-900/50 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-800 text-blue-200">
                        T2
                      </span>
                      <span className="text-xs text-blue-400">12–16</span>
                    </div>
                    <p className="text-sm text-zinc-300">{effect.tier2}</p>
                  </div>
                  {/* Tier 3 */}
                  <div className="rounded-lg bg-creator-highlight/10 border border-creator-highlight/40 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-creator-highlight text-creator-bg">
                        T3
                      </span>
                      <span className="text-xs text-creator-highlight">
                        17+
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{effect.tier3}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Regular Effects */}
        {regularEffects.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Effect
            </div>
            <div className="space-y-2">
              {regularEffects.map((effect, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3"
                >
                  {"name" in effect && effect.name && (
                    <div className="text-xs text-creator-highlight font-medium mb-1">
                      {effect.name}
                    </div>
                  )}
                  {"effect" in effect && (
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {effect.effect}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flavor Text */}
        {ability.flavor && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <p className="text-sm italic text-zinc-500">{ability.flavor}</p>
          </div>
        )}
      </DetailPanel>
    );
  };

  // No class selected
  if (!heroClass) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center">
        <div className="text-center text-zinc-500">
          <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No Class Selected</h2>
          <p className="text-sm max-w-md">
            Select a class first to see available abilities.
          </p>
        </div>
      </div>
    );
  }

  // No abilities at this level
  if (abilityFeatures.length === 0) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center">
        <div className="text-center text-zinc-500">
          <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No Abilities Available</h2>
          <p className="text-sm max-w-md">
            No abilities are available for {heroClass} at level {level}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="mb-1 text-lg font-semibold">Choose Abilities</h2>
        <p className="mb-2 text-sm text-zinc-400">
          Select {selectionLimit} starting abilities. Signature abilities are free to use,
          while others cost heroic resources.
        </p>
        <p className={cn("mb-4 text-xs", selectedCount >= selectionLimit ? "text-creator-highlight" : "text-creator-text-muted")}>
          {selectedCount} / {selectionLimit} abilities selected
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder="Search abilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <SplitViewSelector
          items={filteredAbilities}
          selectedId={previewedAbility ? getFeatureId(previewedAbility) : null}
          onPreview={setPreviewedAbility}
          onSelect={(item) => toggle(getFeatureId(item))}
          renderCard={renderCard}
          renderDetail={renderDetail}
          previewedItem={previewedAbility}
          emptyMessage={
            searchQuery
              ? "No abilities match your search"
              : "No abilities available"
          }
          gridCols={1}
        />
      </div>

      <div className="flex-shrink-0 mt-4 pt-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          {selectedCount} / {selectionLimit} abilities selected
        </p>
      </div>
    </div>
  );
}
