import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Loader2,
  NotebookText,
  PlayCircle,
  Plus,
  User,
  Users,
  X,
} from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, cn, useSidebar } from '@anvil/ui';
import type { HeroSummary, Note } from '@anvil/types';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import type { CampaignData, CampaignSession } from '../components/sessions/types.js';
import { PERSONAL_NOTEBOOK_ID } from '../stores/notesStore.js';

const MAX_NOTE_CAMPAIGNS = 8;
const MAX_LIST_ITEMS = 5;
const PERSONAL_NOTEBOOK_NAME = 'Personal Notes';

const DASHBOARD_BACKGROUNDS = {
  director: '/dashboard/director-flow-background.png',
  player: '/dashboard/player-flow-background.png',
} as const;

const APP_VERSION = '0.2.0';
const ONBOARDING_STORAGE_VERSION = `v${APP_VERSION}`;
const ONBOARDING_CARD_WIDTH = 340;
const ONBOARDING_CARD_ESTIMATED_HEIGHT = 260;
const ONBOARDING_VIEWPORT_INSET = 16;
const ONBOARDING_TARGET_PADDING = 8;
const DASHBOARD_SECTION_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 32rem), 1fr))',
};
const DASHBOARD_SECTION_CLASS =
  'min-w-0 rounded-xl border border-zinc-800/65 bg-zinc-950/50 p-4 shadow-sm shadow-black/10 backdrop-blur-md';
const DASHBOARD_ROW_CARD_CLASS =
  'rounded-none border-0 bg-transparent shadow-none transition-colors hover:bg-zinc-900/35';

interface AssetItem {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  file_size: number | null;
  created_at: string;
  uploaded_at: string | null;
}

interface DashboardNote extends Note {
  campaignName: string;
}

interface DashboardState {
  campaigns: CampaignData[];
  heroes: HeroSummary[];
  notes: DashboardNote[];
  assets: AssetItem[];
}

interface LiveTable {
  campaign: CampaignData;
  session: CampaignSession;
}

interface RecentCharacter {
  id: string;
  name: string;
  detail: string;
  badge: string;
  date: string | null;
  to: string;
}

const INITIAL_DASHBOARD: DashboardState = {
  campaigns: [],
  heroes: [],
  notes: [],
  assets: [],
};

const COMMON_MENU_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'account-menu',
    target: 'menu-account',
    title: 'Account menu',
    description: 'Open profile settings, app preferences, and data controls from here.',
    placement: 'right',
  },
  {
    id: 'role-switcher',
    target: 'menu-role-toggle',
    title: 'Flow switcher',
    description: 'Move between Director and Player flow when you need a different workspace.',
    placement: 'right',
  },
  {
    id: 'dashboard-nav',
    target: 'menu-anvil',
    title: 'Dashboard',
    description: 'Return to this overview from anywhere in the app.',
    placement: 'right',
  },
  {
    id: 'live-nav',
    target: 'menu-live',
    title: 'Live',
    description: 'Find active tables, lobby rooms, and session entry points.',
    placement: 'right',
  },
];

const COMMON_UTILITY_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'notes-nav',
    target: 'menu-notes',
    title: 'Notes',
    description: 'Open campaign and personal notes without leaving the main workspace.',
    placement: 'right',
  },
  {
    id: 'report-issue',
    target: 'menu-report-issue',
    title: 'Report issue',
    description:
      'Send a manual report when something crashes, looks wrong, or feels out of sync. Recent navigation and session breadcrumbs are included automatically.',
    placement: 'right',
  },
  {
    id: 'theme-toggle',
    target: 'menu-theme',
    title: 'Theme',
    description: 'Switch between light and dark display modes.',
    placement: 'right',
  },
  {
    id: 'sidebar-toggle',
    target: 'menu-sidebar-toggle',
    title: 'Menu width',
    description: 'Collapse or expand the menu bar when you want more room on the dashboard.',
    placement: 'right',
  },
];

