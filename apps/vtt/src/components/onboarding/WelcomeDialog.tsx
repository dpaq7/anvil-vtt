import { ArrowRight } from 'lucide-react';
import { Button, Checkbox, D20Icon, cn } from '@anvil/ui';
import type { DashboardRoleKey } from '../dashboard/types.js';
import { APP_VERSION } from './steps.js';

interface WelcomeDialogProps {
  roleKey: DashboardRoleKey;
  neverShowAgain: boolean;
  onNeverShowAgainChange: (checked: boolean) => void;
  onStartTour: () => void;
  onSkip: () => void;
}

/** The first-run welcome moment — parchment card, rolling d20, two paths in. */
export function WelcomeDialog({
  roleKey,
  neverShowAgain,
  onNeverShowAgainChange,
  onStartTour,
  onSkip,
}: WelcomeDialogProps) {
  const isDirector = roleKey === 'director';
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-onboarding-title"
        className="texture-parchment w-full max-w-md rounded-card border border-anvil-parchment-300 p-6 shadow-paper-lift motion-safe:animate-pop-in"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-chip bg-anvil-ember-400/15 text-anvil-ember-600 motion-safe:animate-dice-roll">
            <D20Icon size={28} aria-hidden="true" />
          </span>
          <div className="flex flex-wrap justify-end gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-chip border px-2.5 py-0.5 text-xs font-semibold',
                isDirector
                  ? 'border-rose-700/30 bg-rose-500/10 text-rose-700'
                  : 'border-cyan-700/30 bg-cyan-600/10 text-cyan-800',
              )}
            >
              {isDirector ? 'Director flow' : 'Player flow'}
            </span>
            <span className="inline-flex items-center rounded-chip border border-anvil-parchment-300 bg-anvil-parchment-200 px-2.5 py-0.5 text-xs font-semibold text-anvil-ink-soft">
              Beta v{APP_VERSION}
            </span>
          </div>
        </div>
        <h2
          id="dashboard-onboarding-title"
          className="mt-4 font-display text-2xl font-semibold text-anvil-ink"
        >
          Welcome to the table
        </h2>
        <p className="mt-3 text-sm leading-6 text-anvil-ink-soft">
          {isDirector
            ? 'Anvil is your director’s chair — prep scenes, gather your party, and run Draw Steel live. A one-minute tour shows you around, then a short checklist gets your first campaign rolling.'
            : 'Anvil is your seat at the table — roll up heroes, join campaigns, and play Draw Steel live. A one-minute tour shows you around, then a short checklist gets your first hero rolling.'}
        </p>
        <label className="mt-5 flex items-center gap-3 rounded-lg border border-anvil-parchment-300 bg-anvil-parchment-50 px-3 py-2 text-sm text-anvil-ink-soft">
          <Checkbox
            checked={neverShowAgain}
            onCheckedChange={(checked) => onNeverShowAgainChange(checked === true)}
            className="border-anvil-parchment-300 bg-white data-[state=checked]:border-anvil-ember-500 data-[state=checked]:bg-anvil-ember-500 data-[state=checked]:text-white"
          />
          Never show again
        </label>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="rounded-chip border-anvil-parchment-300 bg-transparent text-anvil-ink hover:bg-anvil-ink/5 hover:text-anvil-ink"
          >
            I’ll explore
          </Button>
          <Button
            type="button"
            onClick={onStartTour}
            className="rounded-chip bg-anvil-ember-500 text-white hover:bg-anvil-ember-600"
          >
            Show me around
            <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
