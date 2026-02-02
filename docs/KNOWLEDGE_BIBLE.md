# The Development Knowledge Bible
## A Comprehensive Guide for VTT Development with AI Coding Assistants

**Target Audience**: Novice developers building Virtual Tabletop applications with React/TypeScript, Supabase, and Claude Code

---

# Table of Contents

```
<toc>
1. TECH STACK SELECTION FRAMEWORK
2. VTT SOFTWARE ARCHITECTURE PATTERNS
3. WORKING WITH AI CODING ASSISTANTS
4. FIGMA-TO-CODE WORKFLOWS
5. PROFESSIONAL DEVELOPMENT WORKFLOWS
6. META-PROMPTING FOR FRONTEND DEVELOPMENT
7. COLLABORATIVE SPECIFICATION BUILDING ← NEW
8. TERMINOLOGY AND CONCEPTUAL FRAMEWORKS
9. QUALITY ASSURANCE AND VISION ALIGNMENT
</toc>
```

---

# 1. Tech Stack Selection Framework

<section id="tech-stack-selection">

Your current stack—**React/TypeScript + Supabase + Figma + Playwright**—is an excellent foundation for building a Draw Steel character tracking app. This section helps you understand *why* these choices work and when to consider alternatives.

## The decision matrix for technology choices

Professional teams evaluate tech stacks using weighted criteria. For a real-time VTT application, prioritize these factors:

| Factor | Weight | Your Consideration |
|--------|--------|--------------------|
| **Real-time capabilities** | 30% | Does it support WebSockets/live sync? |
| **Development velocity** | 25% | Can you ship features quickly while learning? |
| **Learning resources** | 20% | Are tutorials and docs abundant? |
| **Community/ecosystem** | 15% | Can you find help when stuck? |
| **Scalability** | 10% | Will it handle growth if needed? |

**Key insight**: Wrong technology choices cost companies $2.3M on average in rewrites, but for solo projects, optimizing for *learning speed* and *available help* often matters more than theoretical scalability.

## Frontend framework comparison for VTT development

Your choice of **React** is well-suited for VTT development. Here's how it compares:

| Metric | React | Vue | Svelte |
|--------|-------|-----|--------|
| **Market share** | 39.5% | 15.4% | 6.5% |
| **Learning resources** | Abundant | Good | Growing |
| **Real-time game examples** | Many | Some | Few |
| **Hiring/collaboration** | Easiest | Moderate | Harder |

**React advantages for your project**:
- Largest ecosystem of real-time and canvas libraries
- Most VTT tutorials use React
- React Native option if you ever want mobile
- Vast community for troubleshooting

**When to consider alternatives**: If starting fresh with a simpler app, Vue or Svelte offer gentler learning curves with less boilerplate.

<decision-tree id="frontend-framework">
## Frontend Framework Decision Tree

```
START: Building a VTT application?
│
├─► Need extensive third-party libraries? → React
├─► Prioritize smallest bundle size? → Svelte
├─► Want gentlest learning curve? → Vue
├─► Building with existing React codebase? → React
└─► Rapid prototyping, may rewrite later? → Vue or Svelte
```
</decision-tree>

## TypeScript vs JavaScript: Always choose TypeScript for VTT

For character tracking apps with complex state, **TypeScript is non-negotiable**. Here's why:

- **Character data is inherently complex**: Stats, inventory, abilities, and relationships benefit from type checking
- **Real-time sync bugs are hard to debug**: TypeScript catches mismatched data shapes at compile time
- **AI assistants work better**: Claude Code generates more accurate code with explicit type definitions
- **Refactoring is safer**: When changing character schemas, TypeScript shows all affected code

<claude-code-instruction id="typescript-setup">
### Claude Code Instruction: TypeScript Configuration

```
Set up TypeScript with strict mode enabled for this React project. 
Configure the following in tsconfig.json:
- strict: true
- noUncheckedIndexedAccess: true  
- exactOptionalPropertyTypes: true

Create path aliases so imports look like:
import { Character } from '@/types/character'
instead of relative paths.
```
</claude-code-instruction>

## Database selection: Why Supabase excels for character tracking

Your choice of **Supabase** is optimal for Draw Steel character tracking:

| Feature | Supabase | Firebase | Raw PostgreSQL |
|---------|----------|----------|----------------|
| **Data model** | Relational (SQL) | Document (NoSQL) | Relational (SQL) |
| **Complex queries** | ✅ Full SQL | ⚠️ Limited | ✅ Full SQL |
| **Real-time** | ✅ Built-in | ✅ Native | ⚠️ Manual setup |
| **Character relationships** | Natural via JOINs | Denormalized copies | Natural via JOINs |
| **Vendor lock-in** | Low (open-source) | High | None |

**Supabase wins for RPG data because**:
- Character stats, inventory, and abilities are naturally relational
- SQL queries like "find all characters with Might > 3" are trivial
- Row-Level Security handles multi-player access elegantly
- **4x faster reads** than Firebase in benchmarks

<checklist id="supabase-setup">
### Supabase Project Setup Checklist

- [ ] Enable Row Level Security on all tables
- [ ] Create `characters` table with JSONB column for flexible stats
- [ ] Set up real-time subscriptions for character updates
- [ ] Configure auth providers (email/password minimum)
- [ ] Create database functions for dice roll logging
- [ ] Set up foreign key relationships (characters → campaigns)
</checklist>

</section>

---

# 2. VTT Software Architecture Patterns

<section id="vtt-architecture">

Understanding how successful VTTs like Foundry VTT, Roll20, and Owlbear Rodeo are built will help you make better architectural decisions for your Draw Steel app.

## The document-based data model pattern

Every successful VTT uses a **document-based architecture** where game entities (characters, items, scenes) are treated as discrete documents with defined schemas.

```typescript
// Core pattern used by Foundry VTT and applicable to your app
interface Document {
  id: string;
  type: string;
  data: Record<string, unknown>;
  ownership: PermissionConfig;
  createdAt: Date;
  updatedAt: Date;
}

// Your Draw Steel character as a document
interface DrawSteelCharacter extends Document {
  type: 'character';
  data: {
    name: string;
    ancestry: string;
    characterClass: string;
    level: number;
    characteristics: CharacteristicsBlock;
    stamina: ResourcePool;
    recoveries: ResourcePool;
    skills: string[];
    abilities: Ability[];
  };
}
```

**Why this pattern works**: It provides a consistent interface for creating, updating, deleting, and syncing any game entity.

## Real-time synchronization strategies

For a character tracking app, you have three main synchronization approaches:

### Option 1: Supabase Realtime (Recommended for your stack)

```typescript
// Supabase Realtime pattern for character updates
const channel = supabase.channel('campaign-123')
  // Broadcast for ephemeral data (cursor positions, dice rolling animations)
  .on('broadcast', { event: 'dice-roll' }, (payload) => {
    showDiceAnimation(payload.result);
  })
  // Presence for tracking who's online
  .on('presence', { event: 'sync' }, () => {
    const players = channel.presenceState();
    setOnlinePlayers(Object.values(players));
  })
  // Database changes for persistent state
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'characters' 
  }, (payload) => {
    updateCharacterInStore(payload.new);
  })
  .subscribe();
```

**When to use each channel type**:
- **Broadcast**: Dice rolls, cursor positions, typing indicators (ephemeral)
- **Presence**: Online/offline status, active character selection
- **Postgres Changes**: Character stat updates, inventory changes (persistent)

### Option 2: CRDTs for collaborative editing

If multiple players can edit the same character simultaneously (like shared party inventory), consider **CRDTs** (Conflict-free Replicated Data Types):

```typescript
// Using Yjs for collaborative character notes
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const ytext = ydoc.getText('character-notes');
const provider = new WebsocketProvider('wss://your-server', 'room-id', ydoc);

// Any edit automatically syncs without conflicts
ytext.insert(0, 'Session 5 notes: ');
```

**Use CRDTs when**: Multiple users edit the same content simultaneously (shared journals, party loot tracking).

**Don't use CRDTs for**: Individual character stats (use optimistic updates + last-write-wins instead).

### Option 3: WebSocket with Socket.io (for custom server logic)

If you need server-side validation (preventing cheating, complex game rules):

