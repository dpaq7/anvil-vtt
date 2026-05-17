import { useState, useMemo } from "react";
import { WizardLogic } from "@anvil/data";
import type { CharacterInProgress } from "@anvil/data";
import type { HeroClass } from "@anvil/types";
import { cn, Input } from "@anvil/ui";
import {
  SplitViewSelector,
  DetailPanel,
} from "../creator/index.js";
import { AbilityBlock } from "../drawsteel/AbilityBlock.js";
import { drawSteelAbilityFromLike } from "../drawsteel/abilityData.js";
import {
  Search,
  Swords,
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
    item_id?: string;
    class?: HeroClass;
    level?: number;
    ability_type?: string;
    cost_amount?: number;
    cost_resource?: string;
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

// Get feature ID for tracking selection
function getFeatureId(feature: GameDataFeature): string {
  return WizardLogic.getAbilityFeatureId(
    feature as Parameters<typeof WizardLogic.getAbilityFeatureId>[0],
  );
}

export function AbilitiesStep({ character, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [previewedAbility, setPreviewedAbility] =
    useState<GameDataFeature | null>(null);

  const heroClass = character.heroClass as HeroClass | null;
  const slots = useMemo(() => WizardLogic.getAbilityChoiceSlots(character), [
    character,
  ]);
  const selectedSlot =
    slots.find((slot) => slot.id === selectedSlotId) ??
    slots.find((slot) => !character.abilityChoices?.[slot.id]) ??
    slots[0] ??
    null;
  const selectedCount = slots.filter(
    (slot) => !!character.abilityChoices?.[slot.id],
  ).length;

  const abilityFeatures = useMemo(() => {
    if (!selectedSlot) return [];
    return WizardLogic.getAbilityOptionsForSlot(
      character,
      selectedSlot,
    ) as unknown as GameDataFeature[];
  }, [character, selectedSlot]);

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

  const selectAbility = (id: string) => {
    if (!selectedSlot) return;

    const abilityChoices = {
      ...(character.abilityChoices ?? {}),
      [selectedSlot.id]: id,
    };
    const nextCharacter = {
      ...character,
      abilityChoices,
      selectedAbilities: [],
    };

    onChange({
      abilityChoices,
      selectedAbilities: WizardLogic.getSelectedAbilityIds(nextCharacter),
    });
  };

  const renderCard = (
    ability: GameDataFeature,
    _isSelected: boolean,
    isPreviewed: boolean,
  ) => {
    const isSelected = selectedSlot
      ? character.abilityChoices?.[selectedSlot.id] === getFeatureId(ability)
      : false;

    return (
      <AbilityBlock
        ability={drawSteelAbilityFromLike(ability)}
        compact
        selected={isSelected}
        className={cn(isPreviewed && !isSelected && "border-zinc-500")}
      />
    );
  };

  const renderDetail = (ability: GameDataFeature) => {
    const id = getFeatureId(ability);
    const isSelected = selectedSlot
      ? character.abilityChoices?.[selectedSlot.id] === id
      : false;

    return (
      <DetailPanel
        title={ability.name}
        onSelect={() => selectAbility(id)}
        selectLabel={isSelected ? "Selected" : `Select ${ability.name}`}
      >
        <AbilityBlock ability={drawSteelAbilityFromLike(ability)} />
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

  if (slots.length === 0) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center">
        <div className="text-center text-zinc-500">
          <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No Ability Slots</h2>
          <p className="text-sm max-w-md">
            This class does not have any starting ability choices configured.
          </p>
        </div>
      </div>
    );
  }

  if (abilityFeatures.length === 0) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center">
        <div className="text-center text-zinc-500">
          <Swords className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No Abilities Available</h2>
          <p className="text-sm max-w-md">
            No abilities are available for this slot.
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
          Choose one signature ability, one 3pt ability, and one 5pt ability.
        </p>
        <p className={cn("mb-4 text-xs", selectedCount >= slots.length ? "text-creator-highlight" : "text-creator-text-muted")}>
          {selectedCount} / {slots.length} ability slots filled
        </p>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {slots.map((slot) => {
            const selectedAbilityId = character.abilityChoices?.[slot.id];
            const selectedAbility = selectedAbilityId
              ? WizardLogic.getAbilityOptionsForSlot(character, slot).find(
                  (ability) => WizardLogic.getAbilityFeatureId(ability) === selectedAbilityId,
                )
              : null;
            const active = selectedSlot?.id === slot.id;

            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  setSelectedSlotId(slot.id);
                  setPreviewedAbility(null);
                }}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition",
                  active
                    ? "border-creator-highlight bg-creator-highlight/15 text-creator-highlight"
                    : selectedAbility
                      ? "border-green-700 bg-green-900/20 text-green-300"
                      : "border-creator-border text-creator-text-muted hover:border-creator-text-muted",
                )}
              >
                <div className="font-medium">{slot.label}</div>
                <div className="mt-0.5 truncate text-xs opacity-75">
                  {selectedAbility?.name ?? slot.description}
                </div>
              </button>
            );
          })}
        </div>

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
          selectedId={selectedSlot ? character.abilityChoices?.[selectedSlot.id] ?? null : null}
          onPreview={setPreviewedAbility}
          onSelect={(item) => selectAbility(getFeatureId(item))}
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
          {selectedCount} / {slots.length} ability slots filled
        </p>
      </div>
    </div>
  );
}
