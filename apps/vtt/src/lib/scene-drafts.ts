import {
  FORGESTEEL_MONSTERS,
  LORD_RELG_STATBLOCK,
  isMonsterStatblock,
} from '@anvil/data';
import type {
  CompendiumItemBase,
  CompendiumMonster,
  MonsterFeature,
} from '@anvil/data';
import type {
  MotivationType,
  NegotiationMotivation,
  NegotiationPitfall,
  NegotiationSceneTemplate,
  NPCAttitude,
  SceneType,
} from '@anvil/types';

export type BattleDifficulty = 'easy' | 'standard' | 'hard' | 'extreme';

export interface BattleTokenSummary {
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

export interface BattleSceneDraft {
  mapUrl: string;
  gridCols: number;
  gridRows: number;
  difficulty: BattleDifficulty;
  creatureGroups: string;
  notes: string;
}

export interface StorySceneDraft {
  readAloud: string;
  notes: string;
  assetUrl: string;
}

export interface MontageSceneDraft {
  goal: string;
  roundLimit: number;
  successesNeeded: number;
  failureLimit: number;
  challenges: string;
  notes: string;
}

export type NegotiationTraitRole = 'motivation' | 'pitfall';

export interface NegotiationTraitSelection {
  id: string;
  type: MotivationType | '';
  note: string;
}

export interface NegotiationSceneDraft {
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

export interface RespiteSceneDraft {
  location: string;
  duration: string;
  availableActivities: string[];
  projects: string;
  notes: string;
}

export interface SceneCreationDrafts {
  battle: BattleSceneDraft;
  story: StorySceneDraft;
  montage: MontageSceneDraft;
  negotiation: NegotiationSceneDraft;
  respite: RespiteSceneDraft;
}

export const SCENE_TYPE_OPTIONS: Array<{ value: SceneType; label: string; summary: string }> = [
  { value: 'story', label: 'Story', summary: 'Read-aloud text, notes, and backdrop' },
  { value: 'battle', label: 'Battle', summary: 'Map, grid, monsters, and tactics' },
  { value: 'montage', label: 'Montage', summary: 'Goal, limits, and challenge list' },
  { value: 'negotiation', label: 'Negotiation', summary: 'NPC, attitude, motives, and pitfalls' },
  { value: 'respite', label: 'Respite', summary: 'Location, activities, and projects' },
];

export const RESPITE_ACTIVITY_OPTIONS = [
  { id: 'recover', label: 'Recover' },
  { id: 'craft', label: 'Craft' },
  { id: 'research', label: 'Research' },
  { id: 'socialize', label: 'Socialize' },
  { id: 'change_kit', label: 'Change Kit' },
  { id: 'project', label: 'Project' },
  { id: 'train', label: 'Train' },
  { id: 'negotiate', label: 'Negotiate' },
];

export const NEGOTIATION_TRAITS: Array<{
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

export function generateDraftId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.match(/-?\d+/)?.[0] ?? '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function createEmptyNegotiationTrait(): NegotiationTraitSelection {
  return {
    id: generateDraftId('negotiation-trait'),
    type: '',
    note: '',
  };
}

export function createInitialSceneDrafts(): SceneCreationDrafts {
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

/** Collapses compendium items + built-in statblocks into a lowercase name lookup. */
export function buildMonsterLookup(items: CompendiumItemBase[]): Map<string, CompendiumMonster> {
  const byName = new Map<string, CompendiumMonster>();
  for (const monster of [
    ...items.filter(isMonsterStatblock),
    ...FORGESTEEL_MONSTERS,
    LORD_RELG_STATBLOCK,
  ]) {
    byName.set(monster.name.toLowerCase(), monster);
  }
  return byName;
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

export function isSelectedNegotiationTrait(selection: NegotiationTraitSelection): selection is NegotiationTraitSelection & { type: MotivationType } {
  return selection.type !== '';
}

export function negotiationTraitText(type: MotivationType, role: NegotiationTraitRole): string {
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

export function isNegotiationDraftReady(draft: NegotiationSceneDraft): boolean {
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

export function createSceneData(
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
