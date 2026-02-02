# GameData Layer - Draw Steel Game Data Access

This folder contains the GameData layer, providing a unified API for accessing all Draw Steel game data.

## Status: INTEGRATED

The GameData layer is fully integrated and exported from `@anvil/data`.

## Usage

```typescript
import { GameData } from '@anvil/data';

// Access classes
const fury = GameData.getClass('fury');
const allClasses = GameData.getAllClasses(); // 10 classes

// Access ancestries
const human = GameData.getAncestry('human');
const allAncestries = GameData.getAllAncestries(); // 12 ancestries

// Access monsters
const allMonsters = GameData.getAllMonsters(); // 413 statblocks

// Game rules
const tier = GameData.getTierForRoll(14); // Returns 2
const isWinded = GameData.isWinded(currentStamina, maxStamina);

// Type guards
import { isHeroClass, isCharacteristic } from '@anvil/data';
if (isHeroClass('fury')) { ... }
```

## Directory Structure

```
game-data/
├── types/           # TypeScript interfaces (from Mettle)
│   ├── game-data.ts # Main types for GameData API
│   ├── hero.ts      # Hero/character types
│   ├── common.ts    # Shared types
│   └── [other type files]
├── lib/
│   ├── game-rules.ts      # GameData API with ~90 methods
│   └── condition-parser.ts # Condition text parser
├── data/
│   ├── conditions.ts      # Condition definitions
│   ├── reference-data.ts  # Ancestries, careers, kits, languages
│   ├── class-resources.ts # Heroic resource config
│   ├── magicItems.ts      # Magic item definitions
│   ├── perks/perks-data.ts
│   └── classes/class-definitions.ts
├── generated/       # JSON data files
│   ├── abilities.json    # Hero abilities (919KB)
│   ├── features.json     # Hero features (809KB)
│   ├── monsters.json     # Monster statblocks (1.4MB, 413 entries)
│   ├── traps.json        # Traps and terrain (103KB, 35 entries)
│   └── skills.json       # Skill definitions (8KB, 57 entries)
└── index.ts         # Barrel exports
```

## Data Counts

| Data Type | Count |
|-----------|-------|
| Classes | 10 |
| Ancestries | 12 |
| Monsters | 413 |
| Kits | 21 |
| Skills | 57 |
| Perks | 40 |
| Conditions | 14 |
| Languages | 41 |

## Data Generation Scripts

Located in `packages/data/scripts/`:

```bash
# Generate monsters.json and traps.json from Anvil docs
pnpm --filter @anvil/data run consolidate-data

# Generate skills.json and other MD-parsed data
pnpm --filter @anvil/data run parse-data

# Run both
pnpm --filter @anvil/data run generate-data
```

Source data comes from `Anvil/docs/`:
- `Draw Steel JSON game data/` - JSON source files
- `data-rules-md/` - Markdown rule files

## Type Notes

Some types use `as unknown as Type` casts where the source data structure
differs from the expected types. This is intentional to allow the API to work
while preserving full type safety for consumers.

## Build Notes

- Uses ESM with JSON import assertions (`with { type: 'json' }`)
- `composite: false` in tsconfig to avoid JSON file listing issues
- JSON files are copied to `dist/game-data/generated/` during build
