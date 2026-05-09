'use client';

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip.js';
import { cn } from '../lib/utils.js';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

type SidebarVariant = 'director' | 'player' | 'default';

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  variant: SidebarVariant;
  setVariant: (v: SidebarVariant) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'anvil-sidebar-collapsed';

export interface SidebarProviderProps {
  children: ReactNode;
  /** Labels used to calculate expanded width based on longest item */
  labels?: string[];
}

export function SidebarProvider({ children, labels = [] }: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [variant, setVariant] = useState<SidebarVariant>('default');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      /* noop */
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  // Calculate width: icon (18px) + gap (12px) + text + padding (16px each side)
  // Base: 18 + 12 + 32 = 62px + text width
  // Approximate 8px per character for text-sm font
  const longestLabel = labels.reduce((a, b) => (a.length > b.length ? a : b), '');
  const textWidth = longestLabel.length * 8;
  const sidebarWidth = Math.max(144, 78 + textWidth);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, variant, setVariant }}>
      <div style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                           */
/* ------------------------------------------------------------------ */

export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  /** Role-based color variant */
  variant?: 'director' | 'player' | 'default';
}

export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    const { collapsed, setVariant } = useSidebar();

    // Sync variant to context so nav items can adapt
    useEffect(() => {
      setVariant(variant);
    }, [variant, setVariant]);

    return (
      <aside
        ref={ref}
        className={cn(
          'flex h-full flex-col border-r transition-[width] duration-200 ease-in-out',
          variant === 'director' && 'bg-sidebar-director border-sidebar-director/50',
          variant === 'player' && 'bg-sidebar-player border-sidebar-player/50',
          variant === 'default' && 'bg-zinc-950 border-zinc-800',
          collapsed ? 'w-12' : 'w-[var(--sidebar-width)]',
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    );
  },
);
Sidebar.displayName = 'Sidebar';

/* ------------------------------------------------------------------ */
/*  SidebarNav                                                        */
/* ------------------------------------------------------------------ */

export const SidebarNav = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} className={cn('flex flex-1 flex-col gap-1 p-2', className)} {...props} />
  ),
);
SidebarNav.displayName = 'SidebarNav';

/* ------------------------------------------------------------------ */
/*  SidebarNavItem                                                    */
/* ------------------------------------------------------------------ */

export interface SidebarNavItemProps extends HTMLAttributes<HTMLAnchorElement> {
  icon: ReactNode;
  label: string;
  active?: boolean;
  /** Pass-through for wrapper element (e.g. NavLink) */
  as?: React.ElementType;
  to?: string;
  end?: boolean;
}

export const SidebarNavItem = forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ icon, label, active, className, as: Comp = 'a', ...props }, ref) => {
    const { collapsed, variant } = useSidebar();
    const isColored = variant === 'director' || variant === 'player';

    const content = (
      <Comp
        ref={ref}
        aria-label={collapsed ? label : undefined}
        className={cn(
          'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
          // Default (dark) variant
          !isColored && 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
          !isColored && active && 'border-l-2 border-anvil-accent bg-zinc-800 text-zinc-100',
          // Colored (light) variants - use dark text
          isColored && 'text-zinc-800 hover:bg-black/10 hover:text-zinc-900',
          isColored && active && 'border-l-2 border-zinc-800 bg-black/15 text-zinc-900 font-semibold',
          collapsed && 'justify-center',
          className,
        )}
        {...props}
      >
        <span className="shrink-0">{icon}</span>
        {!collapsed && <span className="truncate">{label}</span>}
      </Comp>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      );
    }

    return content;
  },
);
SidebarNavItem.displayName = 'SidebarNavItem';

/* ------------------------------------------------------------------ */
/*  SidebarToggle                                                     */
/* ------------------------------------------------------------------ */

export function SidebarToggle({ className }: { className?: string }) {
  const { collapsed, toggle, variant } = useSidebar();
  const isColored = variant === 'director' || variant === 'player';

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex items-center justify-center border-t p-2 transition-colors',
        !isColored && 'border-zinc-800 text-zinc-500 hover:text-zinc-100',
        isColored && 'border-black/10 text-zinc-700 hover:text-zinc-900',
        className,
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('transition-transform', collapsed && 'rotate-180')}
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
