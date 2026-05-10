import { useMemo } from "react";
import { WizardLogic } from "@anvil/data";
import type { CharacterInProgress, Characteristics } from "@anvil/data";
import type { HeroClass } from "@anvil/types";
import { cn, Button } from "@anvil/ui";
import { Sparkles, RotateCcw, Check } from "lucide-react";

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

type CharacteristicName = keyof Characteristics;

const CHARACTERISTIC_NAMES: CharacteristicName[] = [
  "might",
  "agility",
  "reason",
  "intuition",
  "presence",
];

// The standard array values to assign
const STANDARD_ARRAY = [2, 2, 1, 0, -1];

// Available values for the point-buy interface
const AVAILABLE_VALUES = [2, 2, 1, 0, -1];

// Class potency characteristics (the characteristics each class cares about most)
const CLASS_POTENCY: Record<HeroClass, CharacteristicName[]> = {
  beastheart: ["might", "intuition"],
  censor: ["might", "presence"],
  conduit: ["intuition"],
  elementalist: ["reason"],
  fury: ["might", "agility"],
  null: ["agility", "intuition"],
  shadow: ["agility"],
  summoner: ["reason"],
  tactician: ["might", "reason"],
  talent: ["reason", "presence"],
  troubadour: ["agility", "presence"],
};

// Recommended arrays per class (puts highest values in potency characteristics)
function getRecommendedArray(heroClass: HeroClass): Characteristics {
  const potency = CLASS_POTENCY[heroClass] || [];

  // Start with a default assignment
  const result: Characteristics = {
    might: 0,
    agility: 0,
    reason: 0,
    intuition: 0,
    presence: 0,
  };

  const available = [...AVAILABLE_VALUES];

  // Assign highest values to potency characteristics
  for (const char of potency) {
    const maxIdx = available.indexOf(Math.max(...available));
    if (maxIdx !== -1) {
      result[char] = available[maxIdx]!;
      available.splice(maxIdx, 1);
    }
  }

  // Assign remaining values to other characteristics
  const remaining = CHARACTERISTIC_NAMES.filter((c) => !potency.includes(c));
  for (const char of remaining) {
    if (available.length > 0) {
      // Sort remaining to get somewhat reasonable distribution
      available.sort((a, b) => b - a);
      result[char] = available.shift()!;
    }
  }

  return result;
}

// Calculate what values are still available to assign
function getAvailableValues(chars: Characteristics): number[] {
  const used = CHARACTERISTIC_NAMES.map((n) => chars[n]);
  const available = [...AVAILABLE_VALUES];

  for (const val of used) {
    const idx = available.indexOf(val);
    if (idx !== -1) {
      available.splice(idx, 1);
    }
  }

  return available.sort((a, b) => b - a);
}

// Check if current assignment is valid (uses exactly the standard array)
function isValidAssignment(chars: Characteristics): boolean {
  const values = CHARACTERISTIC_NAMES.map((n) => chars[n]).sort(
    (a, b) => b - a,
  );
  const target = [...STANDARD_ARRAY].sort((a, b) => b - a);
  return values.every((v, i) => v === target[i]);
}

