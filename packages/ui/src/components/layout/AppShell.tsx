import type { ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
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
  leftRailCollapsed?: boolean;
  rightRailCollapsed?: boolean;
  onToggleLeftRail?: () => void;
  onToggleRightRail?: () => void;
}

export function AppShell({
  children,
  topBar,
  leftRail,
  rightRail,
  filmStrip,
  statusBar,
  className,
  leftRailCollapsed = false,
  rightRailCollapsed = false,
  onToggleLeftRail,
  onToggleRightRail,
}: AppShellProps) {
  const hasLeft = leftRail != null && !leftRailCollapsed;
  const hasRight = rightRail != null && !rightRailCollapsed;
  const canRestoreLeft = leftRail != null && leftRailCollapsed && onToggleLeftRail;
  const canRestoreRight = rightRail != null && rightRailCollapsed && onToggleRightRail;

  // Build panel IDs based on which rails are present
  const panelIds = [
    ...(hasLeft ? ['left-rail'] : []),
    'stage',
    ...(hasRight ? ['right-rail'] : []),
  ];
  const layoutKey = panelIds.join(':');

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
        key={layoutKey}
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
              className="relative overflow-visible bg-zinc-900/50"
            >
              {onToggleLeftRail && (
                <button
                  type="button"
                  title="Collapse left pane"
                  aria-label="Collapse left pane"
                  className="absolute right-0 top-1/2 z-40 flex h-14 w-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100"
                  onClick={onToggleLeftRail}
                >
                  <PanelLeftClose className="size-3.5" />
                </button>
              )}
              <div className="h-full overflow-y-auto">
                {leftRail}
              </div>
            </Panel>
            <Separator className="w-1 bg-zinc-800 transition-colors hover:bg-zinc-600 data-[active]:bg-zinc-500" />
          </>
        )}

        {/* Stage */}
        <Panel id="stage" className="relative overflow-visible">
          {canRestoreLeft && (
            <button
              type="button"
              title="Open left pane"
              aria-label="Open left pane"
              className="absolute left-0 top-1/2 z-40 flex h-14 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100"
              onClick={onToggleLeftRail}
            >
              <PanelLeftOpen className="size-3.5" />
            </button>
          )}
          {canRestoreRight && (
            <button
              type="button"
              title="Open right pane"
              aria-label="Open right pane"
              className="absolute right-0 top-1/2 z-40 flex h-14 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100"
              onClick={onToggleRightRail}
            >
              <PanelRightOpen className="size-3.5" />
            </button>
          )}
          <div className="h-full overflow-y-auto">
            {children}
          </div>
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
              className="relative overflow-visible bg-zinc-900/50"
            >
              {onToggleRightRail && (
                <button
                  type="button"
                  title="Collapse right pane"
                  aria-label="Collapse right pane"
                  className="absolute left-0 top-1/2 z-40 flex h-14 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100"
                  onClick={onToggleRightRail}
                >
                  <PanelRightClose className="size-3.5" />
                </button>
              )}
              <div className="h-full overflow-y-auto">
                {rightRail}
              </div>
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
