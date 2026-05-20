import { useState, useMemo } from "react";
import { GameData, WizardLogic } from "@anvil/data";
import type {
  CharacterInProgress,
  SummonerMinionChoiceOption,
} from "@anvil/data";
import type { HeroClass } from "@anvil/types";
import { cn, Input } from "@anvil/ui";
import { SplitViewSelector, DetailPanel } from "../creator/index.js";
import { AbilityBlock } from "../drawsteel/AbilityBlock.js";
import { drawSteelAbilityFromLike } from "../drawsteel/abilityData.js";
import { Search, Swords, Sparkles } from "lucide-react";

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

function formatStamina(stamina: SummonerMinionChoiceOption["stamina"]): string {
  return Array.isArray(stamina) ? stamina.join("/") : String(stamina);
}

function abilityStepCopy(heroClass: HeroClass | null): string {
  if (heroClass === "summoner") {
    return "Summoner Strike and Strike For Me are automatic. Choose your portfolio minions and one 5-essence ability.";
  }
  if (heroClass === "tactician") {
    return "Your kits grant your signature abilities. Choose one 3-focus ability and one 5-focus ability.";
  }
  if (
    heroClass === "conduit" ||
    heroClass === "elementalist" ||
    heroClass === "null" ||
    heroClass === "talent"
  ) {
    return "Choose two signature abilities, one 3pt ability, and one 5pt ability.";
  }
  return "Choose one signature ability, one 3pt ability, and one 5pt ability.";
}

