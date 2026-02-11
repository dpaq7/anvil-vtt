/**
 * Lightweight hero summary for list/card views.
 *
 * Derived stats (staminaMax, recoveriesMax, recoveryValue) are computed
 * server-side via HeroLogic from heroClass + level + kit. Runtime state
 * (staminaCurrent, recoveriesCurrent) comes from the data blob and will
 * be null until the DB schema is extended with dedicated columns.
 */

/** Lightweight hero for list/card views. Derived stats computed server-side. */
export interface HeroSummary {
  id: string;
  name: string;
  level: number;
  heroClass: string | null;
  subclass: string | null;
  portraitUrl: string | null;

  /** Resolved from ancestry ID via GameData. */
  ancestry: { id: string; name: string } | null;

  /** Computed via HeroLogic (from heroClass + level + kit). */
  staminaMax: number | null;
  /** Computed via HeroLogic (from heroClass). */
  recoveriesMax: number | null;
  /** Computed via HeroLogic: floor(staminaMax / 3). */
  recoveryValue: number | null;

  /** Runtime state — null until persisted. */
  staminaCurrent: number | null;
  /** Runtime state — null until persisted. */
  recoveriesCurrent: number | null;
  victories: number;
  xp: number;

  createdAt: string;
  updatedAt: string;
}
