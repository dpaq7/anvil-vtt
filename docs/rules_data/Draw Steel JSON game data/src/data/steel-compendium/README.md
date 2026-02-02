# Steel Compendium Data

LLM-optimized Draw Steel TTRPG data for Mettle/Anvil development.

## Attribution

*The Steel Compendium is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL (c) 2024 MCDM Productions, LLC.*

## Format

Each item includes:
- `_id` - Unique path-based identifier (e.g., "monsters/monsters/dragons/statblocks/thorn_dragon")
- `_category` - Top-level category: `heroes` or `monsters`
- `_subcategory` - Sub-folder path if nested (e.g., "abilities/censor/1stlevel_features")
- `_filename` - Original filename without extension
- `type` - Item type (e.g., "statblock", "feature", "ability")
- `name` - Display name
- `...` - All original JSON content merged in

## Files

| File | Items | Size | Description |
|------|-------|------|-------------|
| `draw-steel-consolidated.json` | 1639 | ~5.5MB | All data in one file |
| `draw-steel-heroes.json` | 1128 | ~3.9MB | Hero abilities, features, kits |
| `draw-steel-monsters.json` | 511 | ~1.6MB | Monster statblocks, features, terrain |

## Usage with Claude Code

Reference specific categories in prompts:
```
Using draw-steel-monsters.json as reference, implement the Monster type interface...
```

Or load the full consolidated file for broad context.

## TypeScript Usage

```typescript
import { loadConsolidated, filterItems, searchByName } from './steel-compendium';

// Load all data
const { default: data } = await loadConsolidated();

// Find all dragons
const dragons = filterItems(data, item =>
  item._id.includes('dragons') && item.type === 'statblock'
);

// Search by name
const matches = searchByName(data, 'thorn');
```

## Regenerating

```bash
node /tmp/consolidate-ds-json.cjs "/Users/danpaquin/Desktop/Projects/Draw Steel Compedium"
```