export function CharacteristicsStep({ character, onChange }: Props) {
  const heroClass = character.heroClass as HeroClass | null;
  const chars =
    character.characteristics ?? WizardLogic.createDefaultCharacteristics();

  // Get potency characteristics for current class
  const potencyChars = useMemo(() => {
    if (!heroClass) return [];
    return CLASS_POTENCY[heroClass] || [];
  }, [heroClass]);

  // Get recommended array for current class
  const recommended = useMemo(() => {
    if (!heroClass) return null;
    return getRecommendedArray(heroClass);
  }, [heroClass]);

  // Calculate what's available to assign
  const availableValues = useMemo(() => getAvailableValues(chars), [chars]);

  // Check if assignment is complete and valid
  const isComplete = isValidAssignment(chars);
  const total = CHARACTERISTIC_NAMES.reduce((sum, n) => sum + chars[n], 0);

  // Handle clicking a value button to assign it
  const assignValue = (characteristic: CharacteristicName, value: number) => {
    // If clicking the same value that's already assigned, unassign it
    if (chars[characteristic] === value) {
      onChange({ characteristics: { ...chars, [characteristic]: 0 } });
      return;
    }

    // Check if this value is available (or is the current value for this stat)
    const available = getAvailableValues(chars);
    const currentValue = chars[characteristic];

    // Add back the current value to available pool for comparison
    if (currentValue !== 0 || AVAILABLE_VALUES.includes(0)) {
      available.push(currentValue);
    }

    if (!available.includes(value)) {
      return; // Value not available
    }

    onChange({ characteristics: { ...chars, [characteristic]: value } });
  };

  // Apply recommended array
  const applyRecommended = () => {
    if (recommended) {
      onChange({ characteristics: recommended });
    }
  };

  // Reset to all zeros
  const resetArray = () => {
    onChange({
      characteristics: {
        might: 0,
        agility: 0,
        reason: 0,
        intuition: 0,
        presence: 0,
      },
    });
  };

  // Check if a value button should be enabled
  const isValueAvailable = (
    characteristic: CharacteristicName,
    value: number,
  ): boolean => {
    // Always allow selecting current value (to toggle off)
    if (chars[characteristic] === value) return true;

    // Check if this value is in the available pool
    const available = getAvailableValues(chars);
    // Add back current value since we're considering swapping
    if (chars[characteristic] !== 0 || AVAILABLE_VALUES.includes(0)) {
      const curr = chars[characteristic];
      if (!available.includes(curr)) {
        available.push(curr);
      }
    }

    return available.includes(value);
  };

  return (
    <div className="h-[500px] flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="mb-1 text-lg font-semibold">Assign Characteristics</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Click to assign values from the standard array:{" "}
          <strong>+2, +2, +1, 0, -1</strong>
          {potencyChars.length > 0 && (
            <>
              {" "}
              — Your class benefits most from{" "}
              <span className="text-creator-highlight">
                {potencyChars
                  .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
                  .join(" & ")}
              </span>
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {heroClass && recommended && (
            <Button
              variant="outline"
              size="sm"
              onClick={applyRecommended}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              Apply Recommended
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetArray}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      {/* Characteristics Grid */}
      <div className="flex-1 space-y-4">
        {CHARACTERISTIC_NAMES.map((name) => {
          const isPotency = potencyChars.includes(name);
          const currentValue = chars[name];

          return (
            <div
              key={name}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg border transition",
                isPotency
                  ? "border-creator-highlight/50 bg-creator-highlight/10"
                  : "border-zinc-700 bg-zinc-900/30",
              )}
            >
              {/* Characteristic Name */}
              <div className="w-28 flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium capitalize",
                    isPotency ? "text-creator-highlight" : "text-zinc-300",
                  )}
                >
                  {name}
                </span>
                {isPotency && (
                  <Sparkles className="h-3.5 w-3.5 text-creator-highlight" />
                )}
              </div>

              {/* Value Buttons */}
              <div className="flex gap-2">
                {[-1, 0, 1, 2].map((value) => {
                  const isSelected = currentValue === value;
                  const isAvailable = isValueAvailable(name, value);

                  return (
                    <button
                      key={value}
                      onClick={() => assignValue(name, value)}
                      disabled={!isAvailable && !isSelected}
                      className={cn(
                        "w-12 h-10 rounded-lg border text-sm font-bold transition",
                        isSelected
                          ? "border-blue-500 bg-blue-500/20 text-blue-400"
                          : isAvailable
                            ? "border-zinc-600 bg-zinc-800/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700/50"
                            : "border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed",
                      )}
                    >
                      {value >= 0 ? `+${value}` : value}
                    </button>
                  );
                })}
              </div>

              {/* Current Value Display */}
              <div className="ml-auto flex items-center gap-2">
                <span
                  className={cn(
                    "w-10 text-center text-lg font-bold",
                    currentValue > 0
                      ? "text-green-400"
                      : currentValue < 0
                        ? "text-red-400"
                        : "text-zinc-500",
                  )}
                >
                  {currentValue >= 0 ? `+${currentValue}` : currentValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Available values:{" "}
            {availableValues.length > 0 ? (
              availableValues.map((v, i) => (
                <span key={i} className="font-mono">
                  {v >= 0 ? `+${v}` : v}
                  {i < availableValues.length - 1 ? ", " : ""}
                </span>
              ))
            ) : (
              <span className="text-green-400">All assigned</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">
              Total:{" "}
              <span className="font-mono">
                {total >= 0 ? `+${total}` : total}
              </span>
            </span>
            {isComplete && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check className="h-3.5 w-3.5" />
                Valid
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
