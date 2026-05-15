/**
 * Shared scene-data parsing helpers.
 *
 * DirectorView and PlayerView both need to extract typed stage props from
 * the raw `sceneData` JSON blob. These helpers centralise that logic so
 * changes to the data schema only need to be made in one place.
 */
import type { MotivationType } from '@anvil/types';

// ---------------------------------------------------------------------------
// Montage
// ---------------------------------------------------------------------------

export interface ParsedChallenge {
  id: string;
  name: string;
  completed: boolean;
  description?: string;
  suggestedSkills?: string[];
  suggestedCharacteristics?: string[];
}

export interface MontageStageData {
  goal: string;
  roundLimit: number;
  heroCount: number;
  successLimit: number;
  failureLimit: number;
  totalSuccess: string;
  partialSuccess: string;
  totalFailure: string;
  challenges: ParsedChallenge[];
}

export function parseMontageData(sceneData: Record<string, unknown>): MontageStageData {
  let challenges: ParsedChallenge[] = [];
  const rawChallenges = sceneData['challenges'];
  if (Array.isArray(rawChallenges)) {
    challenges = rawChallenges.map((c: unknown, idx) => {
      if (typeof c === 'string') {
        return {
          id: `challenge-${idx + 1}`,
          name: c.trim() || `Challenge ${idx + 1}`,
          completed: false,
        };
      }

      const challenge = c && typeof c === 'object' ? c as Record<string, unknown> : {};
      const stringList = (value: unknown): string[] | undefined =>
        Array.isArray(value) ? value.map(String).filter(Boolean) : undefined;

      return {
        id: typeof challenge['id'] === 'string' && challenge['id'] ? challenge['id'] : `challenge-${idx + 1}`,
        name: typeof challenge['name'] === 'string' && challenge['name'] ? challenge['name'] : `Challenge ${idx + 1}`,
        completed: typeof challenge['completed'] === 'boolean' ? challenge['completed'] : false,
        description: typeof challenge['description'] === 'string' ? challenge['description'] : undefined,
        suggestedSkills: stringList(challenge['suggestedSkills']),
        suggestedCharacteristics: stringList(challenge['suggestedCharacteristics']),
      };
    });
  } else if (typeof rawChallenges === 'string' && rawChallenges.trim()) {
    challenges = rawChallenges
      .split('\n')
      .filter(Boolean)
      .map((name, idx) => ({
        id: `legacy-${idx}`,
        name: name.trim(),
        completed: false,
      }));
  }

  return {
    goal: (sceneData['goal'] as string) ?? '',
    roundLimit: (sceneData['roundLimit'] as number) ?? 2,
    heroCount: (sceneData['heroCount'] as number) ?? 5,
    successLimit: (sceneData['successesNeeded'] as number) ?? 5,
    failureLimit: (sceneData['failureLimit'] as number) ?? 3,
    totalSuccess: (sceneData['totalSuccess'] as string) ?? '',
    partialSuccess: (sceneData['partialSuccess'] as string) ?? '',
    totalFailure: (sceneData['totalFailure'] as string) ?? '',
    challenges,
  };
}

// ---------------------------------------------------------------------------
// Negotiation
// ---------------------------------------------------------------------------

export interface ParsedMotivation {
  id: string;
  type: MotivationType;
  description: string;
  revealed: boolean;
}

export interface NegotiationStageData {
  npcName: string;
  npcPortrait?: string;
  npcAttitude: string;
  interest: number;
  patience: number;
  maxPatience: number;
  phase: 'active' | 'success' | 'failure';
  motivations: ParsedMotivation[];
  pitfalls: ParsedMotivation[];
  outcomes: Record<number, string>;
}

