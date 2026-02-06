import type { Ancestry, AncestryFeature } from '@anvil/types';
import { Button, cn } from '@anvil/ui';
import { Check, Sparkles, X } from 'lucide-react';

interface Props {
  ancestry: Ancestry & { quickBuild?: string[] };
  selectedTraitIds: string[];
  onChange: (traitIds: string[]) => void;
  disabled?: boolean;
}

/**
 * Point-buy trait selector for ancestry traits.
 * Groups traits by cost and enforces the ancestry point budget.
 */
export function TraitSelector({
  ancestry,
  selectedTraitIds,
  onChange,
  disabled = false,
}: Props) {
  const traits = ancestry.purchasedTraits ?? [];

  // Calculate spent and remaining points
  const spentPoints = selectedTraitIds.reduce((sum, id) => {
    const trait = traits.find((t) => t.id === id);
    return sum + (trait?.cost ?? 0);
  }, 0);

  const remainingPoints = ancestry.ancestryPoints - spentPoints;

  // Check if a trait can be selected (either already selected or affordable)
  const canSelectTrait = (trait: AncestryFeature): boolean => {
    if (disabled) return false;
    if (selectedTraitIds.includes(trait.id)) return true;
    return (trait.cost ?? 0) <= remainingPoints;
  };

  // Toggle trait selection
  const toggleTrait = (trait: AncestryFeature) => {
    if (disabled) return;

    if (selectedTraitIds.includes(trait.id)) {
      // Deselect
      onChange(selectedTraitIds.filter((id) => id !== trait.id));
    } else if (canSelectTrait(trait)) {
      // Select
      onChange([...selectedTraitIds, trait.id]);
    }
  };

  // Quick build - find traits by name matching quickBuild suggestions
  const applyQuickBuild = () => {
    const quickBuildSuggestions = ancestry.quickBuild;
    if (disabled || !quickBuildSuggestions?.length) return;

    const quickBuildIds = quickBuildSuggestions
      .map((name) => {
        // Match trait by name (handle partial matches like "Psionic Gift (Psionic Bolt)")
        const normalizedName = name.toLowerCase().split('(')[0]?.trim() ?? '';
        return traits.find(
          (t) =>
            t.name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(t.name.toLowerCase())
        )?.id;
      })
      .filter((id): id is string => id !== undefined);

    onChange(quickBuildIds);
  };

  // Clear all selections
  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  // Group traits by cost
  const onePointTraits = traits.filter((t) => t.cost === 1);
  const twoPointTraits = traits.filter((t) => t.cost === 2);

  const hasQuickBuild = ancestry.quickBuild && ancestry.quickBuild.length > 0;

  return (
    <div className="mt-4">
      {/* Header with budget pill */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
          Purchasable Traits
        </h4>
        <div className="flex items-center gap-2">
          {/* Budget pill */}
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              remainingPoints === 0
                ? 'bg-creator-highlight/20 text-creator-highlight border border-creator-highlight/50'
                : 'bg-creator-card text-creator-text-muted border border-creator-border'
            )}
          >
            {spentPoints}/{ancestry.ancestryPoints} pts
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-3">
        {hasQuickBuild && (
          <Button
            variant="outline"
            size="sm"
            onClick={applyQuickBuild}
            disabled={disabled || selectedTraitIds.length > 0}
            className="text-xs border-creator-border text-creator-text hover:bg-creator-card-hover"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Quick Build
          </Button>
        )}
        {selectedTraitIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-creator-text-muted hover:text-creator-text"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Trait sections */}
      <div className="space-y-4">
        {/* 1-Point Traits */}
        {onePointTraits.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-creator-text-muted mb-2">
              1-Point Traits
            </h5>
            <div className="space-y-2">
              {onePointTraits.map((trait) => (
                <TraitCard
                  key={trait.id}
                  trait={trait}
                  selected={selectedTraitIds.includes(trait.id)}
                  affordable={canSelectTrait(trait)}
                  disabled={disabled}
                  onClick={() => toggleTrait(trait)}
                />
              ))}
            </div>
          </div>
        )}

        {/* 2-Point Traits */}
        {twoPointTraits.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-creator-text-muted mb-2">
              2-Point Traits
            </h5>
            <div className="space-y-2">
              {twoPointTraits.map((trait) => (
                <TraitCard
                  key={trait.id}
                  trait={trait}
                  selected={selectedTraitIds.includes(trait.id)}
                  affordable={canSelectTrait(trait)}
                  disabled={disabled}
                  onClick={() => toggleTrait(trait)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TraitCardProps {
  trait: AncestryFeature;
  selected: boolean;
  affordable: boolean;
  disabled: boolean;
  onClick: () => void;
}

function TraitCard({
  trait,
  selected,
  affordable,
  disabled,
  onClick,
}: TraitCardProps) {
  const isClickable = !disabled && affordable;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'w-full text-left rounded-lg border p-2 transition-all',
        // Base state
        'bg-creator-card border-creator-border',
        // Selected state
        selected && 'bg-creator-highlight/20 border-creator-highlight ring-1 ring-creator-highlight/50',
        // Hover state (only if clickable)
        isClickable && !selected && 'hover:bg-creator-card-hover hover:border-creator-text-muted',
        isClickable && selected && 'hover:bg-creator-highlight/30',
        // Disabled/unaffordable state
        !isClickable && !selected && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'font-medium text-sm',
                selected ? 'text-creator-highlight' : 'text-creator-text'
              )}
            >
              {trait.name}
            </span>
            {selected && (
              <Check className="w-4 h-4 text-creator-highlight shrink-0" />
            )}
          </div>
          <p className="mt-1 text-xs text-creator-text-muted line-clamp-2">
            {trait.description}
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-mono px-1.5 py-0.5 rounded shrink-0',
            selected
              ? 'bg-creator-highlight/30 text-creator-highlight'
              : 'bg-creator-border text-creator-text-muted'
          )}
        >
          {trait.cost ?? 0} pt{(trait.cost ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}
