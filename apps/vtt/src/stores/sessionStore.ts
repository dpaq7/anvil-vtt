import { create } from 'zustand';
import type { SessionState, ParticipantInfo, EntityData, CombatState, SceneRef } from '../types/protocol.js';

interface SessionStore {
  sessionState: SessionState | null;
  selectedEntityId: string | null;

  setSessionState: (state: SessionState | null) => void;
  setActiveScene: (sceneId: string) => void;
  setParticipants: (participants: ParticipantInfo[]) => void;
  addEntity: (entity: EntityData) => void;
  updateEntity: (entityId: string, changes: Record<string, unknown>) => void;
  removeEntity: (entityId: string) => void;
  moveEntity: (entityId: string, x: number, y: number) => void;
  setCombat: (combat: CombatState | null) => void;
  selectEntity: (entityId: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionState: null,
  selectedEntityId: null,

  setSessionState: (state) => set({ sessionState: state }),

  setActiveScene: (sceneId) =>
    set((s) => ({
      sessionState: s.sessionState ? { ...s.sessionState, activeSceneId: sceneId } : null,
    })),

  setParticipants: (participants) =>
    set((s) => ({
      sessionState: s.sessionState ? { ...s.sessionState, participants } : null,
    })),

  addEntity: (entity) =>
    set((s) => ({
      sessionState: s.sessionState
        ? { ...s.sessionState, entities: [...s.sessionState.entities, entity] }
        : null,
    })),

  updateEntity: (entityId, changes) =>
    set((s) => ({
      sessionState: s.sessionState
        ? {
            ...s.sessionState,
            entities: s.sessionState.entities.map((e) =>
              e.id === entityId ? { ...e, ...changes } : e,
            ),
          }
        : null,
    })),

  removeEntity: (entityId) =>
    set((s) => ({
      sessionState: s.sessionState
        ? { ...s.sessionState, entities: s.sessionState.entities.filter((e) => e.id !== entityId) }
        : null,
    })),

  moveEntity: (entityId, x, y) =>
    set((s) => ({
      sessionState: s.sessionState
        ? {
            ...s.sessionState,
            entities: s.sessionState.entities.map((e) =>
              e.id === entityId ? { ...e, x, y } : e,
            ),
          }
        : null,
    })),

  setCombat: (combat) =>
    set((s) => ({
      sessionState: s.sessionState ? { ...s.sessionState, combat } : null,
    })),

  selectEntity: (entityId) => set({ selectedEntityId: entityId }),

  reset: () => set({ sessionState: null, selectedEntityId: null }),
}));
