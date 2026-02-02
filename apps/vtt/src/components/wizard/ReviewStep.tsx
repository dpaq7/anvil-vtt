import type { CharacterInProgress } from '@anvil/data';
import { WizardLogic } from '@anvil/data';
import { WizardPreview } from './WizardPreview.js';

interface Props {
  character: CharacterInProgress;
}

export function ReviewStep({ character }: Props) {
  const complete = WizardLogic.isCharacterComplete(character);
  const progress = WizardLogic.getWizardProgress(character);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Review Your Hero</h2>
      <p className="mb-4 text-sm text-zinc-400">
        {complete
          ? 'Your hero is ready! Click Save Hero to finish.'
          : `Your hero is ${Math.round(progress * 100)}% complete. Go back to fill in missing steps.`}
      </p>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <WizardPreview character={character} />
      </div>
    </div>
  );
}
