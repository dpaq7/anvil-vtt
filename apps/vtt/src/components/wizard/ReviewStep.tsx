import type { CharacterInProgress } from "@anvil/data";
import { GameData, HeroLogic, WizardLogic } from "@anvil/data";
import { PhoneDecisionFlow } from "../creator/phone/index.js";
import { WizardPreview } from "./WizardPreview.js";
import { formatScore, resolveWizardSummary } from "./wizard-summary.js";
import { buildReviewScreens } from "./phone/ReviewScreens.js";
import type { ReviewField } from "./phone/ReviewScreens.js";

interface Props {
  character: CharacterInProgress;
}

const REQUIRED_STEP_LABELS: Record<number, string> = {
  [WizardLogic.WIZARD_STEPS.ANCESTRY]: "Ancestry",
  [WizardLogic.WIZARD_STEPS.CULTURE]: "Culture",
  [WizardLogic.WIZARD_STEPS.CAREER]: "Career",
  [WizardLogic.WIZARD_STEPS.CLASS]: "Class",
  [WizardLogic.WIZARD_STEPS.SUBCLASS]: "Subclass",
  [WizardLogic.WIZARD_STEPS.CHARACTERISTICS]: "Characteristics",
  [WizardLogic.WIZARD_STEPS.KIT]: "Kit",
  [WizardLogic.WIZARD_STEPS.SKILLS]: "Skills",
  [WizardLogic.WIZARD_STEPS.LANGUAGES]: "Languages",
  [WizardLogic.WIZARD_STEPS.PERKS]: "Perks",
  [WizardLogic.WIZARD_STEPS.ABILITIES]: "Abilities",
  [WizardLogic.WIZARD_STEPS.PERSONAL]: "Personal",
};

// Mirrors LevelSelectStep's echelon naming (HeroLogic.getEchelon has no name lookup).
const ECHELON_NAMES: Record<number, string> = {
  1: "Adventurer",
  2: "Veteran",
  3: "Master",
  4: "Legend",
};

function getMissingStepText(character: CharacterInProgress): string | null {
  const firstIncomplete = WizardLogic.getFirstIncompleteStep(character);
  if (!firstIncomplete) return null;

  if (firstIncomplete === WizardLogic.WIZARD_STEPS.SKILLS) {
    const needed = WizardLogic.getSkillSelectionsNeeded(character);
    const made = WizardLogic.getSkillSelectionsMade(character);
    const remaining = Math.max(needed - made, 0);
    return `Missing: Skills (${remaining} selection${remaining === 1 ? "" : "s"} remaining).`;
  }

  if (firstIncomplete === WizardLogic.WIZARD_STEPS.ABILITIES) {
    const slots = WizardLogic.getAbilityChoiceSlots(character);
    const made = slots.filter((slot) => !!WizardLogic.getSelectedChoiceIdForSlot(character, slot)).length;
    const remaining = Math.max(slots.length - made, 0);
    return `Missing: Abilities (${remaining} slot${remaining === 1 ? "" : "s"} remaining).`;
  }

  return `Missing: ${REQUIRED_STEP_LABELS[firstIncomplete] ?? "Required step"}.`;
}

export function ReviewStep({ character }: Props) {
  const complete = WizardLogic.isCharacterComplete(character);
  const progress = WizardLogic.getWizardProgress(character);
  const missingStepText = getMissingStepText(character);

  // Phone: resolve every selection here through the same lookup path the
  // desktop preview uses, then hand the builder plain strings — nulls
  // render as muted dashes so gaps are visible without duplicating the
  // footer's Create Hero completion gate.
  const summary = resolveWizardSummary(character);
  const echelon = HeroLogic.getEchelon(character.level || 1);
  const echelonName = ECHELON_NAMES[echelon] ?? `Echelon ${echelon}`;
  const kitDisplay =
    [summary.kitName, summary.secondaryKitName].filter(Boolean).join(", ") || null;
  const selectableLanguages = GameData.getSelectableLanguages();
  const languageNames = character.selectedLanguages.map(
    (id) => selectableLanguages.find((lang) => lang.id === id)?.name ?? id,
  );
  const titleNames = character.selectedTitles
    .map((title) => title.name.trim())
    .filter(Boolean);
  const chars = character.characteristics;

  const identity: ReviewField[] = [
    { label: "Name", value: character.name.trim() || null },
    { label: "Level", value: `${character.level || 1} (${echelonName})` },
    { label: "Ancestry", value: summary.ancestryName },
    { label: "Culture", value: summary.cultureDisplay },
    { label: "Career", value: summary.careerName },
    { label: "Class", value: summary.className },
    { label: "Subclass", value: summary.subclassName },
    { label: "Complication", value: summary.complicationName },
    { label: summary.secondaryKitName ? "Kits" : "Kit", value: kitDisplay },
    ...(summary.companionName
      ? [{ label: "Companion", value: summary.companionName }]
      : []),
  ];

  const stats: ReviewField[] = [
    { label: "Stamina", value: summary.stats ? String(summary.stats.stamina) : null },
    { label: "Speed", value: summary.stats ? String(summary.stats.speed) : null },
    { label: "Stability", value: summary.stats ? String(summary.stats.stability) : null },
    { label: "Size", value: summary.stats ? summary.stats.size : null },
    { label: "Recoveries", value: summary.stats ? String(summary.stats.recoveries) : null },
  ];

  const selections: ReviewField[] = [
    { label: "Skills", value: summary.selectedSkills.join(", ") || null },
    { label: "Languages", value: languageNames.join(", ") || null },
    { label: "Perks", value: summary.selectedPerks.join(", ") || null },
    { label: "Titles", value: titleNames.join(", ") || null },
    { label: "Abilities", value: summary.selectedAbilities.join(", ") || null },
    ...(summary.selectedMinions.length > 0
      ? [{ label: "Minions", value: summary.selectedMinions.join(", ") }]
      : []),
  ];

  const screens = buildReviewScreens({
    complete,
    progress,
    missingText: missingStepText,
    identity,
    stats,
    characteristics: chars
      ? `M${formatScore(chars.might)} A${formatScore(chars.agility)} R${formatScore(chars.reason)} I${formatScore(chars.intuition)} P${formatScore(chars.presence)}`
      : null,
    selections,
  });

  const renderDesktop = () => (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Review Your Hero</h2>
      <p className="mb-2 text-sm text-zinc-400">
        {complete
          ? "Your hero is ready! Click Create Hero to finish."
          : `Your hero is ${progress}% complete. Go back to fill in missing steps.`}
      </p>
      {!complete && missingStepText ? (
        <p className="mb-4 text-sm font-medium text-sidebar-player">
          {missingStepText}
        </p>
      ) : (
        <div className="mb-4" />
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <WizardPreview character={character} />
      </div>
    </div>
  );

  return <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />;
}
