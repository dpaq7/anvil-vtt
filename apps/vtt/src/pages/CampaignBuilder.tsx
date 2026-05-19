import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type DragEvent,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@anvil/ui';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  GripVertical,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Swords,
  Trash2,
} from 'lucide-react';
import {
  FORGESTEEL_MONSTERS,
  LORD_RELG_STATBLOCK,
  isMinion,
  isMonsterStatblock,
  loadMonsters,
} from '@anvil/data';
import type {
  CompendiumItemBase,
  CompendiumMonster,
  MonsterFeature,
} from '@anvil/data';
import type { SceneImportDocument } from '@anvil/types';
import { api } from '../lib/api.js';
import { generateRoomCode } from '../lib/room-code.js';
import { TreeSidebar } from '../components/builder/TreeSidebar.js';
import { CardGrid } from '../components/builder/CardGrid.js';
import { SceneWorkspace } from '../components/builder/SceneWorkspace.js';
import { SceneImportDialog } from '../components/import/SceneImportDialog.js';
import { AbilityBlock } from '../components/drawsteel/AbilityBlock.js';
import { drawSteelAbilityFromLike } from '../components/drawsteel/abilityData.js';

interface Module {
  id: string;
  name: string;
  description: string;
  order_index: number;
}
interface Session {
  id: string;
  name: string;
  description: string;
  module_id: string | null;
  order_index: number;
  status?: string;
}
interface Scene {
  id: string;
  title: string;
  type: string;
  data: string;
  order_index: number;
  game_session_id: string;
}

interface BattleTokenSummary {
  id: string;
  name: string;
  type: 'monster' | 'hero' | 'npc' | string;
  monsterName?: string;
  level?: number;
  roles?: string[];
  squadId?: string;
  squadSize?: number;
  ev?: number | string;
  speed?: number | string;
  size?: number | string;
  stability?: number | string;
  freeStrike?: number | string;
  characteristics?: {
    might?: number;
    agility?: number;
    reason?: number;
    intuition?: number;
    presence?: number;
  };
  ancestry?: string[];
  immunities?: string[];
  weaknesses?: string[];
  movement?: string;
  maxStamina?: number;
  currentStamina?: number;
  features?: MonsterFeature[];
}

interface MaliceFeatureBlock extends CompendiumItemBase {
  name?: string;
  type?: string;
  featureblock_type?: string;
  features?: MonsterFeature[];
  flavor?: string;
}

interface InitiativeCreatureGroup {
  id: string;
  name: string;
  count: number;
  ev: number;
  tokens: BattleTokenSummary[];
  monster: CompendiumMonster | null;
}

interface InitiativeGroupAssignment {
  id: string;
  name: string;
  creatureIds: string[];
}

interface InitiativeSection {
  id: string;
  label: string;
  ev: number;
  creatures: InitiativeCreatureGroup[];
}

type BuilderLeftRailTab = 'structure' | 'initiative';

const BUILDER_SIDEBAR_DEFAULT_WIDTH = 256;
const BUILDER_SIDEBAR_MIN_WIDTH = 220;
const RAIL_TABS_LIST_CLASS =
  'flex h-9 w-full shrink-0 justify-start rounded-none border-b border-zinc-800 bg-zinc-950/40 p-0 px-2 pt-1';
const RAIL_TAB_TRIGGER_CLASS =
  'h-8 min-w-0 flex-1 rounded-b-none rounded-t-md border border-transparent border-b-0 px-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 transition data-[state=active]:border-zinc-700 data-[state=active]:bg-zinc-900 data-[state=active]:text-zinc-100 data-[state=inactive]:hover:bg-zinc-800/50 data-[state=inactive]:hover:text-zinc-300';
const RAIL_TAB_CONTENT_CLASS =
  'mt-0 min-h-0 flex-1 overflow-hidden focus-visible:ring-0';
const PANE_HANDLE_CLASS =
  'absolute top-1/2 z-40 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100';

function maxHalfViewportWidth(): number {
  return typeof window === 'undefined'
    ? 760
    : Math.floor(window.innerWidth * 0.5);
}

function clampBuilderPaneWidth(width: number): number {
  return Math.min(
    maxHalfViewportWidth(),
    Math.max(BUILDER_SIDEBAR_MIN_WIDTH, Math.round(width)),
  );
}