```typescript
// Server-side with Socket.io
io.on('connection', (socket) => {
  socket.on('character:update', async (characterId, changes) => {
    // Validate changes server-side
    if (isValidUpdate(changes)) {
      await saveToDatabase(characterId, changes);
      // Broadcast to all connected clients in the campaign
      socket.to(`campaign:${campaignId}`).emit('character:updated', characterId, changes);
    }
  });
});
```

<decision-tree id="sync-strategy">
## Real-Time Sync Decision Tree

```
START: What kind of data are you syncing?
│
├─► Ephemeral (cursors, animations)?
│   └─► Use Supabase Broadcast
│
├─► Presence (who's online)?
│   └─► Use Supabase Presence
│
├─► Persistent data (character stats)?
│   │
│   ├─► Single editor at a time?
│   │   └─► Use Supabase Postgres Changes
│   │
│   └─► Multiple simultaneous editors?
│       └─► Use CRDTs (Yjs/Automerge)
│
└─► Need server-side validation?
    └─► Use Socket.io + custom backend
```
</decision-tree>

## State management for game applications

For VTT applications, **Zustand** is strongly recommended over Redux or React Context. Owlbear Rodeo's developers explicitly noted that using React Context for performance-critical state was a mistake they fixed by switching to Zustand.

```typescript
// Recommended Zustand store pattern for VTT
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Character {
  id: string;
  name: string;
  stamina: { current: number; max: number };
  characteristics: Record<string, number>;
}

interface GameState {
  characters: Record<string, Character>;
  selectedCharacterId: string | null;
  
  // Actions
  updateCharacter: (id: string, changes: Partial<Character>) => void;
  setStamina: (id: string, current: number) => void;
  selectCharacter: (id: string | null) => void;
}

export const useGameStore = create<GameState>()(
  immer((set) => ({
    characters: {},
    selectedCharacterId: null,
    
    updateCharacter: (id, changes) => set((state) => {
      if (state.characters[id]) {
        Object.assign(state.characters[id], changes);
      }
    }),
    
    setStamina: (id, current) => set((state) => {
      if (state.characters[id]) {
        state.characters[id].stamina.current = current;
      }
    }),
    
    selectCharacter: (id) => set({ selectedCharacterId: id }),
  }))
);

// Selective subscriptions prevent unnecessary re-renders
const selectedCharacter = useGameStore((state) => 
  state.selectedCharacterId ? state.characters[state.selectedCharacterId] : null
);
```

**State architecture layers**:
| State Type | Tool | Example |
|------------|------|---------|
| UI State | Component state or Zustand | Modal open/closed, sidebar collapsed |
| Game State | Zustand + Supabase sync | Character stats, token positions |
| Server State | TanStack Query + Supabase | Campaign list, user profile |
| Ephemeral State | Supabase Presence | Cursor positions, typing indicators |

## Character data modeling for Draw Steel

Based on patterns from Foundry VTT and professional RPG systems:

```typescript
// Core character schema with flexibility for system evolution
interface DrawSteelCharacter {
  // Identity
  id: string;
  userId: string;
  campaignId: string;
  name: string;
  
  // Core Draw Steel attributes
  ancestry: string;
  characterClass: string;
  level: number;
  
  // Characteristics (the 5 core stats)
  characteristics: {
    might: number;
    agility: number;
    reason: number;
    intuition: number;
    presence: number;
  };
  
  // Resources
  stamina: { current: number; max: number };
  recoveries: { current: number; max: number };
  
  // Derived stats (computed, not stored)
  // armorClass, initiative, etc.
  
  // Flexible storage for system evolution
  skills: string[];
  abilities: Ability[];
  inventory: InventoryItem[];
  
  // Extensibility field (Foundry VTT "flags" pattern)
  customData: Record<string, unknown>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Derived stats calculated at runtime, not stored
function computeDerivedStats(character: DrawSteelCharacter) {
  return {
    mightModifier: character.characteristics.might - 10,
    agilityModifier: character.characteristics.agility - 10,
    // ... other derived values
  };
}
```

**Key modeling principles**:
1. **Store source data, compute derived data**: Don't store calculated values—compute them when rendering
2. **Use JSONB for flexible fields**: Allows schema evolution without migrations
3. **Plan for extensibility**: The `customData` field lets you add homebrew without schema changes
4. **Normalize relationships**: Characters → Abilities is a separate table, not embedded JSON

<claude-code-instruction id="character-schema">
### Claude Code Instruction: Database Schema Setup

```
Create Supabase database tables for a Draw Steel character tracking app.

Tables needed:
1. characters - core character data with JSONB for characteristics
2. abilities - character abilities/powers (many-to-many with characters)
3. inventory_items - character inventory
4. campaigns - game campaigns that characters belong to

Include:
- UUID primary keys
- Foreign key relationships
- Row Level Security policies (users can only see their own characters)
- Timestamps (created_at, updated_at)
- Indexes on frequently queried fields (user_id, campaign_id)

Use the Draw Steel RPG system structure where characters have:
- 5 characteristics: might, agility, reason, intuition, presence
- Stamina and recoveries as resource pools
- Skills as a string array
```
</claude-code-instruction>

## Dice mechanics implementation

```typescript
// Type-safe dice roller for Draw Steel
interface DiceResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  tier: 1 | 2 | 3;  // Draw Steel result tiers
}

class DrawSteelDice {
  // Cryptographically random for fairness
  private roll(sides: number): number {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return (array[0] % sides) + 1;
  }
  
  // Standard 2d10 + modifier roll
  rollTest(modifier: number = 0): DiceResult {
    const rolls = [this.roll(10), this.roll(10)];
    const total = rolls[0] + rolls[1] + modifier;
    
    return {
      notation: `2d10${modifier >= 0 ? '+' : ''}${modifier}`,
      rolls,
      modifier,
      total,
      tier: this.determineTier(total),
    };
  }
  
  // Draw Steel tier system
  private determineTier(total: number): 1 | 2 | 3 {
    if (total >= 17) return 3;  // Tier 3 success
    if (total >= 12) return 2;  // Tier 2 success
    return 1;                    // Tier 1 or failure
  }
  
  // Broadcast roll to all players via Supabase
  async broadcastRoll(channel: RealtimeChannel, result: DiceResult) {
    await channel.send({
      type: 'broadcast',
      event: 'dice-roll',
      payload: result,
    });
  }
}
```

</section>

---

# 3. Working with AI Coding Assistants

<section id="agentic-coding">

This section addresses your pain point of inefficient Claude Code workflows with excessive copy-pasting. These practices come directly from Anthropic's engineering team and practitioners.

## The fundamental mindset shift

**Treat Claude Code like a talented junior developer on their first day.** It writes code like a senior engineer but lacks context about your specific project. Your job is to provide that context efficiently.

Key characteristics of AI coding assistants:
- Writes solid code within well-defined constraints
- Makes design decisions like a junior (needs guidance)
- Too eager to please—rarely pushes back
- Has no memory of previous sessions
- Works best with explicit, specific instructions

## Essential: Set up your CLAUDE.md file

Create a `CLAUDE.md` file in your project root. This is Claude Code's persistent memory about your project. **This single file will eliminate 50% of your copy-pasting.**

```markdown
# CLAUDE.md - Draw Steel Character Tracker

## Project Overview
React/TypeScript character tracking app for the Draw Steel TTRPG system.
Uses Supabase for database and real-time, Tailwind for styling.

## Commands
- `npm run dev` - Start development server
- `npm run test` - Run Playwright tests  
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Run ESLint

## Code Conventions
- Use functional components with TypeScript
- Props interfaces named [Component]Props
- Use Zustand for state management (NOT React Context)
- Design tokens in src/tokens/ as CSS variables
- Components in src/components/[Name]/[Name].tsx

## File Structure
src/
├── components/     # Reusable UI components
├── features/       # Feature-based modules (auth/, characters/, campaigns/)
├── hooks/          # Custom React hooks
├── stores/         # Zustand stores
├── types/          # TypeScript type definitions
├── utils/          # Pure utility functions
└── lib/            # Third-party integrations (supabase client)

## Database
- Supabase project with Row Level Security
- Tables: characters, abilities, campaigns, profiles
- Real-time subscriptions for character updates

## Draw Steel RPG Context
- 5 characteristics: might, agility, reason, intuition, presence
- Resource pools: stamina (HP) and recoveries (healing)
- Tests use 2d10 + modifier against difficulty thresholds
- Result tiers: Tier 1 (11 or less), Tier 2 (12-16), Tier 3 (17+)

## Common Patterns
- Character updates use optimistic UI + Supabase sync
- Form validation with react-hook-form + zod
- Error boundaries wrap feature components
- Loading states use skeleton components

## Things to Avoid
- Don't use React Context for frequently-changing state
- Don't store derived/computed values in database
- Don't use inline styles (use Tailwind classes)
- Don't create new dependencies without asking
```