const DASHBOARD_ONBOARDING_STEPS: Record<DashboardRoleKey, OnboardingStep[]> = {
  director: [
    ...COMMON_MENU_ONBOARDING_STEPS,
    {
      id: 'campaigns-nav',
      target: 'menu-campaigns',
      title: 'Campaigns',
      description: 'Build campaigns, organize modules, prepare scenes, and manage invites.',
      placement: 'right',
    },
    {
      id: 'assets-nav',
      target: 'menu-assets',
      title: 'Assets',
      description: 'Manage maps, portraits, audio, terrain, NPCs, and other table material.',
      placement: 'right',
    },
    ...COMMON_UTILITY_ONBOARDING_STEPS,
    {
      id: 'dashboard-header',
      target: 'dashboard-header',
      title: 'Director dashboard',
      description: 'This header summarizes your current prep surface and keeps the primary Director actions close.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-actions',
      target: 'dashboard-actions',
      title: 'Quick actions',
      description: 'Open the Live workspace from this primary dashboard action.',
      placement: 'bottom',
    },
    {
      id: 'live-section',
      target: 'dashboard-section-live',
      title: 'Sessions in progress',
      description: 'Active and lobby sessions appear here so you can rejoin the table quickly.',
      placement: 'bottom',
    },
    {
      id: 'campaigns-section',
      target: 'dashboard-section-campaigns',
      title: 'Campaign activity',
      description: 'Recent campaigns stay visible with session, scene, player, and last-played context.',
      placement: 'right',
    },
    {
      id: 'notes-section',
      target: 'dashboard-section-notes',
      title: 'Notebook updates',
      description: 'Recently updated notes surface here for fast prep review.',
      placement: 'left',
    },
    {
      id: 'characters-section',
      target: 'dashboard-section-characters',
      title: 'Player roster',
      description: 'Joined player characters are collected here as your table fills out.',
      placement: 'right',
    },
    {
      id: 'assets-section',
      target: 'dashboard-section-assets',
      title: 'Uploads',
      description: 'Your newest maps, portraits, audio, and files appear here after upload.',
      placement: 'left',
    },
  ],
  player: [
    ...COMMON_MENU_ONBOARDING_STEPS,
    {
      id: 'heroes-nav',
      target: 'menu-heroes',
      title: 'Heroes',
      description: 'Create heroes, review character sheets, and prepare for live play.',
      placement: 'right',
    },
    ...COMMON_UTILITY_ONBOARDING_STEPS,
    {
      id: 'dashboard-header',
      target: 'dashboard-header',
      title: 'Player dashboard',
      description: 'This header keeps your table status, characters, and player actions in one place.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-actions',
      target: 'dashboard-actions',
      title: 'Quick actions',
      description: 'Jump to live rooms, heroes, join codes, or notes from these shortcut buttons.',
      placement: 'bottom',
    },
    {
      id: 'live-section',
      target: 'dashboard-section-live',
      title: 'Available sessions',
      description: 'Rooms opened by your Director appear here when it is time to join.',
      placement: 'bottom',
    },
    {
      id: 'campaigns-section',
      target: 'dashboard-section-campaigns',
      title: 'Joined tables',
      description: 'Campaigns you belong to are listed here with recent activity and table context.',
      placement: 'right',
    },
    {
      id: 'notes-section',
      target: 'dashboard-section-notes',
      title: 'Notebook updates',
      description: 'Recent personal, session, and campaign notes are easy to reopen from this area.',
      placement: 'left',
    },
    {
      id: 'characters-section',
      target: 'dashboard-section-characters',
      title: 'Hero roster',
      description: 'Your heroes appear here with level and class details for fast access.',
      placement: 'right',
    },
    {
      id: 'assets-section',
      target: 'dashboard-section-assets',
      title: 'Uploads',
      description: 'Recent files connected to your characters or notes appear here.',
      placement: 'left',
    },
  ],
};

type DashboardSectionId = 'live' | 'campaigns' | 'notes' | 'characters' | 'assets';
type DashboardRoleKey = keyof typeof DASHBOARD_BACKGROUNDS;
type OnboardingPhase = 'hidden' | 'welcome' | 'tour';
type OnboardingPlacement = 'top' | 'right' | 'bottom' | 'left';

interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement?: OnboardingPlacement;
}

interface OnboardingRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

interface DashboardSectionConfig {
  id: DashboardSectionId;
  eyebrow: string;
  title: string;
  to?: string;
  className?: string;
  body: ReactNode;
}

