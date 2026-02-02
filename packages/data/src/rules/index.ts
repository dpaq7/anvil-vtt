/**
 * Draw Steel Rules Data
 * Character creation and gameplay data
 */

// Core reference data (ancestries, careers, cultures, kits, languages)
export * from './reference-data.js';

// Skills
export * from './skills.js';

// Perks (47 perks across 6 categories)
export * from './perks/index.js';

// Complications (100 backstory complications)
export * from './complications.js';

// Titles (59 earned achievements across 4 echelons)
export * from './titles.js';

// Encounter Objectives (10 combat victory conditions)
export * from './encounter-objectives.js';

// Rules Reference (39 core game rules for in-app lookup)
export * from './rules-reference.js';

// TODO: These require more work to integrate properly
// - conditions.js has type mismatches
// - classes/index.js doesn't exist
// export * from './conditions.js';
// export * from './progression.js';
// export * from './classes/index.js';
