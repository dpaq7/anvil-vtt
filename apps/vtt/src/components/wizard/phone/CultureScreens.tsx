import { Fragment } from 'react';
import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a prebuilt culture preset that the phone screens need. */
export interface CulturePresetChoice {
  id: string;
  name: string;
  /** Canonical one-liner from game data, e.g. 'Urban, bureaucratic, creative.' */
  description: string;
}

/** A labelled preset group, mirroring desktop's Professional/Bespoke sections. */
export interface CulturePresetGroupChoice {
  label: string;
  presets: CulturePresetChoice[];
}

export type CultureAspectField = 'environment' | 'organization' | 'upbringing';

/** The slice of a culture aspect option that the phone screens need. */
export interface CultureAspectOptionChoice {
  id: string;
  name: string;
  /** Canonical benefit one-liner from game data. */
  effect: string;
}

/** One aspect decision (environment/organization/upbringing). */
export interface CultureAspectScreen {
  field: CultureAspectField;
  label: string;
  question: string;
  helper: string;
  options: CultureAspectOptionChoice[];
  selectedId: string | null;
}

interface BuildCultureScreensArgs {
  presetGroups: CulturePresetGroupChoice[];
  selectedPresetId: string | null;
  /** Empty when the selected preset fully defines the culture (professional path). */
  aspects: CultureAspectScreen[];
  onSelectPreset: (presetId: string) => void;
  onPeekPreset: (presetId: string) => void;
  onSelectAspect: (field: CultureAspectField, optionId: string) => void;
  onPeekAspect: (optionId: string) => void;
}

/**
 * Screen 1 picks a culture preset (the Bespoke Culture preset is the custom
 * path); one further screen per aspect while the bespoke builder is engaged.
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * CultureStep's original layout.
 */
export function buildCultureScreens({
  presetGroups,
  selectedPresetId,
  aspects,
  onSelectPreset,
  onPeekPreset,
  onSelectAspect,
  onPeekAspect,
}: BuildCultureScreensArgs): DecisionScreenSpec[] {
  const total = 1 + aspects.length;

  const presetScreen: DecisionScreenSpec = {
    id: 'culture-preset',
    render: () => (
      <DecisionScreen
        overline={`Culture · 1 of ${total}`}
        question="Choose a culture"
        helper="Your culture determines the skill groups you can choose from."
      >
        {presetGroups.map((group) => (
          <Fragment key={group.label}>
            <p className="pt-1 text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
              {group.label}
            </p>
            {group.presets.map((preset) => (
              <ChoiceRow
                key={preset.id}
                title={preset.name}
                summary={preset.description}
                selected={selectedPresetId === preset.id}
                onSelect={() => onSelectPreset(preset.id)}
                onInfo={() => onPeekPreset(preset.id)}
              />
            ))}
          </Fragment>
        ))}
      </DecisionScreen>
    ),
  };

  const aspectScreens: DecisionScreenSpec[] = aspects.map((aspect, index) => ({
    id: `culture-${aspect.field}`,
    render: () => (
      <DecisionScreen
        overline={`Culture · ${index + 2} of ${total} — ${aspect.label}`}
        question={aspect.question}
        helper={aspect.helper}
      >
        {aspect.options.map((option) => (
          <ChoiceRow
            key={option.id}
            title={option.name}
            summary={option.effect}
            selected={aspect.selectedId === option.id}
            onSelect={() => onSelectAspect(aspect.field, option.id)}
            onInfo={() => onPeekAspect(option.id)}
          />
        ))}
      </DecisionScreen>
    ),
  }));

  return [presetScreen, ...aspectScreens];
}
