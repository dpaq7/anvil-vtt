import { useState } from 'react';
import { GameData, WizardLogic } from '@anvil/data';
import type {
  CharacterInProgress,
  CompanionChoiceOption,
  HeroLogic as HeroLogicTypes,
  SubclassDefinition,
} from '@anvil/data';
import { Card, CardHeader, CardTitle, CardContent, Input, cn } from '@anvil/ui';
import { Check } from 'lucide-react';
import { BottomSheet, PhoneDecisionFlow } from '../creator/phone/index.js';
import { buildSubclassScreens } from './phone/SubclassScreens.js';

interface Props {
  character: CharacterInProgress;
  onChange: (patch: Partial<CharacterInProgress>) => void;
}

/** Phone info sheet — subclasses and companions render differently. */
type SubclassPeek =
  | { kind: 'subclass'; subclass: SubclassDefinition }
  | { kind: 'companion'; companion: CompanionChoiceOption };

export function SubclassStep({ character, onChange }: Props) {
  const [peek, setPeek] = useState<SubclassPeek | null>(null);
  const [companionSearch, setCompanionSearch] = useState('');
  const companionOptions = WizardLogic.getCompanionOptions();
  const query = companionSearch.trim().toLowerCase();
  const filteredCompanions = (
    query
      ? companionOptions.filter((option) => {
          return (
            option.name.toLowerCase().includes(query) ||
            option.roles.some((role) => role.toLowerCase().includes(query)) ||
            option.ancestry?.some((ancestry) => ancestry.toLowerCase().includes(query))
          );
        })
      : companionOptions
  ).slice(0, 60);

  const hasClass = !!character.heroClass;
  const heroClass = character.heroClass as HeroLogicTypes.HeroClass;
  const subclasses = hasClass ? GameData.getSubclasses(heroClass) : [];
  const typeName = hasClass ? GameData.getSubclassTypeName(heroClass) : 'Subclass';
  const selectCount = hasClass ? GameData.getSubclassSelectCount(heroClass) : 1;
  const multi = selectCount > 1;
  const selectedIds = Array.isArray(character.subclass)
    ? character.subclass
    : character.subclass
      ? [character.subclass]
      : [];
  const companionRequired = WizardLogic.isCompanionRequired(character);

  const isSelected = (id: string) => selectedIds.includes(id);

  const toggle = (id: string) => {
    if (!multi) {
      onChange({ subclass: id });
      return;
    }
    const current = Array.isArray(character.subclass) ? character.subclass : [];
    if (current.includes(id)) {
      onChange({ subclass: current.filter((s) => s !== id) });
    } else if (current.length < selectCount) {
      onChange({ subclass: [...current, id] });
    }
  };

  // Phone slot semantics: screen N owns pick N. Duplicate picks are disabled
  // in the builder, mirroring desktop's toggle (never the same id twice).
  const selectAt = (slotIndex: number, id: string) => {
    if (!multi) {
      onChange({ subclass: id });
      return;
    }
    const current = Array.isArray(character.subclass) ? character.subclass : [];
    if (current.includes(id)) return;
    const next = [...current];
    if (slotIndex < next.length) next[slotIndex] = id;
    else next.push(id);
    onChange({ subclass: next.slice(0, selectCount) });
  };

  const screens = buildSubclassScreens({
    hasClass,
    typeName,
    selectCount,
    subclasses,
    selectedIds,
    companion: companionRequired
      ? {
          options: filteredCompanions.map((option) => ({
            id: option.id,
            name: option.name,
            summary: `Level ${option.level} / ${option.roles.join(', ')}`,
          })),
          selectedId: character.companion ?? null,
          searchValue: companionSearch,
          onSearchChange: setCompanionSearch,
          onSelect: (companionId) => onChange({ companion: companionId }),
          onPeek: (companionId) => {
            const companion = companionOptions.find((c) => c.id === companionId);
            if (companion) setPeek({ kind: 'companion', companion });
          },
        }
      : null,
    onSelectAt: selectAt,
    onPeekSubclass: (subclassId) => {
      const subclass = subclasses.find((s) => s.id === subclassId);
      if (subclass) setPeek({ kind: 'subclass', subclass });
    },
  });

  const renderDesktop = () => {
    if (!character.heroClass) {
      return <p className="text-zinc-500">Select a class first.</p>;
    }

    return (
      <div>
        <h2 className="mb-1 text-lg font-semibold">Choose Your {typeName}</h2>
        <p className="mb-4 text-sm text-zinc-400">
          {multi ? `Select ${selectCount} options.` : `Select one ${typeName.toLowerCase()}.`}
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subclasses.map((sc) => {
            const selected = isSelected(sc.id);
            return (
              <Card
                key={sc.id}
                className={cn(
                  'cursor-pointer transition-all bg-creator-card',
                  selected
                    ? 'border-creator-highlight ring-1 ring-creator-highlight/50 bg-creator-highlight/20'
                    : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover'
                )}
                onClick={() => toggle(sc.id)}
              >
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className={cn('text-base', selected && 'text-creator-highlight')}>
                      {sc.name}
                    </CardTitle>
                    {selected && <Check className="h-5 w-5 text-creator-highlight shrink-0" />}
                  </div>
                </CardHeader>
                {sc.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-creator-text-muted">{sc.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {companionRequired && (
          <DesktopCompanionPicker
            options={filteredCompanions}
            selectedId={character.companion ?? null}
            search={companionSearch}
            onSearchChange={setCompanionSearch}
            onSelect={(companionId) => onChange({ companion: companionId })}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <PhoneDecisionFlow screens={screens} desktop={renderDesktop} />
      {/* Renders null on desktop: nothing there ever sets peek. */}
      <BottomSheet
        open={peek !== null}
        onClose={() => setPeek(null)}
        title={
          peek?.kind === 'subclass'
            ? peek.subclass.name
            : peek?.kind === 'companion'
              ? peek.companion.name
              : undefined
        }
      >
        {peek?.kind === 'subclass' && peek.subclass.description && (
          <p className="text-sm leading-relaxed text-creator-text">{peek.subclass.description}</p>
        )}
        {peek?.kind === 'companion' && <CompanionPeekBody companion={peek.companion} />}
      </BottomSheet>
    </>
  );
}

/** Desktop-only companion picker section (Beastheart). */
function DesktopCompanionPicker({ options, selectedId, search, onSearchChange, onSelect }: {
  options: CompanionChoiceOption[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (companionId: string) => void;
}) {
  return (
    <section className="mt-6 rounded-lg border border-creator-border bg-creator-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-creator-text">Choose Your Companion</h3>
          <p className="mt-1 text-sm text-creator-text-muted">
            Beasthearts choose one bonded companion to fight beside them.
          </p>
        </div>
        {selectedId && (
          <span className="rounded-full border border-creator-highlight px-2 py-1 text-xs text-creator-highlight">
            Selected
          </span>
        )}
      </div>

      <Input
        className="mb-3"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search companions, roles, or ancestries..."
      />

      <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                'rounded-md border px-3 py-2 text-left text-sm transition',
                selected
                  ? 'border-creator-highlight bg-creator-highlight/20 text-creator-highlight'
                  : 'border-creator-border text-creator-text hover:border-creator-text-muted hover:bg-creator-card-hover',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{option.name}</span>
                {selected && <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              </div>
              <div className="mt-1 text-xs text-creator-text-muted">
                Level {option.level} / {option.roles.join(', ')}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Phone peek sheet body for a companion's canonical stats. */
function CompanionPeekBody({ companion }: { companion: CompanionChoiceOption }) {
  return (
    <>
      <p className="text-sm text-creator-text">
        Level {companion.level} / {companion.roles.join(', ')}
      </p>
      {companion.ancestry && companion.ancestry.length > 0 && (
        <p className="mt-2 text-xs text-creator-text-muted">
          Ancestry: {companion.ancestry.join(', ')}
        </p>
      )}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Size</div>
          <div className="mt-1 text-sm text-creator-text">{companion.size ?? '-'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Speed</div>
          <div className="mt-1 text-sm text-creator-text">{companion.speed ?? '-'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">Stability</div>
          <div className="mt-1 text-sm text-creator-text">{companion.stability ?? '-'}</div>
        </div>
      </div>
      {companion.signatureAbility && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-creator-text-muted">
            Signature Ability
          </div>
          <div className="mt-1 text-sm text-creator-text">{companion.signatureAbility}</div>
        </div>
      )}
    </>
  );
}
