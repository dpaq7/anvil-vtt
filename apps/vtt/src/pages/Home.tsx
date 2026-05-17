import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Boxes,
  CalendarClock,
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
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, cn } from '@anvil/ui';
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

type DashboardSectionId = 'live' | 'campaigns' | 'notes' | 'characters' | 'assets';

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
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard stats">
      {stats.map((stat) => (
        <StatStripItem key={stat.id} stat={stat} />
      ))}
    </div>
  );
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
          className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.69)_0%,rgba(9,9,11,0.68)_36%,rgba(9,9,11,0.62)_68%,rgba(9,9,11,0.45)_100%)]"
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
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.69)_0%,rgba(9,9,11,0.68)_34%,rgba(9,9,11,0.62)_66%,rgba(9,9,11,0.43)_100%)]"
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
        <header className="flex flex-col gap-5 border-b border-zinc-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className={cn(
              'mb-3 border-transparent',
              isDirector ? 'bg-rose-300/10 text-rose-200' : 'bg-cyan-300/10 text-cyan-200',
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
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button key={action.to} asChild variant={index === 0 ? 'default' : 'outline'} size="sm">
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
    </div>
  );
}
