import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a kit definition that the phone screens need. */
export interface KitChoice {
  id: string;
  name: string;
  /** Canonical one-liner from kit data. */
  description: string;
}

interface BuildKitScreensArgs {
  kits: KitChoice[];
  /** 2 when the class gets a second kit (Tactician's Field Arsenal), else 1. */
  selectionsNeeded: number;
  primaryKitId: string | null;
  secondaryKitId: string | null;
  onSelectAt: (slotIndex: number, kitId: string) => void;
  onPeekKit: (kitId: string) => void;
}

/**
 * Screen 1 picks the kit; screen 2 exists only when the character is
 * entitled to a secondary kit. The kit chosen in the other slot is disabled —
 * desktop's click handling likewise never assigns the same kit twice.
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * KitStep's original card grid.
 */
export function buildKitScreens({
  kits,
  selectionsNeeded,
  primaryKitId,
  secondaryKitId,
  onSelectAt,
  onPeekKit,
}: BuildKitScreensArgs): DecisionScreenSpec[] {
  const needsTwo = selectionsNeeded > 1;

  const renderRows = (slotIndex: number) =>
    kits.map((kit) => {
      const selectedInSlot = slotIndex === 0 ? primaryKitId : secondaryKitId;
      const selectedElsewhere = slotIndex === 0 ? secondaryKitId : primaryKitId;
      const isSelected = selectedInSlot === kit.id;
      return (
        <ChoiceRow
          key={kit.id}
          title={kit.name}
          summary={kit.description}
          selected={isSelected}
          disabled={!isSelected && needsTwo && selectedElsewhere === kit.id}
          onSelect={() => onSelectAt(slotIndex, kit.id)}
          onInfo={() => onPeekKit(kit.id)}
        />
      );
    });

  const primaryScreen: DecisionScreenSpec = {
    id: 'kit-primary',
    render: () => (
      <DecisionScreen
        overline={needsTwo ? 'Kit · 1 of 2' : 'Kit'}
        question='Choose your kit'
        helper='Your kit provides equipment, combat bonuses, and a signature ability.'
      >
        {renderRows(0)}
      </DecisionScreen>
    ),
  };

  if (!needsTwo) return [primaryScreen];

  const secondaryScreen: DecisionScreenSpec = {
    id: 'kit-secondary',
    render: () => (
      <DecisionScreen
        overline='Kit · 2 of 2'
        question='Choose your second kit'
        helper='Field Arsenal lets Tacticians benefit from two kits and both kit signature abilities.'
      >
        {renderRows(1)}
      </DecisionScreen>
    ),
  };

  return [primaryScreen, secondaryScreen];
}
