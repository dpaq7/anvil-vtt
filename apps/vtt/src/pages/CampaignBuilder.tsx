import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@anvil/ui';
import { ChevronDown, Minimize2, PanelLeftClose, PanelLeftOpen, Swords } from 'lucide-react';
import { FORGESTEEL_MONSTERS, LORD_RELG_STATBLOCK, isMinion, isMonsterStatblock, loadMonsters } from '@anvil/data';
import type { CompendiumItemBase, CompendiumMonster, MonsterFeature } from '@anvil/data';
import type { SceneImportDocument } from '@anvil/types';
import { api } from '../lib/api.js';
import { generateRoomCode } from '../lib/room-code.js';
import { TreeSidebar } from '../components/builder/TreeSidebar.js';
import { CardGrid } from '../components/builder/CardGrid.js';
import { SceneWorkspace } from '../components/builder/SceneWorkspace.js';
import { SceneImportDialog } from '../components/import/SceneImportDialog.js';
import { AbilityBlock } from '../components/drawsteel/AbilityBlock.js';
import { drawSteelAbilityFromLike } from '../components/drawsteel/abilityData.js';

interface Module { id: string; name: string; description: string; order_index: number; }
interface Session { id: string; name: string; description: string; module_id: string | null; order_index: number; status?: string; }
interface Scene { id: string; title: string; type: string; data: string; order_index: number; game_session_id: string; }

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
const RAIL_TAB_CONTENT_CLASS = 'mt-0 min-h-0 flex-1 overflow-hidden focus-visible:ring-0';
const PANE_HANDLE_CLASS =
  'absolute top-1/2 z-40 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100';

function maxHalfViewportWidth(): number {
  return typeof window === 'undefined' ? 760 : Math.floor(window.innerWidth * 0.5);
}

