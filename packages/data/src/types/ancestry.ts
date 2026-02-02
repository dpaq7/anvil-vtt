/**
 * Ancestry types from Draw Steel compendium
 */

import type { CompendiumItemBase } from './compendium-item.js';

/**
 * Size category for ancestries
 */
export type AncestrySize = 'Small' | 'Medium' | 'Large';

/**
 * Ancestry feature
 */
export interface AncestryFeature {
  name: string;
  description: string;
}

/**
 * Ancestry from compendium
 */
export interface CompendiumAncestry extends CompendiumItemBase {
  type: 'ancestry';
  name: string;
  /** Ancestry description */
  description?: string;
  /** Size category */
  size?: AncestrySize;
  /** Base speed */
  speed?: number;
  /** Signature ability name */
  signature_ability?: string;
  /** Ancestry features */
  features?: AncestryFeature[];
  /** Source book reference */
  source?: string;
}

/**
 * Check if an item is an ancestry
 */
export function isAncestry(item: CompendiumItemBase): item is CompendiumAncestry {
  return item.type === 'ancestry';
}