export function AbilitiesStep({ character, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [previewedAbility, setPreviewedAbility] =
    useState<GameDataFeature | null>(null);
  const [previewedMinion, setPreviewedMinion] =
    useState<SummonerMinionChoiceOption | null>(null);

  const heroClass = character.heroClass as HeroClass | null;
  const slots = useMemo(
    () => WizardLogic.getAbilityChoiceSlots(character),
    [character],
  );
  const selectedSlot =
    slots.find((slot) => slot.id === selectedSlotId) ??
    slots.find(
      (slot) => !WizardLogic.getSelectedChoiceIdForSlot(character, slot),
    ) ??
    slots[0] ??
    null;
  const selectedCount = slots.filter(
    (slot) => !!WizardLogic.getSelectedChoiceIdForSlot(character, slot),
  ).length;
  const automaticAbilityIds = WizardLogic.getAutomaticAbilityIds(character);
  const automaticAbilities = automaticAbilityIds.map((abilityId) => {
    const ability = GameData.getAbility(abilityId);
    return ability?.name ?? abilityId;
  });
  const kitSignatureNames =
    heroClass === "tactician"
      ? WizardLogic.getSelectedKitIds(character)
          .map((kitId) => GameData.getKit(kitId)?.signatureAbility.name)
          .filter((name): name is string => !!name)
      : [];

  const abilityFeatures = useMemo(() => {
    if (!selectedSlot || selectedSlot.kind !== "ability") return [];
    return WizardLogic.getAbilityOptionsForSlot(
      character,
      selectedSlot,
    ) as unknown as GameDataFeature[];
  }, [character, selectedSlot]);

  const minionOptions = useMemo(() => {
    if (!selectedSlot || selectedSlot.kind !== "minion") return [];
    return WizardLogic.getSummonerMinionOptionsForSlot(character, selectedSlot);
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

  const filteredMinions = useMemo(() => {
    if (!searchQuery.trim()) return minionOptions;
    const query = searchQuery.toLowerCase();
    return minionOptions.filter((minion) => {
      if (minion.name.toLowerCase().includes(query)) return true;
      if (minion.role.toLowerCase().includes(query)) return true;
      if (
        minion.keywords.some((keyword) => keyword.toLowerCase().includes(query))
      )
        return true;
      return minion.traits.some((trait) =>
        `${trait.name} ${trait.description}`.toLowerCase().includes(query),
      );
    });
  }, [minionOptions, searchQuery]);

  const selectAbility = (id: string) => {
    if (!selectedSlot) return;

    const abilityChoices = { ...(character.abilityChoices ?? {}) };
    const summonerMinionChoices = {
      ...(character.summonerMinionChoices ?? {}),
    };

    for (const slot of slots) {
      if (slot.id === selectedSlot.id) continue;
      if (slot.kind === "minion") {
        if (summonerMinionChoices[slot.id] === id) {
          delete summonerMinionChoices[slot.id];
        }
      } else if (abilityChoices[slot.id] === id) {
        delete abilityChoices[slot.id];
      }
    }

    if (selectedSlot.kind === "minion") {
      summonerMinionChoices[selectedSlot.id] = id;
    } else {
      abilityChoices[selectedSlot.id] = id;
    }

    const nextCharacter = {
      ...character,
      abilityChoices,
      summonerMinionChoices,
      selectedAbilities: [],
    };

    onChange({
      abilityChoices,
      summonerMinionChoices,
      selectedAbilities: WizardLogic.getSelectedAbilityIds(nextCharacter),
    });
  };

  const renderCard = (
    ability: GameDataFeature,
    _isSelected: boolean,
    isPreviewed: boolean,
  ) => {
    const abilityView = drawSteelAbilityFromLike(ability);
    const isSelected = selectedSlot
      ? WizardLogic.getSelectedChoiceIdForSlot(character, selectedSlot) ===
        getFeatureId(ability)
      : false;

    return (
      <div
        className={cn(
          "block min-h-[4.75rem] w-full cursor-pointer rounded-md border bg-zinc-900/80 p-3 text-left text-zinc-100 shadow-sm shadow-black/20 transition",
          isSelected
            ? "border-flow-player/70 ring-1 ring-flow-player/45"
            : isPreviewed
              ? "border-zinc-500"
              : "border-zinc-800 hover:border-flow-player/45 hover:bg-zinc-900",
        )}
      >
        <h3 className="min-w-0 break-words text-sm font-black uppercase tracking-[0.08em] text-zinc-100">
          {abilityView.name}
        </h3>
        {abilityView.flavor ? (
          <p className="mt-2 line-clamp-2 text-xs italic leading-5 text-zinc-400">
            {abilityView.flavor}
          </p>
        ) : null}
      </div>
    );
  };

  const renderDetail = (ability: GameDataFeature) => {
    const id = getFeatureId(ability);
    const isSelected = selectedSlot
      ? WizardLogic.getSelectedChoiceIdForSlot(character, selectedSlot) === id
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

  const renderMinionCard = (
    minion: SummonerMinionChoiceOption,
    _isSelected: boolean,
    isPreviewed: boolean,
  ) => {
    const isSelected = selectedSlot
      ? WizardLogic.getSelectedChoiceIdForSlot(character, selectedSlot) ===
        minion.id
      : false;

    return (
      <div
        className={cn(
          "rounded-md border bg-creator-card p-3 transition",
          isSelected
            ? "border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/15"
            : isPreviewed
              ? "border-zinc-500"
              : "border-creator-border hover:border-creator-text-muted",
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold uppercase tracking-wider text-creator-text">
              {minion.name}
            </h3>
            <p className="mt-1 text-xs capitalize text-creator-text-muted">
              {minion.role} / Size {minion.size}
            </p>
          </div>
          <span className="shrink-0 rounded border border-creator-highlight/40 bg-creator-highlight/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-creator-highlight">
            {minion.essenceCost} Essence
          </span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] text-creator-text-muted">
          <div className="rounded bg-creator-bg px-1.5 py-1">
            <div className="uppercase">Sta</div>
            <div className="font-mono text-creator-text">
              {formatStamina(minion.stamina)}
            </div>
          </div>
          <div className="rounded bg-creator-bg px-1.5 py-1">
            <div className="uppercase">Spd</div>
            <div className="font-mono text-creator-text">{minion.speed}</div>
          </div>
          <div className="rounded bg-creator-bg px-1.5 py-1">
            <div className="uppercase">Stb</div>
            <div className="font-mono text-creator-text">
              {minion.stability}
            </div>
          </div>
          <div className="rounded bg-creator-bg px-1.5 py-1">
            <div className="uppercase">FS</div>
            <div className="font-mono text-creator-text">
              {minion.freeStrike}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {minion.keywords.slice(0, 4).map((keyword) => (
            <span
              key={keyword}
              className="rounded border border-creator-border px-1.5 py-0.5 text-[10px] uppercase text-creator-text-muted"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderMinionDetail = (minion: SummonerMinionChoiceOption) => {
    const isSelected = selectedSlot
      ? WizardLogic.getSelectedChoiceIdForSlot(character, selectedSlot) ===
        minion.id
      : false;

    return (
      <DetailPanel
        title={minion.name}
        subtitle={`${minion.essenceCost} Essence / ${minion.role} / Summons ${minion.minionsPerSummon}`}
        onSelect={() => selectAbility(minion.id)}
        selectLabel={isSelected ? "Selected" : `Select ${minion.name}`}
      >
        <div className="grid gap-4 text-sm text-creator-text">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded border border-creator-border bg-creator-card p-2">
              <div className="text-[10px] uppercase text-creator-text-muted">
                Size
              </div>
              <div className="font-mono">{minion.size}</div>
            </div>
            <div className="rounded border border-creator-border bg-creator-card p-2">
              <div className="text-[10px] uppercase text-creator-text-muted">
                Speed
              </div>
              <div className="font-mono">{minion.speed}</div>
            </div>
            <div className="rounded border border-creator-border bg-creator-card p-2">
              <div className="text-[10px] uppercase text-creator-text-muted">
                Stamina
              </div>
              <div className="font-mono">{formatStamina(minion.stamina)}</div>
            </div>
            <div className="rounded border border-creator-border bg-creator-card p-2">
              <div className="text-[10px] uppercase text-creator-text-muted">
                Stability
              </div>
              <div className="font-mono">{minion.stability}</div>
            </div>
            <div className="rounded border border-creator-border bg-creator-card p-2">
              <div className="text-[10px] uppercase text-creator-text-muted">
                Free Strike
              </div>
              <div className="font-mono">
                {minion.freeStrike} {minion.freeStrikeDamageType}
              </div>
            </div>
            <div className="rounded border border-creator-border bg-creator-card p-2">
              <div className="text-[10px] uppercase text-creator-text-muted">
                Movement
              </div>
              <div>
                {minion.movementModes.length
                  ? minion.movementModes.join(", ")
                  : "-"}
              </div>
            </div>
          </div>
          {minion.signatureAbilityName && (
            <div>
              <div className="text-xs uppercase tracking-wide text-creator-text-muted">
                Signature
              </div>
              <div>{minion.signatureAbilityName}</div>
            </div>
          )}
          {minion.traits.length > 0 && (
            <div className="grid gap-2">
              {minion.traits.map((trait) => (
                <div
                  key={trait.name}
                  className="rounded border border-creator-border bg-creator-card p-3"
                >
                  <div className="text-sm font-medium text-creator-text">
                    {trait.name}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-creator-text-muted">
                    {trait.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DetailPanel>
    );
  };

  // No class selected
  if (!heroClass) {
    return (
      <div className="flex h-[calc(100vh-12rem)] min-h-[560px] flex-col items-center justify-center">
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
      <div className="flex h-[calc(100vh-12rem)] min-h-[560px] flex-col items-center justify-center">
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

  if (selectedSlot?.kind === "ability" && abilityFeatures.length === 0) {
    return (
      <div className="flex h-[calc(100vh-12rem)] min-h-[560px] flex-col items-center justify-center">
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
    <div className="flex h-[calc(100vh-12rem)] min-h-[560px] flex-col">
      <div className="flex-shrink-0 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Choose Abilities</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {abilityStepCopy(heroClass)}
            </p>
          </div>
          <div className="rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
            <span
              className={cn(
                "font-medium",
                selectedCount >= slots.length
                  ? "text-creator-highlight"
                  : "text-zinc-200",
              )}
            >
              {selectedCount} / {slots.length}
            </span>{" "}
            filled
          </div>
        </div>

        {(automaticAbilities.length > 0 || kitSignatureNames.length > 0) && (
          <div className="rounded-md border border-creator-border bg-creator-card px-3 py-2">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-creator-text-muted">
              <Sparkles className="h-3.5 w-3.5 text-creator-highlight" />
              Automatic
            </div>
            <div className="flex flex-wrap gap-2">
              {[...automaticAbilities, ...kitSignatureNames].map((name) => (
                <span
                  key={name}
                  className="rounded border border-creator-highlight/40 bg-creator-highlight/10 px-2 py-1 text-xs text-creator-highlight"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {slots.map((slot) => {
              const selectedChoiceId = WizardLogic.getSelectedChoiceIdForSlot(
                character,
                slot,
              );
              const selectedAbility =
                selectedChoiceId && slot.kind === "ability"
                  ? WizardLogic.getAbilityOptionsForSlot(character, slot).find(
                      (ability) =>
                        WizardLogic.getAbilityFeatureId(ability) ===
                        selectedChoiceId,
                    )?.name
                  : null;
              const selectedMinion =
                selectedChoiceId && slot.kind === "minion"
                  ? WizardLogic.getSummonerMinionOptionsForSlot(
                      character,
                      slot,
                    ).find((minion) => minion.id === selectedChoiceId)?.name
                  : null;
              const active = selectedSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => {
                    setSelectedSlotId(slot.id);
                    setPreviewedAbility(null);
                    setPreviewedMinion(null);
                  }}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition",
                    active
                      ? "border-creator-highlight bg-creator-highlight/15 text-creator-highlight"
                      : selectedChoiceId
                        ? "border-green-700 bg-green-900/20 text-green-300"
                        : "border-creator-border text-creator-text-muted hover:border-creator-text-muted",
                  )}
                >
                  <div className="font-medium">{slot.label}</div>
                  <div className="mt-0.5 truncate text-xs opacity-75">
                    {selectedAbility ?? selectedMinion ?? slot.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder={
                selectedSlot?.kind === "minion"
                  ? "Search minions..."
                  : "Search abilities..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 pt-3">
        {selectedSlot?.kind === "minion" ? (
          <SplitViewSelector
            items={filteredMinions}
            selectedId={
              selectedSlot
                ? (WizardLogic.getSelectedChoiceIdForSlot(
                    character,
                    selectedSlot,
                  ) ?? null)
                : null
            }
            onPreview={setPreviewedMinion}
            onSelect={(item) => selectAbility(item.id)}
            renderCard={renderMinionCard}
            renderDetail={renderMinionDetail}
            previewedItem={previewedMinion}
            emptyMessage={
              searchQuery
                ? "No minions match your search"
                : "No minions available"
            }
            gridCols={1}
          />
        ) : (
          <SplitViewSelector
            items={filteredAbilities}
            selectedId={
              selectedSlot
                ? (WizardLogic.getSelectedChoiceIdForSlot(
                    character,
                    selectedSlot,
                  ) ?? null)
                : null
            }
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
        )}
      </div>
    </div>
  );
}
