import { useState, useMemo } from 'react';
import {
  PERKS,
  PERK_CATEGORY_INFO,
  ALL_PERK_CATEGORIES,
  WizardLogic,
} from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import type { Perk, PerkCategory } from '@anvil/types';
import { CardContent, cn, Input } from '@anvil/ui';
import {
  SplitViewSelector,
  SelectionCard,
  DetailPanel,
} from '../creator/index.js';
import {
  Check,
  Search,
  Lock,
  Sparkles,
  Compass,
  Users,
  BookOpen,
  Search as SearchIcon,
  Hammer,
} from 'lucide-react';
import { BottomSheet, PhoneDecisionFlow } from '../creator/phone/index.js';
import { buildPerksScreens } from './phone/PerksScreens.js';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

// Map categories to icons
const CATEGORY_ICONS: Record<
  PerkCategory,
  React.ComponentType<{ className?: string }>
> = {
  crafting: Hammer,
  exploration: Compass,
  interpersonal: Users,
  intrigue: SearchIcon,
  lore: BookOpen,
  supernatural: Sparkles,
};

interface PerkSlot {
  id: string;
  label: string;
  description: string;
  categories: PerkCategory[];
  source: 'career' | 'class';
  classIndex?: number;
  selectedPerkId: string | null;
}

function getPerkSlots(character: CharacterInProgress): PerkSlot[] {
  let classIndex = 0;
  return WizardLogic.getPerkChoiceSlots(character).map((slot) => {
    const mapped: PerkSlot = {
      id: slot.id,
      label: slot.label,
      description: slot.description,
      categories: slot.categories as PerkCategory[],
      source: slot.source,
      selectedPerkId: slot.selectedPerkId,
    };
    if (slot.source === 'class') {
      mapped.classIndex = classIndex;
      classIndex += 1;
    }
    return mapped;
  });
}

