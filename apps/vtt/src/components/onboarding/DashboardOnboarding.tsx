import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Badge, Button, cn, useSidebar } from '@anvil/ui';
import type { DashboardRoleKey } from '../dashboard/types.js';
import {
  APP_VERSION,
  DASHBOARD_ONBOARDING_STEPS,
  hasOnboardingDismissal,
  onboardingStorageKey,
  writeOnboardingDismissal,
  type OnboardingPhase,
  type OnboardingRect,
} from './steps.js';
import { ONBOARDING_TARGET_PADDING, getCalloutPosition } from './positioning.js';

export function DashboardOnboarding({ roleKey, userId }: { roleKey: DashboardRoleKey; userId: string | undefined }) {
  const { expand } = useSidebar();
  const steps = DASHBOARD_ONBOARDING_STEPS[roleKey];
  const storageKey = useMemo(() => onboardingStorageKey(userId, roleKey), [roleKey, userId]);
  const [phase, setPhase] = useState<OnboardingPhase>('hidden');
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<OnboardingRect | null>(null);
  const activeStep = phase === 'tour' ? steps[stepIndex] : null;
  const isFinalStep = stepIndex === steps.length - 1;
  const portalContainer = typeof document === 'undefined' ? null : document.body;

  useEffect(() => {
    setNeverShowAgain(false);
    setStepIndex(0);
    setTargetRect(null);
    setPhase(hasOnboardingDismissal(storageKey) ? 'hidden' : 'welcome');
  }, [storageKey]);

  const updateTargetRect = useCallback(() => {
    if (!activeStep) return;

    const target = document.querySelector<HTMLElement>(`[data-onboarding="${activeStep.target}"]`);
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
    const target = document.querySelector<HTMLElement>(`[data-onboarding="${activeStep.target}"]`);
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
    if (neverShowAgain) writeOnboardingDismissal(storageKey);
    setPhase('hidden');
  }, [neverShowAgain, storageKey]);

  const startTour = useCallback(() => {
    if (neverShowAgain) writeOnboardingDismissal(storageKey);
    expand();
    setStepIndex(0);
    setTargetRect(null);
    setPhase('tour');
  }, [expand, neverShowAgain, storageKey]);

  const finishTour = useCallback(() => {
    if (neverShowAgain) writeOnboardingDismissal(storageKey);
    setPhase('hidden');
  }, [neverShowAgain, storageKey]);

  const goNext = useCallback(() => {
    if (isFinalStep) {
      finishTour();
      return;
    }

    setTargetRect(null);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [finishTour, isFinalStep, steps.length]);

  const goBack = useCallback(() => {
    setTargetRect(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  if (phase === 'hidden' || !portalContainer) return null;

  if (phase === 'welcome') {
    return createPortal((
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-onboarding-title"
          className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/40"
        >
          <div className="flex flex-wrap gap-2">
            <Badge className={cn(
              'border-transparent',
              roleKey === 'director' ? 'bg-rose-300/10 text-flow-director' : 'bg-cyan-300/10 text-flow-player',
            )}>
              {roleKey === 'director' ? 'Director flow' : 'Player flow'}
            </Badge>
            <Badge variant="secondary">Beta v{APP_VERSION}</Badge>
          </div>
          <h2 id="dashboard-onboarding-title" className="mt-4 text-xl font-semibold text-zinc-50">
            Welcome to Anvil beta testing
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Thanks for helping test Anvil v{APP_VERSION} in the{' '}
            {roleKey === 'director' ? 'Director' : 'Player'} flow. This brief tour highlights the
            dashboard, menu tools, and the issue reporter to use when something crashes, looks wrong,
            or needs context.
          </p>
          <label className="mt-5 flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={(event) => setNeverShowAgain(event.currentTarget.checked)}
              className="size-4 rounded border-zinc-600 bg-zinc-900 accent-zinc-100"
            />
            Never show again
          </label>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={skipOnboarding}>
              <X size={15} />
              Skip
            </Button>
            <Button type="button" onClick={startTour}>
              Start tour
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </div>
    ), portalContainer);
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
  const calloutStyle = getCalloutPosition(targetRect, activeStep.placement);

  return createPortal((
    <>
      {!highlightRect && <div className="fixed inset-0 z-50 bg-black/70" />}
      {highlightRect && (
        <>
          <div
            aria-hidden="true"
            className="fixed left-0 top-0 z-50 bg-black/70"
            style={{ right: 0, height: highlightRect.top }}
          />
          <div
            aria-hidden="true"
            className="fixed left-0 z-50 bg-black/70"
            style={{ top: highlightRect.top, width: highlightRect.left, height: highlightRect.height }}
          />
          <div
            aria-hidden="true"
            className="fixed right-0 z-50 bg-black/70"
            style={{
              top: highlightRect.top,
              left: highlightRect.left + highlightRect.width,
              height: highlightRect.height,
            }}
          />
          <div
            aria-hidden="true"
            className="fixed bottom-0 left-0 z-50 bg-black/70"
            style={{ right: 0, top: highlightRect.top + highlightRect.height }}
          />
        </>
      )}
      {highlightRect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[75] rounded-lg border-4 border-sky-300 bg-sky-300/10 shadow-[0_0_0_4px_rgba(56,189,248,0.28),0_0_30px_rgba(125,211,252,0.45)]"
          style={highlightRect}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-onboarding-step-title"
        className="fixed z-[80] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-5 shadow-2xl shadow-black/50"
        style={calloutStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <Badge variant="secondary">Step {stepIndex + 1} of {steps.length}</Badge>
          <button
            type="button"
            aria-label="Skip onboarding"
            onClick={skipOnboarding}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <h2 id="dashboard-onboarding-step-title" className="mt-4 text-lg font-semibold text-zinc-50">
          {activeStep.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{activeStep.description}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={stepIndex === 0}>
            <ChevronLeft size={14} />
            Back
          </Button>
          <Button type="button" size="sm" onClick={goNext}>
            {isFinalStep ? (
              <>
                <CheckCircle2 size={14} />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  ), portalContainer);
}
