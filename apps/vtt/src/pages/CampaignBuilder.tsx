import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose, Input, Textarea, Collapsible, CollapsibleContent, CollapsibleTrigger, Tooltip, TooltipContent, TooltipTrigger, SceneTypeIcon, cn } from '@anvil/ui';
import { ChevronDown, Minimize2, PanelLeftClose, PanelLeftOpen, Swords } from 'lucide-react';
import { FORGESTEEL_MONSTERS, LORD_RELG_STATBLOCK, isMinion, isMonsterStatblock, loadMonsters } from '@anvil/data';
import type { CompendiumItemBase, CompendiumMonster, MonsterFeature } from '@anvil/data';
import type { MotivationType, NegotiationSceneTemplate, NegotiationMotivation, NegotiationPitfall, NPCAttitude, SceneImportDocument, SceneType } from '@anvil/types';
import { api } from '../lib/api.js';
import { generateRoomCode } from '../lib/room-code.js';
import { TreeSidebar } from '../components/builder/TreeSidebar.js';
import { CardGrid } from '../components/builder/CardGrid.js';
import { SceneWorkspace } from '../components/builder/SceneWorkspace.js';
import { SceneImportDialog } from '../components/import/SceneImportDialog.js';

interface Module { id: string; name: string; description: string; order_index: number; }
interface Session { id: string; name: string; description: string; module_id: string | null; order_index: number; status?: string; }
interface Scene { id: string; title: string; type: string; data: string; order_index: number; game_session_id: string; }

type BattleDifficulty = 'easy' | 'standard' | 'hard' | 'extreme';