<claude-code-instruction id="init-claudemd">
### Claude Code Instruction: Initialize CLAUDE.md

```
Run /init to generate a CLAUDE.md file for this project.
Then customize it with the Draw Steel RPG-specific context I'll provide.
```
</claude-code-instruction>

## The "Explore, Plan, Code, Commit" workflow

This is Anthropic's recommended workflow for feature development:

### Step 1: Explore (gather context)
```
Read the character sheet component at src/features/characters/CharacterSheet.tsx 
and the character types at src/types/character.ts.
DON'T write any code yet—just understand the current implementation.
```

### Step 2: Plan (design solution)
```
Based on what you read, create a plan for adding a "recoveries" tracker section 
to the character sheet. Give me 2-3 options, starting with the simplest.
Think hard about edge cases. DON'T code yet.
```

### Step 3: Code (implement)
```
Implement option 2 from your plan. Create the RecoveriesTracker component 
following the same patterns as the StaminaTracker component.
```

### Step 4: Commit (save work)
```
Commit these changes with a descriptive message following our commit convention.
Update the CharacterSheet.md documentation to reflect the new component.
```

## Effective prompt patterns

### Pattern 1: Reference existing code
Instead of describing what you want from scratch, point to existing examples:

❌ **Bad**: "Create a button component with primary and secondary variants"

✅ **Good**: "Create a new IconButton component following the same patterns as src/components/Button/Button.tsx. It should accept an icon prop and have the same variants."

### Pattern 2: Constrain the solution space
❌ **Bad**: "Add user authentication"

✅ **Good**: "Add email/password authentication using Supabase Auth. Use the existing AuthContext pattern. Don't add any new npm dependencies. Create a simple login form matching our existing form patterns in src/components/Form/."

### Pattern 3: Use "think" keywords for complex problems
- "think" → Basic extended thinking
- "think hard" → More analysis time
- "think harder" → Even more thorough
- "ultrathink" → Maximum reasoning

```
Think hard about the best way to structure the character abilities system.
Consider:
- Some abilities are passive (always on)
- Some abilities have limited uses per rest
- Some abilities have cooldowns
Give me a data model that handles all three elegantly.
```

### Pattern 4: Request plans before code
```
Give me a few options for implementing real-time character sync, 
starting with the simplest. Don't code yet—I want to discuss the approach first.
```

### Pattern 5: Incremental verification
```
Implement the stamina tracker. After each major piece, 
tell me what to check in the browser to verify it's working.
```

## Context management: The secret to efficiency

**The #1 cause of poor AI output is degraded context.** Long sessions accumulate irrelevant information that confuses Claude.

### Use `/clear` frequently
After completing a feature or fixing a bug, run `/clear` to reset context. This is not losing progress—Claude will re-read your CLAUDE.md file automatically.

**When to /clear**:
- After completing a feature
- When Claude starts giving irrelevant suggestions
- When switching to a different part of the codebase
- Every 30-45 minutes of active work

### The "Document and Clear" method for complex features
1. Have Claude dump its understanding and plan into a markdown file
2. Run `/clear`
3. Start new session: "Read FEATURE_PLAN.md and continue implementation"

```
Create a markdown file at docs/ABILITIES_IMPLEMENTATION.md documenting:
1. The data model we designed
2. The components we've created so far
3. What's left to implement
4. Any edge cases we identified

I'll clear context and continue from this document.
```

### Provide context efficiently
Instead of pasting entire files, give Claude just what it needs:

```
Look at the StaminaTracker component pattern (src/components/StaminaTracker/).
I need you to create an identical structure for a RecoveriesTracker.
Same styling patterns, same Supabase sync approach, same prop interface style.
```

## Common pitfalls and how to avoid them

<checklist id="ai-pitfalls">
### AI Coding Pitfall Checklist

**Before accepting generated code**:
- [ ] Did you test it in the browser? (AI code often looks correct but fails)
- [ ] Did you check for hardcoded values that should be props/configs?
- [ ] Did you verify it follows your established patterns?
- [ ] Did you check for leftover debug code (console.log)?
- [ ] Did you verify TypeScript types are accurate?

**When Claude seems confused**:
- [ ] Is the context window cluttered? (Use /clear)
- [ ] Did you provide enough specific context?
- [ ] Are you asking for too many things at once?
- [ ] Have you tried breaking the task into smaller pieces?

**When output quality degrades**:
- [ ] Have you been in the same session too long? (Clear and restart)
- [ ] Is Claude using outdated patterns? (Paste current documentation)
- [ ] Are you providing contradictory instructions?
</checklist>

### Pitfall 1: Blindly accepting generated code
**Always review generated code like it came from a junior developer.** Ask Claude to explain decisions you don't understand:

```
Explain why you used useCallback here instead of a regular function.
What problem does this solve?
```

### Pitfall 2: Insufficient context
If Claude keeps generating code that doesn't fit your patterns, it lacks context. Solution: paste examples.

```
Here's our existing component pattern. Match this style exactly:

[paste 20-30 lines of representative code]

Now create the new component following this pattern.
```

### Pitfall 3: Not verifying after every change
**Test in localhost after EVERY change.** Small, incremental verification prevents nightmare debugging sessions.

```
After you implement this change, tell me exactly what I should see 
in the browser to verify it's working correctly.
```

### Pitfall 4: Letting Claude make architectural decisions
Claude is great at implementing designs but mediocre at creating them. Always provide architectural direction:

❌ "Build a state management system for characters"  
✅ "Implement character state management using Zustand following this structure I've outlined..."

### Pitfall 5: Copy-pasting error messages without context
Instead of just pasting an error:

```
I'm getting this error when clicking the save button on the character sheet:

[error message]

The relevant code is in src/features/characters/CharacterSheet.tsx around line 45.
The save function calls updateCharacter from the Zustand store.
The error started after I added the new recoveries field.
```

## When Claude should push back (and how to encourage it)

AI assistants are too eager to please. Encourage pushback:

```
Before implementing this, tell me if you see any problems with my approach.
Are there edge cases I'm not considering? 
Is there a simpler way to achieve this?
Be critical—I'd rather fix issues now than debug later.
```

</section>

---

# 4. Figma-to-Code Workflows

<section id="figma-workflows">

This section directly addresses your pain point of copy-pasting UI elements. The key is setting up proper tooling and communication patterns.

## Set up Figma MCP Server (game-changer for Claude Code)

The Figma MCP Server allows Claude Code to directly read your Figma designs. **This eliminates most UI-related copy-pasting.**

### Installation
```bash
claude mcp add --transport http figma https://mcp.figma.com/mcp
```

### Two ways to use it

**Selection-based** (fastest):
1. Open Figma desktop app
2. Select the frame you want to implement
3. Ask Claude: "Using the Figma MCP, look at my selected frame and create a React component that matches this design."

**Link-based** (for specific elements):
1. Right-click a frame in Figma → "Copy link"
2. Paste link into Claude Code prompt: "Implement this Figma frame as a React component: [link]"

<claude-code-instruction id="figma-component">
### Claude Code Instruction: Implement from Figma

```
Using the Figma MCP, look at my selected frame in Figma.
Create a React component that matches this design exactly.

Requirements:
- Use Tailwind CSS for styling
- Use our existing Button and Input components from src/components/
- Apply spacing tokens from our design system
- Make it responsive (mobile-first)
- Add appropriate TypeScript props interface
```
</claude-code-instruction>

## Design tokens: The bridge between design and code

Design tokens eliminate the need to copy-paste hex codes, spacing values, and font sizes.

### Setting up the token pipeline

1. **In Figma**: Use the Tokens Studio plugin to manage design tokens
2. **Export**: Export tokens as JSON
3. **Transform**: Use Style Dictionary to convert to CSS variables
4. **Use**: Reference CSS variables in your code