export function PerksStep({ character, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [previewedPerk, setPreviewedPerk] = useState<Perk | null>(null);
  const [peekPerk, setPeekPerk] = useState<Perk | null>(null);

  const level = character.level ?? 1;

  const perkSlots = useMemo(() => getPerkSlots(character), [character]);

  // Get perks already selected across all slots
  const selectedPerkIds = new Set(WizardLogic.getSelectedPerkIds(character));

  // Current slot info
  const currentSlot = perkSlots[selectedSlot];
  const allowedCategories = currentSlot?.categories ?? ALL_PERK_CATEGORIES;
  const isAnyCategory = allowedCategories.length === ALL_PERK_CATEGORIES.length;

  // Filter perks for current slot
  const availablePerks = useMemo(() => {
    let perks = PERKS.filter((p) => allowedCategories.includes(p.category));

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      perks = perks.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          PERK_CATEGORY_INFO[p.category].name.toLowerCase().includes(query),
      );
    }

    return perks;
  }, [allowedCategories, searchQuery]);

  // Group perks by category
  const perksByCategory = useMemo(() => {
    const grouped: Partial<Record<PerkCategory, Perk[]>> = {};
    for (const perk of availablePerks) {
      if (!grouped[perk.category]) {
        grouped[perk.category] = [];
      }
      grouped[perk.category]!.push(perk);
    }
    return grouped;
  }, [availablePerks]);

  // Get the perk selected for the current slot
  const currentSlotPerkId = currentSlot?.selectedPerkId ?? null;

  const selectPerkForSlot = (slot: PerkSlot, perk: Perk) => {
    if (slot.source === 'career') {
      onChange({ careerPerk: perk.id });
      return;
    }

    const newPerks = [...(character.selectedPerks ?? [])];
    const classIndex = slot.classIndex ?? 0;
    while (newPerks.length <= classIndex) newPerks.push('');
    newPerks[classIndex] = perk.id;
    onChange({ selectedPerks: newPerks });
  };

  const handleSelectPerk = (perk: Perk) => {
    if (!currentSlot) return;
    selectPerkForSlot(currentSlot, perk);
  };

  const handleClearSlot = () => {
    if (!currentSlot) return;

    if (currentSlot.source === 'career') {
      onChange({ careerPerk: null });
    } else {
      const newPerks = [...(character.selectedPerks ?? [])];
      const classIndex = currentSlot.classIndex ?? 0;
      if (newPerks[classIndex]) {
        newPerks[classIndex] = '';
        onChange({ selectedPerks: newPerks });
      }
    }
    setPreviewedPerk(null);
  };

  // Flatten perks for SplitViewSelector
  const flatPerks = Object.values(perksByCategory).flat();

  const renderCard = (
    perk: Perk,
    isSelected: boolean,
    isPreviewed: boolean,
  ) => {
    const isSelectedElsewhere = !isSelected && selectedPerkIds.has(perk.id);
    const CategoryIcon = CATEGORY_ICONS[perk.category];

    return (
      <SelectionCard
        selected={isSelected}
        onClick={() => setPreviewedPerk(perk)}
        className={cn(
          isPreviewed && !isSelected && 'border-zinc-500',
          isSelectedElsewhere && 'opacity-50',
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-4 w-4 text-zinc-400 shrink-0" />
                <h4 className="font-medium text-zinc-100 truncate">
                  {perk.name}
                </h4>
              </div>
              <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                {perk.description}
              </p>
            </div>
            {isSelected && (
              <Check className="h-5 w-5 text-green-500 shrink-0 ml-2" />
            )}
            {isSelectedElsewhere && (
              <Lock className="h-4 w-4 text-zinc-500 shrink-0 ml-2" />
            )}
          </div>
        </CardContent>
      </SelectionCard>
    );
  };

  const renderDetail = (perk: Perk) => {
    const isSelectedElsewhere =
      selectedPerkIds.has(perk.id) && currentSlotPerkId !== perk.id;
    const CategoryIcon = CATEGORY_ICONS[perk.category];
    const categoryInfo = PERK_CATEGORY_INFO[perk.category];

    return (
      <DetailPanel
        title={perk.name}
        onSelect={
          isSelectedElsewhere ? undefined : () => handleSelectPerk(perk)
        }
        selectLabel={
          isSelectedElsewhere
            ? 'Already selected in another slot'
            : currentSlotPerkId === perk.id
              ? 'Selected'
              : `Select ${perk.name}`
        }
      >
        {/* Category Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-600 text-xs font-medium text-zinc-300">
            <CategoryIcon className="h-3.5 w-3.5" />
            {categoryInfo.name}
          </span>
        </div>

        {/* Description */}
        <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-4">
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
            {perk.description}
          </p>
        </div>

        {/* Category Info */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            About {categoryInfo.name} Perks
          </h4>
          <p className="text-xs text-zinc-400">{categoryInfo.description}</p>
        </div>
      </DetailPanel>
    );
  };

  // Phone: one decision screen per perk slot.
  const screens = buildPerksScreens({
    slots: perkSlots,
    emptyHelper: !character.career
      ? 'Select a career first to see available perks.'
      : level < 2
        ? 'Your current choices do not grant a perk slot.'
        : 'Your class and level combination has no perk slots available.',
    selectedPerkIds,
    getEligiblePerks: (categories) =>
      PERKS.filter((p) => categories.includes(p.category)),
    onSelectPerk: (slotId, perk) => {
      const slot = perkSlots.find((s) => s.id === slotId);
      if (slot) selectPerkForSlot(slot, perk);
    },
    onPeekPerk: setPeekPerk,
  });

  const renderDesktop = () => {
    // If no perks available at this level
    if (perkSlots.length === 0) {
      return (
        <div className="flex h-[calc(100vh-12rem)] min-h-[560px] flex-col items-center justify-center">
          <div className="text-center text-zinc-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-lg font-semibold mb-2">No Perks Available</h2>
            <p className="text-sm max-w-md">
              {!character.career
                ? 'Select a career first to see available perks.'
                : level < 2
                  ? 'Your current choices do not grant a perk slot.'
                  : 'Your class and level combination has no perk slots available.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-12rem)] min-h-[560px] flex-col">
        <div className="flex-shrink-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Select Perks</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Choose the perk granted by your career, plus any class perks
                unlocked by your level.
              </p>
            </div>
            <div className="rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400">
              <span className="font-medium text-zinc-200">
                {perkSlots.filter((slot) => slot.selectedPerkId).length} /{' '}
                {perkSlots.length}
              </span>{' '}
              filled
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
            {/* Slot Selector */}
            <div className="flex flex-wrap gap-2">
              {perkSlots.map((slot, index) => {
                const slotPerkId = slot.selectedPerkId;
                const slotPerk = slotPerkId
                  ? PERKS.find((p) => p.id === slotPerkId)
                  : null;
                const isActive = selectedSlot === index;
                const hasSelection = !!slotPerk;
                const isRestricted =
                  slot.categories.length < ALL_PERK_CATEGORIES.length;

                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(index)}
                    className={cn(
                      'min-w-[12rem] max-w-full rounded-md border px-3 py-1.5 text-left text-sm font-medium transition',
                      isActive
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : hasSelection
                          ? 'border-green-700 bg-green-900/20 text-green-400'
                          : 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {slot.label}
                      {hasSelection && <Check className="h-3.5 w-3.5" />}
                      {isRestricted && !hasSelection && (
                        <Lock className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                    {slotPerk && (
                      <div className="mt-0.5 truncate text-xs opacity-75">
                        {slotPerk.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search and Clear */}
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  className="pl-9"
                  placeholder="Search perks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {currentSlotPerkId && (
                <button
                  onClick={handleClearSlot}
                  className="shrink-0 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
                >
                  Clear Slot
                </button>
              )}
            </div>
          </div>

          {/* Category Restrictions Info */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>Available categories:</span>
            {isAnyCategory ? (
              <span className="inline-flex px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-xs">
                Any
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allowedCategories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-600 text-xs text-zinc-300"
                    >
                      <Icon className="h-3 w-3" />
                      {PERK_CATEGORY_INFO[cat].name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 pt-3">
          <SplitViewSelector
            items={flatPerks}
            selectedId={currentSlotPerkId}
            onPreview={setPreviewedPerk}
            onSelect={handleSelectPerk}
            renderCard={renderCard}
            renderDetail={renderDetail}
            previewedItem={previewedPerk}
            emptyMessage={
              searchQuery
                ? 'No perks match your search'
                : 'No perks available for these categories'
            }
            gridCols={2}
            listClassName="lg:w-[58%]"
            detailClassName="lg:w-[42%]"
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />
      {/* Renders null on desktop: nothing there ever sets peekPerk. */}
      <BottomSheet
        open={peekPerk !== null}
        onClose={() => setPeekPerk(null)}
        title={peekPerk?.name}
      >
        {peekPerk && (
          <>
            <p className="text-xs font-medium uppercase tracking-wider text-creator-text-muted">
              {PERK_CATEGORY_INFO[peekPerk.category].name} Perk
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-creator-text">
              {peekPerk.description}
            </p>
          </>
        )}
      </BottomSheet>
    </>
  );
}
