import { GameData } from '@anvil/data';
import type { CharacterInProgress, CultureBenefit } from '@anvil/data';
import { Card, CardContent, cn } from '@anvil/ui';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

// Descriptions for each culture type
const CULTURE_DESCRIPTIONS = {
  // Environments
  nomadic: 'Your people traveled constantly, never settling in one place for long. You learned to read the land and negotiate with strangers.',
  rural: 'You grew up in farming villages or small towns, learning practical skills and local traditions.',
  secluded: 'Your community was isolated from the wider world, developing its own customs and deep bonds between members.',
  urban: 'You were raised in a city, exposed to diverse peoples, political intrigue, and the bustle of commerce.',
  wilderness: 'Far from civilization, you learned to survive in nature and craft what you needed from the land.',
  // Organizations
  bureaucratic: 'Your community was organized by hierarchy and formal institutions. You learned to navigate rules and social structures.',
  communal: 'Decisions were made collectively, and resources were shared. You learned cooperation and practical skills.',
  // Upbringings
  academic: 'You received formal education, studying texts and learning from scholars.',
  creative: 'You were encouraged to express yourself through art, music, or craftsmanship.',
  labor: 'Hard work was your teacher. You learned practical trades and physical endurance.',
  lawless: 'Rules were for others. You learned to survive by your wits in the shadows.',
  martial: 'Combat and discipline shaped your youth. You trained in warfare and tactics.',
  noble: 'Born to privilege, you learned etiquette, diplomacy, and the art of influence.',
};

const PRESET_GROUPS = [
  { type: 'professional', label: 'Professional Cultures' },
  { type: 'bespoke', label: 'Bespoke Cultures' },
] as const;

type CulturePreset = ReturnType<typeof GameData.getPrebuiltCultures>[number];

export function CultureStep({ character, onChange }: Props) {
  const environments = GameData.getCulturesByType('environment');
  const organizations = GameData.getCulturesByType('organization');
  const upbringings = GameData.getCulturesByType('upbringing');
  const selectedPreset = character.culture.preset
    ? GameData.getPrebuiltCulture(character.culture.preset)
    : null;
  const visibleSelectedPreset =
    selectedPreset?.type === 'professional' || selectedPreset?.type === 'bespoke'
      ? selectedPreset
      : null;
  const hasBespokeSelections = Boolean(
    character.culture.environment ||
      character.culture.organization ||
      character.culture.upbringing
  );
  const showBespokeBuilder =
    character.culture.preset === 'bespoke-culture' ||
    selectedPreset?.type === 'ancestral' ||
    (!character.culture.preset && hasBespokeSelections);

  const updateCulture = (field: 'environment' | 'organization' | 'upbringing', value: string) => {
    const cultureSkills = { ...character.cultureSkills };
    delete cultureSkills[field];

    onChange({
      culture: {
        ...character.culture,
        [field]: value,
        preset: character.culture.preset === 'bespoke-culture' ? 'bespoke-culture' : null,
        language: null,
      },
      cultureSkills,
    });
  };

  const selectPreset = (preset: CulturePreset) => {
    if (preset.type === 'bespoke' || !preset.environment || !preset.organization || !preset.upbringing) {
      onChange({
        culture: {
          ...character.culture,
          preset: preset.id,
          language: null,
        },
        cultureSkills: {},
      });
      return;
    }

    onChange({
      culture: {
        environment: preset.environment.type,
        organization: preset.organization.type,
        upbringing: preset.upbringing.type,
        preset: preset.id,
        language: getLanguageId(preset.language),
      },
      cultureSkills: {},
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-lg font-semibold">Choose Your Culture</h2>
        <p className="text-sm text-zinc-400">
          Your culture determines the skill groups you can choose from.
        </p>
      </div>

      <div className="flex flex-col gap-7">
        {PRESET_GROUPS.map((group) => (
          <CulturePresetGroup
            key={group.type}
            label={group.label}
            items={GameData.getPrebuiltCulturesByType(group.type)}
            selectedId={visibleSelectedPreset?.id ?? null}
            onSelect={selectPreset}
          />
        ))}
      </div>

      {showBespokeBuilder && (
        <div className="flex flex-col gap-6 border-t border-creator-border pt-6">
          <CultureGroup
            label="Environment"
            description="Where did you grow up?"
            items={environments}
            selected={character.culture.environment}
            onSelect={(type) => updateCulture('environment', type)}
          />
          <CultureGroup
            label="Organization"
            description="How was your community structured?"
            items={organizations}
            selected={character.culture.organization}
            onSelect={(type) => updateCulture('organization', type)}
          />
          <CultureGroup
            label="Upbringing"
            description="What kind of education or training did you receive?"
            items={upbringings}
            selected={character.culture.upbringing}
            onSelect={(type) => updateCulture('upbringing', type)}
          />
        </div>
      )}
    </div>
  );
}

function CulturePresetGroup({ label, items, selectedId, onSelect }: {
  label: string;
  items: CulturePreset[];
  selectedId: string | null;
  onSelect: (preset: CulturePreset) => void;
}) {
  return (
    <section>
      <h3 className="mb-3 border-b border-creator-border pb-2 text-sm font-semibold uppercase tracking-wider text-creator-text">
        {label}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <CulturePresetCard
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onSelect={() => onSelect(item)}
          />
        ))}
      </div>
    </section>
  );
}