interface BattleTokenSummary {
  id: string;
  name: string;
  type: 'monster' | 'hero' | 'npc' | string;
  monsterName?: string;
  x?: number;
  y?: number;
  color?: number;
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

interface BattleSceneDraft {
  mapUrl: string;
  gridCols: number;
  gridRows: number;
  difficulty: BattleDifficulty;
  creatureGroups: string;
  notes: string;
}

interface StorySceneDraft {
  readAloud: string;
  notes: string;
  assetUrl: string;
}

interface MontageSceneDraft {
  goal: string;
  roundLimit: number;
  successesNeeded: number;
  failureLimit: number;
  challenges: string;
  notes: string;
}

type NegotiationTraitRole = 'motivation' | 'pitfall';

interface NegotiationTraitSelection {
  id: string;
  type: MotivationType | '';
  note: string;
}

interface NegotiationSceneDraft {
  npcName: string;
  npcDescription: string;
  startingAttitude: NPCAttitude;
  startingInterest: number;
  startingPatience: number;
  impression: number;
  motivations: NegotiationTraitSelection[];
  pitfalls: NegotiationTraitSelection[];
  notes: string;
}

interface RespiteSceneDraft {
  location: string;
  duration: string;
  availableActivities: string[];
  projects: string;
  notes: string;
}

interface SceneCreationDrafts {
  battle: BattleSceneDraft;
  story: StorySceneDraft;
  montage: MontageSceneDraft;
  negotiation: NegotiationSceneDraft;
  respite: RespiteSceneDraft;
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

const BUILDER_SIDEBAR_DEFAULT_WIDTH = 256;
const BUILDER_SIDEBAR_MIN_WIDTH = 220;

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

const SCENE_TYPE_OPTIONS: Array<{ value: SceneType; label: string; summary: string }> = [
  { value: 'story', label: 'Story', summary: 'Read-aloud text, notes, and backdrop' },
  { value: 'battle', label: 'Battle', summary: 'Map, grid, monsters, and tactics' },
  { value: 'montage', label: 'Montage', summary: 'Goal, limits, and challenge list' },
  { value: 'negotiation', label: 'Negotiation', summary: 'NPC, attitude, motives, and pitfalls' },
  { value: 'respite', label: 'Respite', summary: 'Location, activities, and projects' },
];

const RESPITE_ACTIVITY_OPTIONS = [
  { id: 'recover', label: 'Recover' },
  { id: 'craft', label: 'Craft' },
  { id: 'research', label: 'Research' },
  { id: 'socialize', label: 'Socialize' },
  { id: 'change_kit', label: 'Change Kit' },
  { id: 'project', label: 'Project' },
  { id: 'train', label: 'Train' },
  { id: 'negotiate', label: 'Negotiate' },
];

const NEGOTIATION_TRAITS: Array<{
  value: MotivationType;
  label: string;
  motivation: string;
  pitfall: string;
}> = [
  {
    value: 'benevolence',
    label: 'Benevolence',
    motivation: 'Believes in sharing what they have with others, though resources or loyalties can limit them.',
    pitfall: 'Thinks helping others just because it is right is foolish.',
  },
  {
    value: 'discovery',
    label: 'Discovery',
    motivation: 'Wants new lore, forgotten places, hidden truths, or artifacts.',
    pitfall: 'Has no interest in new ideas and might fear the unknown.',
  },
  {
    value: 'freedom',
    label: 'Freedom',
    motivation: 'Wants no authority above them and no authority over others.',
    pitfall: 'Believes a world without authority is chaotic and dangerous.',
  },
  {
    value: 'greed',
    label: 'Greed',
    motivation: 'Desires wealth and resources above all else.',
    pitfall: 'Holds ideals above material desires and is offended by attempts to buy their partnership.',
  },
  {
    value: 'higher_authority',
    label: 'Higher Authority',
    motivation: 'Is staunchly loyal to an organization, deity, monarch, or personal hero.',
    pitfall: 'Scoffs at serving another and refuses to answer to anyone.',
  },
  {
    value: 'justice',
    label: 'Justice',
    motivation: 'Wants the righteous rewarded and the wicked punished according to their own moral compass.',
    pitfall: 'Views justice as a naive illusion in a world of eternal conflict.',
  },
  {
    value: 'legacy',
    label: 'Legacy',
    motivation: 'Wants fame in life and acclaim that outlasts death.',
    pitfall: 'Believes trying to leave a personal mark on the world is vain and wasteful.',
  },
  {
    value: 'peace',
    label: 'Peace',
    motivation: 'Wants calm and to be left alone to run their business or realm.',
    pitfall: 'Hates boredom and craves excitement, drama, and danger.',
  },
  {
    value: 'power',
    label: 'Power',
    motivation: 'Covets authority and wants more influence through conquest, command, or artifacts.',
    pitfall: 'Rejects authority and hates the thought of ruling over other people.',
  },
  {
    value: 'protection',
    label: 'Protection',
    motivation: 'Has land, people, or items they want to keep safe above all else.',
    pitfall: 'Believes everyone should fend for themselves and rejects risking life for others.',
  },
  {
    value: 'revelry',
    label: 'Revelry',
    motivation: 'Wants fun, social connection, and indulgent pleasures.',
    pitfall: 'Views socializing and debauchery as a waste, finding value in work or character.',
  },
  {
    value: 'vengeance',
    label: 'Vengeance',
    motivation: 'Wants to harm those who hurt them, through death, failure, or embarrassment.',
    pitfall: 'Believes revenge solves nothing and disapproves of those who seek it.',
  },
];

function createEmptyNegotiationTrait(): NegotiationTraitSelection {
  return {
    id: generateDraftId('negotiation-trait'),
    type: '',
    note: '',
  };
}

function createInitialSceneDrafts(): SceneCreationDrafts {
  return {
    battle: {
      mapUrl: '',
      gridCols: 30,
      gridRows: 20,
      difficulty: 'standard',
      creatureGroups: '',
      notes: '',
    },
    story: {
      readAloud: '',
      notes: '',
      assetUrl: '',
    },
    montage: {
      goal: '',
      roundLimit: 2,
      successesNeeded: 5,
      failureLimit: 5,
      challenges: '',
      notes: '',
    },
    negotiation: {
      npcName: '',
      npcDescription: '',
      startingAttitude: 'neutral',
      startingInterest: 2,
      startingPatience: 4,
      impression: 5,
      motivations: [createEmptyNegotiationTrait(), createEmptyNegotiationTrait()],
      pitfalls: [createEmptyNegotiationTrait()],
      notes: '',
    },
    respite: {
      location: '',
      duration: '',
      availableActivities: ['recover', 'craft', 'research', 'socialize'],
      projects: '',
      notes: '',
    },
  };
}

function generateDraftId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function splitDraftLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function clampWholeNumber(value: number, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function parseCreatureGroup(line: string): { name: string; count: number } {
  const countMatch = line.match(/^(.*?)\s*(?:x|×)\s*(\d+)$/i);
  if (!countMatch) return { name: line.trim(), count: 1 };
  const name = countMatch[1]?.trim() ?? '';
  const count = clampWholeNumber(Number(countMatch[2]), 1, 1, 24);
  return { name: name || line.trim(), count };
}

function createBattleTokens(draft: BattleSceneDraft, monsterByName: Map<string, CompendiumMonster>): BattleTokenSummary[] {
  const tokens: BattleTokenSummary[] = [];
  const groupLines = splitDraftLines(draft.creatureGroups);
  const placementWidth = Math.max(1, Math.min(8, draft.gridCols - 2));

  for (const line of groupLines) {
    const group = parseCreatureGroup(line);
    const monster = monsterByName.get(group.name.toLowerCase()) ?? null;
    const tokenBaseName = monster?.name ?? group.name;
    const maxStamina = parseNumber(monster?.stamina);
    const size = Math.max(1, parseNumber(monster?.size) || 1);
    const squadId = group.count > 1 ? generateDraftId('squad') : undefined;

    for (let index = 0; index < group.count; index += 1) {
      const tokenIndex = tokens.length;
      const tokenName = group.count > 1 ? `${tokenBaseName} ${index + 1}` : tokenBaseName;
      tokens.push({
        id: generateDraftId('monster'),
        name: tokenName,
        type: 'monster',
        monsterName: tokenBaseName,
        x: 2 + (tokenIndex % placementWidth) * 2,
        y: 2 + Math.floor(tokenIndex / placementWidth) * 2,
        size,
        color: 0xef4444,
        level: monster?.level,
        roles: monster?.roles,
        squadId,
        squadSize: group.count > 1 ? group.count : undefined,
        ev: monster?.ev,
        speed: monster?.speed,
        freeStrike: monster?.free_strike,
        stability: monster?.stability,
        ancestry: monster?.ancestry,
        immunities: monster?.immunities,
        weaknesses: monster?.weaknesses,
        movement: monster?.movement,
        maxStamina: maxStamina || undefined,
        currentStamina: maxStamina || undefined,
        characteristics: {
          might: monster?.might ?? 0,
          agility: monster?.agility ?? 0,
          reason: monster?.reason ?? 0,
          intuition: monster?.intuition ?? 0,
          presence: monster?.presence ?? 0,
        },
        features: monster?.features,
      });
    }
  }

  return tokens;
}

function isSelectedNegotiationTrait(selection: NegotiationTraitSelection): selection is NegotiationTraitSelection & { type: MotivationType } {
  return selection.type !== '';
}

function negotiationTraitText(type: MotivationType, role: NegotiationTraitRole): string {
  const trait = NEGOTIATION_TRAITS.find((item) => item.value === type);
  if (!trait) return '';
  return role === 'motivation' ? trait.motivation : trait.pitfall;
}

function createNegotiationMotivations(selections: NegotiationTraitSelection[]): NegotiationMotivation[] {
  return selections.filter(isSelectedNegotiationTrait).map((selection) => ({
    id: selection.id,
    type: selection.type,
    description: selection.note.trim() || negotiationTraitText(selection.type, 'motivation'),
    revealed: false,
  }));
}

function createNegotiationPitfalls(selections: NegotiationTraitSelection[]): NegotiationPitfall[] {
  return selections.filter(isSelectedNegotiationTrait).map((selection) => ({
    id: selection.id,
    type: selection.type,
    description: selection.note.trim() || negotiationTraitText(selection.type, 'pitfall'),
    revealed: false,
  }));
}

function isNegotiationDraftReady(draft: NegotiationSceneDraft): boolean {
  return draft.motivations.filter(isSelectedNegotiationTrait).length >= 2
    && draft.pitfalls.filter(isSelectedNegotiationTrait).length >= 1;
}

function createNegotiationTemplate(draft: NegotiationSceneDraft): NegotiationSceneTemplate {
  return {
    npc: {
      name: draft.npcName.trim(),
      description: draft.npcDescription.trim(),
      portraitUrl: '',
    },
    startingAttitude: draft.startingAttitude,
    startingInterest: draft.startingInterest,
    startingPatience: draft.startingPatience,
    impression: draft.impression,
    impressionModifiers: [],
    motivations: createNegotiationMotivations(draft.motivations),
    pitfalls: createNegotiationPitfalls(draft.pitfalls),
    characteristics: { might: 0, agility: 0, reason: 0, intuition: 0, presence: 0 },
    skills: [],
    languages: [],
    responses: {
      interest0: { label: 'No, and...', text: '' },
      interest1: { label: 'No.', text: '' },
      interest2: { label: 'No, but...', text: '' },
      interest3: { label: 'Yes, but...', text: '' },
      interest4: { label: 'Yes.', text: '' },
      interest5: { label: 'Yes, and...', text: '' },
    },
  };
}

function createSceneData(
  type: SceneType,
  drafts: SceneCreationDrafts,
  monsterByName: Map<string, CompendiumMonster>,
): Record<string, unknown> {
  switch (type) {
    case 'battle': {
      const draft = drafts.battle;
      return {
        mapUrl: draft.mapUrl.trim(),
        mapAssetId: '',
        gridCols: clampWholeNumber(draft.gridCols, 30, 5, 80),
        gridRows: clampWholeNumber(draft.gridRows, 20, 5, 80),
        gridCellSize: 48,
        gridType: 'square',
        gridOpacity: 0.4,
        gridColor: '#444444',
        tokens: createBattleTokens(draft, monsterByName),
        drawings: [],
        terrain: [],
        fog: [],
        difficulty: draft.difficulty,
        creatureGroups: draft.creatureGroups,
        notes: draft.notes,
      };
    }
    case 'story': {
      const draft = drafts.story;
      return {
        readAloud: draft.readAloud,
        notes: draft.notes,
        assetUrl: draft.assetUrl.trim(),
        mapAssetId: '',
      };
    }
    case 'montage': {
      const draft = drafts.montage;
      return {
        goal: draft.goal,
        roundLimit: clampWholeNumber(draft.roundLimit, 2, 1, 12),
        heroCount: 5,
        successesNeeded: clampWholeNumber(draft.successesNeeded, 5, 1, 20),
        failureLimit: clampWholeNumber(draft.failureLimit, 5, 1, 20),
        challenges: splitDraftLines(draft.challenges).map((name, index) => ({
          id: generateDraftId('challenge'),
          name,
          description: '',
          suggestedSkills: [],
          suggestedCharacteristics: [],
          order: index,
        })),
        totalSuccess: '',
        partialSuccess: '',
        totalFailure: '',
        notes: draft.notes,
      };
    }
    case 'negotiation': {
      const draft = drafts.negotiation;
      return {
        template: createNegotiationTemplate(draft),
        notes: draft.notes,
      };
    }
    case 'respite': {
      const draft = drafts.respite;
      return {
        location: draft.location,
        duration: draft.duration,
        availableActivities: draft.availableActivities,
        projects: splitDraftLines(draft.projects).map((name) => ({
          id: generateDraftId('project'),
          name,
          goalPoints: 10,
        })),
        notes: draft.notes,
      };
    }
    default:
      return {};
  }
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

function renderFeatureEffect(feature: MonsterFeature): string {
  const effects = feature.effects ?? [];
  if (effects.length === 0) return '';
  return effects
    .map((effect) => {
      const roll = effect.roll ? String(effect.roll) : '';
      const tierText = [effect.tier1, effect.tier2, effect.tier3].filter(Boolean).join('; ');
      return compactText([effect.name, roll, effect.effect, (effect as typeof effect & { damage?: string }).damage, tierText], '');
    })
    .filter(Boolean)
    .join(' ');
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
          <div key={feature.name} className={(index === 0 ? 'border-red-700 bg-red-950/30' : 'border-blue-700 bg-blue-950/30') + ' rounded border'}>
            <div className={(index === 0 ? 'bg-red-700' : 'bg-blue-700') + ' flex items-center justify-between px-2 py-1 text-xs font-bold text-white'}>
              <span>{feature.name}</span>
              <span>{(feature as MonsterFeature & { cost?: string }).cost ?? feature.ability_type ?? ''}</span>
            </div>
            <div className="space-y-1 p-2">
              <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400">
                {feature.keywords?.map((keyword) => <span key={keyword}>{keyword}</span>)}
                {feature.usage ? <span>{feature.usage}</span> : null}
                {feature.distance ? <span>{feature.distance}</span> : null}
              </div>
              <p className="leading-relaxed">{renderFeatureEffect(feature) || 'No effect text loaded.'}</p>
            </div>
          </div>
        ))}
        {traitFeatures.slice(0, 4).map((feature) => (
          <div key={feature.name} className="rounded border border-purple-700 bg-purple-950/25">
            <div className="bg-purple-700 px-2 py-1 text-xs font-bold text-white">{feature.name}</div>
            <p className="p-2 leading-relaxed">{renderFeatureEffect(feature) || 'No effect text loaded.'}</p>
          </div>
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
          <div key={feature.name} className="rounded border border-purple-700 bg-purple-950/25">
            <div className="flex items-center justify-between bg-purple-700 px-2 py-1 font-bold text-white">
              <span>{feature.name}</span>
              <span>{(feature as MonsterFeature & { cost?: string }).cost ?? ''}</span>
            </div>
            <p className="p-2 leading-relaxed">{renderFeatureEffect(feature) || 'No effect text loaded.'}</p>
          </div>
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
  const [newSceneType, setNewSceneType] = useState<SceneType>('story');
  const [sceneDrafts, setSceneDrafts] = useState<SceneCreationDrafts>(() => createInitialSceneDrafts());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [structureOpen, setStructureOpen] = useState(true);
  const [initiativeOpen, setInitiativeOpen] = useState(true);
  const [structurePaneHeight, setStructurePaneHeight] = useState(360);
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
            .map((sc) => ({ id: sc.id, label: sc.title, type: 'scene' as const, sceneType: sc.type, sessionId: s.id })),
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
        .map((sc) => ({ id: sc.id, label: sc.title, type: 'scene' as const, sceneType: sc.type, sessionId: s.id })),
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

  const resetSceneCreationForm = useCallback(() => {
    setNewName('');
    setNewSceneType('story');
    setSceneDrafts(createInitialSceneDrafts());
  }, []);

  const handleAddSceneOpenChange = useCallback((open: boolean) => {
    setAddSceneOpen(open);
    if (open) {
      resetSceneCreationForm();
    }
  }, [resetSceneCreationForm]);

  const updateSceneDraft = useCallback(
    <T extends SceneType>(type: T, updates: Partial<SceneCreationDrafts[T]>) => {
      setSceneDrafts((current) => ({
        ...current,
        [type]: {
          ...current[type],
          ...updates,
        },
      } as SceneCreationDrafts));
    },
    [],
  );

  const updateNegotiationTrait = useCallback(
    (role: NegotiationTraitRole, id: string, updates: Partial<NegotiationTraitSelection>) => {
      const key = role === 'motivation' ? 'motivations' : 'pitfalls';
      setSceneDrafts((current) => ({
        ...current,
        negotiation: {
          ...current.negotiation,
          [key]: current.negotiation[key].map((selection) =>
            selection.id === id ? { ...selection, ...updates } : selection,
          ),
        },
      }));
    },
    [],
  );

  const addNegotiationTrait = useCallback((role: NegotiationTraitRole) => {
    const key = role === 'motivation' ? 'motivations' : 'pitfalls';
    setSceneDrafts((current) => ({
      ...current,
      negotiation: {
        ...current.negotiation,
        [key]: [...current.negotiation[key], createEmptyNegotiationTrait()],
      },
    }));
  }, []);

  const removeNegotiationTrait = useCallback((role: NegotiationTraitRole, id: string) => {
    const key = role === 'motivation' ? 'motivations' : 'pitfalls';
    const minCount = role === 'motivation' ? 2 : 1;
    setSceneDrafts((current) => {
      const currentList = current.negotiation[key];
      if (currentList.length <= minCount) return current;
      return {
        ...current,
        negotiation: {
          ...current.negotiation,
          [key]: currentList.filter((selection) => selection.id !== id),
        },
      };
    });
  }, []);

  const canCreateScene = Boolean(newName.trim())
    && (newSceneType !== 'negotiation' || isNegotiationDraftReady(sceneDrafts.negotiation));

  const addScene = async () => {
    if (!canCreateScene || !selectedId || selectedType !== 'session') return;
    const sceneData = createSceneData(newSceneType, sceneDrafts, monsterByName);
    const result = await api.post<{ id: string }>(`/api/sessions/${selectedId}/scenes`, {
      title: newName,
      type: newSceneType,
      data: JSON.stringify(sceneData),
    });
    resetSceneCreationForm();
    setAddSceneOpen(false);
    await load();
    setSelectedId(result.id);
    setSelectedType('scene');
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

  const handleDeleteScene = useCallback(async (sceneId: string) => {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene) return;
    const confirmed = window.confirm(`Delete "${scene.title}"? This removes it from the campaign structure.`);
    if (!confirmed) return;

    await api.delete(`/api/scenes/${sceneId}`);
    if (selectedId === sceneId) {
      setSelectedId(scene.game_session_id);
      setSelectedType('session');
    }
    await load();
  }, [load, scenes, selectedId]);

  const handleMoveScene = useCallback(async (sceneId: string, targetSessionId: string) => {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene || scene.game_session_id === targetSessionId) return;

    await api.put(`/api/scenes/${sceneId}`, { game_session_id: targetSessionId });
    await load();
  }, [load, scenes]);

  const handleSidebarResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = structurePaneHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const sidebar = sidebarRef.current;
      const maxHeight = sidebar ? Math.max(220, sidebar.getBoundingClientRect().height - 220) : 640;
      const nextHeight = startHeight + moveEvent.clientY - startY;
      setStructurePaneHeight(Math.min(maxHeight, Math.max(160, nextHeight)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [structurePaneHeight]);

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

  const renderNegotiationTraitRows = (role: NegotiationTraitRole, selections: NegotiationTraitSelection[]) => {
    const title = role === 'motivation' ? 'Motivations' : 'Pitfalls';
    const minimum = role === 'motivation' ? 'Choose at least two traits the NPC responds well to.' : 'Choose at least one trait that sparks ire, shame, or fear.';
    const addLabel = role === 'motivation' ? 'Add motivation' : 'Add pitfall';
    const minCount = role === 'motivation' ? 2 : 1;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-300">{title}</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{minimum}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addNegotiationTrait(role)}
            disabled={selections.length >= 4}
          >
            {addLabel}
          </Button>
        </div>
        <div className="space-y-2">
          {selections.map((selection, index) => {
            const trait = selection.type
              ? NEGOTIATION_TRAITS.find((item) => item.value === selection.type) ?? null
              : null;
            const ruleText = trait ? (role === 'motivation' ? trait.motivation : trait.pitfall) : '';
            return (
              <div key={selection.id} className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs font-semibold text-zinc-500">{index + 1}</span>
                  <select
                    className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                    value={selection.type}
                    onChange={(event) => updateNegotiationTrait(role, selection.id, { type: event.target.value as MotivationType | '' })}
                  >
                    <option value="">Select trait</option>
                    {NEGOTIATION_TRAITS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-zinc-500 hover:text-red-300"
                    onClick={() => removeNegotiationTrait(role, selection.id)}
                    disabled={selections.length <= minCount}
                  >
                    Remove
                  </Button>
                </div>
                {ruleText ? (
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{ruleText}</p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-zinc-600">Select one of the twelve Draw Steel negotiation traits.</p>
                )}
                <Textarea
                  className="mt-2 min-h-20"
                  value={selection.note}
                  onChange={(event) => updateNegotiationTrait(role, selection.id, { note: event.target.value })}
                  placeholder={role === 'motivation' ? 'NPC-specific reason this appeals to them' : 'NPC-specific phrase or action that triggers this pitfall'}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSceneCreationFields = () => {
    switch (newSceneType) {
      case 'battle': {
        const draft = sceneDrafts.battle;
        return (
          <div className="space-y-4 rounded-md border border-red-900/50 bg-red-950/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Map image URL</span>
                <Input
                  className="mt-1"
                  value={draft.mapUrl}
                  onChange={(event) => updateSceneDraft('battle', { mapUrl: event.target.value })}
                  placeholder="https://..."
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Difficulty</span>
                <select
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={draft.difficulty}
                  onChange={(event) => updateSceneDraft('battle', { difficulty: event.target.value as BattleDifficulty })}
                >
                  <option value="easy">Easy</option>
                  <option value="standard">Standard</option>
                  <option value="hard">Hard</option>
                  <option value="extreme">Extreme</option>
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Grid columns</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={5}
                  max={80}
                  value={draft.gridCols}
                  onChange={(event) => updateSceneDraft('battle', { gridCols: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Grid rows</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={5}
                  max={80}
                  value={draft.gridRows}
                  onChange={(event) => updateSceneDraft('battle', { gridRows: Number(event.target.value) })}
                />
              </label>
            </div>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Monster groups</span>
              <Textarea
                className="mt-1 min-h-24"
                value={draft.creatureGroups}
                onChange={(event) => updateSceneDraft('battle', { creatureGroups: event.target.value })}
                placeholder={'Goblin x3\nGoblin Cursespitter x1'}
              />
            </label>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Tactical notes</span>
              <Textarea
                className="mt-1"
                value={draft.notes}
                onChange={(event) => updateSceneDraft('battle', { notes: event.target.value })}
                placeholder="Encounter notes"
              />
            </label>
          </div>
        );
      }
      case 'story': {
        const draft = sceneDrafts.story;
        return (
          <div className="space-y-4 rounded-md border border-purple-900/50 bg-purple-950/10 p-4">
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Read-aloud text</span>
              <Textarea
                className="mt-1 min-h-28"
                value={draft.readAloud}
                onChange={(event) => updateSceneDraft('story', { readAloud: event.target.value })}
                placeholder="Scene text"
              />
            </label>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Background image URL</span>
              <Input
                className="mt-1"
                value={draft.assetUrl}
                onChange={(event) => updateSceneDraft('story', { assetUrl: event.target.value })}
                placeholder="https://..."
              />
            </label>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Director notes</span>
              <Textarea
                className="mt-1"
                value={draft.notes}
                onChange={(event) => updateSceneDraft('story', { notes: event.target.value })}
                placeholder="Private scene notes"
              />
            </label>
          </div>
        );
      }
      case 'montage': {
        const draft = sceneDrafts.montage;
        return (
          <div className="space-y-4 rounded-md border border-amber-900/50 bg-amber-950/10 p-4">
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Goal</span>
              <Input
                className="mt-1"
                value={draft.goal}
                onChange={(event) => updateSceneDraft('montage', { goal: event.target.value })}
                placeholder="Escape the collapsing ruins"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Rounds</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={12}
                  value={draft.roundLimit}
                  onChange={(event) => updateSceneDraft('montage', { roundLimit: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Successes</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={20}
                  value={draft.successesNeeded}
                  onChange={(event) => updateSceneDraft('montage', { successesNeeded: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Failures</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={20}
                  value={draft.failureLimit}
                  onChange={(event) => updateSceneDraft('montage', { failureLimit: Number(event.target.value) })}
                />
              </label>
            </div>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Challenges</span>
              <Textarea
                className="mt-1 min-h-24"
                value={draft.challenges}
                onChange={(event) => updateSceneDraft('montage', { challenges: event.target.value })}
                placeholder={'Navigate the flooded passage\nDisable the spinning blades'}
              />
            </label>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Director notes</span>
              <Textarea
                className="mt-1"
                value={draft.notes}
                onChange={(event) => updateSceneDraft('montage', { notes: event.target.value })}
                placeholder="Montage notes"
              />
            </label>
          </div>
        );
      }
      case 'negotiation': {
        const draft = sceneDrafts.negotiation;
        return (
          <div className="space-y-4 rounded-md border border-blue-900/50 bg-blue-950/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">NPC name</span>
                <Input
                  className="mt-1"
                  value={draft.npcName}
                  onChange={(event) => updateSceneDraft('negotiation', { npcName: event.target.value })}
                  placeholder="Magistrate Venn"
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Starting attitude</span>
                <select
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  value={draft.startingAttitude}
                  onChange={(event) => updateSceneDraft('negotiation', { startingAttitude: event.target.value as NPCAttitude })}
                >
                  <option value="hostile">Hostile</option>
                  <option value="unfriendly">Unfriendly</option>
                  <option value="neutral">Neutral</option>
                  <option value="friendly">Friendly</option>
                  <option value="helpful">Helpful</option>
                </select>
              </label>
            </div>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">NPC description</span>
              <Textarea
                className="mt-1"
                value={draft.npcDescription}
                onChange={(event) => updateSceneDraft('negotiation', { npcDescription: event.target.value })}
                placeholder="What the NPC wants and how they behave"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Interest</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  max={5}
                  value={draft.startingInterest}
                  onChange={(event) => updateSceneDraft('negotiation', { startingInterest: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Patience</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  max={5}
                  value={draft.startingPatience}
                  onChange={(event) => updateSceneDraft('negotiation', { startingPatience: Number(event.target.value) })}
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Impression</span>
                <Input
                  className="mt-1"
                  type="number"
                  min={1}
                  max={12}
                  value={draft.impression}
                  onChange={(event) => updateSceneDraft('negotiation', { impression: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-950/40 p-3 text-xs leading-5 text-zinc-500">
              Draw Steel negotiations use twelve traits as either motivations or pitfalls. Configure at least two motivations and one pitfall before creating the scene.
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {renderNegotiationTraitRows('motivation', draft.motivations)}
              {renderNegotiationTraitRows('pitfall', draft.pitfalls)}
            </div>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Director notes</span>
              <Textarea
                className="mt-1"
                value={draft.notes}
                onChange={(event) => updateSceneDraft('negotiation', { notes: event.target.value })}
                placeholder="Negotiation notes"
              />
            </label>
          </div>
        );
      }
      case 'respite': {
        const draft = sceneDrafts.respite;
        return (
          <div className="space-y-4 rounded-md border border-emerald-900/50 bg-emerald-950/10 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Location</span>
                <Input
                  className="mt-1"
                  value={draft.location}
                  onChange={(event) => updateSceneDraft('respite', { location: event.target.value })}
                  placeholder="The Old Lantern Inn"
                />
              </label>
              <label className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-300">Duration</span>
                <Input
                  className="mt-1"
                  value={draft.duration}
                  onChange={(event) => updateSceneDraft('respite', { duration: event.target.value })}
                  placeholder="One evening"
                />
              </label>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">Activities</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {RESPITE_ACTIVITY_OPTIONS.map((activity) => {
                  const checked = draft.availableActivities.includes(activity.id);
                  return (
                    <label
                      key={activity.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm',
                        checked ? 'border-emerald-700 bg-emerald-950/40 text-zinc-100' : 'border-zinc-800 bg-zinc-900 text-zinc-400',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          updateSceneDraft('respite', {
                            availableActivities: event.target.checked
                              ? [...draft.availableActivities, activity.id]
                              : draft.availableActivities.filter((id) => id !== activity.id),
                          });
                        }}
                      />
                      <span>{activity.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Projects</span>
              <Textarea
                className="mt-1"
                value={draft.projects}
                onChange={(event) => updateSceneDraft('respite', { projects: event.target.value })}
                placeholder={'Repair the broken ward\nResearch the baroness'}
              />
            </label>
            <label className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-300">Director notes</span>
              <Textarea
                className="mt-1"
                value={draft.notes}
                onChange={(event) => updateSceneDraft('respite', { notes: event.target.value })}
                placeholder="Respite notes"
              />
            </label>
          </div>
        );
      }
      default:
        return null;
    }
  };

  if (!campaign) return <div className="p-8 text-zinc-400">Loading...</div>;

  const builderSidebar = (
    <div
      ref={sidebarRef}
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50 pr-8"
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
        className="absolute right-2 top-3 z-20 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
      >
        <PanelLeftClose className="size-4" />
      </button>

      <Collapsible
        open={structureOpen}
        onOpenChange={setStructureOpen}
        className={structureOpen ? `flex min-h-0 ${showInitiativeTracker ? 'flex-none' : 'flex-1'} flex-col border-b border-zinc-800` : 'flex-none border-b border-zinc-800'}
        style={structureOpen && showInitiativeTracker ? { height: structurePaneHeight } : undefined}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-zinc-800 p-3 text-left">
          <h2 className="text-sm font-semibold text-zinc-300">Campaign Structure</h2>
          <ChevronDown className={'size-4 text-zinc-500 transition-transform ' + (structureOpen ? '' : '-rotate-90')} />
        </CollapsibleTrigger>
        <CollapsibleContent className="min-h-0 flex-1 overflow-y-auto">
          <TreeSidebar
            nodes={buildTree()}
            selectedId={selectedId}
            onSelect={(id, type) => { setSelectedId(id); setSelectedType(type); }}
            onDeleteScene={handleDeleteScene}
            onMoveScene={handleMoveScene}
          />
        </CollapsibleContent>
      </Collapsible>

      {showInitiativeTracker && (
        <>
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize campaign sections"
            title="Resize panes"
            onMouseDown={handleSidebarResizeStart}
            className="group flex h-2 flex-none cursor-ns-resize items-center bg-zinc-900 hover:bg-zinc-800"
          >
            <div className="mx-auto h-px w-14 bg-zinc-700 group-hover:bg-zinc-500" />
          </div>

          <Collapsible open={initiativeOpen} onOpenChange={setInitiativeOpen} className="flex min-h-0 flex-1 flex-col">
            <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-zinc-800 p-3 text-left">
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      tabIndex={0}
                    >
                      <Swords className="size-4 text-red-400" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-64 text-xs leading-relaxed">
                    Draw Steel uses side initiative: roll 1d10 when combat starts. On 6+, heroes choose first; otherwise villains choose first. Sides alternate until every combatant has acted, then the next round begins.
                  </TooltipContent>
                </Tooltip>
                <h2 className="text-sm font-semibold text-zinc-300">Initiative Tracker</h2>
              </div>
              <ChevronDown className={'size-4 text-zinc-500 transition-transform ' + (initiativeOpen ? '' : '-rotate-90')} />
            </CollapsibleTrigger>
            <CollapsibleContent className="min-h-0 flex-1 overflow-y-auto bg-zinc-200 p-1 text-zinc-950">
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
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
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
          className="absolute left-2 top-3 z-30 rounded-md border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100"
        >
          <PanelLeftOpen className="size-4" />
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
      <div className="min-w-0 flex-1 overflow-y-auto">
        {!focusMode && (
        <div className="flex items-center gap-2 border-b border-zinc-800 p-4">
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
            <Dialog open={addSceneOpen} onOpenChange={handleAddSceneOpenChange}>
              <DialogTrigger asChild><Button size="sm" className="bg-sidebar-director text-zinc-900 hover:bg-sidebar-director/80">Add Scene</Button></DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                <DialogTitle>New Scene</DialogTitle>
                <div className="mt-4 flex flex-col gap-5">
                  <label className="text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">Scene title</span>
                    <Input
                      className="mt-1"
                      placeholder="Scene title"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </label>
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Scene type</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-5">
                      {SCENE_TYPE_OPTIONS.map((option) => {
                        const selected = newSceneType === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setNewSceneType(option.value)}
                            className={cn(
                              'flex min-h-[92px] flex-col items-start gap-2 rounded-md border px-3 py-2 text-left transition',
                              selected
                                ? 'border-sidebar-director bg-sidebar-director/15 text-zinc-100'
                                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200',
                            )}
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              <SceneTypeIcon type={option.value} className="size-4" />
                              {option.label}
                            </span>
                            <span className="text-xs leading-4 text-zinc-500">{option.summary}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {renderSceneCreationFields()}
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={addScene} disabled={!canCreateScene}>Create Scene</Button>
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
        )}
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
