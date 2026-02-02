import type { PerkCategory } from '@anvil/types';

export const PERK_CATEGORY_INFO: Record<PerkCategory, {
  name: string;
  description: string;
  icon: string;
  colorVar: string;
}> = {
  crafting: {
    name: 'Crafting',
    description: 'Perks for creating items, jury-rigging, and resource management',
    icon: 'hammer',
    colorVar: '--perk-crafting',
  },
  exploration: {
    name: 'Exploration',
    description: 'Perks for physical feats, traversal, and environmental challenges',
    icon: 'compass',
    colorVar: '--perk-exploration',
  },
  interpersonal: {
    name: 'Interpersonal',
    description: 'Perks for social interaction, persuasion, and relationships',
    icon: 'users',
    colorVar: '--perk-interpersonal',
  },
  intrigue: {
    name: 'Intrigue',
    description: 'Perks for stealth, investigation, and clandestine activities',
    icon: 'search',
    colorVar: '--perk-intrigue',
  },
  lore: {
    name: 'Lore',
    description: 'Perks for knowledge, research, and recalling information',
    icon: 'book-open',
    colorVar: '--perk-lore',
  },
  supernatural: {
    name: 'Supernatural',
    description: 'Perks for minor magic, psionic tricks, and mystical abilities',
    icon: 'sparkles',
    colorVar: '--perk-supernatural',
  },
};

export const ALL_PERK_CATEGORIES: PerkCategory[] = [
  'crafting',
  'exploration',
  'interpersonal',
  'intrigue',
  'lore',
  'supernatural',
];