export function parseNegotiationData(sceneData: Record<string, unknown>): NegotiationStageData {
  const template = sceneData['template'] as
    | {
        npc: { name: string; portraitUrl?: string };
        startingAttitude: string;
        startingInterest: number;
        startingPatience: number;
        motivations: { id: string; type: string; description: string; revealed?: boolean }[];
        pitfalls: { id: string; type: string; description: string; revealed?: boolean }[];
        responses?: Record<string, { label: string; text: string }>;
      }
    | undefined;

  const npcName = template?.npc.name ?? (sceneData['npcName'] as string) ?? 'NPC';
  const npcPortrait = template?.npc.portraitUrl;
  const npcAttitude = template?.startingAttitude ?? (sceneData['npcAttitude'] as string) ?? 'neutral';
  const interest = template?.startingInterest ?? (sceneData['interest'] as number) ?? 2;
  const patience = template?.startingPatience ?? (sceneData['patience'] as number) ?? 4;

  const motivations = (
    template?.motivations ??
    (sceneData['motivations'] as { id: string; type: string; description: string; revealed: boolean }[]) ??
    []
  ).map((m) => ({ ...m, type: m.type as MotivationType, revealed: m.revealed ?? false }));

  const pitfalls = (
    template?.pitfalls ??
    (sceneData['pitfalls'] as { id: string; type: string; description: string; revealed: boolean }[]) ??
    []
  ).map((p) => ({ ...p, type: p.type as MotivationType, revealed: p.revealed ?? false }));

  const outcomes: Record<number, string> = {};
  if (template?.responses) {
    outcomes[0] = template.responses['interest0']?.text ?? '';
    outcomes[1] = template.responses['interest1']?.text ?? '';
    outcomes[2] = template.responses['interest2']?.text ?? '';
    outcomes[3] = template.responses['interest3']?.text ?? '';
    outcomes[4] = template.responses['interest4']?.text ?? '';
    outcomes[5] = template.responses['interest5']?.text ?? '';
  } else {
    Object.assign(outcomes, (sceneData['outcomes'] as Record<number, string>) ?? {});
  }

  return {
    npcName,
    npcPortrait,
    npcAttitude,
    interest,
    patience,
    maxPatience: (sceneData['maxPatience'] as number) ?? 5,
    phase: (sceneData['phase'] as 'active' | 'success' | 'failure') ?? 'active',
    motivations,
    pitfalls,
    outcomes,
  };
}

// ---------------------------------------------------------------------------
// Respite
// ---------------------------------------------------------------------------

export interface ParsedProject {
  id: string;
  name: string;
  currentPoints: number;
  goalPoints: number;
}

export interface RespiteStageData {
  location: string;
  activities: { heroName: string; activityType: string; completed: boolean }[];
  projects: ParsedProject[];
}

export function parseRespiteData(sceneData: Record<string, unknown>): RespiteStageData {
  const location = (sceneData['location'] as string) ?? (sceneData['locationDescription'] as string) ?? '';

  let activities =
    (sceneData['activities'] as { heroName: string; activityType: string; completed: boolean }[]) ?? [];

  const availableActivities = sceneData['availableActivities'];
  if (activities.length === 0 && Array.isArray(availableActivities)) {
    activities = availableActivities.map((activityId) => ({
      heroName: 'Available',
      activityType: String(activityId),
      completed: false,
    }));
  }

  const rawProjects = sceneData['projects'];
  const projects: ParsedProject[] = Array.isArray(rawProjects)
    ? rawProjects.map((p: { id: string; name: string; currentPoints?: number; goalPoints: number }) => ({
        id: p.id,
        name: p.name,
        currentPoints: p.currentPoints ?? 0,
        goalPoints: p.goalPoints,
      }))
    : [];

  return { location, activities, projects };
}

// ---------------------------------------------------------------------------
// Battle
// ---------------------------------------------------------------------------

export interface DrawingEntry {
  id: string;
  type: 'freehand' | 'line' | 'rect' | 'circle';
  points: number[];
  color: string;
  width: number;
}

export interface FogEntry {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TerrainEntry {
  id: string;
  terrainId: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hidden?: boolean;
}

export interface BattleStageData {
  cols: number;
  rows: number;
  backgroundUrl: string | null;
  cellSize: number;
  gridOpacity: number;
  gridColor: string;
  gridOffsetX: number;
  gridOffsetY: number;
  drawings: DrawingEntry[];
  fogZones: FogEntry[];
  terrain: TerrainEntry[];
}

export function parseBattleData(sceneData: Record<string, unknown>): BattleStageData {
  const parseArray = <T>(key: string): T[] => {
    const raw = sceneData[key];
    return Array.isArray(raw) ? (raw as T[]) : [];
  };

  return {
    cols: (sceneData['gridCols'] as number) ?? (sceneData['gridSize'] as number) ?? 30,
    rows: (sceneData['gridRows'] as number) ?? 20,
    backgroundUrl: (sceneData['mapUrl'] as string) ?? null,
    cellSize: (sceneData['gridCellSize'] as number) ?? 48,
    gridOpacity: (sceneData['gridOpacity'] as number) ?? 0.4,
    gridColor: (sceneData['gridColor'] as string) ?? '#444444',
    gridOffsetX: (sceneData['gridOffsetX'] as number) ?? 0,
    gridOffsetY: (sceneData['gridOffsetY'] as number) ?? 0,
    drawings: parseArray<DrawingEntry>('drawings'),
    fogZones: parseArray<FogEntry>('fog'),
    terrain: parseArray<TerrainEntry>('terrain'),
  };
}