function stripTokenOrdinal(name: string): string {
  return name
    .replace(/\s+x\d+$/i, '')
    .replace(/\s+\d+$/, '')
    .trim();
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.match(/-?\d+/)?.[0] ?? '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function parseSceneData(data: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(data) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function generateInitiativeGroupId(): string {
  return `initiative-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseInitiativeGroupAssignments(
  value: unknown,
): InitiativeGroupAssignment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry, index): InitiativeGroupAssignment[] => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const creatureIdsValue = record['creatureIds'];
    const creatureIds = Array.isArray(creatureIdsValue)
      ? creatureIdsValue.filter(
          (id): id is string => typeof id === 'string' && id.trim().length > 0,
        )
      : [];
    const fallbackName = `Initiative Group ${index + 1}`;
    return [
      {
        id:
          typeof record['id'] === 'string' && record['id'].trim()
            ? record['id'].trim()
            : `initiative-group-${index + 1}`,
        name:
          typeof record['name'] === 'string' && record['name'].trim()
            ? record['name'].trim()
            : fallbackName,
        creatureIds,
      },
    ];
  });
}

function buildDefaultInitiativeAssignments(
  creatures: InitiativeCreatureGroup[],
): InitiativeGroupAssignment[] {
  const assignments: InitiativeGroupAssignment[] = [];
  for (let i = 0; i < creatures.length; i += 2) {
    assignments.push({
      id: `initiative-group-${assignments.length + 1}`,
      name: `Initiative Group ${assignments.length + 1}`,
      creatureIds: creatures.slice(i, i + 2).map((creature) => creature.id),
    });
  }
  return assignments;
}

function normalizeInitiativeAssignments(
  assignments: InitiativeGroupAssignment[],
  creatures: InitiativeCreatureGroup[],
): InitiativeGroupAssignment[] {
  if (assignments.length === 0)
    return buildDefaultInitiativeAssignments(creatures);

  const validCreatureIds = new Set(creatures.map((creature) => creature.id));
  const assignedCreatureIds = new Set<string>();
  const usedGroupIds = new Set<string>();

  const normalized = assignments.map((assignment, index) => {
    const cleanCreatureIds = assignment.creatureIds.filter((creatureId) => {
      if (
        !validCreatureIds.has(creatureId) ||
        assignedCreatureIds.has(creatureId)
      )
        return false;
      assignedCreatureIds.add(creatureId);
      return true;
    });

    let id = assignment.id || `initiative-group-${index + 1}`;
    if (usedGroupIds.has(id)) id = `${id}-${index + 1}`;
    usedGroupIds.add(id);

    return {
      id,
      name: assignment.name.trim() || `Initiative Group ${index + 1}`,
      creatureIds: cleanCreatureIds,
    };
  });

  const unassignedCreatureIds = creatures
    .map((creature) => creature.id)
    .filter((creatureId) => !assignedCreatureIds.has(creatureId));
  if (unassignedCreatureIds.length > 0) {
    normalized[normalized.length - 1]?.creatureIds.push(
      ...unassignedCreatureIds,
    );
  }

  return normalized;
}

function InitiativeGroupNameInput({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const next = draft.trim() || value;
    setDraft(next);
    if (next !== value) onCommit(next);
  };

  return (
    <Input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
      aria-label="Initiative group name"
      className="h-7 min-w-0 flex-1 border-zinc-700 bg-zinc-950/70 px-2 text-xs font-black text-zinc-100 focus:border-red-500"
    />
  );
}

function compactText(
  parts: Array<string | number | undefined | null>,
  fallback = '-',
): string {
  const text = parts
    .filter(
      (part) => part !== undefined && part !== null && String(part).trim(),
    )
    .join(' ');
  return text || fallback;
}

function monsterRoles(
  monster: CompendiumMonster | null,
  token?: BattleTokenSummary,
): string {
  return compactText([...(monster?.roles ?? token?.roles ?? [])], 'Creature');
}

function monsterEv(
  monster: CompendiumMonster | null,
  token?: BattleTokenSummary,
): number {
  return parseNumber(monster?.ev ?? token?.ev ?? token?.level ?? 0);
}

function getMaliceFamilyName(monster: CompendiumMonster | null): string | null {
  const ancestry = monster?.ancestry?.[0];
  if (ancestry) return ancestry;
  const firstWord = monster?.name?.split(' ')[0];
  return firstWord || null;
}

function InitiativeCreatureDetails({
  group,
}: {
  group: InitiativeCreatureGroup;
}) {
  const monster = group.monster;
  const token = group.tokens[0];
  const abilityFeatures = (monster?.features ?? token?.features ?? []).filter(
    (feature) => feature.feature_type === 'ability',
  );
  const traitFeatures = (monster?.features ?? token?.features ?? []).filter(
    (feature) => feature.feature_type !== 'ability',
  );
  const roleText = monsterRoles(monster, token);
  const ancestryText =
    monster?.ancestry?.join(', ') ?? token?.ancestry?.join(', ') ?? roleText;
  const characteristics = {
    might: monster?.might ?? token?.characteristics?.might ?? 0,
    agility: monster?.agility ?? token?.characteristics?.agility ?? 0,
    reason: monster?.reason ?? token?.characteristics?.reason ?? 0,
    intuition: monster?.intuition ?? token?.characteristics?.intuition ?? 0,
    presence: monster?.presence ?? token?.characteristics?.presence ?? 0,
  };

  return (
    <div className="rounded-b-md border border-t-0 border-zinc-700 bg-zinc-950/80 p-3 text-xs text-zinc-300">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-2">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-zinc-100">
            {group.name}
          </div>
          <div className="text-[11px] italic text-zinc-500">{ancestryText}</div>
        </div>
        <div className="text-right text-[11px] font-semibold text-zinc-400">
          <div>Level {monster?.level ?? token?.level ?? '-'}</div>
          <div>EV {group.ev}</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 border-b border-yellow-500/60 py-2 text-center">
        {[
          ['Size', monster?.size ?? token?.size ?? '1M'],
          ['Speed', monster?.speed ?? token?.speed ?? '-'],
          ['Stamina', token?.maxStamina ?? monster?.stamina ?? '-'],
          ['Stability', monster?.stability ?? token?.stability ?? 0],
          ['Free Strike', monster?.free_strike ?? token?.freeStrike ?? '-'],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-[10px] font-bold text-zinc-500">{label}</div>
            <div className="font-semibold text-zinc-100">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        {(monster?.immunities ?? token?.immunities)?.length ? (
          <span>
            <span className="font-semibold">Immunity</span>{' '}
            {(monster?.immunities ?? token?.immunities)?.join(', ')}
          </span>
        ) : null}
        {(monster?.weaknesses ?? token?.weaknesses)?.length ? (
          <span>
            <span className="font-semibold">Weakness</span>{' '}
            {(monster?.weaknesses ?? token?.weaknesses)?.join(', ')}
          </span>
        ) : null}
        {(monster?.movement ?? token?.movement) ? (
          <span>
            <span className="font-semibold">Movement</span>{' '}
            {monster?.movement ?? token?.movement}
          </span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[11px]">
        {[
          ['M', characteristics.might],
          ['A', characteristics.agility],
          ['R', characteristics.reason],
          ['I', characteristics.intuition],
          ['P', characteristics.presence],
        ].map(([label, value]) => (
          <div key={label} className="rounded bg-zinc-900 px-1 py-0.5">
            <span className="font-black text-zinc-100">{label}</span>{' '}
            {value ?? 0}
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {abilityFeatures.slice(0, 6).map((feature, index) => (
          <AbilityBlock
            key={feature.name}
            ability={drawSteelAbilityFromLike(feature)}
            compact
            className={index === 0 ? 'border-red-400/90' : 'border-sky-400/80'}
          />
        ))}
        {traitFeatures.slice(0, 4).map((feature) => (
          <AbilityBlock
            key={feature.name}
            ability={drawSteelAbilityFromLike(feature)}
            compact
            className="border-purple-400/80"
          />
        ))}
      </div>
    </div>
  );
}

function InitiativeMaliceDetails({ block }: { block: MaliceFeatureBlock }) {
  return (
    <div className="rounded-b-md border border-t-0 border-zinc-700 bg-zinc-950/80 p-3 text-xs text-zinc-300">
      <div className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-100">
        {block.name}
      </div>
      {block.flavor ? (
        <p className="mb-2 text-[11px] text-zinc-500">{block.flavor}</p>
      ) : null}
      <div className="space-y-2">
        {(block.features ?? []).map((feature) => (
          <AbilityBlock
            key={feature.name}
            ability={drawSteelAbilityFromLike(feature)}
            compact
            className="border-purple-400/80"
          />
        ))}
      </div>
    </div>
  );
}

interface TreeNode {
  id: string;
  label: string;
  type: 'campaign' | 'module' | 'session' | 'scene';
  sceneType?: string;
  children?: TreeNode[];
}

export function CampaignBuilder() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TreeNode['type'] | null>(
    null,
  );

  // Dialog states
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addSceneOpen, setAddSceneOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSceneType, setNewSceneType] = useState('story');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [leftRailTab, setLeftRailTab] =
    useState<BuilderLeftRailTab>('structure');
  const [leftRailWidth, setLeftRailWidth] = useState(
    BUILDER_SIDEBAR_DEFAULT_WIDTH,
  );
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [monsterItems, setMonsterItems] = useState<CompendiumItemBase[]>([]);
  const [expandedInitiativeItems, setExpandedInitiativeItems] = useState<
    Record<string, boolean>
  >({});
  const [draggedInitiativeCreatureId, setDraggedInitiativeCreatureId] =
    useState<string | null>(null);
  const [initiativeDropTargetId, setInitiativeDropTargetId] = useState<
    string | null
  >(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) return;
    const campaignData = await api.get<{
      campaign: { name: string; description: string };
    }>(`/api/campaigns/${campaignId}`);
    setCampaign(campaignData.campaign);

    const modulesData = await api.get<{ modules: Module[] }>(
      `/api/campaigns/${campaignId}/modules`,
    );
    setModules(modulesData.modules);

    const sessionsData = await api.get<{ sessions: Session[] }>(
      `/api/campaigns/${campaignId}/sessions`,
    );
    setSessions(sessionsData.sessions);

    // Load scenes for all sessions
    const allScenes: Scene[] = [];
    for (const s of sessionsData.sessions) {
      const sceneData = await api.get<{ scenes: Scene[] }>(
        `/api/sessions/${s.id}/scenes`,
      );
      allScenes.push(...sceneData.scenes);
    }
    setScenes(allScenes);
  }, [campaignId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handleResize = () =>
      setLeftRailWidth((width) => clampBuilderPaneWidth(width));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadMonsters()
      .then((data) => {
        if (!cancelled) setMonsterItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setMonsterItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const buildTree = (): TreeNode[] => {
    if (!campaign || !campaignId) return [];

    const moduleNodes: TreeNode[] = modules.map((m) => {
      const moduleSessions = sessions.filter((s) => s.module_id === m.id);
      return {
        id: m.id,
        label: m.name,
        type: 'module' as const,
        children: moduleSessions.map((s) => ({
          id: s.id,
          label: s.name,
          type: 'session' as const,
          children: scenes
            .filter((sc) => sc.game_session_id === s.id)
            .map((sc) => ({
              id: sc.id,
              label: sc.title,
              type: 'scene' as const,
              sceneType: sc.type,
            })),
        })),
      };
    });

    // Unattached sessions
    const unattached = sessions.filter((s) => !s.module_id);
    const unattachedNodes: TreeNode[] = unattached.map((s) => ({
      id: s.id,
      label: s.name,
      type: 'session' as const,
      children: scenes
        .filter((sc) => sc.game_session_id === s.id)
        .map((sc) => ({
          id: sc.id,
          label: sc.title,
          type: 'scene' as const,
          sceneType: sc.type,
        })),
    }));

    return [
      {
        id: campaignId,
        label: campaign.name,
        type: 'campaign',
        children: [...moduleNodes, ...unattachedNodes],
      },
    ];
  };

  const getCardItems = () => {
    if (!selectedId || !selectedType) return [];
    if (selectedType === 'campaign') {
      return modules.map((m) => ({
        id: m.id,
        title: m.name,
        subtitle: m.description,
      }));
    }
    if (selectedType === 'module') {
      return sessions
        .filter((s) => s.module_id === selectedId)
        .map((s) => ({ id: s.id, title: s.name, subtitle: s.description }));
    }
    if (selectedType === 'session') {
      return scenes
        .filter((s) => s.game_session_id === selectedId)
        .map((s) => ({ id: s.id, title: s.title, type: s.type }));
    }
    return [];
  };

  const addModule = async () => {
    if (!newName.trim() || !campaignId) return;
    await api.post(`/api/campaigns/${campaignId}/modules`, { name: newName });
    setNewName('');
    setAddModuleOpen(false);
    await load();
  };

  const addSession = async () => {
    if (!newName.trim() || !campaignId) return;
    const moduleId = selectedType === 'module' ? selectedId : undefined;
    await api.post(`/api/campaigns/${campaignId}/sessions`, {
      name: newName,
      module_id: moduleId,
    });
    setNewName('');
    setAddSessionOpen(false);
    await load();
  };

  const addScene = async () => {
    if (!newName.trim() || !selectedId || selectedType !== 'session') return;
    await api.post(`/api/sessions/${selectedId}/scenes`, {
      title: newName,
      type: newSceneType,
    });
    setNewName('');
    setAddSceneOpen(false);
    await load();
  };

  const handleGoLive = async () => {
    if (!selectedId || selectedType !== 'session') return;
    const session = sessions.find((s) => s.id === selectedId);
    if (session?.status && session.status !== 'draft') return;
    const roomCode = generateRoomCode();
    await api.put(`/api/sessions/${selectedId}/go-live`, { roomCode });
    navigate(`/app/session/${selectedId}/lobby`);
  };

  const handleRejoin = () => {
    if (!selectedId || selectedType !== 'session') return;
    navigate(`/app/session/${selectedId}`);
  };

  const handleInvite = async () => {
    if (!campaignId) return;
    const result = await api.post<{ invite: { code: string } }>(
      `/api/campaigns/${campaignId}/invites`,
      {},
    );
    const link = `${window.location.origin}/join/${result.invite.code}`;
    setInviteLink(link);
    setInviteOpen(true);
  };

  const handleSceneImport = async (document: SceneImportDocument) => {
    if (!campaignId) return;
    await api.post(`/api/campaigns/${campaignId}/import`, { document });
    await load();
  };

  const handleLeftRailResizeStart = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = leftRailWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setLeftRailWidth(
          clampBuilderPaneWidth(startWidth + moveEvent.clientX - startX),
        );
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [leftRailWidth],
  );

  const handleBeginCombat = useCallback(
    async (scene: Scene) => {
      const session = sessions.find((s) => s.id === scene.game_session_id);
      if (!session) return;

      if (session.status === 'active') {
        navigate(`/app/session/${session.id}`);
        return;
      }

      if (session.status && session.status !== 'draft') return;

      const roomCode = generateRoomCode();
      await api.put(`/api/sessions/${session.id}/go-live`, {
        roomCode,
        sceneId: scene.id,
      });
      navigate(`/app/session/${session.id}/lobby`);
    },
    [navigate, sessions],
  );

  const selectedSession =
    selectedType === 'session'
      ? sessions.find((s) => s.id === selectedId)
      : null;
  const selectedScene =
    selectedType === 'scene'
      ? (scenes.find((s) => s.id === selectedId) ?? null)
      : null;
  const showInitiativeTracker = selectedScene?.type === 'battle';
  const selectedSceneData = useMemo<Record<string, unknown>>(() => {
    if (!selectedScene || selectedScene.type !== 'battle') return {};
    return parseSceneData(selectedScene.data);
  }, [selectedScene]);
  useEffect(() => {
    setLeftRailTab(showInitiativeTracker ? 'initiative' : 'structure');
  }, [selectedScene?.id, showInitiativeTracker]);
  const monsterStatblocks = useMemo(() => {
    const byName = new Map<string, CompendiumMonster>();
    for (const monster of [
      ...monsterItems.filter(isMonsterStatblock),
      ...FORGESTEEL_MONSTERS,
      LORD_RELG_STATBLOCK,
    ]) {
      byName.set(monster.name.toLowerCase(), monster);
    }
    return [...byName.values()];
  }, [monsterItems]);
  const monsterByName = useMemo(() => {
    const byName = new Map<string, CompendiumMonster>();
    for (const monster of monsterStatblocks)
      byName.set(monster.name.toLowerCase(), monster);
    return byName;
  }, [monsterStatblocks]);
  const maliceBlocks = useMemo<MaliceFeatureBlock[]>(() => {
    return monsterItems.filter((item): item is MaliceFeatureBlock => {
      const candidate = item as MaliceFeatureBlock;
      return (
        candidate.type === 'featureblock' &&
        /malice/i.test(
          compactText(
            [
              candidate.featureblock_type,
              candidate.name,
              candidate._subcategory,
            ],
            '',
          ),
        ) &&
        Array.isArray(candidate.features)
      );
    });
  }, [monsterItems]);
  const battleTokens = useMemo<BattleTokenSummary[]>(() => {
    if (!selectedScene || selectedScene.type !== 'battle') return [];
    if (!Array.isArray(selectedSceneData['tokens'])) return [];
    return selectedSceneData['tokens'].filter(
      (token): token is BattleTokenSummary => {
        return Boolean(
          token &&
          typeof token === 'object' &&
          'id' in token &&
          'name' in token &&
          'type' in token,
        );
      },
    );
  }, [selectedScene, selectedSceneData]);
  const heroTokens = battleTokens.filter((token) => token.type === 'hero');
  const villainTokens = battleTokens.filter(
    (token) => token.type === 'monster' || token.type === 'npc',
  );
  const initiativeCreatureGroups = useMemo<InitiativeCreatureGroup[]>(() => {
    const groups = new Map<string, InitiativeCreatureGroup>();
    for (const token of villainTokens) {
      const lookupName = token.monsterName ?? stripTokenOrdinal(token.name);
      const monster = monsterByName.get(lookupName.toLowerCase()) ?? null;
      const baseName = monster?.name ?? lookupName;
      const key = token.squadId ?? baseName.toLowerCase();
      const existing = groups.get(key);
      if (existing) {
        existing.tokens.push(token);
        existing.count += 1;
        existing.ev += monsterEv(monster, token);
      } else {
        groups.set(key, {
          id: key,
          name: baseName,
          count: 1,
          ev: monsterEv(monster, token),
          tokens: [token],
          monster,
        });
      }
    }

    return [...groups.values()]
      .map((group) => {
        const firstToken = group.tokens[0];
        const squadSize =
          firstToken?.squadSize && firstToken.squadSize > group.count
            ? firstToken.squadSize
            : group.count;
        const useSquadCount = Boolean(
          group.monster && isMinion(group.monster) && squadSize > 1,
        );
        return {
          ...group,
          count: useSquadCount ? squadSize : group.count,
          ev:
            useSquadCount && group.monster
              ? monsterEv(group.monster, firstToken) * squadSize
              : group.ev,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [monsterByName, villainTokens]);
  const initiativeAssignments = useMemo(
    () =>
      normalizeInitiativeAssignments(
        parseInitiativeGroupAssignments(selectedSceneData['initiativeGroups']),
        initiativeCreatureGroups,
      ),
    [selectedSceneData, initiativeCreatureGroups],
  );
  const initiativeSections = useMemo<InitiativeSection[]>(() => {
    const creatureById = new Map(
      initiativeCreatureGroups.map((creature) => [creature.id, creature]),
    );
    return initiativeAssignments.map((assignment, index) => {
      const creatures = assignment.creatureIds.flatMap((creatureId) => {
        const creature = creatureById.get(creatureId);
        return creature ? [creature] : [];
      });
      return {
        id: assignment.id,
        label: assignment.name || `Initiative Group ${index + 1}`,
        ev: creatures.reduce((sum, creature) => sum + creature.ev, 0),
        creatures,
      };
    });
  }, [initiativeAssignments, initiativeCreatureGroups]);
  const encounterEv = initiativeCreatureGroups.reduce(
    (sum, group) => sum + group.ev,
    0,
  );
  const maliceBlock = useMemo(() => {
    const families = new Set(
      initiativeCreatureGroups
        .map((group) => getMaliceFamilyName(group.monster))
        .filter(Boolean),
    );
    return (
      maliceBlocks.find((block) => {
        const blockName = String(block.name ?? '').toLowerCase();
        return [...families].some((family) =>
          blockName.includes(String(family).toLowerCase()),
        );
      }) ?? null
    );
  }, [initiativeCreatureGroups, maliceBlocks]);
  const maliceInsertIndex = Math.min(
    1,
    Math.max(0, initiativeSections.length - 1),
  );
  const toggleInitiativeItem = useCallback((itemId: string) => {
    setExpandedInitiativeItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }));
  }, []);
  const saveInitiativeAssignments = useCallback(
    (assignments: InitiativeGroupAssignment[]) => {
      if (!selectedScene || selectedScene.type !== 'battle') return;
      const nextData = {
        ...parseSceneData(selectedScene.data),
        initiativeGroups: assignments,
      };
      const nextDataString = JSON.stringify(nextData);

      setScenes((current) =>
        current.map((scene) =>
          scene.id === selectedScene.id
            ? { ...scene, data: nextDataString }
            : scene,
        ),
      );

      void api
        .put(`/api/scenes/${selectedScene.id}`, { data: nextDataString })
        .catch((error) => {
          console.error('Failed to save initiative groups:', error);
          void load();
        });
    },
    [load, selectedScene],
  );
  const updateInitiativeAssignments = useCallback(
    (
      updater: (
        assignments: InitiativeGroupAssignment[],
      ) => InitiativeGroupAssignment[],
    ) => {
      const nextAssignments = normalizeInitiativeAssignments(
        updater(initiativeAssignments),
        initiativeCreatureGroups,
      );
      saveInitiativeAssignments(nextAssignments);
    },
    [
      initiativeAssignments,
      initiativeCreatureGroups,
      saveInitiativeAssignments,
    ],
  );
  const handleAddInitiativeGroup = useCallback(() => {
    updateInitiativeAssignments((assignments) => [
      ...assignments,
      {
        id: generateInitiativeGroupId(),
        name: `Initiative Group ${assignments.length + 1}`,
        creatureIds: [],
      },
    ]);
  }, [updateInitiativeAssignments]);
  const handleRenameInitiativeGroup = useCallback(
    (groupId: string, name: string) => {
      updateInitiativeAssignments((assignments) =>
        assignments.map((assignment) =>
          assignment.id === groupId ? { ...assignment, name } : assignment,
        ),
      );
    },
    [updateInitiativeAssignments],
  );
  const handleDeleteInitiativeGroup = useCallback(
    (groupId: string) => {
      if (initiativeAssignments.length <= 1) return;
      updateInitiativeAssignments((assignments) => {
        const removeIndex = assignments.findIndex(
          (assignment) => assignment.id === groupId,
        );
        if (removeIndex === -1) return assignments;
        const removed = assignments[removeIndex];
        const remaining = assignments.filter(
          (assignment) => assignment.id !== groupId,
        );
        const targetIndex = Math.min(
          Math.max(removeIndex - 1, 0),
          remaining.length - 1,
        );
        if (removed?.creatureIds.length && remaining[targetIndex]) {
          remaining[targetIndex] = {
            ...remaining[targetIndex],
            creatureIds: [
              ...remaining[targetIndex].creatureIds,
              ...removed.creatureIds,
            ],
          };
        }
        return remaining;
      });
    },
    [initiativeAssignments.length, updateInitiativeAssignments],
  );
  const handleMoveInitiativeGroup = useCallback(
    (groupId: string, direction: -1 | 1) => {
      updateInitiativeAssignments((assignments) => {
        const index = assignments.findIndex(
          (assignment) => assignment.id === groupId,
        );
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= assignments.length)
          return assignments;
        const next = [...assignments];
        const [moved] = next.splice(index, 1);
        if (!moved) return assignments;
        next.splice(nextIndex, 0, moved);
        return next;
      });
    },
    [updateInitiativeAssignments],
  );
  const handleInitiativeCreatureDrop = useCallback(
    (groupId: string, creatureId: string) => {
      updateInitiativeAssignments((assignments) =>
        assignments.map((assignment) => {
          const creatureIds = assignment.creatureIds.filter(
            (id) => id !== creatureId,
          );
          if (assignment.id !== groupId) return { ...assignment, creatureIds };
          return { ...assignment, creatureIds: [...creatureIds, creatureId] };
        }),
      );
    },
    [updateInitiativeAssignments],
  );
  const handleInitiativeDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, creatureId: string) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        'application/x-anvil-initiative-creature',
        creatureId,
      );
      setDraggedInitiativeCreatureId(creatureId);
    },
    [],
  );
  const handleInitiativeDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, groupId: string) => {
      event.preventDefault();
      const creatureId = event.dataTransfer.getData(
        'application/x-anvil-initiative-creature',
      );
      setInitiativeDropTargetId(null);
      setDraggedInitiativeCreatureId(null);
      if (creatureId) handleInitiativeCreatureDrop(groupId, creatureId);
    },
    [handleInitiativeCreatureDrop],
  );

  if (!campaign) return <div className="p-8 text-zinc-400">Loading...</div>;

  const builderSidebar = (
    <div
      ref={sidebarRef}
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50"
      style={{ width: leftRailWidth, maxWidth: '50vw' }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize campaign pane"
        title="Resize campaign pane"
        onMouseDown={handleLeftRailResizeStart}
        className="group absolute inset-y-0 right-0 z-10 flex w-2 cursor-ew-resize items-center justify-center hover:bg-zinc-800/70"
      >
        <div className="h-12 w-px bg-zinc-700 opacity-0 transition group-hover:opacity-100" />
      </div>
      <button
        type="button"
        title="Collapse campaign pane"
        aria-label="Collapse campaign pane"
        onClick={() => setLeftRailCollapsed(true)}
        className={`${PANE_HANDLE_CLASS} right-0 translate-x-1/2`}
      >
        <PanelLeftClose className="size-3.5" />
      </button>

      <Tabs
        value={leftRailTab}
        onValueChange={(value) => setLeftRailTab(value as BuilderLeftRailTab)}
        className="flex h-full min-h-0 flex-col overflow-hidden"
      >
        <TabsList className={RAIL_TABS_LIST_CLASS}>
          <TabsTrigger value="structure" className={RAIL_TAB_TRIGGER_CLASS}>
            <span className="truncate">Structure</span>
          </TabsTrigger>
          {showInitiativeTracker ? (
            <TabsTrigger value="initiative" className={RAIL_TAB_TRIGGER_CLASS}>
              <Swords className="mr-1 size-3.5 shrink-0 text-red-400" />
              <span className="truncate">Initiative</span>
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent
          value="structure"
          className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto`}
        >
          <TreeSidebar
            nodes={buildTree()}
            selectedId={selectedId}
            onSelect={(id, type) => {
              setSelectedId(id);
              setSelectedType(type);
            }}
          />
        </TabsContent>

        {showInitiativeTracker ? (
          <TabsContent
            value="initiative"
            className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto bg-zinc-950/60 p-2 text-zinc-200`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <div>
                  <div className="text-sm font-black text-zinc-100">
                    Monsters
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Director order
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-black text-zinc-300">
                    EV {encounterEv}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddInitiativeGroup}
                    className="h-8 shrink-0 border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-100 hover:bg-zinc-800"
                  >
                    <Plus className="mr-1 size-3.5" />
                    Group
                  </Button>
                </div>
              </div>

              {initiativeSections.length > 0 ? (
                initiativeSections.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    onDragOver={(event) => {
                      if (!draggedInitiativeCreatureId) return;
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDragEnter={() => {
                      if (draggedInitiativeCreatureId)
                        setInitiativeDropTargetId(section.id);
                    }}
                    onDragLeave={(event) => {
                      if (
                        event.currentTarget.contains(
                          event.relatedTarget as Node | null,
                        )
                      )
                        return;
                      setInitiativeDropTargetId((current) =>
                        current === section.id ? null : current,
                      );
                    }}
                    onDrop={(event) => handleInitiativeDrop(event, section.id)}
                    className={
                      'space-y-2 rounded-md border p-2 transition ' +
                      (initiativeDropTargetId === section.id
                        ? 'border-red-400 bg-red-950/30'
                        : 'border-zinc-800 bg-zinc-900/60')
                    }
                  >
                    <div className="flex items-center gap-1">
                      <InitiativeGroupNameInput
                        value={section.label}
                        onCommit={(name) =>
                          handleRenameInitiativeGroup(section.id, name)
                        }
                      />
                      <span className="shrink-0 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] font-black text-zinc-400">
                        EV {section.ev}
                      </span>
                      <button
                        type="button"
                        title="Move group earlier"
                        aria-label="Move group earlier"
                        disabled={sectionIndex === 0}
                        onClick={() =>
                          handleMoveInitiativeGroup(section.id, -1)
                        }
                        className="flex size-7 shrink-0 items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Move group later"
                        aria-label="Move group later"
                        disabled={
                          sectionIndex === initiativeSections.length - 1
                        }
                        onClick={() => handleMoveInitiativeGroup(section.id, 1)}
                        className="flex size-7 shrink-0 items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete group"
                        aria-label="Delete group"
                        disabled={initiativeSections.length <= 1}
                        onClick={() => handleDeleteInitiativeGroup(section.id)}
                        className="flex size-7 shrink-0 items-center justify-center rounded border border-zinc-700 text-zinc-500 hover:border-red-500/70 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {section.creatures.map((group) => {
                      const itemId = 'creature:' + group.id;
                      const expanded = Boolean(expandedInitiativeItems[itemId]);
                      return (
                        <div
                          key={group.id}
                          draggable
                          onDragStart={(event) =>
                            handleInitiativeDragStart(event, group.id)
                          }
                          onDragEnd={() => {
                            setDraggedInitiativeCreatureId(null);
                            setInitiativeDropTargetId(null);
                          }}
                          className={
                            'transition ' +
                            (draggedInitiativeCreatureId === group.id
                              ? 'opacity-50'
                              : 'opacity-100')
                          }
                        >
                          <button
                            type="button"
                            onClick={() => toggleInitiativeItem(itemId)}
                            className="flex w-full items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-800/80 px-2 py-2 text-left text-xs font-bold text-zinc-100 shadow-sm hover:border-zinc-500 hover:bg-zinc-800"
                          >
                            <GripVertical className="size-4 shrink-0 text-zinc-500" />
                            <span className="min-w-0 flex-1 truncate">
                              {group.name}
                              {group.count > 1 ? ' x' + group.count : ''}
                            </span>
                            <ChevronDown
                              className={
                                'size-4 shrink-0 rounded border border-zinc-700 p-0.5 text-zinc-400 transition-transform ' +
                                (expanded ? 'rotate-180' : '')
                              }
                            />
                          </button>
                          {expanded ? (
                            <InitiativeCreatureDetails group={group} />
                          ) : null}
                        </div>
                      );
                    })}
                    {section.creatures.length === 0 ? (
                      <div className="rounded-md border border-dashed border-zinc-700 bg-zinc-950/40 px-3 py-4 text-center text-xs text-zinc-500">
                        Drop creatures here
                      </div>
                    ) : null}

                    {maliceBlock && sectionIndex === maliceInsertIndex ? (
                      <div className="space-y-2 pt-1">
                        <div className="px-1 text-xs font-black text-zinc-500">
                          Malice
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleInitiativeItem('malice')}
                            className="flex w-full items-center justify-between rounded-md border border-purple-500/40 bg-purple-950/30 px-2 py-2 text-left text-xs font-bold text-purple-100 shadow-sm hover:border-purple-400/70"
                          >
                            <span>{maliceBlock.name}</span>
                            <ChevronDown
                              className={
                                'size-4 rounded border border-purple-500/40 p-0.5 text-purple-300 transition-transform ' +
                                (expandedInitiativeItems['malice']
                                  ? 'rotate-180'
                                  : '')
                              }
                            />
                          </button>
                          {expandedInitiativeItems['malice'] ? (
                            <InitiativeMaliceDetails block={maliceBlock} />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-500">
                  Add monsters or NPCs to this battle map to seed initiative
                  groups.
                </p>
              )}

              {heroTokens.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1 text-xs font-black text-zinc-400">
                    <span>Heroes</span>
                    <span>{heroTokens.length}</span>
                  </div>
                  {heroTokens.map((token) => (
                    <div
                      key={token.id}
                      className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-2 text-xs font-bold text-zinc-300 shadow-sm"
                    >
                      {token.name}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );

  return (
    <div className="relative flex h-full overflow-hidden">
      {!focusMode && !leftRailCollapsed && builderSidebar}
      {!focusMode && leftRailCollapsed && (
        <button
          type="button"
          title="Expand campaign pane"
          aria-label="Expand campaign pane"
          onClick={() => setLeftRailCollapsed(false)}
          className={`${PANE_HANDLE_CLASS} left-0 translate-x-1/2`}
        >
          <PanelLeftOpen className="size-3.5" />
        </button>
      )}
      {focusMode && (
        <Button
          type="button"
          title="Exit full screen"
          aria-label="Exit full screen"
          onClick={() => setFocusMode(false)}
          className="absolute right-4 top-4 z-40 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800"
          size="sm"
        >
          <Minimize2 className="mr-1.5 size-4" />
          Exit full screen
        </Button>
      )}
      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!focusMode && (
          <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 p-4">
            {campaignId && (
              <SceneImportDialog
                buttonLabel="Import Scenes"
                onImport={handleSceneImport}
              />
            )}
            {selectedType === 'campaign' && (
              <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-sidebar-director text-anvil-ink hover:bg-sidebar-director/80"
                  >
                    Add Module
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>New Module</DialogTitle>
                  <div className="mt-4 flex flex-col gap-4">
                    <Input
                      placeholder="Module name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button onClick={addModule}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {selectedType === 'module' && (
              <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-sidebar-director text-anvil-ink hover:bg-sidebar-director/80"
                  >
                    Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>New Session</DialogTitle>
                  <div className="mt-4 flex flex-col gap-4">
                    <Input
                      placeholder="Session name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button onClick={addSession}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {selectedType === 'session' && (
              <Dialog open={addSceneOpen} onOpenChange={setAddSceneOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-sidebar-director text-anvil-ink hover:bg-sidebar-director/80"
                  >
                    Add Scene
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>New Scene</DialogTitle>
                  <div className="mt-4 flex flex-col gap-4">
                    <Input
                      placeholder="Scene title"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                    <select
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                      value={newSceneType}
                      onChange={(e) => setNewSceneType(e.target.value)}
                    >
                      <option value="story">Story</option>
                      <option value="battle">Battle</option>
                      <option value="montage">Montage</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="respite">Respite</option>
                    </select>
                    <div className="flex justify-end gap-2">
                      <DialogClose asChild>
                        <Button variant="ghost">Cancel</Button>
                      </DialogClose>
                      <Button onClick={addScene}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {selectedType === 'campaign' && (
              <Button size="sm" variant="outline" onClick={handleInvite}>
                Invite Players
              </Button>
            )}
            {selectedSession &&
              (!selectedSession.status ||
                selectedSession.status === 'draft') && (
                <Button size="sm" variant="default" onClick={handleGoLive}>
                  Go Live
                </Button>
              )}
            {selectedSession && selectedSession.status === 'active' && (
              <Button size="sm" variant="secondary" onClick={handleRejoin}>
                Rejoin
              </Button>
            )}
            {selectedSession?.status && selectedSession.status !== 'draft' && (
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400 capitalize">
                {selectedSession.status}
              </span>
            )}
          </div>
        )}

        {/* Conditionally render SceneWorkspace or CardGrid */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {selectedType === 'scene' && selectedId ? (
            (() => {
              const selectedScene = scenes.find((s) => s.id === selectedId);
              if (!selectedScene)
                return <div className="p-8 text-zinc-500">Scene not found</div>;
              return (
                <SceneWorkspace
                  scene={{
                    ...selectedScene,
                    type: selectedScene.type as
                      | 'battle'
                      | 'story'
                      | 'montage'
                      | 'negotiation'
                      | 'respite',
                  }}
                  campaignId={campaignId!}
                  onSave={load}
                  onBeginCombat={handleBeginCombat}
                  focusMode={focusMode}
                  onFocusModeChange={setFocusMode}
                />
              );
            })()
          ) : (
            <div className="h-full overflow-y-auto">
              <CardGrid
                items={getCardItems()}
                onSelect={(id) => {
                  // If clicking a scene, find and select it in tree
                  const scene = scenes.find((s) => s.id === id);
                  if (scene) {
                    setSelectedId(id);
                    setSelectedType('scene');
                  } else {
                    // It could be a module or session
                    const mod = modules.find((m) => m.id === id);
                    if (mod) {
                      setSelectedId(id);
                      setSelectedType('module');
                    }
                    const sess = sessions.find((s) => s.id === id);
                    if (sess) {
                      setSelectedId(id);
                      setSelectedType('session');
                    }
                  }
                }}
                onDoubleClick={(id) => {
                  // Double-click on scene also opens it (select it)
                  const scene = scenes.find((s) => s.id === id);
                  if (scene) {
                    setSelectedId(id);
                    setSelectedType('scene');
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogTitle>Invite Players</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-zinc-400">
              Share this link with your players:
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink ?? ''}
                className="font-mono text-xs"
              />
              <Button
                size="sm"
                onClick={() => {
                  if (inviteLink) navigator.clipboard.writeText(inviteLink);
                }}
              >
                Copy
              </Button>
            </div>
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="ghost">Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
