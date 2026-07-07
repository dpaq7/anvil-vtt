import type { CharacterInProgress, Title } from '@anvil/data';
import { Button, Input } from '@anvil/ui';
import { PhoneDecisionFlow } from '../creator/phone/index.js';
import { useWizardNavigation } from '../../stores/wizardStore.js';
import { buildTitlesScreens } from './phone/TitlesScreens.js';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function TitlesStep({ character, onChange }: Props) {
  const { goNext } = useWizardNavigation();

  const addTitle = () => {
    onChange({
      selectedTitles: [
        ...character.selectedTitles,
        { id: crypto.randomUUID(), name: '', description: '' },
      ],
    });
  };

  const updateTitle = (index: number, updates: Partial<Title>) => {
    const titles = [...character.selectedTitles];
    const current = titles[index]!;
    titles[index] = { id: current.id, name: current.name, ...updates };
    onChange({ selectedTitles: titles });
  };

  const removeTitle = (index: number) => {
    onChange({ selectedTitles: character.selectedTitles.filter((_, i) => i !== index) });
  };

  // Phone: one optional screen — "Skip for now" advances to the next macro
  // step; titles stay free-text entries, mirroring desktop's add/remove rows.
  const screens = buildTitlesScreens({
    titles: character.selectedTitles,
    onAddTitle: addTitle,
    onRenameTitle: (index, name) => updateTitle(index, { name }),
    onRemoveTitle: removeTitle,
    onSkip: goNext,
  });

  const renderDesktop = () => (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Titles</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Add any titles your character has earned. This step is optional.
      </p>

      <div className="flex flex-col gap-3">
        {character.selectedTitles.map((title, i) => (
          <div key={title.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Input
                value={title.name}
                onChange={(e) => updateTitle(i, { name: e.target.value })}
                placeholder="Title name"
              />
            </div>
            <Button variant="ghost" className="text-zinc-500 hover:text-red-400" onClick={() => removeTitle(i)}>
              Remove
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" className="mt-3" onClick={addTitle}>
        Add Title
      </Button>
    </div>
  );

  return <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />;
}