```json
// tokens/colors.json
{
  "color": {
    "primary": { "value": "#6366f1", "type": "color" },
    "surface": {
      "default": { "value": "#ffffff", "type": "color" },
      "elevated": { "value": "#f8fafc", "type": "color" }
    },
    "text": {
      "primary": { "value": "#1e293b", "type": "color" },
      "secondary": { "value": "#64748b", "type": "color" }
    }
  },
  "spacing": {
    "xs": { "value": "4px", "type": "dimension" },
    "sm": { "value": "8px", "type": "dimension" },
    "md": { "value": "16px", "type": "dimension" },
    "lg": { "value": "24px", "type": "dimension" },
    "xl": { "value": "32px", "type": "dimension" }
  }
}
```

```css
/* Generated CSS variables */
:root {
  --color-primary: #6366f1;
  --color-surface-default: #ffffff;
  --color-surface-elevated: #f8fafc;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}
```

### Referencing tokens in prompts

Instead of describing colors and spacing:

❌ "Make the card have a light gray background with 16px padding"

✅ "Apply `--color-surface-elevated` background and `--spacing-md` padding to the card"

## Describing UI to Claude without screenshots

When you can't use Figma MCP, use this structured format:

```markdown
## Component: CharacterStatBlock

**Layout**:
- Horizontal row of 5 stat boxes
- Each box is 64px × 80px
- 8px gap between boxes
- Centered within parent

**Each stat box contains**:
- Stat name (top): 12px, secondary text color, uppercase
- Stat value (center): 24px, bold, primary text color  
- Modifier (bottom): 14px, calculated as (value - 10), show + for positive

**Visual styling**:
- Background: var(--color-surface-elevated)
- Border: 1px solid var(--color-border-subtle)
- Border radius: 8px
- Box shadow: var(--shadow-sm)

**States**:
- Hover: border color changes to var(--color-primary)
- Active (editing): primary border, slight scale(1.02)

**Responsive**:
- Below 640px: 2 rows (3 + 2), smaller boxes (56px × 72px)
```

### UI description vocabulary

| Concept | Describe As |
|---------|-------------|
| Layout | "horizontal stack", "vertical stack", "2-column grid", "sidebar + main" |
| Spacing | Token names: "md padding", "sm gap" or pixels: "16px padding" |
| Alignment | "center", "space-between", "flex-start", "baseline" |
| Sizing | "64px fixed", "flex-1 (fill remaining)", "min-w-[200px]" |
| Responsive | "below 768px: stack vertically", "hide on mobile" |
| States | "hover: darker background", "focus: ring-2", "disabled: 50% opacity" |

## Component specification templates

Use this template when requesting new components:

```markdown
## Component Specification: [Name]

### Purpose
[One sentence describing what this component does]

### Props Interface
```typescript
interface [Name]Props {
  // List expected props with types
}
```

### Layout
- [Describe structure and arrangement]

### Visual Design
- [Colors, spacing, typography using token names]

### States
- Default: [description]
- Hover: [description]
- Active: [description]
- Disabled: [description]

### Responsive Behavior
- Desktop (1024px+): [description]
- Tablet (768px-1023px): [description]
- Mobile (<768px): [description]

### Accessibility
- [Keyboard navigation requirements]
- [ARIA attributes needed]
- [Focus management]

### Usage Example
```tsx
<[Name] prop1="value" prop2={data} />
```
```

<claude-code-instruction id="component-from-spec">
### Claude Code Instruction: Component from Specification

```
Create a React component matching this specification.
Use Tailwind CSS for styling and follow our component patterns.
Include TypeScript props interface and JSDoc documentation.
Add a basic test file with React Testing Library.

[Paste component specification]
```
</claude-code-instruction>

## Documentation that serves AI development

Create component documentation that Claude Code can reference:

```markdown
<!-- src/components/Button/README.md -->
# Button

Primary interaction element for user actions.

## Variants
- `primary`: Main CTA, filled background
- `secondary`: Less prominent, outlined
- `ghost`: Minimal, text only
- `danger`: Destructive actions, red

## Sizes
- `sm`: 32px height, 12px text
- `md`: 40px height, 14px text (default)
- `lg`: 48px height, 16px text

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' \| 'danger' | 'primary' | Visual style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| disabled | boolean | false | Disable interaction |
| loading | boolean | false | Show loading spinner |
| leftIcon | ReactNode | - | Icon before text |
| rightIcon | ReactNode | - | Icon after text |

## Design Tokens Used
- `--color-button-primary-bg`
- `--color-button-primary-text`
- `--spacing-button-padding-x`
- `--spacing-button-padding-y`

## Code Example
```tsx
<Button variant="primary" size="md" onClick={handleSave}>
  Save Character
</Button>

<Button variant="secondary" leftIcon={<PlusIcon />}>
  Add Ability
</Button>

<Button variant="danger" loading={isDeleting}>
  Delete Character
</Button>
```
```

</section>

---

# 5. Professional Development Workflows

<section id="professional-workflows">

These workflows will help you develop professional habits while learning, making it easier to collaborate with others in the future.

## Git workflow for solo developers

Use **short-lived feature branches** even when working alone. This builds good habits and provides clear history.

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/add-recoveries-tracker

# Work on feature, commit frequently
git add -A
git commit -m "feat(character): add RecoveriesTracker component"
git commit -m "feat(character): integrate tracker with Supabase sync"

# Push and create PR (even for yourself)
git push origin feature/add-recoveries-tracker
# Create PR in GitHub, review your own changes, merge

# Clean up
git checkout main
git pull origin main
git branch -d feature/add-recoveries-tracker
```

### Commit message convention (Angular/Conventional)

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting (no code change)
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance tasks

Examples:
feat(character): add stamina tracking component
fix(dice): correct tier calculation for edge cases
docs(readme): update setup instructions
refactor(store): simplify character update logic
test(character): add integration tests for save flow
```

<claude-code-instruction id="git-commit">
### Claude Code Instruction: Commit Changes

```
Commit the current changes with a descriptive message following 
the conventional commits format (type(scope): description).
The type should be 'feat' for new features, 'fix' for bug fixes.
```
</claude-code-instruction>

## Self-code review checklist

Before merging any PR, review against this checklist:

<checklist id="code-review">
### Self-Review Checklist

**Functionality**
- [ ] Code accomplishes its intended purpose
- [ ] Edge cases are handled appropriately
- [ ] Error states display user-friendly messages
- [ ] Happy path AND error paths tested manually

**Code Quality**
- [ ] No `console.log` statements left in code
- [ ] No commented-out code (use git history)
- [ ] Variable names are meaningful
- [ ] Functions are focused (single responsibility)
- [ ] Follows established patterns in codebase
- [ ] TypeScript types are accurate

**Security**
- [ ] User input is validated/sanitized
- [ ] No sensitive data in logs or comments
- [ ] API keys/secrets not hardcoded

**Performance**
- [ ] No obvious performance bottlenecks
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] Network requests are optimized

**Testing**
- [ ] New functionality has tests
- [ ] Existing tests still pass
- [ ] Tested in browser manually
</checklist>

## Systematic debugging methodology

When you encounter a bug, don't just copy-paste the error to Claude. Use this systematic approach:

### The Scientific Method for Debugging

**Step 1: Reproduce**
- Find the exact steps to trigger the bug
- Note the environment (browser, data state)
- Create the smallest possible test case

**Step 2: Hypothesize**
- Form a specific, testable hypothesis
- "The bug is in the stamina update function, not the UI"

**Step 3: Test**
- Add strategic console.logs or breakpoints
- Use binary search: comment out half the code
- Validate or invalidate your hypothesis

**Step 4: Fix and Verify**
- Write a test that reproduces the bug FIRST
- Implement the fix
- Verify the test passes
- Check for related issues

### Asking Claude for debugging help effectively

Instead of just pasting an error:

```
I'm debugging an issue with character stamina updates.

SYMPTOMS:
- When I click the "-" button on StaminaTracker, the UI updates but reverts after 1 second
- No errors in console
- Network tab shows the Supabase update succeeds (200 response)

WHAT I'VE TRIED:
- Confirmed the Zustand store updates correctly (logged state)
- Checked Supabase dashboard - the value IS being saved
- The issue only happens on this component, not RecoveriesTracker

MY HYPOTHESIS:
Something is overwriting the optimistic update. Maybe the Supabase 
real-time subscription is firing and resetting to old data.

RELEVANT FILES:
- src/components/StaminaTracker/StaminaTracker.tsx
- src/stores/characterStore.ts
- src/hooks/useCharacterSync.ts

Can you help me investigate the real-time subscription logic?
```

