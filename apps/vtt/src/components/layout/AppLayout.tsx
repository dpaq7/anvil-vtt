import { useEffect, useState } from 'react';
import { Link, Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CircleUserRound,
  Download,
  LogOut,
  Moon,
  Settings,
  Sun,
  Swords,
  Image,
  StickyNote,
  User,
  Clapperboard,
  Crown,
  Smartphone,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarNav,
  SidebarNavItem,
  SidebarToggle,
  useSidebar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  AnvilIcon,
  cn,
} from '@anvil/ui';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { addBreadcrumb } from '../../lib/bug-reporting';
import { IssueReportButton } from './IssueReportButton.js';

type UserRole = 'director' | 'player';

const DIRECTOR_NAV = [
  { label: 'Anvil', icon: AnvilIcon, to: '/app', end: true },
  { label: 'Live', icon: Clapperboard, to: '/app/live' },
  { label: 'Mobile', icon: Smartphone, to: '/app/mobile' },
  { label: 'Campaigns', icon: Swords, to: '/app/campaigns' },
  { label: 'Assets', icon: Image, to: '/app/assets' },
  { label: 'Notes', icon: StickyNote, to: '/app/notes' },
] as const;

const PLAYER_NAV = [
  { label: 'Anvil', icon: AnvilIcon, to: '/app', end: true },
  { label: 'Live', icon: Clapperboard, to: '/app/live' },
  { label: 'Mobile', icon: Smartphone, to: '/app/mobile' },
  { label: 'Heroes', icon: User, to: '/app/heroes' },
  { label: 'Notes', icon: StickyNote, to: '/app/notes' },
] as const;

const ROLE_OPTIONS = [
  { role: 'director', label: 'Director', icon: Crown },
  { role: 'player', label: 'Player', icon: User },
] as const;

const API_BASE = import.meta.env['VITE_API_BASE'] || '';

// Collect all labels from both nav configs for width calculation
const ALL_LABELS = ['Account', 'Report issue', ...new Set([...DIRECTOR_NAV, ...PLAYER_NAV].map((item) => item.label))];

function onboardingId(label: string) {
  return `menu-${label.toLowerCase()}`;
}

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
      data-onboarding="menu-role-toggle"
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
                ? 'bg-anvil-ink text-anvil-paper shadow-sm shadow-black/20'
                : 'text-anvil-ink/80 hover:bg-black/10 hover:text-anvil-ink',
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

function ThemeToggle() {
  const { collapsed } = useSidebar();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isLight = theme === 'light';
  const Icon = isLight ? Sun : Moon;
  const displayLabel = isLight ? 'Light' : 'Dark';
  const actionLabel = isLight ? 'Switch to dark mode' : 'Switch to light mode';

  const button = (
    <button
      type="button"
      aria-label={actionLabel}
      aria-pressed={isLight}
      data-onboarding="menu-theme"
      onClick={toggleTheme}
      className={cn(
        'mx-1 mb-2 flex h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-anvil-ink/80 transition-colors hover:bg-black/10 hover:text-anvil-ink',
        collapsed ? 'w-10 justify-center px-0' : 'w-[calc(100%-0.5rem)] justify-start',
      )}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{displayLabel}</span>
          <span
            aria-hidden="true"
            className={cn(
              'ml-auto flex h-5 w-9 shrink-0 items-center rounded-full border border-black/10 p-0.5 shadow-inner shadow-black/10 transition-colors',
              isLight ? 'bg-anvil-ink/25' : 'bg-black/15',
            )}
          >
            <span
              className={cn(
                'size-4 rounded-full bg-anvil-ink shadow-sm transition-transform',
                isLight && 'translate-x-4',
              )}
            />
          </span>
        </>
      )}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{actionLabel}</TooltipContent>
    </Tooltip>
  );
}

function AccountMenu() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const active = location.pathname === '/app/account';
  const initials = (user?.username ?? 'Account')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account"
              data-onboarding="menu-account"
              className={cn(
                'mx-1 mt-2 flex h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors',
                collapsed ? 'w-10 justify-center px-0' : 'w-[calc(100%-0.5rem)] justify-start',
                active
                  ? 'bg-anvil-ink text-anvil-paper shadow-sm shadow-black/20'
                  : 'text-anvil-ink/80 hover:bg-black/10 hover:text-anvil-ink',
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/15">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold">{initials}</span>
                )}
              </span>
              {!collapsed && <span className="truncate">{user?.username ?? 'Account'}</span>}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        {collapsed && <TooltipContent side="right">Account</TooltipContent>}
      </Tooltip>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-zinc-100">{user?.username ?? 'Account'}</span>
          <span className="mt-0.5 block text-xs font-normal capitalize text-zinc-500">
            {user?.role ?? 'user'} flow
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/account?section=profile" className="gap-2">
            <CircleUserRound className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/account?section=settings" className="gap-2">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/account?section=data" className="gap-2">
            <Download className="size-4" />
            Data
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={loggingOut}
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          className="gap-2 text-red-300 focus:text-red-200"
        >
          <LogOut className="size-4" />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

  useEffect(() => {
    addBreadcrumb({
      category: 'navigation',
      message: 'Route changed',
      data: {
        path: location.pathname,
        search: location.search ? '[redacted]' : '',
        hash: location.hash ? '[redacted]' : '',
        role: user?.role ?? null,
      },
    });
  }, [location.hash, location.pathname, location.search, user?.role]);

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
          <Sidebar
            className="relative z-30 shrink-0"
            variant={isPlayer ? 'player' : 'director'}
            data-onboarding="menu-bar"
          >
            <AccountMenu />
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
                    data-onboarding={onboardingId(label)}
                  />
                );
              })}
            </SidebarNav>
            <IssueReportButton />
            <ThemeToggle />
            <div data-onboarding="menu-sidebar-toggle">
              <SidebarToggle />
            </div>
          </Sidebar>
          <main className="relative flex-1 overflow-y-auto">
            <Outlet key={`${user?.id ?? 'anonymous'}:${user?.role ?? 'unknown'}:${location.pathname}`} />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
