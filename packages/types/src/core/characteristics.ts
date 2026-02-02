/**
 * Draw Steel Characteristics
 * The five attributes that define a creature's capabilities
 */

export type Characteristic = 'might' | 'agility' | 'reason' | 'intuition' | 'presence';

export interface Characteristics {
  /** Physical power, melee combat */
  might: number;
  /** Dexterity, ranged combat, reflexes */
  agility: number;
  /** Logic, knowledge, crafting */
  reason: number;
  /** Perception, willpower, healing */
  intuition: number;
  /** Charisma, leadership, intimidation */
  presence: number;
}

export type CharacteristicName = keyof Characteristics;
