import { useState, useMemo } from 'react';
import {
  PERKS,
  PERK_CATEGORY_INFO,
  ALL_PERK_CATEGORIES,
  getAvailablePerkCategories,
  getClassPerkLevels,
} from '@anvil/data';
import type { CharacterInProgress } from '@anvil/data';
import type { Perk, PerkCategory, HeroClass } from '@anvil/types';
import { CardContent, cn, Input } from '@anvil/ui';
import { SplitViewSelector, SelectionCard, DetailPanel } from '../creator/index.js';
import { Check, Search, Lock, Sparkles, Compass, Users, BookOpen, Search as SearchIcon, Hammer } from 'lucide-react';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

// Map categories to icons
const CATEGORY_ICONS: Record<PerkCategory, React.ComponentType<{ className?: string }>> = {
  crafting: Hammer,
  exploration: Compass,
  interpersonal: Users,
  intrigue: SearchIcon,
  lore: BookOpen,
  supernatural: Sparkles,
};

// Get perks granted at each level up to the current level
function getPerkSlots(heroClass: HeroClass | null, level: number): { level: number; categories: PerkCategory[] }[] {
  if (!heroClass) return [];

  const perkLevels = getClassPerkLevels(heroClass);
  const slots: { level: number; categories: PerkCategory[] }[] = [];

  for (const perkLevel of perkLevels) {
    if (perkLevel <= level) {
      const categories = getAvailablePerkCategories(heroClass, perkLevel);
      slots.push({ level: perkLevel, categories });
    }
  }

  return slots;
}

export function PerksStep({ character, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  const [previewedPerk, setPreviewedPerk] = useState<Perk | null>(null);

  const heroClass = character.heroClass as HeroClass | null;
  const level = character.level ?? 1;

  // Get perk slots for this class and level
  const perkSlots = useMemo(() => getPerkSlots(heroClass, level), [heroClass, level]);

  // Get perks already selected across all slots
  const selectedPerkIds = new Set(character.selectedPerks ?? []);

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
          PERK_CATEGORY_INFO[p.category].name.toLowerCase().includes(query)
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
  const currentSlotPerkId = character.selectedPerks?.[selectedSlot] ?? null;

  const handleSelectPerk = (perk: Perk) => {
    const newPerks = [...(character.selectedPerks ?? [])];
    // Ensure array has enough slots
    while (newPerks.length < perkSlots.length) {
      newPerks.push('');
    }
    newPerks[selectedSlot] = perk.id;
    onChange({ selectedPerks: newPerks });
  };

  const handleClearSlot = () => {
    const newPerks = [...(character.selectedPerks ?? [])];
    if (newPerks[selectedSlot]) {
      newPerks[selectedSlot] = '';
      onChange({ selectedPerks: newPerks });
    }
    setPreviewedPerk(null);
  };

  // Flatten perks for SplitViewSelector
  const flatPerks = Object.values(perksByCategory).flat();

  const renderCard = (perk: Perk, isSelected: boolean, isPreviewed: boolean) => {
    const isSelectedElsewhere = !isSelected && selectedPerkIds.has(perk.id);
    const CategoryIcon = CATEGORY_ICONS[perk.category];

    return (
      <SelectionCard
        selected={isSelected}
        onClick={() => setPreviewedPerk(perk)}
        className={cn(
          isPreviewed && !isSelected && 'border-zinc-500',
          isSelectedElsewhere && 'opacity-50'
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-4 w-4 text-zinc-400 shrink-0" />
                <h4 className="font-medium text-zinc-100 truncate">{perk.name}</h4>
              </div>
              <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{perk.description}</p>
            </div>
            {isSelected && <Check className="h-5 w-5 text-green-500 shrink-0 ml-2" />}
            {isSelectedElsewhere && <Lock className="h-4 w-4 text-zinc-500 shrink-0 ml-2" />}
          </div>
        </CardContent>
      </SelectionCard>
    );
  };

  const renderDetail = (perk: Perk) => {
    const isSelectedElsewhere = selectedPerkIds.has(perk.id) && currentSlotPerkId !== perk.id;
    const CategoryIcon = CATEGORY_ICONS[perk.category];
    const categoryInfo = PERK_CATEGORY_INFO[perk.category];

    return (
      <DetailPanel
        title={perk.name}
        onSelect={isSelectedElsewhere ? undefined : () => handleSelectPerk(perk)}
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
          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{perk.description}</p>
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

  // If no perks available at this level
  if (perkSlots.length === 0) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center">
        <div className="text-center text-zinc-500">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-lg font-semibold mb-2">No Perks Available</h2>
          <p className="text-sm max-w-md">
            {!heroClass
              ? 'Select a class first to see available perks.'
              : level < 2
                ? 'Perks are gained starting at level 2. Increase your level to unlock perk selections.'
                : 'Your class and level combination has no perk slots available.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] flex flex-col">
      <div className="flex-shrink-0">
        <h2 className="mb-1 text-lg font-semibold">Select Perks</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Choose perks gained at levels 2, 4, 6, and 8. Some levels restrict which categories you can choose from.
        </p>

        {/* Slot Selector */}
        <div className="flex gap-2 mb-4">
          {perkSlots.map((slot, index) => {
            const slotPerkId = character.selectedPerks?.[index];
            const slotPerk = slotPerkId ? PERKS.find((p) => p.id === slotPerkId) : null;
            const isActive = selectedSlot === index;
            const hasSelection = !!slotPerk;
            const isRestricted = slot.categories.length < ALL_PERK_CATEGORIES.length;

            return (
              <button
                key={slot.level}
                onClick={() => setSelectedSlot(index)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition',
                  isActive
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : hasSelection
                      ? 'border-green-700 bg-green-900/20 text-green-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  Level {slot.level}
                  {hasSelection && <Check className="h-3.5 w-3.5" />}
                  {isRestricted && !hasSelection && <Lock className="h-3 w-3 opacity-50" />}
                </div>
                {slotPerk && (
                  <div className="text-xs mt-0.5 truncate opacity-75">{slotPerk.name}</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Restrictions Info */}
        <div className="flex items-center gap-2 mb-3 text-xs text-zinc-400">
          <span>Available categories:</span>
          {isAnyCategory ? (
            <span className="inline-flex px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 text-xs">Any</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allowedCategories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-600 text-xs text-zinc-300">
                    <Icon className="h-3 w-3" />
                    {PERK_CATEGORY_INFO[cat].name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Search and Clear */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
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
              className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md text-zinc-300 transition"
            >
              Clear Slot
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
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
          gridCols={1}
        />
      </div>

      <div className="flex-shrink-0 mt-4 pt-3 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          {perkSlots.filter((_, i) => character.selectedPerks?.[i]).length} / {perkSlots.length} perk slots filled
        </p>
      </div>
    </div>
  );
}
