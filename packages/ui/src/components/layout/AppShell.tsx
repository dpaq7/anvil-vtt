import type { ReactNode } from 'react';
import { cn } from '../../lib/utils.js';

export interface AppShellProps {
  children?: ReactNode;
  topBar?: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  filmStrip?: ReactNode;
  statusBar?: ReactNode;
  className?: string;
}

export function AppShell({
  children,
  topBar,
  leftRail,
  rightRail,
  filmStrip,
  statusBar,
  className,
}: AppShellProps) {
  return (
    <div className={cn('flex h-screen flex-col bg-zinc-950 text-zinc-100', className)}>
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center border-b border-zinc-800 bg-zinc-900 px-4">
        {topBar ?? <span className="text-sm font-semibold text-zinc-300">Anvil VTT</span>}
      </header>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail */}
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900/50">
          {leftRail ?? <div className="p-4 text-xs text-zinc-500">Navigation</div>}
        </aside>

        {/* Stage */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right Rail */}
        <aside className="w-72 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/50">
          {rightRail ?? <div className="p-4 text-xs text-zinc-500">Details</div>}
        </aside>
      </div>

      {/* Film Strip */}
      <div className="h-14 shrink-0 border-t border-zinc-800 bg-zinc-900/50">
        {filmStrip ?? <div className="flex h-full items-center px-4 text-xs text-zinc-500">Film Strip</div>}
      </div>

      {/* Status Bar */}
      <footer className="flex h-6 shrink-0 items-center border-t border-zinc-800 bg-zinc-900 px-4 text-xs text-zinc-500">
        {statusBar ?? <span>Ready</span>}
      </footer>
    </div>
  );
}
