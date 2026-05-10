import type { CharacterInProgress } from "@anvil/data";
import { WizardLogic } from "@anvil/data";
import { WizardPreview } from "./WizardPreview.js";

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
  [WizardLogic.WIZARD_STEPS.PERSONAL]: "Personal",
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

  return `Missing: ${REQUIRED_STEP_LABELS[firstIncomplete] ?? "Required step"}.`;
}

export function ReviewStep({ character }: Props) {
  const complete = WizardLogic.isCharacterComplete(character);
  const progress = WizardLogic.getWizardProgress(character);
  const missingStepText = getMissingStepText(character);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Review Your Hero</h2>
      <p className="mb-2 text-sm text-zinc-400">
        {complete
          ? "Your hero is ready! Click Save Hero to finish."
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
}
