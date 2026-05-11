import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Swords, Image, StickyNote, User, Clapperboard, Crown } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarNav,
  SidebarNavItem,
  SidebarToggle,
  useSidebar,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  AnvilIcon,
  cn,
} from '@anvil/ui';
import { useAuthStore } from '../../stores/authStore';

type UserRole = 'director' | 'player';

const DIRECTOR_NAV = [
  { label: 'Anvil', icon: AnvilIcon, to: '/app', end: true },
  { label: 'Live', icon: Clapperboard, to: '/app/live' },
  { label: 'Campaigns', icon: Swords, to: '/app/campaigns' },
  { label: 'Assets', icon: Image, to: '/app/assets' },
  { label: 'Notes', icon: StickyNote, to: '/app/notes' },
] as const;

const PLAYER_NAV = [
  { label: 'Anvil', icon: AnvilIcon, to: '/app', end: true },
  { label: 'Live', icon: Clapperboard, to: '/app/live' },
  { label: 'Heroes', icon: User, to: '/app/heroes' },
  { label: 'Notes', icon: StickyNote, to: '/app/notes' },
] as const;

const ROLE_OPTIONS = [
  { role: 'director', label: 'Director', icon: Crown },
  { role: 'player', label: 'Player', icon: User },
] as const;

const API_BASE = import.meta.env['VITE_API_BASE'] || '';

// Collect all labels from both nav configs for width calculation
const ALL_LABELS = [...new Set([...DIRECTOR_NAV, ...PLAYER_NAV].map((item) => item.label))];

function isRoleExclusiveRoute(role: UserRole, pathname: string) {
  const exclusivePaths = role === 'director' ? ['/app/heroes'] : ['/app/campaigns', '/app/assets'];
  return exclusivePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

interface SidebarRoleToggleProps {
  value: UserRole;
  pendingRole: UserRole | null;
  onValueChange: (role: UserRole) => void;
}

function SidebarRoleToggle({ value, pendingRole, onValueChange }: SidebarRoleToggleProps) {
  const { collapsed } = useSidebar();

  return (
    <div
      role="group"
      aria-label="Role"
      className="mx-1 mt-2 flex flex-col gap-1 rounded-lg border border-black/10 bg-white/20 p-1 shadow-inner shadow-black/10"
    >
      {ROLE_OPTIONS.map(({ role, label, icon: Icon }) => {
        const active = value === role;
        const disabled = pendingRole !== null;
        const button = (
          <button
            key={role}
            type="button"
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onValueChange(role)}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md px-2 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-60',
              collapsed ? 'justify-center px-0' : 'justify-start',
              active
                ? 'bg-zinc-950 text-zinc-50 shadow-sm shadow-black/20'
                : 'text-zinc-800 hover:bg-black/10 hover:text-zinc-950',
            )}
          >
            <Icon size={15} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        );

        if (!collapsed) return button;

        return (
          <Tooltip key={role}>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const setRole = useAuthStore((s) => s.setRole);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const isPlayer = user?.role === 'player';
  const navItems = isPlayer ? PLAYER_NAV : DIRECTOR_NAV;

  const isActive = (to: string, exact: boolean) => {
    return exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const handleRoleChange = async (role: UserRole) => {
    if (role === user?.role || pendingRole) return;

    const nextPath = isRoleExclusiveRoute(role, location.pathname)
      ? '/app'
      : `${location.pathname}${location.search}${location.hash}`;

    if (import.meta.env.DEV) {
      setPendingRole(role);
      try {
        const params = new URLSearchParams({ role, next: nextPath, format: 'json' });
        const res = await fetch(`${API_BASE}/api/auth/dev-login?${params.toString()}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to switch development role');
        await checkAuth();
        if (nextPath !== `${location.pathname}${location.search}${location.hash}`) {
          navigate(nextPath, { replace: true });
        }
      } finally {
        setPendingRole(null);
      }
      return;
    }

    setPendingRole(role);
    try {
      await setRole(role);
      if (nextPath === '/app') {
        navigate('/app', { replace: true });
      }
    } finally {
      setPendingRole(null);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider labels={ALL_LABELS}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar className="relative z-30 shrink-0" variant={isPlayer ? 'player' : 'director'}>
            <SidebarRoleToggle
              value={user?.role ?? 'director'}
              pendingRole={pendingRole}
              onValueChange={handleRoleChange}
            />
            <SidebarNav>
              {navItems.map(({ label, icon: Icon, to, ...rest }) => {
                const exact = 'end' in rest && rest.end === true;
                return (
                  <SidebarNavItem
                    key={to}
                    as={NavLink}
                    to={to}
                    end={exact}
                    icon={<Icon size={18} />}
                    label={label}
                    active={isActive(to, exact)}
                  />
                );
              })}
            </SidebarNav>
            <SidebarToggle />
          </Sidebar>
          <main className="relative z-0 flex-1 overflow-y-auto">
            <Outlet key={`${user?.id ?? 'anonymous'}:${user?.role ?? 'unknown'}:${location.pathname}`} />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
