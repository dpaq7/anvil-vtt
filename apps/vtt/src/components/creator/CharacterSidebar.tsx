import type { CharacterInProgress, DerivedStats } from '@anvil/data';
import { WizardLogic, GameData, HeroLogic } from '@anvil/data';
import { ScrollArea, cn } from '@anvil/ui';

interface Props {
  character: CharacterInProgress;
  visible: boolean;
}

function SidebarField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-sm text-creator-text-muted">{label}</span>
      <span className="text-sm font-medium text-creator-text">
        {value || <span className="text-creator-border">—</span>}
      </span>
    </div>
  );
}

function StatField({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded bg-creator-card px-2 py-1">
      <span className="text-xs text-creator-text-muted">{label}</span>
      <span className="text-sm font-semibold text-creator-text">{value}</span>
    </div>
  );
}

export function CharacterSidebar({ character, visible }: Props) {
  // Get resolved names from IDs
  const ancestryName = character.ancestry
    ? GameData.getAncestry(character.ancestry)?.name ?? character.ancestry
    : null;

  const careerName = character.career
    ? GameData.getCareer(character.career)?.name ?? character.career
    : null;

  const kitName = character.kit
    ? GameData.getKit(character.kit)?.name ?? character.kit
    : null;

  // Format class name
  const className = character.heroClass
    ? character.heroClass.charAt(0).toUpperCase() + character.heroClass.slice(1)
    : null;

  // Format subclass
  let subclassDisplay: string | null = null;
  if (character.subclass && character.heroClass) {
    const subclasses = Array.isArray(character.subclass)
      ? character.subclass
      : [character.subclass];
    const subclassNames = subclasses.map((id) => {
      const subclass = GameData.getSubclass(character.heroClass!, id);
      return subclass?.name ?? id;
    });
    subclassDisplay = subclassNames.join(', ');
  }

  // Get echelon name
  const echelon = HeroLogic.getEchelon(character.level || 1);
  const echelonNames = ['', 'Adventurer', 'Veteran', 'Master', 'Legend'];
  const echelonName = echelonNames[echelon] || '';

  // Calculate derived stats
  const derivedStats: DerivedStats = WizardLogic.calculateDerivedStats(character);

  // Format characteristics
  const chars = character.characteristics;
  const charDisplay = chars
    ? `M${chars.might} A${chars.agility} R${chars.reason} I${chars.intuition} P${chars.presence}`
    : null;

  return (
    <div
      className={cn(
        'shrink-0 border-l border-creator-border bg-creator-bg transition-all duration-300 overflow-hidden',
        visible ? 'w-64' : 'w-0'
      )}
    >
      <ScrollArea className="h-full">
        <div className="p-4 min-w-64">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-creator-text-muted uppercase tracking-wider">
              Character
            </h3>
          </div>

          {/* Identity Section */}
          <div className="mb-4">
            <div className="text-xs font-medium text-creator-text-muted uppercase tracking-wider mb-2">
              Identity
            </div>
            <div className="space-y-0.5">
              <SidebarField label="Name" value={character.name || null} />
              <SidebarField
                label="Level"
                value={`${character.level || 1} (${echelonName})`}
              />
              <SidebarField label="Ancestry" value={ancestryName} />
              <SidebarField label="Career" value={careerName} />
              <SidebarField label="Class" value={className} />
              <SidebarField label="Subclass" value={subclassDisplay} />
              <SidebarField label="Kit" value={kitName} />
            </div>
          </div>

          {/* Stats Section */}
          <div className="mb-4">
            <div className="text-xs font-medium text-creator-text-muted uppercase tracking-wider mb-2">
              Stats
            </div>
            <div className="grid grid-cols-2 gap-1">
              <StatField label="Stamina" value={derivedStats.stamina} />
              <StatField label="Speed" value={derivedStats.speed} />
              <StatField label="Stability" value={derivedStats.stability} />
              <StatField label="Size" value={derivedStats.size} />
              <StatField label="Recoveries" value={derivedStats.recoveries} />
            </div>
          </div>

          {/* Characteristics Section */}
          {charDisplay && (
            <div className="mb-4">
              <div className="text-xs font-medium text-creator-text-muted uppercase tracking-wider mb-2">
                Characteristics
              </div>
              <div className="text-sm font-mono text-creator-text bg-creator-card rounded px-2 py-1">
                {charDisplay}
              </div>
            </div>
          )}

          {/* Progress Section */}
          <div>
            <div className="text-xs font-medium text-creator-text-muted uppercase tracking-wider mb-2">
              Progress
            </div>
            <div className="h-2 rounded-full bg-creator-card overflow-hidden">
              <div
                className="h-full bg-creator-highlight transition-all duration-300"
                style={{ width: `${WizardLogic.getWizardProgress(character)}%` }}
              />
            </div>
            <div className="text-xs text-creator-text-muted mt-1 text-right">
              {WizardLogic.getWizardProgress(character)}% complete
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
