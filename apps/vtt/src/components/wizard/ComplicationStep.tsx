import { useState, useMemo } from 'react';
import { COMPLICATIONS } from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import type { Complication } from '@anvil/types';
import { CardContent, cn, Input } from '@anvil/ui';
import { SplitViewSelector, SelectionCard, DetailPanel } from '../creator/index.js';
import { PhoneDecisionFlow } from '../creator/phone/index.js';
import { useWizardNavigation } from '../../stores/wizardStore.js';
import { buildComplicationScreens } from './phone/ComplicationScreens.js';
import { Check, X, Search } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

export function ComplicationStep({ character, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [previewedComplication, setPreviewedComplication] = useState<Complication | null>(
    () => {
      if (character.complication?.id) {
        return COMPLICATIONS.find((c) => c.id === character.complication?.id) ?? null;
      }
      return null;
    }
  );
  const { goNext } = useWizardNavigation();

  // Filter complications based on search
  const filteredComplications = useMemo(() => {
    if (!searchQuery.trim()) return COMPLICATIONS;
    const query = searchQuery.toLowerCase();
    return COMPLICATIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.benefit?.toLowerCase().includes(query) ||
        c.drawback?.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (complication: Complication) => {
    onChange({
      complication: {
        id: complication.id,
        name: complication.name,
        description: complication.description,
      },
    });
  };

  const handleClear = () => {
    onChange({ complication: null });
    setPreviewedComplication(null);
  };

  const renderCard = (
    complication: Complication,
    isSelected: boolean,
    isPreviewed: boolean
  ) => (
    <SelectionCard
      selected={isSelected}
      onClick={() => setPreviewedComplication(complication)}
      className={cn(isPreviewed && !isSelected && 'border-zinc-500')}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-zinc-100">{complication.name}</h4>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
              {complication.description}
            </p>
          </div>
          {isSelected && (
            <Check className="h-5 w-5 text-green-500 shrink-0 ml-2" />
          )}
        </div>
      </CardContent>
    </SelectionCard>
  );

  const renderDetail = (complication: Complication) => (
    <DetailPanel
      title={complication.name}
      onSelect={() => handleSelect(complication)}
      selectLabel={character.complication?.id === complication.id ? 'Selected' : `Select ${complication.name}`}
    >
      {/* Description */}
      <p className="text-sm text-zinc-300">{complication.description}</p>

      {/* Benefit */}
      {complication.benefit && (
        <div className="mt-4">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-400 mb-2">
            <Check className="h-3.5 w-3.5" />
            Benefit
          </h4>
          <div className="rounded-lg bg-green-950/30 border border-green-900/50 p-3">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{complication.benefit}</p>
          </div>
        </div>
      )}

      {/* Drawback */}
      {complication.drawback && (
        <div className="mt-4">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
            <X className="h-3.5 w-3.5" />
            Drawback
          </h4>
          <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-3">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{complication.drawback}</p>
          </div>
        </div>
      )}

      {/* Roll Number (for random generation) */}
      {complication.rollNumber !== undefined && (
        <div className="mt-4 text-xs text-zinc-500">
          Roll Number: {complication.rollNumber}
        </div>
      )}
    </DetailPanel>
  );

  // Shared by desktop's split view and the phone screen. The selector owns
  // its phone peek sheet (detail + Select), so this step has no step-level
  // BottomSheet.
  const renderComplicationSelector = () => (
    <SplitViewSelector
      items={filteredComplications}
      selectedId={character.complication?.id ?? null}
      onPreview={setPreviewedComplication}
      onSelect={handleSelect}
      renderCard={renderCard}
      renderDetail={renderDetail}
      previewedItem={previewedComplication}
      emptyMessage={searchQuery ? 'No complications match your search' : 'No complications available'}
      gridCols={1}
    />
  );

  // Phone: one optional screen — "Skip for now" advances to the next macro
  // step without touching an existing selection; the remove row mirrors
  // desktop's Clear Selection button.
  const screens = buildComplicationScreens({
    renderComplicationSelector,
    searchValue: searchQuery,
    onSearchChange: setSearchQuery,
    hasSelection: !!character.complication,
    onClear: handleClear,
    onSkip: goNext,
  });

  const renderDesktop = () => (
    <div className="flex h-[70dvh] flex-col md:h-[500px]">
      <div className="flex-shrink-0">
        <h2 className="mb-1 text-lg font-semibold">Complication</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Complications add depth to your backstory with benefits and drawbacks.
          This step is <strong>optional</strong> - you can skip it if you prefer.
        </p>

        {/* Search and Clear */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              className="pl-9"
              placeholder="Search complications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {character.complication && (
            <button
              onClick={handleClear}
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-zinc-300 transition"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">{renderComplicationSelector()}</div>
    </div>
  );

  return <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />;
}
