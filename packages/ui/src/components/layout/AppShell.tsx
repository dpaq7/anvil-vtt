import type { ReactNode } from 'react';
import { Group, Panel, Separator, useDefaultLayout } from 'react-resizable-panels';
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
  const hasLeft = leftRail != null;
  const hasRight = rightRail != null;

  // Build panel IDs based on which rails are present
  const panelIds = [
    ...(hasLeft ? ['left-rail'] : []),
    'stage',
    ...(hasRight ? ['right-rail'] : []),
  ];

  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: 'anvil-shell',
    panelIds,
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  });

  return (
    <div className={cn('flex h-screen flex-col bg-zinc-950 text-zinc-100', className)}>
      {/* Top Bar */}
      <header className="flex h-12 shrink-0 items-center border-b border-zinc-800 bg-zinc-900 px-4">
        {topBar ?? <span className="text-sm font-semibold text-zinc-300">Anvil VTT</span>}
      </header>

      {/* Main content area — resizable panels */}
      <Group
        orientation="horizontal"
        defaultLayout={defaultLayout}
        onLayoutChanged={onLayoutChanged}
        className="flex-1"
      >
        {/* Left Rail */}
        {hasLeft && (
          <>
            <Panel
              id="left-rail"
              defaultSize={15}
              minSize="10%"
              maxSize="30%"
              className="overflow-y-auto bg-zinc-900/50"
            >
              {leftRail}
            </Panel>
            <Separator className="w-1 bg-zinc-800 transition-colors hover:bg-zinc-600 data-[active]:bg-zinc-500" />
          </>
        )}

        {/* Stage */}
        <Panel id="stage" className="overflow-y-auto">
          {children}
        </Panel>

        {/* Right Rail */}
        {hasRight && (
          <>
            <Separator className="w-1 bg-zinc-800 transition-colors hover:bg-zinc-600 data-[active]:bg-zinc-500" />
            <Panel
              id="right-rail"
              defaultSize={20}
              minSize="12%"
              maxSize="40%"
              className="overflow-y-auto bg-zinc-900/50"
            >
              {rightRail}
            </Panel>
          </>
        )}
      </Group>

      {/* Film Strip — only rendered when explicitly provided */}
      {filmStrip && (
        <div className="h-14 shrink-0 border-t border-zinc-800 bg-zinc-900/50">
          {filmStrip}
        </div>
      )}

      {/* Status Bar */}
      <footer className="flex h-6 shrink-0 items-center border-t border-zinc-800 bg-zinc-900 px-4 text-xs text-zinc-500">
        {statusBar ?? <span>Ready</span>}
      </footer>
    </div>
  );
}
