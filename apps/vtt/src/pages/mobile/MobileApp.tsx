import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Boxes,
  ChevronRight,
  Clapperboard,
  FileText,
  FolderKanban,
  Home,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Music,
  NotebookText,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Smartphone,
  Upload,
  User,
  Users,
} from 'lucide-react';
import {
  AnvilIcon,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Progress,
  Textarea,
  cn,
} from '@anvil/ui';
import type { HeroSummary, Note, NoteScope } from '@anvil/types';
import { api } from '../../lib/api.js';
import { assetDataUrl, credentialedMediaCrossOrigin } from '../../lib/api-url.js';
import { uploadFile } from '../../stores/assetsStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import {
  PERSONAL_NOTEBOOK_ID,
  useNotesStore,
} from '../../stores/notesStore.js';
import type { CampaignData } from '../../components/sessions/types.js';
import { MobileNpcPanel } from './MobileNpcs.js';
import {
  EmptyState,
  LoadingPanel,
  SectionHeader,
  StatCard,
  formatBytes,
  formatDate,
  mobileContainerClass,
  titleCase,
} from './shared.js';

export { MobileHeroDetail } from './MobileHeroDetail.js';

type UserRole = 'director' | 'player';
type AssetKind = 'map' | 'token' | 'portrait' | 'handout' | 'audio' | 'other';

const API_BASE = import.meta.env['VITE_API_BASE'] || '';
const PERSONAL_NOTEBOOK_NAME = 'Personal Notes';

interface AssetItem {
  id: string;
  name: string;
  type: string;
  content_type: string | null;
  file_size: number | null;
  created_at: string;
  uploaded_at: string | null;
}

interface CampaignOption {
  id: string;
  name: string;
}

interface DashboardState {
  campaigns: CampaignData[];
  heroes: HeroSummary[];
  notes: Note[];
  assets: AssetItem[];
}

const EMPTY_DASHBOARD: DashboardState = {
  campaigns: [],
  heroes: [],
  notes: [],
  assets: [],
};

const PLAYER_NAV = [
  { label: 'Home', to: '/app/mobile', icon: Home, end: true },
  { label: 'Heroes', to: '/app/mobile/heroes', icon: User },
  { label: 'Notes', to: '/app/mobile/notes', icon: NotebookText },
  { label: 'Account', to: '/app/mobile/account', icon: Shield },
] as const;

const DIRECTOR_NAV = [
  { label: 'Home', to: '/app/mobile', icon: Home, end: true },
  { label: 'Heroes', to: '/app/mobile/heroes', icon: User },
  { label: 'Notes', to: '/app/mobile/notes', icon: NotebookText },
  { label: 'Assets', to: '/app/mobile/assets', icon: ImageIcon },
  { label: 'Campaigns', to: '/app/mobile/campaigns', icon: FolderKanban },
  { label: 'Account', to: '/app/mobile/account', icon: Shield },
] as const;

const ASSET_TYPES: Array<{ value: AssetKind; label: string }> = [
  { value: 'map', label: 'Map' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'token', label: 'Token' },
  { value: 'handout', label: 'Handout' },
  { value: 'audio', label: 'Audio' },
  { value: 'other', label: 'Other' },
];

