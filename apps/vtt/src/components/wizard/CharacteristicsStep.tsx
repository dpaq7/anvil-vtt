import { useMemo } from "react";
import { WizardLogic } from "@anvil/data";
import type { CharacterInProgress, Characteristics } from "@anvil/data";
import { cn, Button } from "@anvil/ui";
import { RotateCcw, Check, Lock } from "lucide-react";

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

type CharacteristicName = keyof Characteristics;

const CHARACTERISTIC_NAMES = WizardLogic.CHARACTERISTIC_ORDER;

function formatCharacteristicName(name: CharacteristicName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatModifier(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

function formatArray(values: number[]): string {
  return values.join(", ");
}

function arrayKey(values: number[]): string {
  return values.join(".");
}

function sameNumberMultiset(values: number[], target: number[]): boolean {
  if (values.length !== target.length) return false;

  const sortedValues = [...values].sort((a, b) => b - a);
  const sortedTarget = [...target].sort((a, b) => b - a);

  return sortedValues.every((value, index) => value === sortedTarget[index]);
}

function buildCharacteristics(
  fixed: Partial<Characteristics>,
  remainingNames: CharacteristicName[],
  values: number[],
): Characteristics {
  const characteristics = WizardLogic.createDefaultCharacteristics();

  for (const name of CHARACTERISTIC_NAMES) {
    const fixedValue = fixed[name];
    if (typeof fixedValue === "number") {
      characteristics[name] = fixedValue;
    }
  }

  remainingNames.forEach((name, index) => {
    characteristics[name] = values[index] ?? 0;
  });

  return characteristics;
}

function countValues(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return counts;
}

export function CharacteristicsStep({ character, onChange }: Props) {
  const rules = useMemo(
    () => WizardLogic.getCharacteristicAssignmentRules(character.heroClass),
    [character.heroClass],
  );

  const selectedArray = useMemo(() => {
    if (!rules || !character.characteristics) return null;

    const remainingValues = rules.remainingNames.map(
      (name) => character.characteristics?.[name] ?? 0,
    );

    return rules.arrays.find((array) => sameNumberMultiset(remainingValues, array)) ?? null;
  }, [character.characteristics, rules]);

  const selectedArrayValues = useMemo(
    () => Array.from(new Set(selectedArray ?? [])).sort((a, b) => b - a),
    [selectedArray],
  );

  const isComplete = WizardLogic.isValidStartingCharacteristics(
    character.characteristics,
    character.heroClass,
  );

  const chooseArray = (array: number[]) => {
    if (!rules) return;
    onChange({
      characteristics: buildCharacteristics(rules.fixed, rules.remainingNames, array),
    });
  };

  const assignValue = (name: CharacteristicName, value: number) => {
    if (!rules || !selectedArray || !character.characteristics) return;

    const currentValue = character.characteristics[name];
    if (currentValue === value) return;

    const next = { ...character.characteristics };
    const allowedCounts = countValues(selectedArray);
    const usedElsewhere = rules.remainingNames
      .filter((candidate) => candidate !== name)
      .reduce((counts, candidate) => {
        const candidateValue = next[candidate];
        counts.set(candidateValue, (counts.get(candidateValue) ?? 0) + 1);
        return counts;
      }, new Map<number, number>());

    if ((usedElsewhere.get(value) ?? 0) >= (allowedCounts.get(value) ?? 0)) {
      const swapTarget = rules.remainingNames.find(
        (candidate) => candidate !== name && next[candidate] === value,
      );
      if (swapTarget) {
        next[swapTarget] = currentValue;
      }
    }

    next[name] = value;
    onChange({ characteristics: next });
  };

  const resetArray = () => {
    onChange({ characteristics: null });
  };

  if (!rules) {
    return (
      <div className="h-[500px] flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 p-6 text-center">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Assign Characteristics</h2>
          <p className="text-sm text-zinc-400">
            Choose a class before assigning characteristics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="mb-1 text-lg font-semibold">Assign Characteristics</h2>
        <p className="mb-4 text-sm text-zinc-400">
          You start with{" "}
          <span className="text-creator-highlight">
            {rules.fixedNames
              .map((name) => `${formatModifier(rules.fixed[name] ?? 0)} in ${formatCharacteristicName(name)}`)
              .join(" and ")}
          </span>
          . Choose a set of values for the other characteristics.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4 sm:grid-cols-5">
          {CHARACTERISTIC_NAMES.map((name) => {
            const fixedValue = rules.fixed[name];
            const currentValue = character.characteristics?.[name];
            const isFixed = typeof fixedValue === "number";
            const value = isFixed ? fixedValue : currentValue;

            return (
              <div
                key={name}
                className={cn(
                  "rounded-lg border px-2 py-2 text-center",
                  isFixed
                    ? "border-creator-highlight/50 bg-creator-highlight/10"
                    : "border-zinc-700 bg-zinc-900/30",
                )}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wide text-zinc-500">
                  {isFixed && <Lock className="h-3 w-3 text-creator-highlight" />}
                  {formatCharacteristicName(name)}
                </div>
                <div
                  className={cn(
                    "mt-1 text-lg font-bold",
                    value === undefined
                      ? "text-zinc-600"
                      : value > 0
                        ? "text-green-400"
                        : value < 0
                          ? "text-red-400"
                          : "text-zinc-400",
                  )}
                >
                  {value === undefined ? "--" : formatModifier(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Remaining Array
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={resetArray}
              className="h-8 px-2 text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            {rules.arrays.map((array) => {
              const selected = selectedArray ? sameNumberMultiset(selectedArray, array) : false;

              return (
                <button
                  key={arrayKey(array)}
                  type="button"
                  onClick={() => chooseArray(array)}
                  className={cn(
                    "flex h-12 w-full items-center justify-center rounded-lg border text-base font-semibold transition",
                    selected
                      ? "border-creator-highlight bg-creator-highlight/15 text-creator-highlight"
                      : "border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/60",
                  )}
                >
                  {formatArray(array)}
                </button>
              );
            })}
          </div>
        </section>

        {selectedArray && character.characteristics && (
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Assign Values
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rules.remainingNames.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-900/30 px-3 py-2"
                >
                  <span className="text-sm font-medium text-zinc-300">
                    {formatCharacteristicName(name)}
                  </span>
                  <div className="flex gap-1">
                    {selectedArrayValues.map((value) => {
                      const selected = character.characteristics?.[name] === value;

                      return (
                        <button
                          key={`${name}-${value}`}
                          type="button"
                          onClick={() => assignValue(name, value)}
                          className={cn(
                            "h-8 min-w-9 rounded-md border px-2 text-sm font-semibold transition",
                            selected
                              ? "border-creator-highlight bg-creator-highlight/20 text-creator-highlight"
                              : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800",
                          )}
                        >
                          {formatModifier(value)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex-shrink-0 mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Remaining stats:{" "}
            {rules.remainingNames.map(formatCharacteristicName).join(", ")}
          </div>
          {isComplete ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Check className="h-3.5 w-3.5" />
              Valid
            </span>
          ) : (
            <span className="text-xs text-zinc-500">Choose an array</span>
          )}
        </div>
      </div>
    </div>
  );
}
