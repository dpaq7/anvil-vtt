import { Input } from '@anvil/ui';
import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a subclass option that the phone screens need. */
export interface SubclassChoice {
  id: string;
  name: string;
  /** Canonical one-liner from class data. */
  description?: string;
}

/** The slice of a Beastheart companion option that the phone screen needs. */
export interface CompanionRowChoice {
  id: string;
  name: string;
  /** One-liner matching desktop's row: level and roles. */
  summary: string;
}

/** Companion sub-decision — present only for classes that bond one (Beastheart). */
export interface CompanionScreenArgs {
  options: CompanionRowChoice[];
  selectedId: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSelect: (companionId: string) => void;
  onPeek: (companionId: string) => void;
}

interface BuildSubclassScreensArgs {
  /** False until a class is picked — becomes a single informational screen. */
  hasClass: boolean;
  /** Canonical per-class term, e.g. 'Domain', 'Wild Nature'. */
  typeName: string;
  /** How many subclasses the class picks (2 for Conduit domains). */
  selectCount: number;
  subclasses: SubclassChoice[];
  /** Selected subclass ids in pick order (slot 0 first). */
  selectedIds: string[];
  /** Non-null only when the class also chooses a companion (Beastheart). */
  companion: CompanionScreenArgs | null;
  onSelectAt: (slotIndex: number, subclassId: string) => void;
  onPeekSubclass: (subclassId: string) => void;
}

/**
 * One decision screen per subclass pick (Conduit picks two domains), plus a
 * companion screen for Beasthearts. A subclass already chosen in another
 * slot is disabled — desktop's toggle likewise never allows duplicates.
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * SubclassStep's original layout.
 */
export function buildSubclassScreens({
  hasClass,
  typeName,
  selectCount,
  subclasses,
  selectedIds,
  companion,
  onSelectAt,
  onPeekSubclass,
}: BuildSubclassScreensArgs): DecisionScreenSpec[] {
  if (!hasClass) {
    return [
      {
        id: 'subclass-no-class',
        render: () => (
          <DecisionScreen
            overline='Subclass'
            question='No class selected'
            helper='Select a class first to see available options.'
          />
        ),
      },
    ];
  }

  const total = selectCount + (companion ? 1 : 0);
  const lowerTypeName = typeName.toLowerCase();

  const subclassScreens: DecisionScreenSpec[] = Array.from(
    { length: selectCount },
    (_, slotIndex) => ({
      id: `subclass-slot-${slotIndex}`,
      render: () => (
        <DecisionScreen
          overline={total > 1 ? `Subclass · ${slotIndex + 1} of ${total}` : 'Subclass'}
          question={
            selectCount > 1
              ? `Choose your ${slotIndex === 0 ? 'first' : 'second'} ${lowerTypeName}`
              : `Choose your ${lowerTypeName}`
          }
        >
          {subclasses.map((sc) => {
            const isSelected = selectedIds[slotIndex] === sc.id;
            const isTakenElsewhere = !isSelected && selectedIds.includes(sc.id);
            return (
              <ChoiceRow
                key={sc.id}
                title={sc.name}
                summary={sc.description}
                selected={isSelected}
                disabled={isTakenElsewhere}
                onSelect={() => onSelectAt(slotIndex, sc.id)}
                onInfo={() => onPeekSubclass(sc.id)}
              />
            );
          })}
        </DecisionScreen>
      ),
    }),
  );

  if (!companion) return subclassScreens;

  const companionScreen: DecisionScreenSpec = {
    id: 'subclass-companion',
    render: () => (
      <DecisionScreen
        overline={`Subclass · ${total} of ${total} — Companion`}
        question='Choose your companion'
        helper='Beasthearts choose one bonded companion to fight beside them.'
      >
        <Input
          className='min-h-11'
          value={companion.searchValue}
          onChange={(e) => companion.onSearchChange(e.target.value)}
          placeholder='Search companions, roles, or ancestries...'
        />
        {companion.options.map((option) => (
          <ChoiceRow
            key={option.id}
            title={option.name}
            summary={option.summary}
            selected={companion.selectedId === option.id}
            onSelect={() => companion.onSelect(option.id)}
            onInfo={() => companion.onPeek(option.id)}
          />
        ))}
      </DecisionScreen>
    ),
  };

  return [...subclassScreens, companionScreen];
}
