import { Input } from '@anvil/ui';
import { ChoiceRow, DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

/** The slice of a career definition that the phone screens need. */
export interface CareerChoice {
  id: string;
  name: string;
  /** Canonical description from game data. */
  description: string;
  /** The career's single suggested inciting incident from game data. */
  incitingIncident: string;
}

interface BuildCareerScreensArgs {
  careers: CareerChoice[];
  /** null until a career is picked; gates the incident screen. */
  selectedCareer: CareerChoice | null;
  /** Current incident text on the character (free text; may match the suggestion). */
  incitingIncident: string | null;
  onSelectCareer: (careerId: string) => void;
  onPeekCareer: (careerId: string) => void;
  onChangeIncident: (text: string) => void;
  onPeekIncident: () => void;
}

/**
 * Screen 1 picks a career; screen 2 exists only once one is chosen. Careers
 * carry a single suggested inciting incident and the character field is free
 * text, so the incident screen pairs the suggestion row with a
 * write-your-own input (mirroring desktop's Input + suggested button).
 * Rendered by PhoneDecisionFlow on phone viewports only — desktop keeps
 * CareerStep's original layout.
 */
export function buildCareerScreens({
  careers,
  selectedCareer,
  incitingIncident,
  onSelectCareer,
  onPeekCareer,
  onChangeIncident,
  onPeekIncident,
}: BuildCareerScreensArgs): DecisionScreenSpec[] {
  const total = selectedCareer ? 2 : 1;

  const careerScreen: DecisionScreenSpec = {
    id: 'career-pick',
    render: () => (
      <DecisionScreen
        overline={`Career · 1 of ${total}`}
        question="Choose your career"
        helper="Your career reflects what you did before becoming a hero."
      >
        {careers.map((career) => (
          <ChoiceRow
            key={career.id}
            title={career.name}
            summary={career.description}
            selected={selectedCareer?.id === career.id}
            onSelect={() => onSelectCareer(career.id)}
            onInfo={() => onPeekCareer(career.id)}
          />
        ))}
      </DecisionScreen>
    ),
  };

  if (!selectedCareer) return [careerScreen];

  const incidentScreen: DecisionScreenSpec = {
    id: 'career-incident',
    render: () => (
      <DecisionScreen overline="Career · 2 of 2" question="Pick an inciting incident">
        <ChoiceRow
          title="Suggested incident"
          summary={selectedCareer.incitingIncident}
          selected={incitingIncident === selectedCareer.incitingIncident}
          onSelect={() => onChangeIncident(selectedCareer.incitingIncident)}
          onInfo={onPeekIncident}
        />
        <label className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-creator-text-muted">
            Or write your own
          </span>
          <Input
            className="min-h-11"
            value={incitingIncident ?? ''}
            onChange={(e) => onChangeIncident(e.target.value)}
            placeholder="What drove you to become a hero?"
          />
        </label>
      </DecisionScreen>
    ),
  };

  return [careerScreen, incidentScreen];
}
