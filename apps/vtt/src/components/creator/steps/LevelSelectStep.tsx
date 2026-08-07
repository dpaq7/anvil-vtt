import { HeroLogic } from "@anvil/data";
import { cn } from "@anvil/ui";
import { getEchelonName } from "../../../lib/echelon.js";
import { useWizardStore } from "../../../stores/wizardStore.js";
import { PhoneDecisionFlow } from "../phone/index.js";
import { buildLevelScreens } from "../../wizard/phone/LevelScreens.js";

const LEVEL_RANGE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const ECHELON_COLORS: Record<number, string> = {
  1: "border-creator-border bg-creator-card",
  2: "border-blue-700/50 bg-blue-950/30",
  3: "border-purple-700/50 bg-purple-950/30",
  4: "border-creator-highlight/50 bg-creator-highlight/20",
};

const SELECTED_COLOR =
  "border-creator-highlight bg-creator-highlight/20 ring-1 ring-creator-highlight/50";

export function LevelSelectStep() {
  const character = useWizardStore((state) => state.character);
  const setLevel = useWizardStore((state) => state.setLevel);

  const selectedLevel = character.level || 1;

  // Group levels by echelon
  const levelsByEchelon = LEVEL_RANGE.reduce(
    (acc, level) => {
      const echelon = HeroLogic.getEchelon(level);
      if (!acc[echelon]) {
        acc[echelon] = [];
      }
      acc[echelon].push(level);
      return acc;
    },
    {} as Record<number, number[]>,
  );

  // Phone: one screen, a row per level. setLevel regenerates the wizard's
  // step list, but this remains the one-screen 'level' step, so the phone
  // flow's sub-step registration is unaffected.
  const screens = buildLevelScreens({
    levels: LEVEL_RANGE.map((level) => {
      const echelon = HeroLogic.getEchelon(level);
      return {
        level,
        echelon,
        echelonName: getEchelonName(echelon),
      };
    }),
    selectedLevel,
    onSelectLevel: setLevel,
  });

  const renderDesktop = () => (
    <div>
      <p className="mb-6 text-sm text-creator-text-muted">
        Choose your starting level. Higher levels unlock additional abilities
        and power, but require making level-up choices for each level.
      </p>

      <div className="space-y-4">
        {Object.entries(levelsByEchelon).map(([echelonStr, levels]) => {
          const echelon = parseInt(echelonStr, 10);
          const echelonName = getEchelonName(echelon);

          return (
            <div key={echelon}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xs font-semibold text-creator-text uppercase tracking-wider">
                  {echelonName}
                </h3>
                <span className="text-xs text-creator-text-muted">
                  Echelon {echelon}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {levels.map((level) => {
                  const isSelected = level === selectedLevel;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setLevel(level)}
                      className={cn(
                        "w-12 h-12 flex items-center justify-center rounded-md border transition-all",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-creator-highlight",
                        isSelected
                          ? SELECTED_COLOR
                          : cn(ECHELON_COLORS[echelon], "hover:brightness-125"),
                      )}
                    >
                      <span
                        className={cn(
                          "text-lg font-bold",
                          isSelected
                            ? "text-creator-highlight"
                            : "text-creator-text",
                        )}
                      >
                        {level}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedLevel > 1 && (
        <div className="mt-6 rounded-lg border border-creator-highlight/50 bg-creator-highlight/10 p-3">
          <h4 className="text-sm font-semibold text-creator-highlight">
            Level {selectedLevel} Selected
          </h4>
          <p className="mt-1 text-xs text-creator-text">
            You will complete {selectedLevel - 1} level-up{" "}
            {selectedLevel - 1 === 1 ? "step" : "steps"} (L2
            {selectedLevel > 2 ? `–L${selectedLevel}` : ""}) after base
            character creation.
          </p>
        </div>
      )}
    </div>
  );

  return <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />;
}
