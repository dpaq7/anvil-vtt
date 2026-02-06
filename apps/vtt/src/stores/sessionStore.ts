import { create } from 'zustand';
import type { SessionState, ParticipantInfo, EntityData, CombatState, SceneRef } from '../types/protocol.js';
import type { MotivationType } from '@anvil/types';

// ---------------------------------------------------------------------------
// Negotiation Runtime State
// ---------------------------------------------------------------------------

export interface NegotiationMotivationState {
  id: string;
  type: MotivationType;
  description: string;
  revealed: boolean;
}

export interface NegotiationPitfallState {
  id: string;
  type: MotivationType;
  description: string;
  revealed: boolean;
}

export interface NegotiationRuntimeState {
  npcName: string;
  npcPortrait?: string;
  npcAttitude: string;
  interest: number;
  patience: number;
  maxPatience: number;
  motivations: NegotiationMotivationState[];
  pitfalls: NegotiationPitfallState[];
  outcomes: Record<number, string>;
  phase: 'active' | 'success' | 'failure';
}

// ---------------------------------------------------------------------------
// Session Store
// ---------------------------------------------------------------------------

interface SessionStore {
  sessionState: SessionState | null;
  selectedEntityId: string | null;

  // Negotiation runtime state
  negotiation: NegotiationRuntimeState | null;

  setSessionState: (state: SessionState | null) => void;
  setActiveScene: (sceneId: string) => void;
  setParticipants: (participants: ParticipantInfo[]) => void;
  addEntity: (entity: EntityData) => void;
  updateEntity: (entityId: string, changes: Record<string, unknown>) => void;
  removeEntity: (entityId: string) => void;
  moveEntity: (entityId: string, x: number, y: number) => void;
  setCombat: (combat: CombatState | null) => void;
  selectEntity: (entityId: string | null) => void;

  // Negotiation actions
  setNegotiation: (state: NegotiationRuntimeState | null) => void;
  updateNegotiationInterest: (delta: number) => void;
  updateNegotiationPatience: (delta: number) => void;
  revealMotivation: (id: string) => void;
  revealPitfall: (id: string) => void;
  endNegotiation: () => void;

  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionState: null,
  selectedEntityId: null,
  negotiation: null,

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

  // ---------------------------------------------------------------------------
  // Negotiation Actions
  // ---------------------------------------------------------------------------

  setNegotiation: (state) => set({ negotiation: state }),

  updateNegotiationInterest: (delta) =>
    set((s) => {
      if (!s.negotiation || s.negotiation.phase !== 'active') return s;

      const newInterest = Math.max(0, Math.min(5, s.negotiation.interest + delta));
      const newPhase: 'active' | 'success' | 'failure' = newInterest >= 5 ? 'success' : 'active';

      return {
        negotiation: {
          ...s.negotiation,
          interest: newInterest,
          phase: newPhase,
        },
      };
    }),

  updateNegotiationPatience: (delta) =>
    set((s) => {
      if (!s.negotiation || s.negotiation.phase !== 'active') return s;

      const newPatience = Math.max(0, Math.min(s.negotiation.maxPatience, s.negotiation.patience + delta));
      // Patience 0: Success if interest >= 3, else failure
      const newPhase: 'active' | 'success' | 'failure' =
        newPatience <= 0
          ? s.negotiation.interest >= 3
            ? 'success'
            : 'failure'
          : 'active';

      return {
        negotiation: {
          ...s.negotiation,
          patience: newPatience,
          phase: newPhase,
        },
      };
    }),

  revealMotivation: (id) =>
    set((s) => {
      if (!s.negotiation) return s;

      return {
        negotiation: {
          ...s.negotiation,
          motivations: s.negotiation.motivations.map((m) =>
            m.id === id ? { ...m, revealed: true } : m
          ),
        },
      };
    }),

  revealPitfall: (id) =>
    set((s) => {
      if (!s.negotiation) return s;

      return {
        negotiation: {
          ...s.negotiation,
          pitfalls: s.negotiation.pitfalls.map((p) =>
            p.id === id ? { ...p, revealed: true } : p
          ),
        },
      };
    }),

  endNegotiation: () =>
    set((s) => {
      if (!s.negotiation || s.negotiation.phase !== 'active') return s;

      // End negotiation based on current interest
      const newPhase = s.negotiation.interest >= 3 ? 'success' : 'failure';

      return {
        negotiation: {
          ...s.negotiation,
          phase: newPhase,
        },
      };
    }),

  reset: () => set({ sessionState: null, selectedEntityId: null, negotiation: null }),
}));
