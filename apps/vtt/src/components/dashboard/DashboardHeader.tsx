import { Link } from 'react-router-dom';
import { Badge, Button, cn } from '@anvil/ui';
import type { QuickAction } from './types.js';

export interface DashboardHeaderProps {
  isDirector: boolean;
  quickActions: QuickAction[];
}

export function DashboardHeader({ isDirector, quickActions }: DashboardHeaderProps) {
  return (
    <header
      className="flex flex-col gap-5 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between"
      data-onboarding="dashboard-header"
    >
      <div>
        <Badge className={cn(
          'mb-3 border-transparent',
          isDirector ? 'bg-rose-300/10 text-flow-director' : 'bg-cyan-300/10 text-flow-player',
        )}>
          {isDirector ? 'Director flow' : 'Player flow'}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-normal text-zinc-50">
          {isDirector ? 'Director Dashboard' : 'Player Dashboard'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          {isDirector
            ? 'Prep status, active tables, notes, player roster, and recent asset work.'
            : 'Your live tables, characters, notes, and recent uploads in one place.'}
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
