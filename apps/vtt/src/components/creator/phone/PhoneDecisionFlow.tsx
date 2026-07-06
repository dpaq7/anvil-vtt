import { useEffect, type ReactNode } from 'react';
import { useWizardStore } from '../../../stores/wizardStore.js';
import { useIsPhoneViewport } from '../../../hooks/useIsPhoneViewport.js';

export interface DecisionScreenSpec {
  id: string;
  render: () => ReactNode; // a <DecisionScreen> element
}

interface PhoneDecisionFlowProps {
  screens: DecisionScreenSpec[];
  desktop: ReactNode; // today's rendering, untouched
}

export function PhoneDecisionFlow({ screens, desktop }: PhoneDecisionFlowProps) {
  const isPhone = useIsPhoneViewport();
  const subStepIndex = useWizardStore((s) => s.subStepIndex);
  const registerSubStepCount = useWizardStore((s) => s.registerSubStepCount);
  const count = isPhone ? Math.max(screens.length, 1) : 1;

  useEffect(() => {
    registerSubStepCount(count);
  }, [count, registerSubStepCount]);

  if (!isPhone) return <>{desktop}</>;
  const active = screens[Math.min(subStepIndex, screens.length - 1)];
  return <>{active?.render()}</>;
}
