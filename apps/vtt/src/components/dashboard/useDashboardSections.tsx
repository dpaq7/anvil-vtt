import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  CalendarClock,
  Clapperboard,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  NotebookText,
  PlayCircle,
  Plus,
  ScrollText,
  Shield,
  User,
  Users,
} from 'lucide-react';
import type {
  DashboardRoleKey,
  DashboardSectionConfig,
  DashboardState,
  LiveTable,
  QuickAction,
  RecentCharacter,
  StatConfig,
} from './types.js';
import { toTimestamp } from './format.js';
import { SortableGrid } from './sortable.js';
import { EmptyState } from './SectionChrome.js';
import { AssetCard, CampaignCard, CharacterCard, LiveTableCard, NoteCard } from './DashboardCards.js';

const MAX_LIST_ITEMS = 5;

export function useDashboardSections({
  data,
  isDirector,
  roleKey,
}: {
  data: DashboardState;
  isDirector: boolean;
  roleKey: DashboardRoleKey;
}) {
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
            detail: 'Personal and campaign notes',
            icon: NotebookText,
            tone: 'rose',
          },
        ];
  }, [data.assets.length, data.campaigns, data.heroes.length, data.notes.length, isDirector, liveTables.length]);

  const quickActions: QuickAction[] = isDirector
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
      body: (
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:live`}
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:campaigns`}
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:notes`}
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:characters`}
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
        <SortableGrid
          storageKey={`anvil-dashboard:${roleKey}:cards:assets`}
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
  ], [data.assets, data.notes, isDirector, liveTableItems, recentCampaigns, recentCharacters, roleKey]);

  return { dashboardSections, stats, quickActions };
}
