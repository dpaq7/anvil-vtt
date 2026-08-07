import type { CharacterInProgress, DerivedStats } from '@anvil/data';
import { WizardLogic, HeroLogic } from '@anvil/data';
import { ScrollArea, cn } from '@anvil/ui';
import { getEchelonName } from '../../lib/echelon.js';
import { resolveWizardSummary } from '../wizard/wizard-summary.js';

interface Props {
  character: CharacterInProgress;
  visible: boolean;
}

function SidebarField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-sm text-creator-text-muted">{label}</span>
      <span className="ml-3 max-w-36 text-right text-sm font-medium text-creator-text">
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
  const summary = resolveWizardSummary(character);
  const kitDisplay =
    [summary.kitName, summary.secondaryKitName].filter(Boolean).join(', ') || null;

  const echelonName = getEchelonName(HeroLogic.getEchelon(character.level || 1));

  // summary.stats is null until a class is picked; the sidebar still shows
  // baseline defaults then, which calculateDerivedStats returns directly.
  const derivedStats: DerivedStats =
    summary.stats ?? WizardLogic.calculateDerivedStats(character);

  // Format characteristics
  const chars = character.characteristics;
  const charDisplay = chars
    ? `M${chars.might} A${chars.agility} R${chars.reason} I${chars.intuition} P${chars.presence}`
    : null;

  return (
    <div
      className={cn(
        'hidden shrink-0 border-l border-creator-border bg-creator-bg transition-all duration-300 overflow-hidden md:block',
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
              <SidebarField label="Ancestry" value={summary.ancestryName} />
              <SidebarField label="Culture" value={summary.cultureDisplay} />
              <SidebarField label="Career" value={summary.careerName} />
              <SidebarField label="Class" value={summary.className} />
              <SidebarField label="Subclass" value={summary.subclassName} />
              <SidebarField label="Complication" value={summary.complicationName} />
              <SidebarField label={summary.secondaryKitName ? "Kits" : "Kit"} value={kitDisplay} />
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
