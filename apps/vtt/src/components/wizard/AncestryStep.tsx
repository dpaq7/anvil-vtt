import { useState } from 'react';
import { GameData } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import type { Ancestry } from '@anvil/types';
import { CardContent, cn } from '@anvil/ui';
import { SplitViewSelector, SelectionCard, DetailPanel } from '../creator/index.js';
import { TraitSelector } from './TraitSelector.js';
import { Check } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function AncestryStep({ character, onChange }: Props) {
  // Get ancestries from GameData and cast to the Ancestry type from @anvil/types
  const ancestries = GameData.getAllAncestries() as unknown as Ancestry[];
  const [previewedAncestry, setPreviewedAncestry] = useState<Ancestry | null>(
    () => {
      if (character.ancestry) {
        return ancestries.find((a) => a.id === character.ancestry) ?? null;
      }
      return null;
    }
  );

  const handleSelect = (ancestry: Ancestry) => {
    onChange({ ancestry: ancestry.id, ancestryTraits: [] });
  };

  const renderCard = (
    ancestry: Ancestry,
    isSelected: boolean,
    isPreviewed: boolean
  ) => (
    <SelectionCard
      selected={isSelected}
      onClick={() => setPreviewedAncestry(ancestry)}
      className={cn(isPreviewed && !isSelected && 'border-zinc-500')}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-zinc-100">{ancestry.name}</h4>
            <p className="mt-1 text-xs text-zinc-400">
              Size: {ancestry.size} · Speed: {ancestry.speed}
            </p>
          </div>
          {isSelected && (
            <Check className="h-5 w-5 text-green-500 shrink-0" />
          )}
        </div>
      </CardContent>
    </SelectionCard>
  );

  const renderDetail = (ancestry: Ancestry) => (
    <DetailPanel
      title={ancestry.name}
      subtitle={`Size: ${ancestry.size} · Speed: ${ancestry.speed} · ${ancestry.ancestryPoints} Ancestry Points`}
      onSelect={() => handleSelect(ancestry)}
      selectLabel={character.ancestry === ancestry.id ? 'Selected' : `Select ${ancestry.name}`}
    >
      {/* Description */}
      <p className="text-sm text-zinc-300">{ancestry.description}</p>

      {/* Signature Feature */}
      {ancestry.signatureFeature && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Signature Feature
          </h4>
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-3">
            <div className="font-medium text-zinc-200">{ancestry.signatureFeature.name}</div>
            <p className="mt-1 text-sm text-zinc-400">{ancestry.signatureFeature.description}</p>
          </div>
        </div>
      )}

      {/* Purchasable Traits */}
      {ancestry.purchasedTraits && ancestry.purchasedTraits.length > 0 && (
        <TraitSelector
          ancestry={ancestry}
          selectedTraitIds={
            character.ancestry === ancestry.id ? character.ancestryTraits : []
          }
          onChange={(traitIds) => onChange({ ancestryTraits: traitIds })}
          disabled={character.ancestry !== ancestry.id}
        />
      )}
    </DetailPanel>
  );

  return (
    <div className="h-[500px]">
      <p className="mb-4 text-sm text-zinc-400">
        Your ancestry determines your size, speed, and unique traits. Click an ancestry to preview, then select it to continue.
      </p>

      <SplitViewSelector
        items={ancestries}
        selectedId={character.ancestry}
        onPreview={setPreviewedAncestry}
        onSelect={handleSelect}
        renderCard={renderCard}
        renderDetail={renderDetail}
        previewedItem={previewedAncestry}
        emptyMessage="No ancestries available"
        gridCols={1}
      />
    </div>
  );
}
