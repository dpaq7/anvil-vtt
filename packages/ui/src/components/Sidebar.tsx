'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip.js';
import { cn } from '../lib/utils.js';
import { SidebarContext, useSidebar, type SidebarVariant } from './sidebar-context.js';

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'anvil-sidebar-collapsed:v2';

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
  const expand = useCallback(() => setCollapsed(false), []);

  // Calculate width: icon (18px) + gap (12px) + text + padding (16px each side)
  // Base: 18 + 12 + 32 = 62px + text width
  // Approximate 8px per character for text-sm font
  const longestLabel = labels.reduce((a, b) => (a.length > b.length ? a : b), '');
  const textWidth = longestLabel.length * 8;
  const sidebarWidth = Math.max(144, 78 + textWidth);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, expand, variant, setVariant }}>
      <div style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
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
          // App rail (DESIGN.md section 4): one framed surface. The Director /
          // Player variant no longer tints the rail; the role switch shows it.
          'flex h-full flex-col border-r-[3px] border-line bg-surface text-text transition-[width] duration-200 ease-in-out',
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
    <nav ref={ref} className={cn('flex flex-1 flex-col', className)} {...props} />
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
    const { collapsed } = useSidebar();

    const content = (
      <Comp
        ref={ref}
        aria-label={collapsed ? label : undefined}
        className={cn(
          // Nav row: 16 px display; the selected row is filled with text and
          // carries a 6 px active bar on its inner edge.
          'flex min-h-[46px] items-center gap-3 px-4 font-display text-base font-bold text-text transition-colors hover:bg-well',
          active && 'bg-text text-surface shadow-[inset_6px_0_0_var(--color-active)] hover:bg-text',
          collapsed && 'justify-center px-0',
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
  const { collapsed, toggle } = useSidebar();

  return (
    <div className="w-full border-t-[1.5px] border-line-quiet">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center justify-center p-2 text-text-soft transition-colors hover:text-text',
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
    </div>
  );
}
