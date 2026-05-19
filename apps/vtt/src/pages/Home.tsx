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
  GripVertical,
  Image as ImageIcon,
  Loader2,
  NotebookText,
  PlayCircle,
  Plus,
  ScrollText,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, cn, useSidebar } from '@anvil/ui';
import type { HeroSummary, Note } from '@anvil/types';
import { api } from '../lib/api.js';
import { useAuthStore } from '../stores/authStore.js';
import type { CampaignData, CampaignSession } from '../components/sessions/types.js';

const MAX_NOTE_CAMPAIGNS = 8;
const MAX_LIST_ITEMS = 5;

const DASHBOARD_BACKGROUNDS = {
  director: '/dashboard/director-flow-background.png',
  player: '/dashboard/player-flow-background.png',
} as const;

const ONBOARDING_STORAGE_VERSION = 'v1';
const ONBOARDING_CARD_WIDTH = 340;
const ONBOARDING_CARD_ESTIMATED_HEIGHT = 260;
const ONBOARDING_VIEWPORT_INSET = 16;
const ONBOARDING_TARGET_PADDING = 8;

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

interface StatConfig {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  tone: 'cyan' | 'amber' | 'green' | 'rose';
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
      description: 'Jump straight to Live, Campaigns, Assets, or Notes from these shortcut buttons.',
      placement: 'bottom',
    },
    {
      id: 'dashboard-stats',
      target: 'dashboard-stats',
      title: 'Prep snapshot',
      description: 'These counters show live rooms, campaign volume, prepared scenes, and uploaded assets.',
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
      id: 'dashboard-stats',
      target: 'dashboard-stats',
      title: 'Play snapshot',
      description: 'These counters show live rooms, joined campaigns, heroes, and note activity.',
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
      description: 'Recent session and campaign notes are easy to reopen from this area.',
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

function mergeOrder(savedOrder: string[], currentIds: string[]) {
  const current = new Set(currentIds);
  return [
    ...savedOrder.filter((id) => current.has(id)),
    ...currentIds.filter((id) => !savedOrder.includes(id)),
  ];
}

function readStoredOrder(storageKey: string) {
  try {
    const value = localStorage.getItem(storageKey);
    if (!value) return [];
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStoredOrder(storageKey: string, order: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(order));
  } catch {
    /* noop */
  }
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

function useSortableOrder(storageKey: string, defaultIds: string[]) {
  const defaultSignature = defaultIds.join('|');
  const [storedOrder, setStoredOrder] = useState<string[]>(() => readStoredOrder(storageKey));

  useEffect(() => {
    setStoredOrder(readStoredOrder(storageKey));
  }, [storageKey]);

  const orderedIds = useMemo(
    () => mergeOrder(storedOrder, defaultIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storedOrder, defaultSignature],
  );

  useEffect(() => {
    writeStoredOrder(storageKey, orderedIds);
  }, [storageKey, orderedIds]);

  const move = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setStoredOrder((current) => {
      const merged = mergeOrder(current, defaultIds);
      const oldIndex = merged.indexOf(activeId);
      const newIndex = merged.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return current;
      const next = arrayMove(merged, oldIndex, newIndex);
      writeStoredOrder(storageKey, next);
      return next;
    });
  }, [defaultIds, storageKey]);

  return { orderedIds, move };
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

function DragHandle({ label, className, attributes, listeners }: {
  label: string;
  className?: string;
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md border border-zinc-700/70 bg-zinc-950/80 text-zinc-500 opacity-70 shadow-sm shadow-black/20 transition-colors hover:border-zinc-500 hover:text-zinc-200 active:cursor-grabbing',
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={15} />
    </button>
  );
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex min-w-0 gap-2', isDragging && 'relative z-20 opacity-70')}
    >
      <DragHandle label="Move card" attributes={attributes} listeners={listeners} className="mt-3" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SortableSection({ section }: { section: DashboardSectionConfig }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-onboarding={`dashboard-section-${section.id}`}
      className={cn(section.className, isDragging && 'relative z-20 opacity-70')}
    >
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        to={section.to}
        dragHandle={<DragHandle label={`Move ${section.title} section`} attributes={attributes} listeners={listeners} />}
      />
      {section.body}
    </section>
  );
}

function SortableGrid<T extends { id: string }>({
  storageKey,
  items,
  className,
  emptyState,
  renderItem,
}: {
  storageKey: string;
  items: T[];
  className: string;
  emptyState: ReactNode;
  renderItem: (item: T) => ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const defaultIds = useMemo(() => items.map((item) => item.id), [items]);
  const { orderedIds, move } = useSortableOrder(storageKey, defaultIds);
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const orderedItems = orderedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is T => Boolean(item));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    move(String(active.id), String(over.id));
  }, [move]);

  if (items.length === 0) return <>{emptyState}</>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className={className}>
          {orderedItems.map((item) => (
            <SortableCard key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableSections({ storageKey, sections }: { storageKey: string; sections: DashboardSectionConfig[] }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const defaultIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const { orderedIds, move } = useSortableOrder(storageKey, defaultIds);
  const sectionMap = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);
  const orderedSections = orderedIds
    .map((id) => sectionMap.get(id as DashboardSectionId))
    .filter((section): section is DashboardSectionConfig => Boolean(section));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    move(String(active.id), String(over.id));
  }, [move]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className="grid gap-8 xl:grid-cols-2">
          {orderedSections.map((section) => (
            <SortableSection key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function EmptyState({ icon: Icon, title, detail, action }: {
  icon: LucideIcon;
  title: string;
  detail: string;
  action?: { label: string; to: string; icon: LucideIcon };
}) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-950/70 px-4 py-6 text-center shadow-lg shadow-black/20 backdrop-blur-sm">
      <Icon className="size-7 text-zinc-600" />
      <p className="mt-3 text-sm font-semibold text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{detail}</p>
      {action && (
        <Button asChild variant="outline" size="sm" className="mt-4">
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
  dragHandle,
}: {
  title: string;
  eyebrow: string;
  to?: string;
  dragHandle?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
          {dragHandle}
        </div>
        <h2 className="mt-1 text-base font-semibold text-zinc-100">{title}</h2>
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200">
          Open
          <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

function StatStripItem({ stat }: { stat: StatConfig }) {
  const Icon = stat.icon;
  const toneClass = {
    cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
    amber: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    green: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    rose: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
  }[stat.tone];

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md border border-zinc-800/75 bg-zinc-950/65 px-3 py-2 shadow-sm shadow-black/20 backdrop-blur-sm">
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md border', toneClass)}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="shrink-0 text-lg font-semibold leading-none text-zinc-50">{stat.value}</p>
          <p className="truncate text-xs font-medium text-zinc-300">{stat.label}</p>
        </div>
        <p className="mt-0.5 truncate text-[11px] leading-none text-zinc-500">{stat.detail}</p>
      </div>
    </div>
  );
}

function DashboardStatsRow({ stats }: { stats: StatConfig[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard stats" data-onboarding="dashboard-stats">
      {stats.map((stat) => (
        <StatStripItem key={stat.id} stat={stat} />
      ))}
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
          <Badge className={cn(
            'border-transparent',
            roleKey === 'director' ? 'bg-rose-300/10 text-flow-director' : 'bg-cyan-300/10 text-flow-player',
          )}>
            {roleKey === 'director' ? 'Director flow' : 'Player flow'}
          </Badge>
          <h2 id="dashboard-onboarding-title" className="mt-4 text-xl font-semibold text-zinc-50">
            Welcome to your {roleKey === 'director' ? 'Director' : 'Player'} dashboard
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Take a short guided tour of the menu bar and dashboard areas, or skip it for now.
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
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors hover:border-zinc-700">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-semibold leading-5 text-zinc-100">
              {campaign.name}
            </CardTitle>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
              {campaign.description || (isDirector ? 'No description yet.' : `Directed by ${campaign.director?.username ?? 'Director'}`)}
            </p>
          </div>
          {liveSession && (
            <Badge className="shrink-0 border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              {liveSession.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <span>{campaign.sessions.length} {sessionLabel}</span>
          {campaign.scenes.length > 0 && <span>{campaign.scenes.length} {sceneLabel}</span>}
          <span>{memberCount} players</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-500">Last played {formatDate(campaign.last_played)}</span>
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
    <Card className="border-emerald-400/20 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <PlayCircle size={16} className="text-emerald-300" />
            <p className="truncate text-sm font-semibold text-zinc-100">{table.session.name}</p>
          </div>
          <p className="mt-1 truncate text-xs text-zinc-500">{table.campaign.name}</p>
          {table.session.room_code && (
            <p className="mt-2 font-mono text-xs text-emerald-200">{table.session.room_code}</p>
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
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10 text-sm font-semibold text-amber-200">
          {initials(character.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{character.name}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{character.detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary">{character.badge}</Badge>
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
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">{note.title}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">{note.campaignName}</p>
          </div>
          <span className="shrink-0 text-xs text-zinc-500">{formatDate(note.updatedAt)}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-400">
          {preview || 'Empty note'}
        </p>
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset, canOpenAssets }: { asset: AssetItem; canOpenAssets: boolean }) {
  const content = (
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
        <ImageIcon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{asset.name}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">
          {asset.type} · {formatBytes(asset.file_size)}
        </p>
      </div>
      <span className="shrink-0 text-xs text-zinc-500">{formatDate(asset.uploaded_at ?? asset.created_at)}</span>
    </CardContent>
  );

  return (
    <Card className="border-zinc-800/80 bg-zinc-950/75 shadow-lg shadow-black/20 backdrop-blur-sm">
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
        const noteResults = await Promise.allSettled(
          noteCampaigns.map(async (campaign) => {
            const { notes } = await api.get<{ notes: Note[] }>(`/api/campaigns/${campaign.id}/notes`);
            return notes.map((note) => ({ ...note, campaignName: campaign.name }));
          }),
        );

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

  const stats = useMemo<StatConfig[]>(() => {
    const playerCount = new Set(
      data.campaigns.flatMap((campaign) =>
        campaign.members
          .filter((member) => member.role === 'player')
          .map((member) => member.user_id),
      ),
    ).size;
    const sceneCount = data.campaigns.reduce((total, campaign) => total + campaign.scenes.length, 0);
    const sessionCount = data.campaigns.reduce((total, campaign) => total + campaign.sessions.length, 0);

    return isDirector
      ? [
          {
            id: 'director-live',
            label: 'Live tables',
            value: liveTables.length,
            detail: liveTables.length > 0 ? 'Ready to rejoin' : 'No active rooms',
            icon: Clapperboard,
            tone: 'green',
          },
          {
            id: 'director-campaigns',
            label: 'Campaigns',
            value: data.campaigns.length,
            detail: `${sessionCount} sessions prepared`,
            icon: FolderKanban,
            tone: 'cyan',
          },
          {
            id: 'director-scenes',
            label: 'Scenes ready',
            value: sceneCount,
            detail: `${playerCount} player characters`,
            icon: ScrollText,
            tone: 'amber',
          },
          {
            id: 'director-assets',
            label: 'Assets added',
            value: data.assets.length,
            detail: 'Uploaded files',
            icon: Boxes,
            tone: 'rose',
          },
        ]
      : [
          {
            id: 'player-live',
            label: 'Live tables',
            value: liveTables.length,
            detail: liveTables.length > 0 ? 'Ready to join' : 'No active rooms',
            icon: PlayCircle,
            tone: 'green',
          },
          {
            id: 'player-campaigns',
            label: 'Campaigns',
            value: data.campaigns.length,
            detail: 'Tables joined',
            icon: Shield,
            tone: 'cyan',
          },
          {
            id: 'player-characters',
            label: 'Characters',
            value: data.heroes.length,
            detail: 'Heroes in your roster',
            icon: User,
            tone: 'amber',
          },
          {
            id: 'player-notes',
            label: 'Notes',
            value: data.notes.length,
            detail: 'Campaign notes',
            icon: NotebookText,
            tone: 'rose',
          },
        ];
  }, [data.assets.length, data.campaigns, data.heroes.length, data.notes.length, isDirector, liveTables.length]);

  const quickActions = isDirector
    ? [
        { label: 'Go Live', to: '/app/live', icon: Clapperboard },
        { label: 'Campaigns', to: '/app/campaigns', icon: FolderKanban },
        { label: 'Assets', to: '/app/assets', icon: Boxes },
        { label: 'Notes', to: '/app/notes', icon: NotebookText },
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
      className: 'xl:col-span-2',
      body: (
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:live`}
          items={liveTableItems}
          className="grid gap-3 lg:grid-cols-2"
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:campaigns`}
          items={recentCampaigns}
          className="grid gap-3"
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:notes`}
          items={data.notes.slice(0, MAX_LIST_ITEMS)}
          className="grid gap-3"
          emptyState={
            <EmptyState
              icon={FileText}
              title="No notes yet"
              detail={isDirector ? 'Capture prep notes for a campaign from the Notes view.' : 'Create session or world notes once you have joined a campaign.'}
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:characters`}
          items={recentCharacters}
          className="grid gap-3"
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:assets`}
          items={data.assets.slice(0, MAX_LIST_ITEMS)}
          className="grid gap-3"
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
  ], [data.assets, data.notes, isDirector, liveTableItems, recentCampaigns, recentCharacters, roleKey]);

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
    <div className="relative isolate min-h-full overflow-hidden bg-zinc-950 text-zinc-100">
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
                ? 'Prep status, active tables, campaign notes, player roster, and recent asset work.'
                : 'Your live tables, characters, campaign notes, and recent uploads in one place.'}
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

        <DashboardStatsRow stats={stats} />

        <SortableSections storageKey={`anvil-dashboard:${roleKey}:sections`} sections={dashboardSections} />
      </div>
      <DashboardOnboarding roleKey={roleKey} userId={user?.id} />
    </div>
  );
}