function CulturePresetCard({ item, selected, onSelect }: {
  item: CulturePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'min-h-32 rounded-md border bg-creator-card p-4 text-left transition-all',
        selected
          ? 'border-creator-highlight bg-creator-highlight/15 ring-1 ring-creator-highlight/50'
          : 'border-creator-border hover:border-creator-highlight/60 hover:bg-creator-card-hover'
      )}
      onClick={onSelect}
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="min-w-0 text-base font-semibold uppercase tracking-wider text-creator-text">
            {item.name}
          </h4>
          {selected && <Check className="h-5 w-5 shrink-0 text-creator-highlight" />}
        </div>
        <div className="h-0.5 w-full rounded bg-creator-border" />
        <p className="text-sm leading-relaxed text-creator-text-muted">
          {item.description}
        </p>
        {item.language && (
          <span className="mt-auto inline-flex w-fit rounded bg-creator-border px-2 py-0.5 text-xs text-creator-text-muted">
            {item.language}
          </span>
        )}
      </div>
    </button>
  );
}

function getLanguageId(language: string | undefined): string | null {
  if (!language) return null;
  return (
    GameData.getLanguageByName(language)?.id ??
    GameData.getLanguage(language)?.id ??
    language.toLowerCase().replace(/\s+/g, '-')
  );
}

function CultureGroup({ label, description, items, selected, onSelect }: {
  label: string;
  description: string;
  items: CultureBenefit[];
  selected: string | null;
  onSelect: (type: string) => void;
}) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-creator-text">{label}</h3>
        <p className="text-xs text-creator-text-muted">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const isSelected = selected === item.id;
          const cultureDescription = CULTURE_DESCRIPTIONS[item.id as keyof typeof CULTURE_DESCRIPTIONS] ?? '';

          return (
            <Card
              key={item.id}
              className={cn(
                'cursor-pointer transition-all bg-creator-card',
                isSelected
                  ? 'border-creator-highlight ring-1 ring-creator-highlight/50'
                  : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
              )}
              onClick={() => onSelect(item.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-creator-text">{item.name}</h4>
                    <p className="mt-1 text-xs text-creator-text-muted line-clamp-2">
                      {cultureDescription}
                    </p>
                    {item.skill && (
                      <div className="mt-2">
                        <span className="inline-block text-xs bg-creator-border text-creator-text px-1.5 py-0.5 rounded">
                          {item.skill}
                        </span>
                      </div>
                    )}
                    {item.language && (
                      <div className="mt-1">
                        <span className="inline-block text-xs bg-creator-border text-creator-text-muted px-1.5 py-0.5 rounded">
                          +{item.language}
                        </span>
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-creator-highlight shrink-0 ml-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
