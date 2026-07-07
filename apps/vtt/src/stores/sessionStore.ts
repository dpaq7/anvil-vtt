import { create } from 'zustand';
import type {
  AbilityResult,
  ServerMessage,
  SessionState,
} from '../types/protocol.js';

export interface SessionRuntimeState {
  sessionState: SessionState | null;
  combatLog: AbilityResult[];
  sessionStarted: boolean;
}

interface SessionRuntimeStore extends SessionRuntimeState {
  applyServerMessage: (message: ServerMessage) => void;
  resetSessionRuntime: () => void;
}

export const initialSessionRuntimeState: SessionRuntimeState = {
  sessionState: null,
  combatLog: [],
  sessionStarted: false,
};

function createInitialSessionRuntimeState(): SessionRuntimeState {
  return {
    sessionState: null,
    combatLog: [],
    sessionStarted: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function updateSessionState(
  current: SessionRuntimeState,
  update: (state: SessionState) => SessionState,
): SessionRuntimeState {
  if (!current.sessionState) return current;
  return { ...current, sessionState: update(current.sessionState) };
}

function updateActiveSceneData(
  state: SessionState,
  update: (data: Record<string, unknown>) => Record<string, unknown>,
): SessionState {
  return {
    ...state,
    scenes: state.scenes.map((scene) => {
      if (scene.id !== state.activeSceneId) return scene;
      return { ...scene, data: update(scene.data ?? {}) };
    }),
  };
}

function appendActiveSceneArrayItem<T>(
  state: SessionState,
  key: string,
  item: T,
  shouldAppend: (items: unknown[]) => boolean = () => true,
): SessionState {
  return updateActiveSceneData(state, (data) => {
    const current = Array.isArray(data[key]) ? [...data[key]] : [];
    if (shouldAppend(current)) current.push(item);
    return { ...data, [key]: current };
  });
}

function removeActiveSceneArrayItem(
  state: SessionState,
  key: string,
  idKey: string,
  id: string,
): SessionState {
  return updateActiveSceneData(state, (data) => {
    const current = Array.isArray(data[key]) ? data[key] : [];
    return {
      ...data,
      [key]: current.filter((entry) => !isRecord(entry) || entry[idKey] !== id),
    };
  });
}

function upsertActiveSceneArrayItem<T>(
  state: SessionState,
  key: string,
  idKey: string,
  id: string,
  item: T,
): SessionState {
  return updateActiveSceneData(state, (data) => {
    const current = Array.isArray(data[key]) ? data[key] : [];
    let replaced = false;
    const next: unknown[] = current.map((entry) => {
      if (isRecord(entry) && entry[idKey] === id) {
        replaced = true;
        return item;
      }
      return entry;
    });
    if (!replaced) next.push(item);
    return { ...data, [key]: next };
  });
}

export function applyServerMessageToRuntime(
  current: SessionRuntimeState,
  message: ServerMessage,
): SessionRuntimeState {
  switch (message.type) {
    case 'state':
      return {
        ...current,
        sessionState: {
          ...message.state,
          actionLog: message.state.actionLog ?? [],
        },
      };

    case 'scene_changed':
      return updateSessionState(current, (state) => ({
        ...state,
        activeSceneId: message.sceneId,
      }));

    case 'entity_created':
      return updateSessionState(current, (state) => {
        if (state.entities.some((entity) => entity.id === message.entity.id)) return state;
        return { ...state, entities: [...state.entities, message.entity] };
      });

    case 'entity_updated':
      return updateSessionState(current, (state) => ({
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === message.entityId ? { ...entity, ...message.changes } : entity,
        ),
      }));

    case 'entity_deleted':
      return updateSessionState(current, (state) => ({
        ...state,
        entities: state.entities.filter((entity) => entity.id !== message.entityId),
      }));

    case 'entity_moved':
      return updateSessionState(current, (state) => ({
        ...state,
        entities: state.entities.map((entity) =>
          entity.id === message.entityId
            ? { ...entity, x: message.x, y: message.y }
            : entity,
        ),
      }));

    case 'combat_updated':
      return updateSessionState(current, (state) => ({
        ...state,
        combat: message.combat,
      }));

    case 'ability_resolved': {
      const isDupe = current.combatLog.some(
        (entry) =>
          entry.timestamp === message.result.timestamp &&
          entry.sourceId === message.result.sourceId &&
          entry.abilityId === message.result.abilityId,
      );
      return isDupe
        ? current
        : { ...current, combatLog: [...current.combatLog, message.result] };
    }

    case 'action_logged':
      return updateSessionState(current, (state) => {
        const actionLog = state.actionLog ?? [];
        if (actionLog.some((entry) => entry.id === message.entry.id)) return state;
        return { ...state, actionLog: [...actionLog, message.entry].slice(-200) };
      });

    case 'participant_update':
      return updateSessionState(current, (state) => ({
        ...state,
        participants: message.participants,
      }));

    case 'session_started':
      return { ...current, sessionStarted: true };

    case 'session_ended':
      return { ...current, sessionState: null };

    case 'scene_drawing_added':
      return updateSessionState(current, (state) =>
        appendActiveSceneArrayItem(state, 'drawings', message.drawing),
      );

    case 'scene_drawing_removed':
      return updateSessionState(current, (state) =>
        removeActiveSceneArrayItem(state, 'drawings', 'id', message.drawingId),
      );

    case 'scene_fog_added':
      return updateSessionState(current, (state) =>
        appendActiveSceneArrayItem(state, 'fog', message.fog),
      );

    case 'scene_fog_removed':
      return updateSessionState(current, (state) =>
        removeActiveSceneArrayItem(state, 'fog', 'id', message.fogId),
      );

    case 'scene_terrain_added':
      return updateSessionState(current, (state) =>
        appendActiveSceneArrayItem(
          state,
          'terrain',
          message.terrain,
          (items) =>
            !items.some((entry) => isRecord(entry) && entry['id'] === message.terrain.id),
        ),
      );

    case 'scene_terrain_updated':
      return updateSessionState(current, (state) =>
        upsertActiveSceneArrayItem(state, 'terrain', 'id', message.terrain.id, message.terrain),
      );

    case 'scene_terrain_removed':
      return updateSessionState(current, (state) =>
        removeActiveSceneArrayItem(state, 'terrain', 'id', message.terrainId),
      );

    case 'negotiation_updated':
      return updateSessionState(current, (state) => ({
        ...state,
        negotiation: {
          interest: message.interest,
          patience: message.patience,
          maxPatience: message.maxPatience,
          phase: message.phase,
          motivations: message.motivations,
          pitfalls: message.pitfalls,
          argumentLog: message.argumentLog,
        },
      }));

    case 'montage_updated':
      return updateSessionState(current, (state) => ({
        ...state,
        montage: {
          successes: message.successes,
          failures: message.failures,
          successLimit: message.successLimit,
          failureLimit: message.failureLimit,
          testLog: message.testLog,
          outcome: message.outcome,
        },
      }));

    case 'respite_updated':
      return updateSessionState(current, (state) => ({
        ...state,
        respite: {
          activities: message.activities,
          completedBy: message.completedBy,
        },
      }));

    case 'audio_command':
      return updateSessionState(current, (state) => {
        if (message.action === 'stop') return { ...state, audio: null };
        return {
          ...state,
          audio: {
            playing: message.action === 'play',
            audioUrl: message.audioUrl ?? state.audio?.audioUrl ?? null,
            assetName: message.assetName ?? state.audio?.assetName ?? null,
            loop: message.loop ?? state.audio?.loop ?? false,
          },
        };
      });

    case 'story_updated':
      return updateSessionState(current, (state) =>
        updateActiveSceneData(state, (data) => ({
          ...data,
          readAloud: message.readAloudText,
        })),
      );

    case 'scene_reverted':
    case 'draw_steel_roll_resolved':
    case 'token_action_resolved':
    case 'phone_anchor_status':
    // Advisory movement messages — the position change arrives via entity_moved;
    // these carry cost/OA/slam info consumed by UI listeners, not the store.
    case 'move_committed':
    case 'forced_movement_resolved':
    case 'error':
    case 'pong':
      return current;
  }
}

export const useSessionStore = create<SessionRuntimeStore>((set) => ({
  ...createInitialSessionRuntimeState(),

  applyServerMessage: (message) =>
    set((current) => applyServerMessageToRuntime(current, message)),

  resetSessionRuntime: () => set(createInitialSessionRuntimeState()),
}));
