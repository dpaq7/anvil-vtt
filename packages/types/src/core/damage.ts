/**
 * Draw Steel Damage Types
 * Damage types, resistances, immunities, and weaknesses
 */

export type DamageType =
  | 'corruption'
  | 'fire'
  | 'cold'
  | 'lightning'
  | 'sonic'
  | 'acid'
  | 'poison'
  | 'psychic'
  | 'holy'
  | 'radiant'
  | 'untyped'
  | 'varies';

export interface Resistance {
  type: DamageType | 'all';
  /** Value or 'R' for Reason characteristic */
  value: number | 'R';
}

export interface Immunity {
  type: 'damage' | DamageType;
  /** For damage immunity levels */
  value?: number;
}

export interface Weakness {
  type: DamageType;
  value: number;
}

/**
 * Damage bonus format: +tier1/+tier2/+tier3
 * e.g., "+2/+2/+2" or "+0/+0/+4"
 */
export type DamageBonus = `+${number}/+${number}/+${number}`;