### Browser DevTools techniques

| Tool | When to Use |
|------|-------------|
| **Console** | Log values, check for errors |
| **Network tab** | Verify API calls succeed/fail |
| **React DevTools** | Inspect component state and props |
| **Sources tab** | Set breakpoints, step through code |
| **Performance tab** | Identify re-render issues |

## Testing strategy for VTT applications

Follow the **testing pyramid**: many unit tests, fewer integration tests, minimal E2E tests.

```
        /\
       /  \  E2E (Playwright) - Critical paths only
      /----\     
     /      \  Integration - Component interactions
    /--------\
   /          \  Unit Tests - Pure functions, hooks
  /--------------\
```

### Unit tests with React Testing Library

```typescript
// Test behavior, not implementation
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaminaTracker } from './StaminaTracker';

describe('StaminaTracker', () => {
  it('decrements stamina when minus button is clicked', async () => {
    const onUpdate = vi.fn();
    render(
      <StaminaTracker 
        current={10} 
        max={15} 
        onUpdate={onUpdate} 
      />
    );
    
    await userEvent.click(screen.getByRole('button', { name: /decrease/i }));
    
    expect(onUpdate).toHaveBeenCalledWith(9);
  });
  
  it('shows warning styling when stamina is below 25%', () => {
    render(<StaminaTracker current={3} max={15} onUpdate={() => {}} />);
    
    expect(screen.getByTestId('stamina-bar')).toHaveClass('bg-red-500');
  });
});
```

### E2E tests with Playwright

Test complete user journeys, not individual components:

```typescript
// e2e/character-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Character Creation Flow', () => {
  test('user can create a new character', async ({ page }) => {
    await page.goto('/characters/new');
    
    // Fill out character form
    await page.getByLabel('Character Name').fill('Test Hero');
    await page.getByLabel('Ancestry').selectOption('human');
    await page.getByLabel('Class').selectOption('fury');
    
    // Set characteristics
    await page.getByLabel('Might').fill('12');
    await page.getByLabel('Agility').fill('10');
    
    // Submit
    await page.getByRole('button', { name: 'Create Character' }).click();
    
    // Verify redirect and character appears
    await expect(page).toHaveURL(/\/characters\/[a-z0-9-]+/);
    await expect(page.getByText('Test Hero')).toBeVisible();
  });
});
```

<claude-code-instruction id="write-test">
### Claude Code Instruction: Write Tests

```
Write tests for the [ComponentName] component.

Create:
1. Unit tests using React Testing Library for component behavior
2. Integration test for the save/update flow

Follow our testing patterns:
- Test user behavior, not implementation details
- Use role-based queries (getByRole, getByLabel)
- Use userEvent instead of fireEvent
- One behavior per test case

Put tests in [ComponentName].test.tsx next to the component.
```
</claude-code-instruction>

## Project structure for React/TypeScript

```
src/
├── components/           # Shared UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Form/
│       ├── Input.tsx
│       ├── Select.tsx
│       └── index.ts
├── features/             # Feature-based modules
│   ├── characters/
│   │   ├── components/   # Character-specific components
│   │   ├── hooks/        # Character-specific hooks
│   │   ├── services/     # API functions
│   │   └── types.ts      # Character types
│   ├── campaigns/
│   └── dice/
├── hooks/                # Shared custom hooks
├── stores/               # Zustand stores
├── types/                # Shared TypeScript types
├── utils/                # Pure utility functions
├── lib/                  # Third-party integrations
│   └── supabase.ts
├── styles/               # Global styles, tokens
└── App.tsx
```

**Key principles**:
- **Feature-based organization**: Group by feature, not by file type
- **Colocation**: Keep tests, styles, and docs near the component
- **Index files**: Clean imports via `import { Button } from '@/components/Button'`
- **Path aliases**: Use `@/` instead of relative paths

</section>

---

# 6. Meta-Prompting for Frontend Development

<section id="meta-prompting">

These are prompt templates optimized for frontend UI work with Claude Code.

## Component creation template

```
Create a [ComponentName] component for [purpose].

LOCATION: src/components/[ComponentName]/[ComponentName].tsx

REQUIREMENTS:
- [List specific requirements]
- Follow patterns from [existing similar component]
- Use design tokens from src/styles/tokens.css

PROPS NEEDED:
- [prop1]: [type] - [description]
- [prop2]: [type] - [description]

BEHAVIOR:
- [Describe interactions and state changes]

STYLING:
- [Use Tailwind classes / reference tokens]
- [Responsive requirements]

AFTER CREATING:
1. Add export to src/components/[ComponentName]/index.ts
2. Add basic tests in [ComponentName].test.tsx
```

## Layout change template

```
Modify the layout of [page/component name].

CURRENT: [describe current layout]
DESIRED: [describe target layout]

SPECIFIC CHANGES:
1. [Change 1]
2. [Change 2]

CONSTRAINTS:
- Keep existing functionality intact
- Maintain responsive behavior
- Don't change the component API

REFERENCE: [Similar layout elsewhere in codebase]
```

## State management template

```
Add state management for [feature].

DATA SHAPE:
```typescript
interface [StateName] {
  // define structure
}
```

ACTIONS NEEDED:
- [action1]: [description]
- [action2]: [description]

INTEGRATION:
- Store location: src/stores/[storeName].ts
- Components that need access: [list]
- Supabase sync requirements: [describe]

PATTERNS TO FOLLOW:
- Use Zustand with immer middleware
- Match patterns in src/stores/characterStore.ts
```

## Debugging assistance template

```
Help debug: [brief problem description]

SYMPTOMS:
- [What you observe]
- [When it happens]
- [Error messages if any]

EXPECTED:
- [What should happen]

WHAT I'VE TRIED:
- [Attempt 1]
- [Attempt 2]

MY HYPOTHESIS:
[Your best guess about the cause]

RELEVANT CODE:
- [File 1]: [brief description of relevance]
- [File 2]: [brief description of relevance]

Please investigate [specific area] and suggest fixes.
```

## Refactoring template

```
Refactor [component/function] to improve [goal].

CURRENT ISSUES:
- [Issue 1]
- [Issue 2]

CONSTRAINTS:
- Don't change the public API
- Keep existing tests passing
- Don't add new dependencies

SPECIFIC IMPROVEMENTS:
- [Improvement 1]
- [Improvement 2]

Show me the plan before making changes.
```

## Visual implementation template (for Figma designs)

```
Implement this UI from Figma.

ACCESS: [Figma MCP selection / paste Figma link]

COMPONENT NAME: [Name]
LOCATION: src/features/[feature]/components/[Name].tsx

STYLING:
- Use Tailwind CSS
- Reference design tokens where applicable
- Mobile-first responsive approach

EXISTING COMPONENTS TO USE:
- Button from @/components/Button
- Input from @/components/Form

INTERACTIONS:
- [Describe any hover states, clicks, etc.]

DATA:
- Props interface should accept: [describe data shape]
- Component should be presentational (no data fetching)

After implementation, tell me what to check in the browser.
```

</section>

---

# 7. Collaborative Specification Building

<section id="collaborative-specification">

This section transforms Claude from a code generator into a **specification partner**. Use these workflows to build clear, complete specifications before writing any code—dramatically improving development outcomes.

## The Philosophy: Spec Before Code

**Why this matters for novice developers**: The biggest source of wasted effort is building the wrong thing, or building the right thing the wrong way. By investing 15-30 minutes in collaborative specification, you:

- Catch design problems before they become code problems
- Create documentation that guides future development
- Build shared understanding between you and Claude Code
- Reduce "that's not what I wanted" rework by 80%+

## How to Initiate a Specification Session

Start any new feature with this prompt:

```
I want to build [feature name]. Before we write any code, let's build 
a complete specification together.

Read docs/KNOWLEDGE_BIBLE.md, specifically Section 7 (Collaborative Specification Building).

Walk me through the specification process, asking me questions to fill in 
each section. Challenge my assumptions if you see potential issues.
Don't write any code until I approve the final spec.
```

## The Specification Interview Process

<spec-workflow id="interview-process">

### Phase 1: Problem Definition (5 minutes)

Claude should ask these questions:

