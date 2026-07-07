import { PERK_CATEGORY_INFO } from '@anvil/data';
import type { Perk, PerkCategory } from '@anvil/types';
import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of PerksStep's PerkSlot that the phone screens need. */
export interface PerkSlotChoice {
  id: string;
  label: string;
  description: string;
  categories: PerkCategory[];
  selectedPerkId: string | null;
}

interface BuildPerksScreensArgs {
  slots: PerkSlotChoice[];
  /** Mirrors the desktop guard copy for the no-slots case. */
  emptyHelper: string;
  /** Perk ids taken by any slot — disabled outside the slot that owns them. */
  selectedPerkIds: ReadonlySet<string>;
  getEligiblePerks: (categories: PerkCategory[]) => Perk[];
  onSelectPerk: (slotId: string, perk: Perk) => void;
  onPeekPerk: (perk: Perk) => void;
}

/**
 * One decision screen per perk slot. Rendered by PhoneDecisionFlow on phone
 * viewports only — desktop keeps PerksStep's original layout.
 */
export function buildPerksScreens({
  slots,
  emptyHelper,
  selectedPerkIds,
  getEligiblePerks,
  onSelectPerk,
  onPeekPerk,
}: BuildPerksScreensArgs): DecisionScreenSpec[] {
  if (slots.length === 0) {
    return [
      {
        id: 'perks-none',
        render: () => (
          <DecisionScreen
            overline="Perks"
            question="No perks available"
            helper={emptyHelper}
          />
        ),
      },
    ];
  }

  return slots.map((slot, index) => ({
    id: slot.id,
    render: () => (
      <DecisionScreen
        overline={`Perks · ${index + 1} of ${slots.length} — ${slot.label}`}
        question="Pick a perk"
        helper={slot.description}
      >
        {getEligiblePerks(slot.categories).map((perk) => {
          const isSelected = slot.selectedPerkId === perk.id;
          const isTakenElsewhere = !isSelected && selectedPerkIds.has(perk.id);

          return (
            <ChoiceRow
              key={perk.id}
              title={perk.name}
              summary={PERK_CATEGORY_INFO[perk.category].name}
              selected={isSelected}
              disabled={isTakenElsewhere}
              onSelect={() => onSelectPerk(slot.id, perk)}
              onInfo={() => onPeekPerk(perk)}
            />
          );
        })}
      </DecisionScreen>
    ),
  }));
}
