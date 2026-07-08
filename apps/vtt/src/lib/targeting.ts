import type { TokenActionKind } from '../types/protocol.js';

/** Kinds of action that resolve against a target the actor picks on the canvas. */
export type TargetedActionKind = Extract<
  TokenActionKind,
  'ability' | 'grab' | 'knockback' | 'charge' | 'free-strike'
>;

/**
 * A targeted action awaiting an on-canvas target pick. Owned by the session
 * view (Player/Director), which resolves range/flanking from `sourceId` +
 * `distance` and, on confirm, sends the matching `token_action`.
 */
export interface PendingTargetedAction {
  sourceId: string;
  kind: TargetedActionKind;
  /** Present only for `kind: 'ability'` — the hero ability / monster feature id. */
  abilityId?: string;
  /** Human label for the targeting banner (e.g. "Fireball", "Grab"). */
  label: string;
  /** Distance string for range resolution (e.g. "Melee 1", "Ranged 5"). */
  distance: string;
}