```
PROBLEM DEFINITION QUESTIONS:

1. WHAT problem are we solving?
   "Describe the user problem or need in one sentence."
   
2. WHO is the user?
   "Is this for the Director (GM), Players, or both?"
   
3. WHY now?
   "What's blocking progress without this feature?"
   
4. HOW will we know it works?
   "What does success look like? How will you test it?"
```

**Example exchange:**

> **You**: I want to add an abilities section to the character sheet.
>
> **Claude**: Before we design the solution, help me understand the problem:
> 1. What specific problem does this solve for your users?
> 2. Is this primarily for players managing their own characters, or for Directors viewing player abilities?
> 3. What's currently painful about how abilities are handled?
> 4. What would "working correctly" look like when you test it?

### Phase 2: Scope Definition (5 minutes)

```
SCOPE DEFINITION QUESTIONS:

1. MUST HAVE (MVP):
   "What's the absolute minimum for this to be useful?"
   
2. SHOULD HAVE (v1.0):
   "What would make it feel complete?"
   
3. COULD HAVE (future):
   "What are nice-to-haves we should plan for but not build yet?"
   
4. WON'T HAVE (explicitly excluded):
   "What related features are NOT part of this work?"
```

**Example exchange:**

> **Claude**: Let's define scope. For the abilities section:
>
> **MUST HAVE** - What's the minimum viable version?
> - Just display abilities?
> - Edit abilities?
> - Track uses per rest?
>
> **You**: Display abilities with name, description, and a "use" button that decrements available uses.
>
> **Claude**: Got it. What about:
> - **SHOULD HAVE** for v1.0? (filtering, sorting, visual feedback?)
> - **WON'T HAVE** for now? (ability creation, drag-and-drop reordering?)

### Phase 3: Data Model Design (5 minutes)

```
DATA MODEL QUESTIONS:

1. What data does this feature need?
2. Where does that data come from?
3. How does it relate to existing data?
4. What are the edge cases?
```

Claude should propose a data model and ask for validation:

```typescript
// Claude proposes:
interface Ability {
  id: string;
  name: string;
  description: string;
  usesPerRest: number | null;  // null = unlimited
  currentUses: number;
  abilityType: 'action' | 'maneuver' | 'triggered' | 'passive';
  keywords: string[];
}

// Questions for you:
// 1. Does this capture all ability types in Draw Steel?
// 2. Should abilities track what kind of rest resets them (short/long)?
// 3. Are there abilities with cooldowns instead of uses?
// 4. Do abilities ever have variable costs?
```

### Phase 4: UI/UX Design (5-10 minutes)

```
UI/UX QUESTIONS:

1. Where does this live in the interface?
2. What's the primary user action?
3. What feedback does the user need?
4. How does it behave on mobile?
5. What existing components can we reuse?
```

Claude should sketch the UI in text:

```
PROPOSED LAYOUT:

┌─────────────────────────────────────────────────────┐
│ ABILITIES                                    [+Add] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🗡️ Mighty Strike              [Use] 2/3 uses   │ │
│ │ Deal 2d6 + Might damage to adjacent enemy      │ │
│ │ Keywords: attack, melee                        │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🛡️ Defensive Stance            [Toggle: ON]    │ │
│ │ +2 to defense until start of next turn         │ │
│ │ Keywords: defensive, stance                    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

INTERACTIONS:
- Click [Use] → decrements uses, shows animation
- Click ability card → expands full description
- Uses at 0 → button disabled, visual dimming
- [+Add] → opens ability picker modal

QUESTIONS FOR YOU:
1. Does this layout match your vision?
2. Should passive abilities look different from active ones?
3. What animation/feedback when using an ability?
```

### Phase 5: Technical Approach (5 minutes)

```
TECHNICAL APPROACH QUESTIONS:

1. What components need to be created/modified?
2. What state management changes are needed?
3. What database changes are required?
4. What's the sync strategy for multiplayer?
5. What tests should we write?
```

Claude should propose an implementation plan:

```
IMPLEMENTATION PLAN:

FILES TO CREATE:
- src/features/characters/components/AbilityList/AbilityList.tsx
- src/features/characters/components/AbilityCard/AbilityCard.tsx
- src/features/characters/components/AbilityCard/AbilityCard.test.tsx

FILES TO MODIFY:
- src/features/characters/CharacterSheet.tsx (add AbilityList)
- src/stores/characterStore.ts (add ability actions)
- src/types/character.ts (add Ability interface)

DATABASE:
- Create abilities table with character_id foreign key
- Add RLS policy: users can only modify their own characters' abilities

STATE FLOW:
1. Component mounts → fetch abilities from Supabase
2. User clicks [Use] → optimistic update to store
3. Sync to Supabase → handle conflicts
4. Real-time subscription updates other clients

QUESTIONS:
1. Should ability data be embedded in character or separate table?
2. Do we need real-time sync for ability uses? (or just on refresh)
3. Any existing patterns for similar features I should follow?
```

</spec-workflow>

## Specification Document Template

After the interview, Claude should generate a complete spec document:

```markdown
# Feature Specification: [Feature Name]

**Created**: [Date]
**Status**: Draft | Approved | In Progress | Complete
**Author**: [Your name] + Claude

---

## 1. Problem Statement

**User Story**: As a [user type], I want to [action] so that [benefit].

**Current Pain Point**: [What's broken or missing]

**Success Criteria**:
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

---

## 2. Scope

### In Scope (MVP)
- [Feature 1]
- [Feature 2]

### In Scope (v1.0)
- [Feature 3]
- [Feature 4]

### Out of Scope
- [Explicitly excluded 1]
- [Explicitly excluded 2]

### Future Considerations
- [Thing we should design for but not build]

---

## 3. Data Model

```typescript
// Paste the agreed-upon interfaces here
```

### Database Schema
```sql
-- Paste migration or table definition
```

### Relationships
- [Describe how this relates to existing data]

---

## 4. User Interface

### Layout
```
[ASCII art or description of layout]
```

### Components
| Component | Purpose | Props |
|-----------|---------|-------|
| [Name] | [What it does] | [Key props] |

### States
- **Default**: [description]
- **Loading**: [description]
- **Empty**: [description]
- **Error**: [description]

### Interactions
| User Action | System Response |
|-------------|-----------------|
| [Action] | [Response] |

### Responsive Behavior
- **Desktop**: [behavior]
- **Mobile**: [behavior]

---

## 5. Technical Design

### Files to Create
- `path/to/file.tsx` - [purpose]

### Files to Modify
- `path/to/file.tsx` - [what changes]

### State Management
- **Store**: [which store]
- **Actions**: [list of actions]
- **Selectors**: [list of selectors]

### API/Database
- **Queries**: [what queries]
- **Mutations**: [what mutations]
- **Real-time**: [subscription needs]

### Error Handling
- [Error scenario 1] → [handling]
- [Error scenario 2] → [handling]

---

## 6. Testing Strategy

### Unit Tests
- [ ] [Test case 1]
- [ ] [Test case 2]

### Integration Tests
- [ ] [Test case 1]

### E2E Tests
- [ ] [Critical path test]

### Manual Testing Checklist
- [ ] [Manual check 1]
- [ ] [Manual check 2]

---

## 7. Implementation Plan

### Phase 1: [Name] (estimated: X hours)
1. [Step 1]
2. [Step 2]

### Phase 2: [Name] (estimated: X hours)
1. [Step 1]
2. [Step 2]

### Verification Points
After each phase, verify:
- [ ] [What to check]

---

## 8. Open Questions

- [ ] [Question that needs resolution]
- [ ] [Decision that needs to be made]

---

## Approval

- [ ] Problem statement is accurate
- [ ] Scope is appropriate for MVP
- [ ] Data model handles edge cases
- [ ] UI matches vision
- [ ] Technical approach is sound
- [ ] Ready to implement
```

## Quick-Start Prompts for Common Scenarios

### New Component
```
I need to build a new [ComponentName] component.

Read docs/KNOWLEDGE_BIBLE.md Section 7 and help me create a specification.
Start by asking me about the problem this component solves.
```

### New Feature
```
I want to add [feature] to the app.

Read docs/KNOWLEDGE_BIBLE.md Section 7 and walk me through 
the full specification interview. Challenge my assumptions.
```

