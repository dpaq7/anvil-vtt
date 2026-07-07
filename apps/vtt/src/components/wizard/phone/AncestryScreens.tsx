import type { ReactNode } from 'react';
import { DecisionScreen } from '../../creator/phone/index.js';
import type { DecisionScreenSpec } from '../../creator/phone/index.js';

interface BuildAncestryScreensArgs {
  /** Whether the chosen ancestry offers purchasable traits — gates screen 2. */
  hasTraitChoices: boolean;
  /** Ancestry points left to spend, for the traits-screen helper. */
  remainingPoints: number;
  /** The chosen ancestry's total trait point budget. */
  ancestryPoints: number;
  /**
   * Renders the step's SplitViewSelector. Its phone mode already provides
   * single-column cards plus a peek sheet with the Select button, so that
   * sheet is the info mechanism — this screen adds no step-level peek.
   */
  renderAncestrySelector: () => ReactNode;
  /** Renders the TraitSelector for the chosen ancestry. */
  renderTraitSelector: () => ReactNode;
}

/**
 * Screen 1 picks an ancestry; screen 2 exists only while the chosen ancestry
 * has purchasable traits (the same condition desktop uses to render
 * TraitSelector inline in the detail panel). Rendered by PhoneDecisionFlow on
 * phone viewports only — desktop keeps AncestryStep's original layout.
 */
export function buildAncestryScreens({
  hasTraitChoices,
  remainingPoints,
  ancestryPoints,
  renderAncestrySelector,
  renderTraitSelector,
}: BuildAncestryScreensArgs): DecisionScreenSpec[] {
  const total = hasTraitChoices ? 2 : 1;

  const ancestryScreen: DecisionScreenSpec = {
    id: 'ancestry-pick',
    render: () => (
      <DecisionScreen
        overline={`Ancestry · 1 of ${total}`}
        question="Choose your ancestry"
        helper="Your ancestry determines your size, speed, and unique traits."
      >
        {renderAncestrySelector()}
      </DecisionScreen>
    ),
  };

  if (!hasTraitChoices) return [ancestryScreen];

  const traitsScreen: DecisionScreenSpec = {
    id: 'ancestry-traits',
    render: () => (
      <DecisionScreen
        overline="Ancestry · 2 of 2"
        question="Choose your traits"
        helper={`${remainingPoints} of ${ancestryPoints} ancestry points remaining`}
      >
        {renderTraitSelector()}
      </DecisionScreen>
    ),
  };

  return [ancestryScreen, traitsScreen];
}
