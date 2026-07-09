import { Loader2 } from 'lucide-react';
import { cn } from '@anvil/ui';
import { useAuthStore } from '../stores/authStore.js';
import { DASHBOARD_BACKGROUNDS } from '../components/dashboard/types.js';
import { useDashboardData } from '../components/dashboard/useDashboardData.js';
import { useDashboardSections } from '../components/dashboard/useDashboardSections.js';
import { DashboardHeader } from '../components/dashboard/DashboardHeader.js';
import { DashboardStatsRow } from '../components/dashboard/DashboardStats.js';
import { SortableSections } from '../components/dashboard/sortable.js';
import { DashboardOnboarding } from '../components/onboarding/DashboardOnboarding.js';
import { FirstStepsChecklist } from '../components/onboarding/FirstStepsChecklist.js';
import { buildFirstSteps } from '../components/onboarding/firstSteps.js';
import { useOnboardingState } from '../components/onboarding/useOnboardingState.js';

export function Home() {
  const user = useAuthStore((state) => state.user);
  const isDirector = user?.role !== 'player';
  const { data, loading, error } = useDashboardData();
  const backgroundUrl = isDirector ? DASHBOARD_BACKGROUNDS.director : DASHBOARD_BACKGROUNDS.player;
  const roleKey = isDirector ? 'director' : 'player';
  const { dashboardSections, stats, quickActions } = useDashboardSections({ data, isDirector, roleKey });
  const onboarding = useOnboardingState(user?.id, roleKey);
  const firstSteps = buildFirstSteps(data, isDirector);

  if (loading) {
    return (
      <div className="relative isolate flex min-h-full items-center justify-center overflow-hidden bg-zinc-950 text-zinc-500">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-bottom bg-no-repeat opacity-80"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
        <div
          aria-hidden="true"
          className="anvil-dashboard-scrim pointer-events-none fixed inset-0 z-0"
        />
        <Loader2 className="relative z-10 mr-2 size-5 animate-spin" />
        <span className="relative z-10">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="anvil-dashboard relative isolate min-h-full overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-bottom bg-no-repeat opacity-80"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div
        aria-hidden="true"
        className="anvil-dashboard-scrim pointer-events-none fixed inset-0 z-0"
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-0 z-0',
          isDirector
            ? 'bg-[linear-gradient(to_right,rgba(127,29,29,0.13),transparent_45%,rgba(251,146,60,0.11))]'
            : 'bg-[linear-gradient(to_right,rgba(8,47,73,0.14),transparent_48%,rgba(202,138,4,0.08))]',
        )}
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 p-6 lg:p-8">
        <DashboardHeader
          isDirector={isDirector}
          userName={user?.username}
          quickActions={quickActions}
        />

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <FirstStepsChecklist
          tasks={firstSteps}
          dismissed={onboarding.record.checklistDismissed}
          onDismiss={onboarding.dismissChecklist}
        />

        <DashboardStatsRow stats={stats} />

        <SortableSections storageKey={`anvil-dashboard:${roleKey}:sections`} sections={dashboardSections} />
      </div>
      <DashboardOnboarding roleKey={roleKey} onboarding={onboarding} />
    </div>
  );
}
