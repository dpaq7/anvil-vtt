import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function CultureStep({ character, onChange }: Props) {
  const environments = GameData.getCulturesByType('environment');
  const organizations = GameData.getCulturesByType('organization');
  const upbringings = GameData.getCulturesByType('upbringing');

  const updateCulture = (field: 'environment' | 'organization' | 'upbringing', value: string) => {
    onChange({
      culture: { ...character.culture, [field]: value },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Choose Your Culture</h2>
        <p className="text-sm text-zinc-400">Select an environment, organization, and upbringing.</p>
      </div>

      <CultureGroup
        label="Environment"
        items={environments}
        selected={character.culture.environment}
        onSelect={(id) => updateCulture('environment', id)}
      />
      <CultureGroup
        label="Organization"
        items={organizations}
        selected={character.culture.organization}
        onSelect={(id) => updateCulture('organization', id)}
      />
      <CultureGroup
        label="Upbringing"
        items={upbringings}
        selected={character.culture.upbringing}
        onSelect={(id) => updateCulture('upbringing', id)}
      />
    </div>
  );
}

function CultureGroup({ label, items, selected, onSelect }: {
  label: string;
  items: Array<{ id: string; name: string; description?: string }>;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-zinc-300">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={`rounded-md border px-3 py-1.5 text-sm transition ${
              selected === item.id
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-600'
            }`}
            onClick={() => onSelect(item.id)}
            title={item.description}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