### Refactoring
```
I need to refactor [area of code] because [problem].

Read docs/KNOWLEDGE_BIBLE.md Section 7 and help me create 
a refactoring specification. Focus on:
- What's wrong with the current approach
- What the improved version should look like
- How to migrate safely
```

### Bug Fix
```
I have a bug: [description]

Before we fix it, help me create a mini-spec that includes:
- Exact reproduction steps
- Root cause hypothesis
- Proposed fix
- Test to prevent regression
```

### Design Decision
```
I'm trying to decide between [option A] and [option B] for [feature].

Read docs/KNOWLEDGE_BIBLE.md and help me think through this decision.
Ask me questions about my priorities and constraints, then give me 
a recommendation with clear reasoning.
```

## The Pushback Protocol

Claude should actively challenge your ideas when appropriate. Encourage this:

```
INSTRUCTIONS FOR CLAUDE:

When reviewing my feature ideas, actively look for:

1. SCOPE CREEP: "This sounds like 3 features. Can we narrow to just [core thing]?"

2. OVER-ENGINEERING: "This seems more complex than needed. Could we start with [simpler approach]?"

3. MISSING EDGE CASES: "What happens when [edge case]? We should handle that."

4. PATTERN VIOLATIONS: "This doesn't match our existing patterns. Should it be different, or should we follow [existing pattern]?"

5. PREMATURE OPTIMIZATION: "Let's build the simple version first and optimize if needed."

6. UNCLEAR REQUIREMENTS: "I don't understand [thing]. Can you clarify?"

Don't just agree with everything I say. A good spec requires pushback.
```

## Integration with Claude Code Workflow

After specification is complete:

```
The specification at docs/specs/[feature-name].md is approved.

Read the spec and begin implementation following the phased plan.
After each phase, tell me what to verify before continuing.
Don't deviate from the spec without discussing changes first.
```

### Updating Specs During Development

When you discover something during development:

```
During implementation, I discovered [issue/change needed].

Update the spec at docs/specs/[feature-name].md to reflect:
- [What changed]
- [Why it changed]
- [Impact on other parts]

Then continue implementation with the updated plan.
```

## Specification Storage Convention

```
docs/
├── specs/
│   ├── completed/           # Implemented specs (for reference)
│   │   ├── stamina-tracker.md
│   │   └── character-creation.md
│   ├── in-progress/         # Currently being built
│   │   └── abilities-section.md
│   └── proposed/            # Approved but not started
│       └── campaign-management.md
└── KNOWLEDGE_BIBLE.md
```

<claude-code-instruction id="save-spec">
### Claude Code Instruction: Save Specification

```
Save our completed specification to docs/specs/proposed/[feature-name].md

Use the specification template from KNOWLEDGE_BIBLE.md Section 7.
Include all decisions we made during our discussion.
Mark status as "Approved - Ready for Implementation"
```
</claude-code-instruction>

</section>

---

# 8. Terminology and Conceptual Frameworks

<section id="terminology">

This glossary covers essential terms you'll encounter. Understanding these concepts helps you communicate more effectively with Claude Code and other developers.

## Architecture concepts

| Term | Definition | Example in Your Project |
|------|------------|------------------------|
| **Component** | A reusable, self-contained UI building block | `StaminaTracker`, `CharacterCard` |
| **State** | Data that changes over time and affects UI | Character's current HP, selected character ID |
| **Props** | Data passed from parent to child component | `<StaminaTracker current={10} max={15} />` |
| **Store** | Central location for managing shared state | Zustand store holding all character data |
| **Side effect** | Operations outside rendering (API calls, subscriptions) | Saving character to Supabase |
| **Derived state** | Values computed from other state | Might modifier = (might - 10) |
| **Optimistic update** | Update UI immediately, sync to server after | Show HP change before Supabase confirms |

## React patterns

| Term | Definition | When to Use |
|------|------------|-------------|
| **Custom hook** | Reusable function starting with `use` | Share logic between components: `useCharacter()` |
| **Context** | Way to pass data through component tree | Theme, auth state (avoid for frequent updates) |
| **Controlled component** | Form input where React controls the value | `<input value={name} onChange={setName} />` |
| **Composition** | Building complex UI from simple components | `<Card><CardHeader /><CardBody /></Card>` |
| **Render prop** | Prop that is a function returning JSX | Flexibility in what children render |
| **Higher-order component (HOC)** | Function that wraps a component | `withAuth(ProtectedPage)` |

## Database and sync concepts

| Term | Definition | Your Implementation |
|------|------------|---------------------|
| **CRUD** | Create, Read, Update, Delete operations | Basic database operations |
| **Row-Level Security (RLS)** | Database rules limiting who sees what data | Users only see their own characters |
| **Foreign key** | Reference to another table's row | Character's `campaign_id` references campaigns |
| **Real-time subscription** | Live updates when database changes | Character updates appear for all players |
| **Optimistic locking** | Detect conflicts using version numbers | Prevent overwriting others' changes |
| **CRDT** | Conflict-free Replicated Data Type | Automatic merge for simultaneous edits |

## Testing terminology

| Term | Definition | Example |
|------|------------|---------|
| **Unit test** | Tests one function/component in isolation | Test `calculateModifier(12)` returns 2 |
| **Integration test** | Tests multiple units working together | Test form submission saves to store |
| **E2E test** | Tests complete user journey | Test character creation from start to finish |
| **Mock** | Fake implementation of a dependency | Mock Supabase client in tests |
| **Assertion** | Statement that must be true for test to pass | `expect(result).toBe(5)` |
| **Test fixture** | Sample data used in tests | Test character with known values |

## Git terminology

| Term | Definition | Command |
|------|------------|---------|
| **Repository (repo)** | Project folder tracked by git | Your Draw Steel app folder |
| **Commit** | Snapshot of changes | `git commit -m "message"` |
| **Branch** | Independent line of development | `git checkout -b feature/new-thing` |
| **Merge** | Combine branches | `git merge feature/new-thing` |
| **Pull Request (PR)** | Request to merge changes | Created on GitHub |
| **Rebase** | Replay commits on different base | `git rebase main` |
| **Stash** | Temporarily store uncommitted changes | `git stash` / `git stash pop` |

## Mental models for software architecture

### The UI layer cake

```
┌─────────────────────────────────────┐
│         UI Components               │ ← What users see and interact with
├─────────────────────────────────────┤
│         State Management            │ ← Zustand stores, React state
├─────────────────────────────────────┤
│         Business Logic              │ ← Character calculations, rules
├─────────────────────────────────────┤
│         Data Access                 │ ← Supabase client, API calls
├─────────────────────────────────────┤
│         External Services           │ ← Supabase, auth providers
└─────────────────────────────────────┘
```

**Key insight**: Each layer should only talk to adjacent layers. UI shouldn't directly call Supabase—it goes through state management or data access layers.

### The request-response cycle

```
User Action → Event Handler → State Update → Re-render → Visual Update
     ↓
Side Effect (optional) → API Call → Server Processing → Response
     ↓
State Update from Response → Re-render → Visual Update
```

### Data flow patterns