function getNotePreview(note: Note): string {
  return note.content
    .replace(/[#>*_`-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

function isImageAsset(asset: AssetItem): boolean {
  return asset.uploaded_at !== null && Boolean(asset.content_type?.startsWith('image/'));
}

function isAudioAsset(asset: AssetItem): boolean {
  return (
    asset.uploaded_at !== null &&
    (asset.type === 'audio' || Boolean(asset.content_type?.startsWith('audio/')))
  );
}

function assetTypeForFile(file: File, fallback: AssetKind): AssetKind {
  if (fallback !== 'other') return fallback;
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('image/')) return 'handout';
  return 'other';
}

function RoleToggle({
  role,
  pendingRole,
  onRoleChange,
}: {
  role: UserRole;
  pendingRole: UserRole | null;
  onRoleChange: (role: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      {(['player', 'director'] as const).map((option) => (
        <button
          key={option}
          type="button"
          disabled={pendingRole !== null}
          aria-pressed={role === option}
          onClick={() => onRoleChange(option)}
          className={cn(
            'h-8 rounded-md px-3 text-xs font-semibold capitalize transition disabled:opacity-60',
            role === option
              ? 'bg-zinc-100 text-zinc-950'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
          )}
        >
          {pendingRole === option ? 'Switching' : option}
        </button>
      ))}
    </div>
  );
}

export function MobileAppLayout() {
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setRole = useAuthStore((state) => state.setRole);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const role = user?.role ?? 'director';
  const nav = role === 'director' ? DIRECTOR_NAV : PLAYER_NAV;
  const initials = (user?.username ?? 'A')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (
      role === 'player' &&
      (location.pathname.startsWith('/app/mobile/assets') ||
        location.pathname.startsWith('/app/mobile/campaigns'))
    ) {
      navigate('/app/mobile', { replace: true });
    }
  }, [location.pathname, navigate, role]);

  const handleRoleChange = async (nextRole: UserRole) => {
    if (nextRole === role || pendingRole) return;
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const nextPath =
      nextRole === 'player' &&
      (location.pathname.startsWith('/app/mobile/assets') ||
        location.pathname.startsWith('/app/mobile/campaigns'))
        ? '/app/mobile'
        : currentPath;

    setPendingRole(nextRole);
    try {
      if (import.meta.env.DEV) {
        const params = new URLSearchParams({
          role: nextRole,
          next: nextPath,
          format: 'json',
        });
        const res = await fetch(`${API_BASE}/api/auth/dev-login?${params.toString()}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to switch development role');
        await checkAuth();
      } else {
        await setRole(nextRole);
      }
      if (nextPath !== currentPath) navigate(nextPath, { replace: true });
    } finally {
      setPendingRole(null);
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            to="/app/mobile"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900"
            aria-label="Mobile home"
          >
            <AnvilIcon className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">Anvil Mobile</p>
            <p className="text-xs capitalize text-zinc-500">{role} flow</p>
          </div>
          <Link
            to="/app"
            className="hidden size-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 sm:flex"
            aria-label="Open desktop app"
          >
            <Smartphone className="size-4" />
          </Link>
          <Link
            to="/app/mobile/account"
            className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 text-xs font-bold"
            aria-label="Account"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials
            )}
          </Link>
        </div>
        <div className="mx-auto mt-3 max-w-3xl">
          <RoleToggle
            role={role}
            pendingRole={pendingRole}
            onRoleChange={handleRoleChange}
          />
        </div>
      </header>

      <main className="pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur">
        <div
          className="mx-auto grid max-w-3xl gap-1"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
        >
          {nav.map(({ label, to, icon: Icon, ...rest }) => {
            const exact = 'end' in rest && rest.end === true;
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold transition',
                    isActive
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100',
                  )
                }
              >
                <Icon className="size-4" />
                <span className="w-full truncate text-center">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function MobileHome() {
  const role = useAuthStore((state) => state.user?.role ?? 'director');
  const [state, setState] = useState<DashboardState>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsData, heroes, assetsData, personalNotes] = await Promise.all([
        api.get<{ campaigns: CampaignData[] }>('/api/game-sessions'),
        api.get<HeroSummary[]>('/api/heroes').catch(() => []),
        role === 'director'
          ? api.get<{ assets: AssetItem[] }>('/api/assets').catch(() => ({ assets: [] }))
          : Promise.resolve({ assets: [] }),
        api
          .get<{ notes: Note[] }>('/api/notes/personal/notes')
          .then((data) => data.notes)
          .catch(() => []),
      ]);
      setState({
        campaigns: sessionsData.campaigns,
        heroes,
        assets: assetsData.assets,
        notes: personalNotes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dashboard unavailable');
      setState(EMPTY_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleCampaigns = useMemo(
    () =>
      role === 'director'
        ? state.campaigns.filter((campaign) => campaign.role === 'director')
        : state.campaigns,
    [role, state.campaigns],
  );
  const liveSessions = useMemo(
    () =>
      visibleCampaigns.flatMap((campaign) =>
        campaign.sessions
          .filter((session) => session.status === 'active' || session.status === 'lobby')
          .map((session) => ({ campaign, session })),
      ),
    [visibleCampaigns],
  );
  const recentNotes = [...state.notes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentHeroes = [...state.heroes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const recentAssets = [...state.assets]
    .filter((asset) => asset.uploaded_at !== null)
    .slice(0, 4);

  if (loading) return <LoadingPanel />;

  return (
    <div className={mobileContainerClass()}>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              {role === 'director' ? 'Director' : 'Player'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Dashboard</h1>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link to="/app/live">Live</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={() => void load()}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Campaigns" value={visibleCampaigns.length} Icon={FolderKanban} />
        <StatCard label="Live" value={liveSessions.length} Icon={Clapperboard} />
        <StatCard label="Heroes" value={state.heroes.length} Icon={Users} />
        <StatCard
          label={role === 'director' ? 'Assets' : 'Notes'}
          value={role === 'director' ? state.assets.length : state.notes.length}
          Icon={role === 'director' ? Boxes : NotebookText}
        />
      </div>

      {liveSessions.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionHeader label="Live tables" />
          {liveSessions.slice(0, 3).map(({ campaign, session }) => (
            <Link
              key={session.id}
              to={`/app/session/${session.id}/phone`}
              className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 transition hover:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {session.name}
                  </p>
                  <p className="truncate text-xs text-zinc-500">{campaign.name}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {session.status}
                </Badge>
              </div>
            </Link>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeader
          label="Characters"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/mobile/heroes">View</Link>
            </Button>
          }
        />
        {recentHeroes.length === 0 ? (
          <EmptyState
            icon={User}
            title="No characters"
            action={
              <Button asChild size="sm">
                <Link to="/app/mobile/heroes/new">
                  <Plus className="size-4" />
                  Create
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-2">
            {recentHeroes.map((hero) => (
              <HeroSummaryCard key={hero.id} hero={hero} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader
          label="Notes"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/mobile/notes">Open</Link>
            </Button>
          }
        />
        {recentNotes.length === 0 ? (
          <EmptyState icon={NotebookText} title="No notes" />
        ) : (
          <div className="grid gap-2">
            {recentNotes.map((note) => (
              <Link
                key={note.id}
                to={`/app/mobile/notes?note=${note.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 transition hover:border-zinc-700"
              >
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {note.title || 'Untitled'}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                  {getNotePreview(note) || 'Empty note'}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {role === 'director' && (
        <section className="flex flex-col gap-2">
          <SectionHeader
            label="Assets"
            action={
              <Button asChild size="sm" variant="ghost">
                <Link to="/app/mobile/assets">Open</Link>
              </Button>
            }
          />
          {recentAssets.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No uploaded assets" />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {recentAssets.map((asset) => (
                <AssetThumb key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionHeader
          label="Campaigns"
          action={
            role === 'director' ? (
              <Button asChild size="sm" variant="ghost">
                <Link to="/app/mobile/campaigns">View</Link>
              </Button>
            ) : null
          }
        />
        {visibleCampaigns.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No campaigns" />
        ) : (
          <div className="grid gap-2">
            {visibleCampaigns.slice(0, 4).map((campaign) => (
              <Card key={campaign.id} className="border-zinc-800 bg-zinc-900/70">
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm">{campaign.name}</CardTitle>
                      <p className="mt-1 text-xs text-zinc-500">
                        {campaign.sessions.length} sessions / {campaign.scenes.length} scenes
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-zinc-600" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HeroSummaryCard({ hero }: { hero: HeroSummary }) {
  const staminaMax = hero.staminaMax ?? 0;
  const staminaCurrent = hero.staminaCurrent ?? staminaMax;
  const staminaPercent =
    staminaMax > 0 ? Math.max(0, Math.min(100, (staminaCurrent / staminaMax) * 100)) : 0;

  return (
    <Link
      to={`/app/mobile/heroes/${hero.id}`}
      className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 transition hover:border-zinc-700"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-lg font-semibold text-zinc-500">
          {hero.portraitUrl ? (
            <img src={hero.portraitUrl} alt="" className="size-full object-cover" />
          ) : (
            hero.name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{hero.name}</p>
          <p className="truncate text-xs text-zinc-500">
            {titleCase(hero.heroClass)} / Level {hero.level}
          </p>
          {hero.staminaMax !== null && (
            <div className="mt-2">
              <Progress value={staminaPercent} className="h-1.5" />
            </div>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 text-zinc-600" />
      </div>
    </Link>
  );
}

export function MobileCharacters() {
  const [heroes, setHeroes] = useState<HeroSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHeroes(await api.get<HeroSummary[]>('/api/heroes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredHeroes = heroes.filter((hero) => {
    const haystack = `${hero.name} ${hero.heroClass ?? ''} ${hero.subclass ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className={mobileContainerClass()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Characters</h1>
          <p className="mt-1 text-xs text-zinc-500">{heroes.length} saved</p>
        </div>
        <Button asChild size="sm">
          <Link to="/app/mobile/heroes/new">
            <Plus className="size-4" />
            Create
          </Link>
        </Button>
      </div>

      <Input
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder="Search characters"
        className="h-11"
      />

      {loading ? (
        <LoadingPanel />
      ) : filteredHeroes.length === 0 ? (
        <EmptyState
          icon={User}
          title={query ? 'No matches' : 'No characters'}
          action={
            !query && (
              <Button asChild size="sm">
                <Link to="/app/mobile/heroes/new">
                  <Plus className="size-4" />
                  Create
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-2">
          {filteredHeroes.map((hero) => (
            <HeroSummaryCard key={hero.id} hero={hero} />
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileNotes() {
  const location = useLocation();
  const role = useAuthStore((state) => state.user?.role ?? 'director');
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([
    { id: PERSONAL_NOTEBOOK_ID, name: PERSONAL_NOTEBOOK_NAME },
  ]);
  const [notebookId, setNotebookId] = useState(PERSONAL_NOTEBOOK_ID);
  const [scope, setScope] = useState<NoteScope>(role === 'player' ? 'player' : 'director');
  const [saving, setSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const hydratedFromQueryRef = useRef(false);
  const {
    folders,
    notes,
    loading,
    error,
    selectedNoteId,
    loadAll,
    createFolder,
    createNote,
    updateNote,
    setSelectedNoteId,
    reset,
    clearError,
  } = useNotesStore();

  useEffect(() => {
    setScope(role === 'player' ? 'player' : 'director');
  }, [role]);

  useEffect(() => {
    api
      .get<{ directed: CampaignOption[]; joined: CampaignOption[] }>('/api/campaigns')
      .then((data) => {
        const source = role === 'player' ? data.joined : [...data.directed, ...data.joined];
        const seen = new Set<string>([PERSONAL_NOTEBOOK_ID]);
        const all = [{ id: PERSONAL_NOTEBOOK_ID, name: PERSONAL_NOTEBOOK_NAME }];
        for (const campaign of source) {
          if (!seen.has(campaign.id)) {
            seen.add(campaign.id);
            all.push(campaign);
          }
        }
        setCampaigns(all);
        setNotebookId((current) =>
          all.some((campaign) => campaign.id === current) ? current : PERSONAL_NOTEBOOK_ID,
        );
      })
      .catch(() => setCampaigns([{ id: PERSONAL_NOTEBOOK_ID, name: PERSONAL_NOTEBOOK_NAME }]));
  }, [role]);

  useEffect(() => {
    reset();
    hydratedFromQueryRef.current = false;
    void loadAll(notebookId, notebookId === PERSONAL_NOTEBOOK_ID ? undefined : scope);
  }, [loadAll, notebookId, reset, scope]);

  useEffect(() => {
    if (hydratedFromQueryRef.current || notes.length === 0) return;
    const params = new URLSearchParams(location.search);
    const requestedNoteId = params.get('note');
    if (requestedNoteId && notes.some((note) => note.id === requestedNoteId)) {
      setSelectedNoteId(requestedNoteId);
      hydratedFromQueryRef.current = true;
    }
  }, [location.search, notes, setSelectedNoteId]);

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const selectedFolderName = useMemo(() => {
    const folder = folders.find((item) => item.id === selectedNote?.folderId);
    return folder?.name ?? null;
  }, [folders, selectedNote?.folderId]);

  useEffect(() => {
    setDraftTitle(selectedNote?.title ?? '');
    setDraftContent(selectedNote?.content ?? '');
  }, [selectedNote]);

  const handleNotebookChange = (event: ChangeEvent<HTMLSelectElement>) => {
    hydratedFromQueryRef.current = false;
    setNotebookId(event.currentTarget.value);
  };

  const handleCreateNote = async () => {
    const folder =
      folders[0] ??
      (await createFolder(notebookId, {
        name: 'Notes',
        scope: notebookId === PERSONAL_NOTEBOOK_ID ? undefined : scope,
      }));
    await createNote(notebookId, {
      title: 'Untitled',
      folderId: folder.id,
      content: '',
      scope: notebookId === PERSONAL_NOTEBOOK_ID ? undefined : scope,
    });
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      await updateNote(notebookId, selectedNote.id, {
        title: draftTitle.trim() || 'Untitled',
        content: draftContent,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={mobileContainerClass()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Notes</h1>
          <p className="mt-1 text-xs text-zinc-500">{sortedNotes.length} notes</p>
        </div>
        <Button size="sm" onClick={() => void handleCreateNote()}>
          <Plus className="size-4" />
          New
        </Button>
      </div>

      <div className="grid gap-2">
        <select
          value={notebookId}
          onChange={handleNotebookChange}
          className="h-11 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        >
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name}
            </option>
          ))}
        </select>

        {notebookId !== PERSONAL_NOTEBOOK_ID && (
          <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
            {(['director', 'player'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={scope === option}
                onClick={() => setScope(option)}
                className={cn(
                  'h-8 rounded-md px-3 text-xs font-semibold capitalize transition',
                  scope === option
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="ghost" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingPanel />
      ) : (
        <div className="grid gap-3 md:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 md:max-h-[calc(100dvh-15rem)]">
            {sortedNotes.length === 0 ? (
              <EmptyState icon={NotebookText} title="No notes" />
            ) : (
              sortedNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className={cn(
                    'rounded-md border p-3 text-left transition',
                    selectedNoteId === note.id
                      ? 'border-zinc-500 bg-zinc-800'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700',
                  )}
                >
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {note.title || 'Untitled'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                    {getNotePreview(note) || 'Empty note'}
                  </p>
                </button>
              ))
            )}
          </div>

          {selectedNote ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-500">
                    {selectedFolderName ?? 'Notebook'} / {formatDate(selectedNote.updatedAt)}
                  </p>
                </div>
                <Button size="sm" onClick={() => void handleSaveNote()} disabled={saving}>
                  <Save className="size-4" />
                  {saving ? 'Saving' : 'Save'}
                </Button>
              </div>
              <Input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.currentTarget.value)}
                className="mb-3 h-11 text-base font-semibold"
                placeholder="Title"
              />
              <Textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.currentTarget.value)}
                className="min-h-[18rem] resize-y text-sm leading-6"
                placeholder="Note"
              />
            </div>
          ) : (
            <EmptyState icon={FileText} title="Select a note" />
          )}
        </div>
      )}
    </div>
  );
}

function AssetThumb({ asset }: { asset: AssetItem }) {
  if (isAudioAsset(asset)) return <AudioAssetCard asset={asset} className="col-span-2" />;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70">
      <div className="flex aspect-video items-center justify-center bg-zinc-800">
        {isImageAsset(asset) ? (
          <img
            src={`/api/assets/${asset.id}/data`}
            alt={asset.name}
            className="size-full object-cover"
          />
        ) : (
          <Boxes className="size-8 text-zinc-600" />
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-zinc-100">{asset.name}</p>
        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
          <span className="truncate capitalize">{asset.type}</span>
          <span>{formatBytes(asset.file_size)}</span>
        </div>
      </div>
    </div>
  );
}

function AudioAssetCard({
  asset,
  className,
}: {
  asset: AssetItem;
  className?: string;
}) {
  const src = assetDataUrl(asset.id);
  const crossOrigin = credentialedMediaCrossOrigin(src);

  return (
    <div className={cn('overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/70', className)}>
      <div className="flex items-start gap-3 p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
          <Music className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">{asset.name}</p>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
            <span className="capitalize">{asset.type}</span>
            <span>{formatBytes(asset.file_size)}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 bg-zinc-950/55 p-3">
        <audio
          controls
          preload="none"
          src={src}
          crossOrigin={crossOrigin}
          className="h-10 w-full min-w-0"
          aria-label={`Play ${asset.name}`}
        />
      </div>
    </div>
  );
}

export function MobileAssets() {
  const role = useAuthStore((state) => state.user?.role ?? 'director');
  const [tab, setTab] = useState<'files' | 'npcs'>('files');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [assetType, setAssetType] = useState<AssetKind>('handout');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { assets } = await api.get<{ assets: AssetItem[] }>('/api/assets');
      setAssets(assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assets unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'director') return;
    void load();
  }, [load, role]);

  if (role !== 'director') return <Navigate to="/app/mobile" replace />;

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      await uploadFile(file, assetTypeForFile(file, assetType));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      event.currentTarget.value = '';
    }
  };

  const uploadedAssets = assets.filter((asset) => asset.uploaded_at !== null);
  const audioAssets = uploadedAssets.filter(isAudioAsset);
  const otherAssets = uploadedAssets.filter((asset) => !isAudioAsset(asset));

  return (
    <div className={mobileContainerClass()}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Assets</h1>
          <p className="mt-1 text-xs text-zinc-500">
            {tab === 'files' ? `${uploadedAssets.length} uploaded` : 'Campaign NPCs'}
          </p>
        </div>
        {tab === 'files' && (
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-100 px-3 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200">
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload
            <input
              type="file"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => void handleUpload(event)}
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        {(['files', 'npcs'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={tab === option}
            onClick={() => setTab(option)}
            className={cn(
              'h-8 rounded-md px-3 text-xs font-semibold transition',
              tab === option
                ? 'bg-zinc-100 text-zinc-950'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
            )}
          >
            {option === 'files' ? 'Files' : 'NPCs'}
          </button>
        ))}
      </div>

      {tab === 'npcs' ? (
        <MobileNpcPanel />
      ) : (
        <>
      <select
        value={assetType}
        onChange={(event) => setAssetType(event.currentTarget.value as AssetKind)}
        className="h-11 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
      >
        {ASSET_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {error && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingPanel />
      ) : uploadedAssets.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No uploaded assets" />
      ) : (
        <div className="grid gap-4">
          {audioAssets.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionHeader label="Audio" />
              <div className="grid gap-3 sm:grid-cols-2">
                {audioAssets.map((asset) => (
                  <AudioAssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            </section>
          )}

          {otherAssets.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionHeader label="Files" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {otherAssets.map((asset) => (
                  <AssetThumb key={asset.id} asset={asset} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}

export function MobileAccount() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [storage, setStorage] = useState<{
    usedBytes: number;
    limitBytes: number;
    usedPercent: number;
    assetCount: number;
    assetLimit: number;
  } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/account/storage`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStorage(data))
      .catch(() => setStorage(null));
  }, []);

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
    <div className={mobileContainerClass()}>
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Account</h1>
        <p className="mt-1 text-xs capitalize text-zinc-500">{user?.role ?? 'user'} flow</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-bold">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                (user?.username ?? 'A').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {user?.username ?? 'Account'}
              </CardTitle>
              <p className="mt-1 truncate text-xs text-zinc-500">{user?.id ?? ''}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {storage && (
        <Card className="border-zinc-800 bg-zinc-900/70">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <Progress value={storage.usedPercent} />
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>{formatBytes(storage.usedBytes)}</span>
              <span>{formatBytes(storage.limitBytes)}</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-zinc-950 px-3 py-2 text-sm">
              <span className="text-zinc-400">Assets</span>
              <span className="font-semibold text-zinc-100">
                {storage.assetCount}/{storage.assetLimit}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-2">
        <Button asChild variant="secondary" className="h-11">
          <Link to="/app/account">
            <Shield className="size-4" />
            Account Settings
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11">
          <Link to="/app">
            <Smartphone className="size-4" />
            Desktop App
          </Link>
        </Button>
        <Button
          variant="destructive"
          className="h-11"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
        >
          <LogOut className="size-4" />
          {loggingOut ? 'Logging out' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}
