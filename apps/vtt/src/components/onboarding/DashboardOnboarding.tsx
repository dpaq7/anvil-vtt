import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSidebar } from '@anvil/ui';
import type { DashboardRoleKey } from '../dashboard/types.js';
import {
  DASHBOARD_ONBOARDING_STEPS,
  queryOnboardingTarget,
  type OnboardingPhase,
  type OnboardingRect,
} from './steps.js';
import { ONBOARDING_TARGET_PADDING, getCalloutPosition } from './positioning.js';
import type { OnboardingState } from './useOnboardingState.js';
import { WelcomeDialog } from './WelcomeDialog.js';
import { OnboardingSpotlight } from './OnboardingSpotlight.js';
import { OnboardingCallout } from './OnboardingCallout.js';

interface DashboardOnboardingProps {
  roleKey: DashboardRoleKey;
  onboarding: OnboardingState;
}

/**
 * Orchestrates the first-run experience: welcome dialog → 5-step spotlight
 * tour. Completion state persists via useOnboardingState (finishing or
 * skipping no longer re-shows the tour on the next visit). The companion
 * FirstStepsChecklist renders separately in the dashboard body.
 */
export function DashboardOnboarding({ roleKey, onboarding }: DashboardOnboardingProps) {
  const { expand } = useSidebar();
  const steps = DASHBOARD_ONBOARDING_STEPS[roleKey];
  const { record, setStatus } = onboarding;
  const [phase, setPhase] = useState<OnboardingPhase>('hidden');
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<OnboardingRect | null>(null);
  const activeStep = phase === 'tour' ? steps[stepIndex] : null;
  const portalContainer = typeof document === 'undefined' ? null : document.body;

  // Offer the welcome moment only to genuinely fresh users for this
  // user+role+version — skipped/completed/never all stay hidden. Status
  // changes mid-session (skip/finish) resolve to 'hidden', which is already
  // the phase those handlers set, so this effect never fights them.
  useEffect(() => {
    if (record.status === 'unseen') {
      setNeverShowAgain(false);
      setStepIndex(0);
      setTargetRect(null);
      setPhase('welcome');
    } else {
      setPhase((current) => (current === 'tour' ? current : 'hidden'));
    }
  }, [roleKey, record.status]);

  const updateTargetRect = useCallback(() => {
    if (!activeStep) return;
    const target = queryOnboardingTarget(activeStep.target);
    if (!target) {
      setTargetRect(null);
      return;
    }
    const rect = target.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [activeStep]);

  useEffect(() => {
    if (!activeStep) return;

    expand();
    const target = queryOnboardingTarget(activeStep.target);
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });

    const animationFrame = window.requestAnimationFrame(updateTargetRect);
    const timeout = window.setTimeout(updateTargetRect, 260);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [activeStep, expand, updateTargetRect]);

  const skipOnboarding = useCallback(() => {
    setStatus(neverShowAgain ? 'never' : 'skipped');
    setPhase('hidden');
  }, [neverShowAgain, setStatus]);

  const startTour = useCallback(() => {
    expand();
    setStepIndex(0);
    setTargetRect(null);
    setPhase('tour');
  }, [expand]);

  const finishTour = useCallback(() => {
    setStatus(neverShowAgain ? 'never' : 'completed');
    setPhase('hidden');
    // Hand off to the first-steps checklist.
    queryOnboardingTarget('first-steps')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [neverShowAgain, setStatus]);

  const goNext = useCallback(() => {
    if (stepIndex === steps.length - 1) {
      finishTour();
      return;
    }
    setTargetRect(null);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [finishTour, stepIndex, steps.length]);

  const goBack = useCallback(() => {
    setTargetRect(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  if (phase === 'hidden' || !portalContainer) return null;

  if (phase === 'welcome') {
    return createPortal(
      <WelcomeDialog
        roleKey={roleKey}
        neverShowAgain={neverShowAgain}
        onNeverShowAgainChange={setNeverShowAgain}
        onStartTour={startTour}
        onSkip={skipOnboarding}
      />,
      portalContainer,
    );
  }

  if (!activeStep) return null;

  const highlightRect = targetRect
    ? (() => {
        const top = Math.max(targetRect.top - ONBOARDING_TARGET_PADDING, 4);
        const left = Math.max(targetRect.left - ONBOARDING_TARGET_PADDING, 4);
        return {
          top,
          left,
          width: Math.min(targetRect.width + ONBOARDING_TARGET_PADDING * 2, window.innerWidth - left - 4),
          height: Math.min(targetRect.height + ONBOARDING_TARGET_PADDING * 2, window.innerHeight - top - 4),
        };
      })()
    : undefined;

  return createPortal(
    <>
      <OnboardingSpotlight rect={highlightRect} />
      <OnboardingCallout
        step={activeStep}
        stepIndex={stepIndex}
        stepCount={steps.length}
        style={getCalloutPosition(targetRect, activeStep.placement)}
        onBack={goBack}
        onNext={goNext}
        onSkip={skipOnboarding}
      />
    </>,
    portalContainer,
  );
}