**Unidirectional data flow** (React's model):
```
State → Props → Component → User Event → Action → State (cycle)
```

**Bidirectional sync** (real-time apps):
```
Local State ⟷ Server State
     ↓              ↓
   Local UI    Other Clients
```

## Common patterns and anti-patterns

<patterns id="patterns-antipatterns">
### Patterns (DO)

**Single Responsibility**: Each component/function does one thing well
```typescript
// Good: Separate concerns
function calculateModifier(stat: number): number { return stat - 10; }
function formatModifier(mod: number): string { return mod >= 0 ? `+${mod}` : `${mod}`; }
```

**Composition over Inheritance**: Build complex from simple
```tsx
// Good: Composable components
<Card>
  <CardHeader title="Character Stats" />
  <CardBody><StatsDisplay stats={character.stats} /></CardBody>
</Card>
```

**Fail Fast**: Validate inputs early, error immediately
```typescript
// Good: Early validation
function updateStamina(current: number, max: number) {
  if (current < 0) throw new Error("Stamina cannot be negative");
  if (current > max) throw new Error("Current cannot exceed max");
  // proceed with valid data
}
```

### Anti-patterns (DON'T)

**Prop Drilling**: Passing props through many layers
```tsx
// Bad: Props passed through components that don't use them
<App>
  <Layout character={character}>
    <Sidebar character={character}>
      <CharacterName character={character} /> // Finally used here
```

**Fix**: Use Zustand store or Context for deeply-nested data.

**God Component**: One component doing too much
```tsx
// Bad: Component handles everything
function CharacterPage() {
  // Fetching, state, calculations, rendering, error handling all here
  // 500+ lines of code
}
```

**Fix**: Break into smaller, focused components.

**Storing Derived State**: Saving computed values
```typescript
// Bad: Storing what can be calculated
const [modifier, setModifier] = useState(stat - 10);
// Now you must keep it in sync when stat changes
```

**Fix**: Calculate derived values during render.
</patterns>

</section>

---

# 9. Quality Assurance and Vision Alignment

<section id="quality-assurance">

This section helps you maintain design vision and code quality throughout development.

## Maintaining design vision with AI

AI assistants can drift from your design intent. Use these strategies:

### 1. Create a design system document

```markdown
<!-- docs/DESIGN_SYSTEM.md -->
# Draw Steel Tracker Design System

## Design Principles
1. **Clear hierarchy**: Most important info is largest and boldest
2. **Accessible**: Minimum contrast ratios, keyboard navigable
3. **Consistent**: Same patterns throughout the app
4. **Draw Steel flavored**: Fantasy RPG aesthetic, not corporate

## Color Palette
- Primary: Indigo (#6366f1) - Actions, links, focus states
- Surface: Slate scale - Backgrounds and cards
- Danger: Red (#ef4444) - Destructive actions, low HP warnings
- Success: Green (#22c55e) - Positive feedback

## Typography
- Headers: Inter Bold, tracking-tight
- Body: Inter Regular
- Numbers/stats: JetBrains Mono (monospace for alignment)

## Component Patterns
- Cards have 1px border + subtle shadow
- Buttons have rounded-lg (8px) corners
- Input focus rings use ring-2 ring-primary

## Spacing Scale
- Use Tailwind's default scale: 2, 4, 6, 8, 12, 16, 24, 32
- Components have p-4 padding default
- Sections separated by gap-6

## Don't
- Don't use more than 3 font sizes per screen
- Don't mix rounded-md and rounded-lg on the same level
- Don't use red for non-error/non-danger states
```

Reference this in prompts:
```
Create the abilities list component following our design system in docs/DESIGN_SYSTEM.md.
Pay special attention to the spacing scale and card patterns.
```

### 2. Use visual regression testing

Compare screenshots before and after changes:

```typescript
// playwright/visual.spec.ts
import { test, expect } from '@playwright/test';

test('character sheet matches design', async ({ page }) => {
  await page.goto('/characters/test-character');
  await expect(page).toHaveScreenshot('character-sheet.png');
});
```

### 3. Regular design audits

Every few features, review the UI against your Figma designs:

```
Look at the current implementation of the character sheet page.
Compare it to the Figma design (use MCP to access).
List any visual inconsistencies you notice:
- Spacing differences
- Color mismatches  
- Typography issues
- Missing states (hover, focus)
```

## Code quality metrics

Track these metrics to maintain quality:

<checklist id="quality-metrics">
### Quality Metrics Checklist

**Weekly Review**
- [ ] TypeScript: 0 `any` types in production code
- [ ] Lint: 0 ESLint errors
- [ ] Tests: All passing, >60% coverage on critical paths
- [ ] Console: No warnings in browser console

**Per Feature**
- [ ] New components have tests
- [ ] Props interfaces are complete and accurate
- [ ] Loading and error states handled
- [ ] Accessible (keyboard nav, screen reader)

**Monthly Audit**
- [ ] Review bundle size (no unexpected growth)
- [ ] Check for unused dependencies
- [ ] Update documentation
- [ ] Review and clean up tech debt
</checklist>

## When to refactor vs. proceed

Use this framework when code feels "wrong" but works:

| Situation | Action |
|-----------|--------|
| Code works but is hard to understand | Add comments/docs now, refactor later |
| Same logic duplicated 3+ times | Refactor into shared function/component |
| Performance issue noticed | Profile first, optimize only confirmed bottlenecks |
| "I might need this flexibility later" | Don't add it—wait until needed (YAGNI) |
| Bug fixes keep touching same file | Refactor that file to reduce complexity |
| Tests are hard to write | Usually signals design issue—consider refactoring |

### The Boy Scout Rule

Leave code better than you found it. When working on a feature:
- Fix obvious issues you encounter (typos, formatting)
- Don't expand scope dramatically
- Note bigger issues for later (create GitHub issues)

## Ensuring AI code aligns with goals

### Pre-generation checklist

Before asking Claude to generate substantial code:

```
BEFORE GENERATING:
1. Did I provide the component specification?
2. Did I reference existing patterns to follow?
3. Did I specify what NOT to do?
4. Did I mention the design system constraints?
5. Did I explain the context (where this fits)?
```

### Post-generation review

After Claude generates code:

```
REVIEW CHECKLIST:
1. Does it follow established patterns?
2. Are the TypeScript types accurate?
3. Does it handle loading/error states?
4. Are there any hardcoded values that should be configurable?
5. Does it match the design system?
6. Are there any security concerns?
7. Did it add unexpected dependencies?
```

### Course correction prompts

When generated code drifts from your vision:

```
This implementation works but doesn't match our patterns.
Looking at [existing component], I see we use [pattern].
Please refactor to follow that pattern instead of [current approach].
```

```
The styling is close but not quite right. Specifically:
- The padding should be 16px, not 12px
- Use rounded-lg, not rounded-md
- The text color should be text-slate-700
Please adjust these values.
```

```
This is more complex than needed. I want the simplest possible
implementation that works. Can you simplify by:
- Removing [unnecessary feature]
- Using [simpler approach] instead of [complex approach]
```

</section>

---

# Quick Reference Card

<quick-reference>

## Claude Code Essential Commands
| Command | Purpose |
|---------|---------|
| `/init` | Generate CLAUDE.md file |
| `/clear` | Reset context (use often!) |
| `/resume` | Return to previous conversation |
| `#` key | Add to CLAUDE.md |
| Escape | Stop current action |

## Thinking Keywords
| Keyword | Effect |
|---------|--------|
| "think" | Basic extended thinking |
| "think hard" | More analysis |
| "think harder" | Even more thorough |
| "ultrathink" | Maximum reasoning |

## Prompt Patterns
```
"Give me options starting with simplest. Don't code yet."
"Follow the pattern in [existing file]."
"Before implementing, tell me if you see problems."
"After each change, tell me what to verify in browser."
```

## Specification Quick-Start
```
Read docs/KNOWLEDGE_BIBLE.md Section 7 and help me create 
a specification for [feature]. Walk me through the interview process.
```

## File Structure Quick Reference
```
CLAUDE.md          → Project context for Claude
docs/KNOWLEDGE_BIBLE.md → This document
docs/specs/        → Feature specifications
src/components/    → Shared UI components
src/features/      → Feature modules
src/stores/        → Zustand stores
src/types/         → TypeScript types
```

## Git Commit Types
```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Formatting
refactor: Restructure
test:     Tests
chore:    Maintenance
```

## Design Token Naming
```
--color-[category]-[variant]     → --color-primary-500
--spacing-[size]                 → --spacing-md
--radius-[size]                  → --radius-lg
--shadow-[intensity]             → --shadow-sm
```

## Debugging Process
```
1. Reproduce → 2. Hypothesize → 3. Test → 4. Fix → 5. Verify
```

## Testing Priority
```
Unit tests (70%) → Integration (20%) → E2E (10%)
```

## Specification Phases
```
1. Problem Definition (5 min)
2. Scope Definition (5 min)
3. Data Model Design (5 min)
4. UI/UX Design (5-10 min)
5. Technical Approach (5 min)
```

</quick-reference>

---

# Final Notes

This knowledge bible is a living document. Update it as you learn new patterns and discover what works best for your Draw Steel project. The key insights to remember:

1. **Your stack is solid**: React/TypeScript/Supabase/Playwright is an excellent foundation
2. **CLAUDE.md is your best friend**: Set it up properly and update it regularly
3. **Spec before code**: Use Section 7 to build specifications collaboratively
4. **Clear context often**: Don't let Claude's context get cluttered
5. **Plan before coding**: Ask Claude for options before implementation
6. **Test incrementally**: Verify in the browser after every change
7. **Document decisions**: Future you (and Claude) will thank you


