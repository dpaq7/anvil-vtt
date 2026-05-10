import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Swords, Image, StickyNote, User, Clapperboard } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarNav,
  SidebarNavItem,
  SidebarToggle,
  TooltipProvider,
  AnvilIcon,
} from '@anvil/ui';
import { useAuthStore } from '../../stores/authStore';

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

// Collect all labels from both nav configs for width calculation
const ALL_LABELS = [...new Set([...DIRECTOR_NAV, ...PLAYER_NAV].map((item) => item.label))];

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const isPlayer = user?.role === 'player';
  const navItems = isPlayer ? PLAYER_NAV : DIRECTOR_NAV;

  const isActive = (to: string, exact: boolean) => {
    return exact ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider labels={ALL_LABELS}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar variant={isPlayer ? 'player' : 'director'}>
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
          <main className="flex-1 overflow-y-auto">
            <Outlet key={location.pathname} />
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
