import { setup, assign } from 'xstate';
import type { SceneRef } from '../types/protocol.js';

export type SceneMode = 'story' | 'battle' | 'montage' | 'negotiation' | 'respite';

export interface SceneContext {
  scenes: SceneRef[];
  activeSceneId: string | null;
  activeSceneType: SceneMode | null;
}

export type SceneEvent =
  | { type: 'LOAD_SCENES'; scenes: SceneRef[]; activeSceneId: string | null }
  | { type: 'SWITCH_SCENE'; sceneId: string }
  | { type: 'SCENE_CHANGED'; sceneId: string }
  | { type: 'DISCONNECT' };

function resolveSceneType(scenes: SceneRef[], sceneId: string | null): SceneMode | null {
  if (!sceneId) return null;
  const scene = scenes.find((s) => s.id === sceneId);
  return (scene?.type as SceneMode) ?? null;
}

export const sceneMachine = setup({
  types: {
    context: {} as SceneContext,
    events: {} as SceneEvent,
  },
}).createMachine({
  id: 'scene',
  initial: 'idle',
  context: {
    scenes: [],
    activeSceneId: null,
    activeSceneType: null,
  },
  states: {
    idle: {
      on: {
        LOAD_SCENES: {
          target: 'active',
          actions: assign(({ event }) => ({
            scenes: event.scenes,
            activeSceneId: event.activeSceneId,
            activeSceneType: resolveSceneType(event.scenes, event.activeSceneId),
          })),
        },
      },
    },
    active: {
      on: {
        SWITCH_SCENE: {
          actions: assign(({ context, event }) => ({
            activeSceneId: event.sceneId,
            activeSceneType: resolveSceneType(context.scenes, event.sceneId),
          })),
        },
        SCENE_CHANGED: {
          actions: assign(({ context, event }) => ({
            activeSceneId: event.sceneId,
            activeSceneType: resolveSceneType(context.scenes, event.sceneId),
          })),
        },
        LOAD_SCENES: {
          actions: assign(({ event }) => ({
            scenes: event.scenes,
            activeSceneId: event.activeSceneId,
            activeSceneType: resolveSceneType(event.scenes, event.activeSceneId),
          })),
        },
        DISCONNECT: { target: 'disconnected' },
      },
    },
    disconnected: {
      on: {
        LOAD_SCENES: {
          target: 'active',
          actions: assign(({ event }) => ({
            scenes: event.scenes,
            activeSceneId: event.activeSceneId,
            activeSceneType: resolveSceneType(event.scenes, event.activeSceneId),
          })),
        },
      },
    },
  },
});