function clampBuilderPaneWidth(width: number): number {
  return Math.min(maxHalfViewportWidth(), Math.max(BUILDER_SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function stripTokenOrdinal(name: string): string {
  return name.replace(/\s+x\d+$/i, '').replace(/\s+\d+$/, '').trim();
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.match(/-?\d+/)?.[0] ?? '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function compactText(parts: Array<string | number | undefined | null>, fallback = '-'): string {
  const text = parts.filter((part) => part !== undefined && part !== null && String(part).trim()).join(' ');
  return text || fallback;
}

function monsterRoles(monster: CompendiumMonster | null, token?: BattleTokenSummary): string {
  return compactText([...(monster?.roles ?? token?.roles ?? [])], 'Creature');
}

function monsterEv(monster: CompendiumMonster | null, token?: BattleTokenSummary): number {
  return parseNumber(monster?.ev ?? token?.ev ?? token?.level ?? 0);
}

function getMaliceFamilyName(monster: CompendiumMonster | null): string | null {
  const ancestry = monster?.ancestry?.[0];
  if (ancestry) return ancestry;
  const firstWord = monster?.name?.split(' ')[0];
  return firstWord || null;
}

function InitiativeCreatureDetails({ group }: { group: InitiativeCreatureGroup }) {
  const monster = group.monster;
  const token = group.tokens[0];
  const abilityFeatures = (monster?.features ?? token?.features ?? []).filter((feature) => feature.feature_type === 'ability');
  const traitFeatures = (monster?.features ?? token?.features ?? []).filter((feature) => feature.feature_type !== 'ability');
  const roleText = monsterRoles(monster, token);
  const ancestryText = monster?.ancestry?.join(', ') ?? token?.ancestry?.join(', ') ?? roleText;
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
          <div className="text-sm font-black uppercase tracking-wide text-zinc-100">{group.name}</div>
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
        {(monster?.immunities ?? token?.immunities)?.length ? <span><span className="font-semibold">Immunity</span> {(monster?.immunities ?? token?.immunities)?.join(', ')}</span> : null}
        {(monster?.weaknesses ?? token?.weaknesses)?.length ? <span><span className="font-semibold">Weakness</span> {(monster?.weaknesses ?? token?.weaknesses)?.join(', ')}</span> : null}
        {(monster?.movement ?? token?.movement) ? <span><span className="font-semibold">Movement</span> {monster?.movement ?? token?.movement}</span> : null}
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1 text-center text-[11px]">
        {[['M', characteristics.might], ['A', characteristics.agility], ['R', characteristics.reason], ['I', characteristics.intuition], ['P', characteristics.presence]].map(([label, value]) => (
          <div key={label} className="rounded bg-zinc-900 px-1 py-0.5"><span className="font-black text-zinc-100">{label}</span> {value ?? 0}</div>
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
      <div className="mb-2 text-sm font-black uppercase tracking-wide text-zinc-100">{block.name}</div>
      {block.flavor ? <p className="mb-2 text-[11px] text-zinc-500">{block.flavor}</p> : null}
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
  const [campaign, setCampaign] = useState<{ name: string; description: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<TreeNode['type'] | null>(null);

  // Dialog states
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addSceneOpen, setAddSceneOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSceneType, setNewSceneType] = useState('story');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [leftRailTab, setLeftRailTab] = useState<BuilderLeftRailTab>('structure');
  const [leftRailWidth, setLeftRailWidth] = useState(BUILDER_SIDEBAR_DEFAULT_WIDTH);
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [monsterItems, setMonsterItems] = useState<CompendiumItemBase[]>([]);
  const [expandedInitiativeItems, setExpandedInitiativeItems] = useState<Record<string, boolean>>({});
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) return;
    const campaignData = await api.get<{ campaign: { name: string; description: string } }>(`/api/campaigns/${campaignId}`);
    setCampaign(campaignData.campaign);

    const modulesData = await api.get<{ modules: Module[] }>(`/api/campaigns/${campaignId}/modules`);
    setModules(modulesData.modules);

    const sessionsData = await api.get<{ sessions: Session[] }>(`/api/campaigns/${campaignId}/sessions`);
    setSessions(sessionsData.sessions);

    // Load scenes for all sessions
    const allScenes: Scene[] = [];
    for (const s of sessionsData.sessions) {
      const sceneData = await api.get<{ scenes: Scene[] }>(`/api/sessions/${s.id}/scenes`);
      allScenes.push(...sceneData.scenes);
    }
    setScenes(allScenes);
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handleResize = () => setLeftRailWidth((width) => clampBuilderPaneWidth(width));
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
    return () => { cancelled = true; };
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
            .map((sc) => ({ id: sc.id, label: sc.title, type: 'scene' as const, sceneType: sc.type })),
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
        .map((sc) => ({ id: sc.id, label: sc.title, type: 'scene' as const, sceneType: sc.type })),
    }));

    return [
      { id: campaignId, label: campaign.name, type: 'campaign', children: [...moduleNodes, ...unattachedNodes] },
    ];
  };

  const getCardItems = () => {
    if (!selectedId || !selectedType) return [];
    if (selectedType === 'campaign') {
      return modules.map((m) => ({ id: m.id, title: m.name, subtitle: m.description }));
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
    await api.post(`/api/campaigns/${campaignId}/sessions`, { name: newName, module_id: moduleId });
    setNewName('');
    setAddSessionOpen(false);
    await load();
  };

  const addScene = async () => {
    if (!newName.trim() || !selectedId || selectedType !== 'session') return;
    await api.post(`/api/sessions/${selectedId}/scenes`, { title: newName, type: newSceneType });
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
    const result = await api.post<{ invite: { code: string } }>(`/api/campaigns/${campaignId}/invites`, {});
    const link = `${window.location.origin}/join/${result.invite.code}`;
    setInviteLink(link);
    setInviteOpen(true);
  };

  const handleSceneImport = async (document: SceneImportDocument) => {
    if (!campaignId) return;
    await api.post(`/api/campaigns/${campaignId}/import`, { document });
    await load();
  };

  const handleLeftRailResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = leftRailWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setLeftRailWidth(clampBuilderPaneWidth(startWidth + moveEvent.clientX - startX));
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
  }, [leftRailWidth]);

  const handleBeginCombat = useCallback(async (scene: Scene) => {
    const session = sessions.find((s) => s.id === scene.game_session_id);
    if (!session) return;

    if (session.status === 'active') {
      navigate(`/app/session/${session.id}`);
      return;
    }

    if (session.status && session.status !== 'draft') return;

    const roomCode = generateRoomCode();
    await api.put(`/api/sessions/${session.id}/go-live`, { roomCode, sceneId: scene.id });
    navigate(`/app/session/${session.id}/lobby`);
  }, [navigate, sessions]);

  const selectedSession = selectedType === 'session' ? sessions.find((s) => s.id === selectedId) : null;
  const selectedScene = selectedType === 'scene' ? scenes.find((s) => s.id === selectedId) ?? null : null;
  const showInitiativeTracker = selectedScene?.type === 'battle';
  useEffect(() => {
    setLeftRailTab(showInitiativeTracker ? 'initiative' : 'structure');
  }, [selectedScene?.id, showInitiativeTracker]);
  const monsterStatblocks = useMemo(() => {
    const byName = new Map<string, CompendiumMonster>();
    for (const monster of [...monsterItems.filter(isMonsterStatblock), ...FORGESTEEL_MONSTERS, LORD_RELG_STATBLOCK]) {
      byName.set(monster.name.toLowerCase(), monster);
    }
    return [...byName.values()];
  }, [monsterItems]);
  const monsterByName = useMemo(() => {
    const byName = new Map<string, CompendiumMonster>();
    for (const monster of monsterStatblocks) byName.set(monster.name.toLowerCase(), monster);
    return byName;
  }, [monsterStatblocks]);
  const maliceBlocks = useMemo<MaliceFeatureBlock[]>(() => {
    return monsterItems.filter((item): item is MaliceFeatureBlock => {
      const candidate = item as MaliceFeatureBlock;
      return candidate.type === 'featureblock'
        && /malice/i.test(compactText([candidate.featureblock_type, candidate.name, candidate._subcategory], ''))
        && Array.isArray(candidate.features);
    });
  }, [monsterItems]);
  const battleTokens = useMemo<BattleTokenSummary[]>(() => {
    if (!selectedScene || selectedScene.type !== 'battle') return [];
    try {
      const sceneData = JSON.parse(selectedScene.data) as { tokens?: unknown };
      if (!Array.isArray(sceneData.tokens)) return [];
      return sceneData.tokens.filter((token): token is BattleTokenSummary => {
        return Boolean(token && typeof token === 'object' && 'id' in token && 'name' in token && 'type' in token);
      });
    } catch {
      return [];
    }
  }, [selectedScene]);
  const heroTokens = battleTokens.filter((token) => token.type === 'hero');
  const villainTokens = battleTokens.filter((token) => token.type === 'monster' || token.type === 'npc');
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

    return [...groups.values()].map((group) => {
      const firstToken = group.tokens[0];
      const squadSize = firstToken?.squadSize && firstToken.squadSize > group.count ? firstToken.squadSize : group.count;
      const useSquadCount = Boolean(group.monster && isMinion(group.monster) && squadSize > 1);
      return {
        ...group,
        count: useSquadCount ? squadSize : group.count,
        ev: useSquadCount && group.monster ? monsterEv(group.monster, firstToken) * squadSize : group.ev,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [monsterByName, villainTokens]);
  const initiativeSections = useMemo<InitiativeSection[]>(() => {
    const sections: InitiativeSection[] = [];
    for (let i = 0; i < initiativeCreatureGroups.length; i += 2) {
      const creatures = initiativeCreatureGroups.slice(i, i + 2);
      sections.push({
        id: `initiative-group-${sections.length + 1}`,
        label: `Initiative Group ${sections.length + 1}`,
        ev: creatures.reduce((sum, creature) => sum + creature.ev, 0),
        creatures,
      });
    }
    return sections;
  }, [initiativeCreatureGroups]);
  const encounterEv = initiativeCreatureGroups.reduce((sum, group) => sum + group.ev, 0);
  const maliceBlock = useMemo(() => {
    const families = new Set(initiativeCreatureGroups.map((group) => getMaliceFamilyName(group.monster)).filter(Boolean));
    return maliceBlocks.find((block) => {
      const blockName = String(block.name ?? '').toLowerCase();
      return [...families].some((family) => blockName.includes(String(family).toLowerCase()));
    }) ?? null;
  }, [initiativeCreatureGroups, maliceBlocks]);
  const maliceInsertIndex = Math.min(1, Math.max(0, initiativeSections.length - 1));
  const toggleInitiativeItem = useCallback((itemId: string) => {
    setExpandedInitiativeItems((current) => ({ ...current, [itemId]: !current[itemId] }));
  }, []);

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

        <TabsContent value="structure" className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto`}>
          <TreeSidebar
            nodes={buildTree()}
            selectedId={selectedId}
            onSelect={(id, type) => { setSelectedId(id); setSelectedType(type); }}
          />
        </TabsContent>

        {showInitiativeTracker ? (
          <TabsContent value="initiative" className={`${RAIL_TAB_CONTENT_CLASS} overflow-y-auto bg-zinc-200 p-1 text-zinc-950`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-sm font-black text-zinc-950">
                <span>Monsters</span>
                <span>EV {encounterEv}</span>
              </div>

              {initiativeSections.length > 0 ? initiativeSections.map((section, sectionIndex) => (
                <div key={section.id} className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-black text-zinc-800">
                    <span>{section.label}</span>
                    <span>EV {section.ev}</span>
                  </div>
                  {section.creatures.map((group) => {
                    const itemId = 'creature:' + group.id;
                    const expanded = Boolean(expandedInitiativeItems[itemId]);
                    return (
                      <div key={group.id}>
                        <button
                          type="button"
                          onClick={() => toggleInitiativeItem(itemId)}
                          className="flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-2 py-2 text-left text-xs font-bold text-zinc-950 shadow-sm hover:border-zinc-400"
                        >
                          <span>{group.name}{group.count > 1 ? ' x' + group.count : ''}</span>
                          <ChevronDown className={'size-4 rounded border border-zinc-300 p-0.5 text-zinc-500 transition-transform ' + (expanded ? 'rotate-180' : '')} />
                        </button>
                        {expanded ? <InitiativeCreatureDetails group={group} /> : null}
                      </div>
                    );
                  })}

                  {maliceBlock && sectionIndex === maliceInsertIndex ? (
                    <div className="space-y-2 pt-1">
                      <div className="px-1 text-xs font-black text-zinc-500">Malice</div>
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleInitiativeItem('malice')}
                          className="flex w-full items-center justify-between rounded-md border border-zinc-300 bg-white px-2 py-2 text-left text-xs font-bold text-zinc-950 shadow-sm hover:border-zinc-400"
                        >
                          <span>{maliceBlock.name}</span>
                          <ChevronDown className={'size-4 rounded border border-zinc-300 p-0.5 text-zinc-500 transition-transform ' + (expandedInitiativeItems['malice'] ? 'rotate-180' : '')} />
                        </button>
                        {expandedInitiativeItems['malice'] ? <InitiativeMaliceDetails block={maliceBlock} /> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )) : (
                <p className="rounded-md border border-zinc-300 bg-white p-3 text-xs text-zinc-500">Add monsters or NPCs to this battle map to seed initiative groups.</p>
              )}

              {heroTokens.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1 text-xs font-black text-zinc-800">
                    <span>Heroes</span>
                    <span>{heroTokens.length}</span>
                  </div>
                  {heroTokens.map((token) => (
                    <div key={token.id} className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-xs font-bold text-zinc-950 shadow-sm">
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
          {campaignId && <SceneImportDialog buttonLabel="Import Scenes" onImport={handleSceneImport} />}
          {selectedType === 'campaign' && (
            <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Module</Button></DialogTrigger>
              <DialogContent>
                <DialogTitle>New Module</DialogTitle>
                <div className="mt-4 flex flex-col gap-4">
                  <Input placeholder="Module name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addModule}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {selectedType === 'module' && (
            <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Session</Button></DialogTrigger>
              <DialogContent>
                <DialogTitle>New Session</DialogTitle>
                <div className="mt-4 flex flex-col gap-4">
                  <Input placeholder="Session name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addSession}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {selectedType === 'session' && (
            <Dialog open={addSceneOpen} onOpenChange={setAddSceneOpen}>
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Scene</Button></DialogTrigger>
              <DialogContent>
                <DialogTitle>New Scene</DialogTitle>
                <div className="mt-4 flex flex-col gap-4">
                  <Input placeholder="Scene title" value={newName} onChange={(e) => setNewName(e.target.value)} />
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
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addScene}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {selectedType === 'campaign' && (
            <Button size="sm" variant="outline" onClick={handleInvite}>Invite Players</Button>
          )}
          {selectedSession && (!selectedSession.status || selectedSession.status === 'draft') && (
            <Button size="sm" variant="default" onClick={handleGoLive}>Go Live</Button>
          )}
          {selectedSession && selectedSession.status === 'active' && (
            <Button size="sm" variant="secondary" onClick={handleRejoin}>Rejoin</Button>
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
              if (!selectedScene) return <div className="p-8 text-zinc-500">Scene not found</div>;
              return (
                <SceneWorkspace
                  scene={{
                    ...selectedScene,
                    type: selectedScene.type as 'battle' | 'story' | 'montage' | 'negotiation' | 'respite',
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
                    if (mod) { setSelectedId(id); setSelectedType('module'); }
                    const sess = sessions.find((s) => s.id === id);
                    if (sess) { setSelectedId(id); setSelectedType('session'); }
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
            <p className="text-sm text-zinc-400">Share this link with your players:</p>
            <div className="flex gap-2">
              <Input readOnly value={inviteLink ?? ''} className="font-mono text-xs" />
              <Button
                size="sm"
                onClick={() => { if (inviteLink) navigator.clipboard.writeText(inviteLink); }}
              >
                Copy
              </Button>
            </div>
            <div className="flex justify-end">
              <DialogClose asChild><Button variant="ghost">Close</Button></DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