function onboardingStorageKey(userId: string | undefined, roleKey: DashboardRoleKey) {
  return `anvil-dashboard-onboarding:${ONBOARDING_STORAGE_VERSION}:${userId ?? 'anonymous'}:${roleKey}`;
}

function hasOnboardingDismissal(storageKey: string) {
  try {
    const value = localStorage.getItem(storageKey);
    return value === 'never';
  } catch {
    return false;
  }
}

function writeOnboardingDismissal(storageKey: string) {
  try {
    localStorage.setItem(storageKey, 'never');
  } catch {
    /* noop */
  }
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function orderedPlacements(preferred: OnboardingPlacement | undefined) {
  const fallback: OnboardingPlacement[] = ['right', 'left', 'bottom', 'top'];
  return preferred ? [preferred, ...fallback.filter((placement) => placement !== preferred)] : fallback;
}

function getCalloutPosition(rect: OnboardingRect | null, placement: OnboardingPlacement | undefined): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(ONBOARDING_CARD_WIDTH, viewportWidth - ONBOARDING_VIEWPORT_INSET * 2);
  const gap = 24;

  if (!rect || viewportWidth < 720) {
    return {
      left: ONBOARDING_VIEWPORT_INSET,
      right: ONBOARDING_VIEWPORT_INSET,
      bottom: ONBOARDING_VIEWPORT_INSET,
      width: 'auto',
    };
  }

  const available = {
    right: viewportWidth - rect.right - gap - ONBOARDING_VIEWPORT_INSET,
    left: rect.left - gap - ONBOARDING_VIEWPORT_INSET,
    bottom: viewportHeight - rect.bottom - gap - ONBOARDING_VIEWPORT_INSET,
    top: rect.top - gap - ONBOARDING_VIEWPORT_INSET,
  };

  const chosen = orderedPlacements(placement).find((candidate) => {
    if (candidate === 'right' || candidate === 'left') return available[candidate] >= cardWidth;
    return available[candidate] >= ONBOARDING_CARD_ESTIMATED_HEIGHT;
  }) ?? 'bottom';

  if (chosen === 'right') {
    return {
      left: rect.right + gap,
      top: clamp(rect.top, ONBOARDING_VIEWPORT_INSET, viewportHeight - ONBOARDING_CARD_ESTIMATED_HEIGHT - ONBOARDING_VIEWPORT_INSET),
      width: cardWidth,
    };
  }

  if (chosen === 'left') {
    return {
      left: rect.left - gap - cardWidth,
      top: clamp(rect.top, ONBOARDING_VIEWPORT_INSET, viewportHeight - ONBOARDING_CARD_ESTIMATED_HEIGHT - ONBOARDING_VIEWPORT_INSET),
      width: cardWidth,
    };
  }

  if (chosen === 'top') {
    return {
      left: clamp(rect.left + rect.width / 2 - cardWidth / 2, ONBOARDING_VIEWPORT_INSET, viewportWidth - cardWidth - ONBOARDING_VIEWPORT_INSET),
      top: rect.top - gap - ONBOARDING_CARD_ESTIMATED_HEIGHT,
      width: cardWidth,
    };
  }

  return {
    left: clamp(rect.left + rect.width / 2 - cardWidth / 2, ONBOARDING_VIEWPORT_INSET, viewportWidth - cardWidth - ONBOARDING_VIEWPORT_INSET),
    top: rect.bottom + gap,
    width: cardWidth,
  };
}

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value.replace(' ', 'T'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string | null | undefined) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return 'No activity';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function formatBytes(value: number | null) {
  if (!value) return 'Size unknown';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function plainPreview(content: string) {
  return content
    .replace(/[`*_>#\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'A';
}

function livePath(session: CampaignSession) {
  return session.status === 'lobby' ? `/app/session/${session.id}/lobby` : `/app/session/${session.id}`;
}

function DashboardSection({ section }: { section: DashboardSectionConfig }) {
  return (
    <section
      data-onboarding={`dashboard-section-${section.id}`}
      className={cn(DASHBOARD_SECTION_CLASS, section.className)}
    >
      <SectionHeader eyebrow={section.eyebrow} title={section.title} to={section.to} />
      {section.body}
    </section>
  );
}

function DashboardList<T extends { id: string }>({
  items,
  className,
  emptyState,
  renderItem,
}: {
  items: T[];
  className?: string;
  emptyState: ReactNode;
  renderItem: (item: T) => ReactNode;
}) {
  if (items.length === 0) return <>{emptyState}</>;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-zinc-800/55 bg-zinc-950/30', className)}>
      {items.map((item, index) => (
        <div key={item.id} className={cn(index > 0 && 'border-t border-zinc-800/55')}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

function DashboardSections({ sections }: { sections: DashboardSectionConfig[] }) {
  return (
    <div className="grid gap-5" style={DASHBOARD_SECTION_GRID_STYLE}>
      {sections.map((section) => (
        <DashboardSection key={section.id} section={section} />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail, action }: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: { label: string; to: string; icon: LucideIcon };
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800/70 bg-zinc-950/30 px-4 py-5 text-center">
      <Icon className="size-6 text-zinc-500" />
      <p className="mt-2 text-sm font-semibold text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{detail}</p>
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to={action.to}>
            <action.icon size={14} />
            {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  eyebrow,
  to,
}: {
  title: string;
  eyebrow: string;
  to?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
        <h2 className="mt-1 text-sm font-semibold text-zinc-100">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="dashboard-accent-link inline-flex items-center gap-1 text-xs font-semibold">
          Open
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

function DashboardOnboarding({ roleKey, userId }: { roleKey: DashboardRoleKey; userId: string | undefined }) {
  const { expand } = useSidebar();
  const steps = DASHBOARD_ONBOARDING_STEPS[roleKey];
  const storageKey = useMemo(() => onboardingStorageKey(userId, roleKey), [roleKey, userId]);
  const [phase, setPhase] = useState<OnboardingPhase>('hidden');
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<OnboardingRect | null>(null);
  const activeStep = phase === 'tour' ? steps[stepIndex] : null;
  const isFinalStep = stepIndex === steps.length - 1;
  const portalContainer = typeof document === 'undefined' ? null : document.body;

  useEffect(() => {
    setNeverShowAgain(false);
    setStepIndex(0);
    setTargetRect(null);
    setPhase(hasOnboardingDismissal(storageKey) ? 'hidden' : 'welcome');
  }, [storageKey]);

  const updateTargetRect = useCallback(() => {
    if (!activeStep) return;

    const target = document.querySelector<HTMLElement>(`[data-onboarding="${activeStep.target}"]`);
    if (!target) {
      setTargetRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, [activeStep]);

  useEffect(() => {
    if (!activeStep) return;

    expand();
    const target = document.querySelector<HTMLElement>(`[data-onboarding="${activeStep.target}"]`);
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });

    const animationFrame = window.requestAnimationFrame(updateTargetRect);
    const timeout = window.setTimeout(updateTargetRect, 260);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeout);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [activeStep, expand, updateTargetRect]);

  const skipOnboarding = useCallback(() => {
    if (neverShowAgain) writeOnboardingDismissal(storageKey);
    setPhase('hidden');
  }, [neverShowAgain, storageKey]);

  const startTour = useCallback(() => {
    if (neverShowAgain) writeOnboardingDismissal(storageKey);
    expand();
    setStepIndex(0);
    setTargetRect(null);
    setPhase('tour');
  }, [expand, neverShowAgain, storageKey]);

  const finishTour = useCallback(() => {
    if (neverShowAgain) writeOnboardingDismissal(storageKey);
    setPhase('hidden');
  }, [neverShowAgain, storageKey]);

  const goNext = useCallback(() => {
    if (isFinalStep) {
      finishTour();
      return;
    }

    setTargetRect(null);
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [finishTour, isFinalStep, steps.length]);

  const goBack = useCallback(() => {
    setTargetRect(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  if (phase === 'hidden' || !portalContainer) return null;

  if (phase === 'welcome') {
    return createPortal((
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-onboarding-title"
          className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/40"
        >
          <div className="flex flex-wrap gap-2">
            <Badge className={cn(
              'border-transparent',
              roleKey === 'director' ? 'bg-rose-300/10 text-flow-director' : 'bg-cyan-300/10 text-flow-player',
            )}>
              {roleKey === 'director' ? 'Director flow' : 'Player flow'}
            </Badge>
            <Badge variant="secondary">Beta v{APP_VERSION}</Badge>
          </div>
          <h2 id="dashboard-onboarding-title" className="mt-4 text-xl font-semibold text-zinc-50">
            Welcome to Anvil beta testing
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Thanks for helping test Anvil v{APP_VERSION} in the{' '}
            {roleKey === 'director' ? 'Director' : 'Player'} flow. This brief tour highlights the
            dashboard, menu tools, and the issue reporter to use when something crashes, looks wrong,
            or needs context.
          </p>
          <label className="mt-5 flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={(event) => setNeverShowAgain(event.currentTarget.checked)}
              className="size-4 rounded border-zinc-600 bg-zinc-900 accent-zinc-100"
            />
            Never show again
          </label>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={skipOnboarding}>
              <X size={15} />
              Skip
            </Button>
            <Button type="button" onClick={startTour}>
              Start tour
              <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </div>
    ), portalContainer);
  }

  if (!activeStep) return null;

  const highlightRect = targetRect
    ? (() => {
        const top = Math.max(targetRect.top - ONBOARDING_TARGET_PADDING, 4);
        const left = Math.max(targetRect.left - ONBOARDING_TARGET_PADDING, 4);
        return {
          top,
          left,
          width: Math.min(targetRect.width + ONBOARDING_TARGET_PADDING * 2, window.innerWidth - left - 4),
          height: Math.min(targetRect.height + ONBOARDING_TARGET_PADDING * 2, window.innerHeight - top - 4),
        };
      })()
    : undefined;
  const calloutStyle = getCalloutPosition(targetRect, activeStep.placement);

  return createPortal((
    <>
      {!highlightRect && <div className="fixed inset-0 z-50 bg-black/70" />}
      {highlightRect && (
        <>
          <div
            aria-hidden="true"
            className="fixed left-0 top-0 z-50 bg-black/70"
            style={{ right: 0, height: highlightRect.top }}
          />
          <div
            aria-hidden="true"
            className="fixed left-0 z-50 bg-black/70"
            style={{ top: highlightRect.top, width: highlightRect.left, height: highlightRect.height }}
          />
          <div
            aria-hidden="true"
            className="fixed right-0 z-50 bg-black/70"
            style={{
              top: highlightRect.top,
              left: highlightRect.left + highlightRect.width,
              height: highlightRect.height,
            }}
          />
          <div
            aria-hidden="true"
            className="fixed bottom-0 left-0 z-50 bg-black/70"
            style={{ right: 0, top: highlightRect.top + highlightRect.height }}
          />
        </>
      )}
      {highlightRect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[75] rounded-lg border-4 border-sky-300 bg-sky-300/10 shadow-[0_0_0_4px_rgba(56,189,248,0.28),0_0_30px_rgba(125,211,252,0.45)]"
          style={highlightRect}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-onboarding-step-title"
        className="fixed z-[80] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-5 shadow-2xl shadow-black/50"
        style={calloutStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <Badge variant="secondary">Step {stepIndex + 1} of {steps.length}</Badge>
          <button
            type="button"
            aria-label="Skip onboarding"
            onClick={skipOnboarding}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        <h2 id="dashboard-onboarding-step-title" className="mt-4 text-lg font-semibold text-zinc-50">
          {activeStep.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{activeStep.description}</p>
        <div className="mt-5 flex items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={stepIndex === 0}>
            <ChevronLeft size={14} />
            Back
          </Button>
          <Button type="button" size="sm" onClick={goNext}>
            {isFinalStep ? (
              <>
                <CheckCircle2 size={14} />
                Finish
              </>
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  ), portalContainer);
}

function CampaignCard({ campaign, isDirector }: { campaign: CampaignData; isDirector: boolean }) {
  const liveSession = campaign.sessions.find((session) => session.status === 'lobby' || session.status === 'active');
  const sceneLabel = campaign.scenes.length === 1 ? 'scene' : 'scenes';
  const sessionLabel = campaign.sessions.length === 1 ? 'session' : 'sessions';
  const memberCount = campaign.members.filter((member) => member.role === 'player').length;

  return (
    <Card className={DASHBOARD_ROW_CARD_CLASS}>
      <CardHeader className="p-3 pb-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold leading-5 text-zinc-100">
              {campaign.name}
            </CardTitle>
            <p className="mt-1 line-clamp-2 text-xs leading-4 text-zinc-500">
              {campaign.description || (isDirector ? 'No description yet.' : `Directed by ${campaign.director?.username ?? 'Director'}`)}
            </p>
          </div>
          {liveSession && (
            <Badge className="dashboard-tone-green shrink-0 text-[11px]">
              {liveSession.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-400">
          <span>{campaign.sessions.length} {sessionLabel}</span>
          {campaign.scenes.length > 0 && <span>{campaign.scenes.length} {sceneLabel}</span>}
          <span>{memberCount} players</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[11px] text-zinc-500">Last played {formatDate(campaign.last_played)}</span>
          <Button asChild variant="outline" size="sm">
            <Link to={isDirector ? `/app/campaigns/${campaign.id}` : '/app/live'}>
              <ArrowRight size={14} />
              Open
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LiveTableCard({ table, isDirector }: { table: LiveTable; isDirector: boolean }) {
  return (
    <Card className={DASHBOARD_ROW_CARD_CLASS}>
      <CardContent className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PlayCircle size={15} className="dashboard-text-green shrink-0" />
            <p className="truncate text-sm font-semibold text-zinc-100">{table.session.name}</p>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{table.campaign.name}</p>
          {table.session.room_code && (
            <p className="dashboard-text-green mt-1.5 font-mono text-[11px]">{table.session.room_code}</p>
          )}
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link to={isDirector ? livePath(table.session) : '/app/live'}>
            <ArrowRight size={14} />
            {isDirector ? 'Rejoin' : 'Join'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function CharacterCard({ character }: { character: RecentCharacter }) {
  return (
    <Card className={DASHBOARD_ROW_CARD_CLASS}>
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className="dashboard-tone-amber flex size-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold">
          {initials(character.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{character.name}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{character.detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className="text-[11px]">{character.badge}</Badge>
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link to={character.to} aria-label={`Open ${character.name}`}>
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NoteCard({ note }: { note: DashboardNote }) {
  const preview = plainPreview(note.content);
  return (
    <Card className={DASHBOARD_ROW_CARD_CLASS}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{note.title}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{note.campaignName}</p>
          </div>
          <span className="shrink-0 text-[11px] text-zinc-500">{formatDate(note.updatedAt)}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-4 text-zinc-400">
          {preview || 'Empty note'}
        </p>
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset, canOpenAssets }: { asset: AssetItem; canOpenAssets: boolean }) {
  const uploadedAt = formatDate(asset.uploaded_at ?? asset.created_at);
  const content = (
    <CardContent className="flex items-center gap-2.5 p-3">
      <div className="dashboard-tone-cyan flex size-9 shrink-0 items-center justify-center rounded-lg border">
        <ImageIcon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{asset.name}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {asset.type} · {formatBytes(asset.file_size)} · {uploadedAt}
        </p>
      </div>
    </CardContent>
  );

  return (
    <Card className={DASHBOARD_ROW_CARD_CLASS}>
      {canOpenAssets ? <Link to="/app/assets">{content}</Link> : content}
    </Card>
  );
}

function useDashboardData() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardState>(INITIAL_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const [{ campaigns }, heroes, assetsResponse] = await Promise.all([
          api.get<{ campaigns: CampaignData[] }>('/api/game-sessions'),
          api.get<HeroSummary[]>('/api/heroes').catch(() => []),
          api.get<{ assets: AssetItem[] }>('/api/assets').catch(() => ({ assets: [] })),
        ]);

        const noteCampaigns = campaigns.slice(0, MAX_NOTE_CAMPAIGNS);
        const noteResults = await Promise.allSettled([
          api.get<{ notes: Note[] }>('/api/notes/personal/notes')
            .then(({ notes }) => notes.map((note) => ({
              ...note,
              campaignId: PERSONAL_NOTEBOOK_ID,
              campaignName: PERSONAL_NOTEBOOK_NAME,
            }))),
          ...noteCampaigns.map(async (campaign) => {
            const { notes } = await api.get<{ notes: Note[] }>(`/api/campaigns/${campaign.id}/notes`);
            return notes.map((note) => ({ ...note, campaignName: campaign.name }));
          }),
        ]);

        const notes = noteResults
          .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
          .sort((a, b) => toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt));

        const assets = [...assetsResponse.assets].sort(
          (a, b) => toTimestamp(b.uploaded_at ?? b.created_at) - toTimestamp(a.uploaded_at ?? a.created_at),
        );

        if (!cancelled) {
          setData({
            campaigns,
            heroes,
            notes,
            assets,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard');
          setData(INITIAL_DASHBOARD);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { data, loading, error };
}

export function Home() {
  const user = useAuthStore((state) => state.user);
  const isDirector = user?.role !== 'player';
  const { data, loading, error } = useDashboardData();
  const backgroundUrl = isDirector ? DASHBOARD_BACKGROUNDS.director : DASHBOARD_BACKGROUNDS.player;
  const roleKey = isDirector ? 'director' : 'player';

  const liveTables = useMemo<LiveTable[]>(
    () =>
      data.campaigns.flatMap((campaign) =>
        campaign.sessions
          .filter((session) => session.status === 'lobby' || session.status === 'active')
          .map((session) => ({ campaign, session })),
      ),
    [data.campaigns],
  );

  const recentCampaigns = useMemo(
    () =>
      [...data.campaigns]
        .sort((a, b) => toTimestamp(b.last_played) - toTimestamp(a.last_played))
        .slice(0, MAX_LIST_ITEMS),
    [data.campaigns],
  );

  const liveTableItems = useMemo(
    () => liveTables.map((table) => ({ id: table.session.id, table })),
    [liveTables],
  );

  const recentCharacters = useMemo<RecentCharacter[]>(() => {
    if (!isDirector) {
      return data.heroes
        .map((hero) => ({
          id: hero.id,
          name: hero.name,
          detail: [
            hero.heroClass ?? 'Hero',
            hero.ancestry?.name,
          ].filter(Boolean).join(' · '),
          badge: `Lv ${hero.level}`,
          date: hero.updatedAt,
          to: `/app/heroes/${hero.id}`,
        }))
        .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
        .slice(0, MAX_LIST_ITEMS);
    }

    const roster = new Map<string, RecentCharacter>();
    for (const campaign of data.campaigns) {
      for (const member of campaign.members) {
        if (!member.hero_id || !member.hero_name) continue;
        if (roster.has(member.hero_id)) continue;
        roster.set(member.hero_id, {
          id: member.hero_id,
          name: member.hero_name,
          detail: `${member.hero_class ?? 'Hero'} · ${campaign.name}`,
          badge: `Lv ${member.hero_level ?? 1}`,
          date: campaign.last_played,
          to: `/app/campaigns/${campaign.id}`,
        });
      }
    }

    return [...roster.values()]
      .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
      .slice(0, MAX_LIST_ITEMS);
  }, [data.campaigns, data.heroes, isDirector]);

  const quickActions = isDirector
    ? [
        { label: 'Open Live', to: '/app/live', icon: Clapperboard },
      ]
    : [
        { label: 'Live', to: '/app/live', icon: PlayCircle },
        { label: 'Heroes', to: '/app/heroes', icon: User },
        { label: 'Join Code', to: '/app/join', icon: Plus },
        { label: 'Notes', to: '/app/notes', icon: NotebookText },
      ];

  const dashboardSections = useMemo<DashboardSectionConfig[]>(() => [
    {
      id: 'live',
      eyebrow: isDirector ? 'Current tables' : 'Live rooms',
      title: isDirector ? 'Sessions In Progress' : 'Available Sessions',
      to: '/app/live',
      body: (
        <DashboardList
          items={liveTableItems}
          emptyState={
            <EmptyState
              icon={CalendarClock}
              title={isDirector ? 'No live sessions' : 'No table is live'}
              detail={isDirector ? 'Start a session from Live when the table is ready.' : 'Live rooms appear here when your Director starts a session.'}
              action={isDirector ? { label: 'Open Live', to: '/app/live', icon: Clapperboard } : undefined}
            />
          }
          renderItem={(item) => <LiveTableCard table={item.table} isDirector={isDirector} />}
        />
      ),
    },
    {
      id: 'campaigns',
      eyebrow: isDirector ? 'Recent campaigns' : 'Campaigns',
      title: isDirector ? 'Campaign Activity' : 'Joined Tables',
      to: isDirector ? '/app/campaigns' : '/app/live',
      body: (
        <DashboardList
          items={recentCampaigns}
          emptyState={
            <EmptyState
              icon={FolderKanban}
              title={isDirector ? 'No campaigns yet' : 'No joined campaigns'}
              detail={isDirector ? 'Create a campaign or import prepared scenes to begin.' : 'Join a campaign with an invite link or room code from your Director.'}
              action={
                isDirector
                  ? { label: 'Open Campaigns', to: '/app/campaigns', icon: FolderKanban }
                  : { label: 'Join by Code', to: '/app/join', icon: Plus }
              }
            />
          }
          renderItem={(campaign) => <CampaignCard campaign={campaign} isDirector={isDirector} />}
        />
      ),
    },
    {
      id: 'notes',
      eyebrow: 'Recent notes',
      title: 'Notebook Updates',
      to: '/app/notes',
      body: (
        <DashboardList
          items={data.notes.slice(0, MAX_LIST_ITEMS)}
          emptyState={
            <EmptyState
              icon={FileText}
              title="No notes yet"
              detail={isDirector ? 'Capture personal or campaign notes from the Notes view.' : 'Capture personal notes now; campaign notes appear after you join a table.'}
              action={{ label: 'Open Notes', to: '/app/notes', icon: NotebookText }}
            />
          }
          renderItem={(note) => (
            <Link to="/app/notes">
              <NoteCard note={note} />
            </Link>
          )}
        />
      ),
    },
    {
      id: 'characters',
      eyebrow: isDirector ? 'Recent characters' : 'My characters',
      title: isDirector ? 'Player Roster' : 'Hero Roster',
      to: isDirector ? '/app/live' : '/app/heroes',
      body: (
        <DashboardList
          items={recentCharacters}
          emptyState={
            <EmptyState
              icon={Users}
              title={isDirector ? 'No player characters yet' : 'No heroes yet'}
              detail={isDirector ? 'Joined player heroes will appear here after they select a character.' : 'Create a hero to use when you join a live table.'}
              action={isDirector ? { label: 'Open Live', to: '/app/live', icon: Clapperboard } : { label: 'Create Hero', to: '/app/heroes/new', icon: Plus }}
            />
          }
          renderItem={(character) => <CharacterCard character={character} />}
        />
      ),
    },
    {
      id: 'assets',
      eyebrow: 'Recent assets',
      title: 'Uploads',
      to: isDirector ? '/app/assets' : undefined,
      body: (
        <DashboardList
          items={data.assets.slice(0, MAX_LIST_ITEMS)}
          emptyState={
            <EmptyState
              icon={ImageIcon}
              title="No uploaded assets"
              detail={isDirector ? 'Maps, audio, portraits, and handouts will show up here after upload.' : 'Any files you upload for your characters or notes will show up here.'}
              action={isDirector ? { label: 'Open Assets', to: '/app/assets', icon: Boxes } : undefined}
            />
          }
          renderItem={(asset) => <AssetCard asset={asset} canOpenAssets={isDirector} />}
        />
      ),
    },
  ], [data.assets, data.notes, isDirector, liveTableItems, recentCampaigns, recentCharacters]);

  if (loading) {
    return (
      <div className="relative isolate flex min-h-full items-center justify-center overflow-hidden bg-zinc-950 text-zinc-500">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-cover bg-bottom bg-no-repeat opacity-80"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
        <div
          aria-hidden="true"
          className="anvil-dashboard-scrim pointer-events-none fixed inset-0 z-0"
        />
        <Loader2 className="relative z-10 mr-2 size-5 animate-spin" />
        <span className="relative z-10">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="anvil-dashboard relative isolate min-h-full overflow-hidden bg-zinc-950 text-zinc-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-bottom bg-no-repeat opacity-80"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div
        aria-hidden="true"
        className="anvil-dashboard-scrim pointer-events-none fixed inset-0 z-0"
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed inset-0 z-0',
          isDirector
            ? 'bg-[linear-gradient(to_right,rgba(127,29,29,0.13),transparent_45%,rgba(251,146,60,0.11))]'
            : 'bg-[linear-gradient(to_right,rgba(8,47,73,0.14),transparent_48%,rgba(202,138,4,0.08))]',
        )}
      />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 p-6 lg:p-8">
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

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <DashboardSections sections={dashboardSections} />
      </div>
      <DashboardOnboarding roleKey={roleKey} userId={user?.id} />
    </div>
  );
}
