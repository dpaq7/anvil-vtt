import { Link } from 'react-router-dom';
import { Button, cn } from '@anvil/ui';
import type { QuickAction } from './types.js';

export interface DashboardHeaderProps {
  isDirector: boolean;
  userName?: string;
  quickActions: QuickAction[];
}

export function DashboardHeader({ isDirector, userName, quickActions }: DashboardHeaderProps) {
  const greeting = userName ? `Welcome back, ${userName}` : 'Welcome back';
  return (
    <header
      className="flex flex-col gap-5 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between"
      data-onboarding="dashboard-header"
    >
      <div>
        <span
          className={cn(
            'mb-3 inline-flex items-center gap-1.5 rounded-chip border px-3 py-1 text-xs font-semibold shadow-paper',
            isDirector
              ? 'border-flow-director/40 bg-rose-300/10 text-flow-director'
              : 'border-flow-player/40 bg-cyan-300/10 text-flow-player',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 rounded-full',
              isDirector ? 'bg-flow-director' : 'bg-flow-player',
            )}
          />
          {isDirector ? 'Director flow' : 'Player flow'}
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-zinc-50">
          {greeting}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          {isDirector
            ? 'Your table awaits — prep, live sessions, roster, and notes at a glance.'
            : 'Your table awaits — live rooms, heroes, and notes in one place.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2" data-onboarding="dashboard-actions">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.to}
              asChild
              variant={index === 0 ? 'default' : 'outline'}
              size="sm"
              className="rounded-chip"
              data-onboarding={`dashboard-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Link to={action.to}>
                <Icon size={14} />
                {action.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </header>
  );
}
