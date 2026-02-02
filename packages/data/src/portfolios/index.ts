// Export all portfolios

export { undeadPortfolio } from './undead.js';
export { demonPortfolio } from './demon.js';
export { elementalPortfolio } from './elemental.js';
export { feyPortfolio } from './fey.js';

import { undeadPortfolio } from './undead.js';
import { demonPortfolio } from './demon.js';
import { elementalPortfolio } from './elemental.js';
import { feyPortfolio } from './fey.js';
import type { Portfolio, PortfolioType } from '@anvil/types';

export const portfolios: Record<PortfolioType, Portfolio> = {
  undead: undeadPortfolio,
  demon: demonPortfolio,
  elemental: elementalPortfolio,
  fey: feyPortfolio,
};
