import { cn } from '@anvil/ui';
import type { DashboardRoleKey } from '../dashboard/types.js';
import { useOnboardingState } from './useOnboardingState.js';

interface TourSettingToggleProps {
  userId: string | undefined;
  roleKey: DashboardRoleKey;
}

/**
 * Settings control that re-arms (or disarms) the dashboard onboarding tour
 * for the current flow. Turning it on resets the full first-run experience —
 * welcome dialog, tour, and first-steps checklist — on the next dashboard
 * visit; turning it off records the tour as skipped.
 */
export function TourSettingToggle({ userId, roleKey }: TourSettingToggleProps) {
  const { record, setStatus, reset } = useOnboardingState(userId, roleKey);
  const enabled = record.status === 'unseen';

  const handleToggle = () => {
    if (enabled) {
      setStatus('skipped');
    } else {
      reset();
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-medium text-zinc-100">Onboarding tour</p>
        <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-500">
          Show the welcome tour and first-steps checklist the next time you open the dashboard.
          The tour is tracked separately per flow — this applies to your current{' '}
          {roleKey === 'director' ? 'Director' : 'Player'} flow.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? 'Disable the onboarding tour' : 'Re-enable the onboarding tour'}
        onClick={handleToggle}
        className={cn(
          'flex h-6 w-11 shrink-0 items-center rounded-full border p-0.5 transition-colors',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400',
          enabled
            ? 'border-anvil-ember-500/60 bg-anvil-ember-500'
            : 'border-zinc-700 bg-zinc-800',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'size-4.5 rounded-full bg-zinc-100 shadow-sm transition-transform',
            enabled ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}
