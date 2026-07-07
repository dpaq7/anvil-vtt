import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of an ability slot that the phone screens need. */
export interface AbilitySlotChoice {
  id: string;
  label: string;
  description: string;
  kind: 'ability' | 'minion';
  /** The choice id currently filling this slot, if any. */
  selectedChoiceId: string | null;
}

/** One selectable option (ability or minion), pre-shaped by the step. */
export interface AbilityOptionChoice {
  id: string;
  name: string;
  /** One-liner: cost/type/keywords for abilities, essence/role/stats for minions. */
  summary: string;
}

interface BuildAbilitiesScreensArgs {
  /** False until a class is picked — its guard copy differs from the no-slots case. */
  hasClass: boolean;
  slots: AbilitySlotChoice[];
  getOptionsForSlot: (slot: AbilitySlotChoice) => AbilityOptionChoice[];
  onSelectOption: (slotId: string, optionId: string) => void;
  onPeekOption: (slotId: string, optionId: string) => void;
}

/**
 * One decision screen per ability slot (summoner minion slots included).
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * AbilitiesStep's original slot-tab layout.
 */
export function buildAbilitiesScreens({
  hasClass,
  slots,
  getOptionsForSlot,
  onSelectOption,
  onPeekOption,
}: BuildAbilitiesScreensArgs): DecisionScreenSpec[] {
  if (!hasClass) {
    return [
      {
        id: 'abilities-no-class',
        render: () => (
          <DecisionScreen
            overline="Abilities"
            question="No class selected"
            helper="Select a class first to see available abilities."
          />
        ),
      },
    ];
  }

  if (slots.length === 0) {
    return [
      {
        id: 'abilities-no-slots',
        render: () => (
          <DecisionScreen
            overline="Abilities"
            question="No ability slots"
            helper="This class does not have any starting ability choices configured."
          />
        ),
      },
    ];
  }

  return slots.map((slot, index) => {
    const overline = `Abilities · ${index + 1} of ${slots.length} — ${slot.label}`;
    const isMinionSlot = slot.kind === 'minion';

    return {
      id: slot.id,
      render: () => {
        const options = getOptionsForSlot(slot);

        if (options.length === 0) {
          return (
            <DecisionScreen
              overline={overline}
              question={isMinionSlot ? 'No minions available' : 'No abilities available'}
              helper={
                isMinionSlot
                  ? 'No minions are available for this slot.'
                  : 'No abilities are available for this slot.'
              }
            />
          );
        }

        return (
          <DecisionScreen
            overline={overline}
            question={isMinionSlot ? 'Pick a minion' : 'Pick an ability'}
            helper={slot.description}
          >
            {options.map((option) => {
              const isSelected = slot.selectedChoiceId === option.id;
              const isTakenElsewhere =
                !isSelected &&
                slots.some(
                  (other) => other.id !== slot.id && other.selectedChoiceId === option.id,
                );

              return (
                <ChoiceRow
                  key={option.id}
                  title={option.name}
                  summary={option.summary}
                  selected={isSelected}
                  disabled={isTakenElsewhere}
                  onSelect={() => onSelectOption(slot.id, option.id)}
                  onInfo={() => onPeekOption(slot.id, option.id)}
                />
              );
            })}
          </DecisionScreen>
        );
      },
    };
  });
}
