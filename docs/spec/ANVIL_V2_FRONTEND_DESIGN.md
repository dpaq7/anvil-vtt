# Anvil V2 — Frontend Design System

> Consistent, clean, shadcn-based design for Directors and Players

---

## Design Principles

### 1. Unified Mental Model
Campaign Builder and Live Session use the **same layout structure**. Directors learn one interface, not two.

### 2. Content Over Chrome
Maximize stage area. Sidebars are slim icon rails that expand on demand. Every pixel serves gameplay.

### 3. Mode Communicates State
Scene type colors tint the interface. You always know what mode you're in at a glance.

### 4. Progressive Disclosure
Show essentials first. Details expand on interaction. Don't overwhelm new users.

### 5. Dark by Default
Optimized for evening play sessions. High contrast for readability. Easy on the eyes.

---

## Color System

Built on shadcn/ui's CSS variable approach for consistent theming.

### Base Colors (Dark Theme)

```css
:root {
  /* Backgrounds - from deepest to elevated */
  --background: 240 10% 3.9%;        /* #09090b - void/canvas */
  --background-deep: 240 6% 6%;      /* #0f0f11 - panels */
  --card: 240 6% 10%;                /* #18181b - cards */
  --popover: 240 6% 10%;             /* #18181b - dropdowns */
  --muted: 240 5% 15%;               /* #25252a - disabled bg */
  
  /* Foreground */
  --foreground: 0 0% 98%;            /* #fafafa - primary text */
  --muted-foreground: 240 5% 65%;    /* #a1a1aa - secondary text */
  
  /* Borders */
  --border: 240 5% 17%;              /* #2a2a2f - subtle */
  --border-strong: 240 5% 26%;       /* #404047 - emphasis */
  
  /* Primary Action */
  --primary: 217 91% 60%;            /* #3b82f6 - blue */
  --primary-foreground: 0 0% 100%;
  
  /* Destructive */
  --destructive: 0 84% 60%;          /* #ef4444 - red */
  --destructive-foreground: 0 0% 100%;
  
  /* Ring (focus) */
  --ring: 217 91% 60%;               /* matches primary */
  
  /* Radius */
  --radius: 0.5rem;                  /* 8px - consistent rounding */
}
```

### Scene Mode Colors

Each scene type has a signature color that tints the interface subtly.

```css
:root {
  /* Scene mode accent colors */
  --mode-battle: 0 84% 60%;          /* #ef4444 - red */
  --mode-story: 187 100% 42%;        /* #00BCD4 - cyan */
  --mode-montage: 142 76% 36%;       /* #22c55e - green */
  --mode-negotiation: 38 92% 50%;    /* #f59e0b - amber */
  --mode-respite: 45 93% 47%;        /* #eab308 - yellow */
}

/* Applied via data attribute on root */
[data-scene-mode="battle"] {
  --mode-accent: var(--mode-battle);
}
[data-scene-mode="story"] {
  --mode-accent: var(--mode-story);
}
/* etc. */
```

### Semantic Colors

```css
:root {
  /* Status */
  --success: 142 76% 36%;            /* #22c55e */
  --warning: 38 92% 50%;             /* #f59e0b */
  --error: 0 84% 60%;                /* #ef4444 */
  --info: 217 91% 60%;               /* #3b82f6 */
  
  /* Entity roles (for tokens, cards) */
  --role-defender: 217 91% 60%;      /* blue */
  --role-striker: 0 84% 60%;         /* red */
  --role-controller: 271 81% 56%;    /* purple #8b5cf6 */
  --role-support: 142 76% 36%;       /* green */
  
  /* Resource bars */
  --stamina: 142 76% 36%;            /* green */
  --stamina-winded: 38 92% 50%;      /* amber when ≤50% */
  --stamina-dying: 0 84% 60%;        /* red when ≤0 */
  --heroic-resource: 271 81% 56%;    /* purple */
}
```

---

## Typography

### Font Stack

```css
:root {
  /* Primary - clean, readable */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  /* Display - cinematic headers (optional, loads async) */
  --font-display: "Cinzel", Georgia, serif;
  
  /* Mono - stats, dice, code */
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}
```

### Type Scale

| Name | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| `display` | 2rem (32px) | 700 | 1.1 | Campaign titles, scene headers |
| `h1` | 1.5rem (24px) | 600 | 1.2 | Section headers |
| `h2` | 1.25rem (20px) | 600 | 1.3 | Card titles |
| `h3` | 1rem (16px) | 600 | 1.4 | Subsections |
| `body` | 0.875rem (14px) | 400 | 1.5 | Default text |
| `small` | 0.75rem (12px) | 400 | 1.4 | Captions, labels |
| `tiny` | 0.625rem (10px) | 500 | 1.2 | Badges, minimal UI |

### Usage

```tsx
// Tailwind classes
<h1 className="text-2xl font-semibold tracking-tight">Scene Title</h1>
<p className="text-sm text-muted-foreground">Secondary info</p>
<span className="font-mono text-sm">2d10+5</span>
```

---

## Spacing System

Use Tailwind's default 4px base scale consistently.

| Token | Value | Use |
|-------|-------|-----|
| `0.5` | 2px | Minimal gaps (icon + text) |
| `1` | 4px | Tight spacing |
| `2` | 8px | Related elements |
| `3` | 12px | Default component padding |
| `4` | 16px | Card padding, section gaps |
| `6` | 24px | Large section gaps |
| `8` | 32px | Page-level spacing |

### Spacing Rules

1. **Inside cards**: `p-3` (12px) or `p-4` (16px)
2. **Between cards**: `gap-3` (12px)
3. **Between sections**: `gap-6` (24px)
4. **Icon + label**: `gap-2` (8px)
5. **Sidebar items**: `gap-1` (4px) vertically

---

## The Unified Layout

**Key Decision**: Campaign Builder and Live Session share the same structural layout. This reduces learning curve and allows consistent muscle memory.

### Core Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  Top Bar (48px)                                                     │
│  Logo │ Breadcrumb/Title │ Mode Indicator │ Connection │ User      │
├────┬──────────────────────────────────────────────────────────┬────┤
│    │                                                          │    │
│ L  │                                                          │  R │
│ e  │                      Stage                               │  i │
│ f  │                   (flex-1, fills)                        │  g │
│ t  │                                                          │  h │
│    │                                                          │  t │
│ R  │                                                          │    │
│ a  │  Scene content adapts:                                   │  R │
│ i  │  - Battle: Canvas + Grid                                 │  a │
│ l  │  - Story: Rich text area                                 │  i │
│    │  - Montage: Progress tracker                             │  l │
│48px│  - Negotiation: NPC + meters                             │48px│
│    │  - Respite: Activity cards                               │    │
│    │                                                          │    │
├────┴──────────────────────────────────────────────────────────┴────┤
│  Film Strip (56px) - Director only in Live                         │
│  [Scene] [Scene] [Scene*] [Scene] [+]                              │
├────────────────────────────────────────────────────────────────────┤
│  Status Bar (32px)                                                  │
│  Scene: Battle │ Round 3 │ Connection ● │ 4 Players                │
└────────────────────────────────────────────────────────────────────┘
```

### Dimensions

| Element | Size | Notes |
|---------|------|-------|
| Top Bar | 48px | Fixed |
| Left Rail | 48px collapsed, 280px expanded | Icon rail + flyout panel |
| Right Rail | 48px collapsed, 320px expanded | Icon rail + flyout panel |
| Film Strip | 56px | Director only in live, always in builder |
| Status Bar | 32px | Fixed, minimal info |
| Stage | flex-1 | Fills remaining space |

### Layout Differences by Context

| Element | Campaign Builder | Live Session (Director) | Live Session (Player) |
|---------|-----------------|------------------------|----------------------|
| Top Bar | Campaign name + nav | Session name + room code | Hero vitals bar |
| Left Rail | Content tree | Scene tools | Abilities |
| Right Rail | Properties panel | Party/Entities | Character sheet |
| Film Strip | Always visible | Always visible | Hidden |
| Status Bar | Save status | Combat state | Turn indicator |

---

## Icon Rail Pattern

Both sidebars use the same pattern: a slim icon rail that expands to show a panel.

### Rail Structure

```
┌────┐
│ 🏠 │  ← Icon button (48x40px)
├────┤
│ 📁 │  ← Active state: bg-muted, left accent border
├────┤
│ 👤 │
├────┤
│ ⚔️ │
├────┤     
│    │  ← Spacer (flex-1)
│    │
├────┤
│ ⚙️ │  ← Bottom-pinned items
└────┘
```

### Rail + Panel Expansion

```tsx
// When an icon is clicked, its panel slides out

// Collapsed (48px total)
┌────┐
│ 📁 │
└────┘

// Expanded (48px rail + 232px panel = 280px)
┌────┬────────────────────────────┐
│ 📁 │  Panel Header          [×] │
│    ├────────────────────────────┤
│    │  Panel content scrolls     │
│    │  ...                       │
└────┴────────────────────────────┘
```

### Implementation

```tsx
// Left sidebar state
const [activePanel, setActivePanel] = useState<string | null>(null);

<aside className="flex h-full">
  {/* Icon rail - always visible */}
  <div className="w-12 flex flex-col border-r border-border bg-background-deep">
    <RailButton
      icon={<FolderTree />}
      tooltip="Content"
      active={activePanel === 'content'}
      onClick={() => setActivePanel(activePanel === 'content' ? null : 'content')}
    />
    <RailButton
      icon={<Swords />}
      tooltip="Combat"
      active={activePanel === 'combat'}
      onClick={() => setActivePanel(activePanel === 'combat' ? null : 'combat')}
    />
    {/* ... */}
  </div>
  
  {/* Expandable panel */}
  {activePanel && (
    <div className="w-[232px] border-r border-border bg-card animate-in slide-in-from-left-2">
      <PanelContent type={activePanel} onClose={() => setActivePanel(null)} />
    </div>
  )}
</aside>
```

---

## Film Strip

Horizontal scrollable list of scene cards. Primary navigation for Directors.

### Scene Card Design

```
┌──────────────────┐
│ ┌──────────────┐ │  64×48px
│ │   Thumbnail  │ │  or
│ │   or Icon    │ │  Scene type icon
│ └──────────────┘ │
│ ⚔️ Battle 1      │  Type icon + truncated title
│ 👁️               │  Visibility toggle (Director only)
└──────────────────┘
  80px wide
```

### States

```css
/* Default */
.scene-card {
  @apply bg-card border border-border rounded-md;
}

/* Active (current scene) */
.scene-card[data-active="true"] {
  @apply border-primary ring-1 ring-primary/50;
}

/* Hover */
.scene-card:hover {
  @apply border-muted-foreground;
}

/* Hidden from players */
.scene-card[data-hidden="true"] {
  @apply opacity-50;
}
```

### Film Strip Container

```tsx
<div className="h-14 border-t border-border bg-background-deep">
  <ScrollArea orientation="horizontal" className="h-full px-2">
    <div className="flex items-center gap-2 py-1">
      {scenes.map(scene => (
        <SceneCard
          key={scene.id}
          scene={scene}
          active={scene.id === activeSceneId}
          onSelect={() => setActiveScene(scene.id)}
        />
      ))}
      <AddSceneButton />
    </div>
  </ScrollArea>
</div>
```

---

## Component Library (shadcn/ui)

### Core Components Used

| Component | Use |
|-----------|-----|
| `Button` | Actions, navigation |
| `Card` | Content containers |
| `Dialog` | Modals, confirmations |
| `DropdownMenu` | Context menus |
| `Input`, `Textarea` | Form fields |
| `Label` | Form labels |
| `ScrollArea` | Scrollable regions |
| `Select` | Dropdowns |
| `Separator` | Visual dividers |
| `Tabs` | Section switching |
| `Tooltip` | Icon hints |
| `Sheet` | Mobile sidebars, large forms |

### Custom Components

Built on shadcn primitives:

#### RailButton

```tsx
interface RailButtonProps {
  icon: ReactNode;
  tooltip: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}

function RailButton({ icon, tooltip, active, badge, onClick }: RailButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "relative w-12 h-10 flex items-center justify-center",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "transition-colors",
            active && "text-foreground bg-muted border-l-2 border-primary"
          )}
        >
          {icon}
          {badge !== undefined && badge > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-medium flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
```

#### StaminaBar

```tsx
interface StaminaBarProps {
  current: number;
  max: number;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function StaminaBar({ current, max, showNumbers = true, size = 'md' }: StaminaBarProps) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  const isWinded = current <= max / 2;
  const isDying = current <= 0;
  
  const height = size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2.5' : 'h-4';
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", height)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isDying ? "bg-destructive" :
            isWinded ? "bg-warning" :
            "bg-success"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showNumbers && (
        <span className="font-mono text-sm text-muted-foreground w-16 text-right">
          {current}/{max}
        </span>
      )}
    </div>
  );
}
```

#### SceneTypeIcon

```tsx
const SCENE_ICONS = {
  battle: Swords,
  story: BookOpen,
  montage: Mountain,
  negotiation: MessageCircle,
  respite: Moon,
} as const;

function SceneTypeIcon({ type, className }: { type: SceneType; className?: string }) {
  const Icon = SCENE_ICONS[type];
  return (
    <Icon 
      className={cn("w-4 h-4", className)} 
      style={{ color: `hsl(var(--mode-${type}))` }}
    />
  );
}
```

#### EntityCard

```tsx
interface EntityCardProps {
  entity: Entity;
  selected?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

function EntityCard({ entity, selected, compact, onClick }: EntityCardProps) {
  const stats = useEntityStats(entity);
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-muted-foreground",
        selected && "border-primary ring-1 ring-primary/50",
        compact && "p-2"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Portrait */}
        <div className={cn(
          "rounded-md bg-muted flex items-center justify-center overflow-hidden",
          compact ? "w-8 h-8" : "w-12 h-12"
        )}>
          {entity.portraitUrl ? (
            <img src={entity.portraitUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{entity.name}</span>
            {entity.type === 'hero' && (
              <Badge variant="outline" className="text-[10px]">
                {entity.data.class}
              </Badge>
            )}
          </div>
          
          {!compact && stats.maxStamina && (
            <StaminaBar 
              current={stats.currentStamina} 
              max={stats.maxStamina} 
              size="sm" 
              showNumbers={false}
            />
          )}
        </div>
        
        {/* Conditions */}
        {entity.conditions?.length > 0 && (
          <div className="flex gap-0.5">
            {entity.conditions.slice(0, 3).map(c => (
              <ConditionIcon key={c.id} condition={c.name} size="sm" />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## Screen Designs

### Auth Screens

Simple, centered card design.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│                      ┌────────────────────┐                      │
│                      │                    │                      │
│                      │   ⚒️ Anvil         │  Logo + name         │
│                      │                    │                      │
│                      │   ──────────────   │                      │
│                      │                    │                      │
│                      │   Email            │                      │
│                      │   [____________]   │                      │
│                      │                    │                      │
│                      │   Password         │                      │
│                      │   [____________]   │                      │
│                      │                    │                      │
│                      │   [  Sign In   ]   │  Primary button      │
│                      │                    │                      │
│                      │   ──── or ────     │                      │
│                      │                    │                      │
│                      │   [G] [Discord]    │  OAuth buttons       │
│                      │                    │                      │
│                      │   No account?      │                      │
│                      │   Sign up          │  Link                │
│                      │                    │                      │
│                      └────────────────────┘                      │
│                             380px                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Dashboard (Campaign List)

```
┌────────────────────────────────────────────────────────────────────┐
│  Top Bar                                                           │
│  ⚒️ Anvil │ Campaigns │                            │ [+] │ 👤    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │  My Campaigns                          [+ New Campaign]     │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│   │ [Cover Img]  │ │ [Cover Img]  │ │ [Cover Img]  │             │
│   │              │ │              │ │              │             │
│   │ Blackshard   │ │ Crown War    │ │ Test Camp    │             │
│   │ 4 players    │ │ 2 players    │ │ Solo         │             │
│   │ ● Active     │ │ ○ Planned    │ │ Draft        │             │
│   └──────────────┘ └──────────────┘ └──────────────┘             │
│        200px            200px            200px                    │
│                                                                    │
│   ─────────────────────────────────────────────────────────────   │
│                                                                    │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │  Joined Campaigns                                           │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│   ┌──────────────┐ ┌──────────────┐                              │
│   │ [Cover Img]  │ │ [Cover Img]  │                              │
│   │              │ │              │                              │
│   │ Alice's Game │ │ Bob's Game   │                              │
│   │ as Kira      │ │ as Thane     │                              │
│   └──────────────┘ └──────────────┘                              │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Hero List

```
┌────────────────────────────────────────────────────────────────────┐
│  Top Bar                                                           │
│  ⚒️ Anvil │ Heroes │                               │ [+] │ 👤    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │  My Heroes                                [+ New Hero]      │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │ [Portrait] │ Kira Shadowbane          │ Shadow │ Level 3   │  │
│   │    64x64   │ Human · Courtier         │        │           │  │
│   │            │ ████████░░░░ 38/50       │        │ [Edit]    │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │ [Portrait] │ Thane Ironforge          │ Fury   │ Level 2   │  │
│   │    64x64   │ Dwarf · Soldier          │        │           │  │
│   │            │ ████████████░ 62/72      │        │ [Edit]    │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│   ┌────────────────────────────────────────────────────────────┐  │
│   │ [Portrait] │ Lyra Stormwind           │ Conduit│ Level 1   │  │
│   │    64x64   │ Elf · Sage               │        │           │  │
│   │            │ ████░░░░░░░░ 18/42       │        │ [Edit]    │  │
│   └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Character Wizard

Full-screen focused flow.

```
┌────────────────────────────────────────────────────────────────────┐
│  [← Back to Heroes]              Step 3 of 11: Career              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────┬────────────────────────┐ │
│  │                                     │                        │ │
│  │   Choose Your Career                │   ┌──────────────────┐ │ │
│  │                                     │   │   [Portrait]     │ │ │
│  │   Your career represents what you   │   │                  │ │ │
│  │   did before becoming a hero.       │   │   Name: ???      │ │ │
│  │                                     │   │   Human          │ │ │
│  │   ┌─────────────────────────────┐   │   │   Level 1        │ │ │
│  │   │ ○ Artisan                   │   │   │                  │ │ │
│  │   │   Crafts, Guild contacts    │   │   │   ─────────────  │ │ │
│  │   └─────────────────────────────┘   │   │                  │ │ │
│  │   ┌─────────────────────────────┐   │   │   Skills:        │ │ │
│  │   │ ● Criminal ✓               │   │   │   • Climb 🔒     │ │ │
│  │   │   Hide, Sneak, Thieves'     │   │   │   • Sneak 🔒     │ │ │
│  │   │   Cant language             │   │   │   • Hide ★       │ │ │
│  │   └─────────────────────────────┘   │   │                  │ │ │
│  │   ┌─────────────────────────────┐   │   │   Languages:     │ │ │
│  │   │ ○ Gladiator                 │   │   │   • Common       │ │ │
│  │   │   Athletics, Intimidation   │   │   │   • Thieves' ★   │ │ │
│  │   └─────────────────────────────┘   │   │                  │ │ │
│  │                                     │   │   ★ = from career │ │ │
│  │   ─────────────────────────────     │   │   🔒 = from prior │ │ │
│  │                                     │   └──────────────────┘ │ │
│  │   Inciting Incident:                │        280px           │ │
│  │   [__________________________]      │                        │ │
│  │                                     │                        │ │
│  │           65%                       │         35%            │ │
│  └─────────────────────────────────────┴────────────────────────┘ │
│                                                                    │
│  ● ● ● ○ ○ ○ ○ ○ ○ ○ ○              [← Back]  [Next →]           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Campaign Builder / Live Session (Unified)

This is the core layout. Same structure, different content based on context.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Top Bar (48px)                                                        │
│  ⚒️ │ Blackshard Dungeon Delve › Session 2 │ ⚔️ Battle │     │ 👤     │
├────┬───────────────────────────────────────────────────────────────┬───┤
│    │                                                               │   │
│ 📁 │                                                               │ 👥│
│────│                                                               │───│
│ ⚔️ │                                                               │ 📊│
│────│                                                               │───│
│ 🗺️ │                       S T A G E                               │ 💀│
│────│                                                               │───│
│ 👤 │                                                               │   │
│    │     (Battle Canvas / Story Text / Montage Tracker /          │   │
│    │      Negotiation Interface / Respite Activities)              │   │
│    │                                                               │   │
│    │                                                               │   │
│────│                                                               │   │
│ ⚙️ │                                                               │   │
├────┴───────────────────────────────────────────────────────────────┴───┤
│  Film Strip (56px)                                                     │
│  [⚔️ Battle] [📖 Story*] [🏔️ Montage] [💬 Negotiate] [+]              │
├────────────────────────────────────────────────────────────────────────┤
│  Status Bar (32px)                                                     │
│  Scene: Battle 1 │ Round 3 Turn 5 │ ● Connected │ 4 players           │
└────────────────────────────────────────────────────────────────────────┘
```

#### Left Rail Icons

**Campaign Builder:**
| Icon | Panel | Content |
|------|-------|---------|
| 📁 | Content | Campaign tree (modules → sessions → scenes) |
| 🗺️ | Maps | Map library, upload |
| 👤 | NPCs | NPC library |
| 💀 | Monsters | Monster compendium |
| ⚙️ | Settings | Campaign settings |

**Live Session (Director):**
| Icon | Panel | Content |
|------|-------|---------|
| ⚔️ | Combat | Initiative, turn controls, malice |
| 🎯 | Tools | Drawing, measure, ping |
| 💬 | Chat | Dice log, chat |
| 📋 | Notes | Director notes |
| ⚙️ | Settings | Session settings |

**Live Session (Player):**
| Icon | Panel | Content |
|------|-------|---------|
| ⚡ | Abilities | Grouped by type, shows costs |
| 🎒 | Inventory | Equipment, items |
| 📜 | Conditions | Active effects |
| 🎲 | Dice | Quick roll panel |

#### Right Rail Icons

**Campaign Builder:**
| Icon | Panel | Content |
|------|-------|---------|
| 📊 | Properties | Selected item properties |
| 👥 | Players | Campaign members, invites |

**Live Session (Director):**
| Icon | Panel | Content |
|------|-------|---------|
| 👥 | Party | Hero cards with vitals |
| 💀 | Enemies | Enemy cards with vitals |
| 📊 | Details | Selected entity full sheet |

**Live Session (Player):**
| Icon | Panel | Content |
|------|-------|---------|
| 📊 | Sheet | Full character sheet |
| 👥 | Party | Other heroes (limited info) |

---

## Scene-Specific Stages

### Battle Stage

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    ┌────────────────────────────────────────────────────┐     │
│    │                                                    │     │
│    │           Canvas (PixiJS)                          │     │
│    │                                                    │     │
│    │    ┌───┐   ┌───┐                                   │     │
│    │    │ T │   │ T │  ← Tokens                         │     │
│    │    └───┘   └───┘                                   │     │
│    │                    ████  ← Fog of war              │     │
│    │    ┌───┐          ████                             │     │
│    │    │ H │                                           │     │
│    │    └───┘                                           │     │
│    │                                                    │     │
│    └────────────────────────────────────────────────────┘     │
│                                                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ Tools: [Select] [Measure] [Ping] [Draw] │ Zoom: 100% │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Story Stage

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    ┌────────────────────────────────────────────────────┐     │
│    │                                                    │     │
│    │           Read-Aloud Text                          │     │
│    │           (Large, readable, cinematic font)        │     │
│    │                                                    │     │
│    │    "The ancient door creaks open, revealing        │     │
│    │     a chamber bathed in ethereal blue light..."    │     │
│    │                                                    │     │
│    └────────────────────────────────────────────────────┘     │
│                                                                │
│    ┌──────────────────┐  ┌──────────────────┐                 │
│    │ [NPC Portrait]   │  │ [Scene Image]    │                 │
│    │                  │  │                  │                 │
│    │ Lord Vayne       │  │                  │                 │
│    └──────────────────┘  └──────────────────┘                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Montage Stage

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    ┌────────────────────────────────────────────────────┐     │
│    │  Goal: Escape the collapsing mine                  │     │
│    │  Difficulty: Moderate                              │     │
│    └────────────────────────────────────────────────────┘     │
│                                                                │
│    Successes: ●●●○○○  (3/6)     Failures: ●●○○  (2/4)        │
│                                                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │                                                      │   │
│    │  Round 3                                             │   │
│    │                                                      │   │
│    │  Kira: Climb ► Tier 2 Success                        │   │
│    │  Thane: Athletics ► Tier 1 Failure                   │   │
│    │  Lyra: Intuition ► Tier 3 Success (+bonus)           │   │
│    │                                                      │   │
│    │  [Make Test]                                         │   │
│    │                                                      │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                │
│    Skills Used by Kira: Climb, Sneak                          │
│    Skills Used by Thane: Athletics                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Negotiation Stage

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    ┌────────────────────────────────────────────────────┐     │
│    │  [Large NPC Portrait]     Lord Vayne                │     │
│    │                           Duke of the Western March │     │
│    │                                                     │     │
│    │                           Disposition: Skeptical    │     │
│    └────────────────────────────────────────────────────┘     │
│                                                                │
│    Interest: ●●●○○  (3/5)        Patience: ●●●●  (4)         │
│                                                                │
│    ┌────────────────────┐  ┌────────────────────┐             │
│    │ ✓ Motivations      │  │ ✗ Pitfalls         │             │
│    │ • Power            │  │ • Greed            │             │
│    │ • Legacy           │  │ • Dishonesty       │             │
│    │ • ?????            │  │ • ?????            │             │
│    └────────────────────┘  └────────────────────┘             │
│                                                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ Argument Log:                                        │   │
│    │ • Kira: Appealed to Legacy ► +1 Interest             │   │
│    │ • Thane: Mentioned gold ► Hit Greed pitfall! -1/-1   │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Respite Stage

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│    ┌────────────────────────────────────────────────────┐     │
│    │  Location: The Gilded Goose Inn                     │     │
│    │  Duration: Long rest                                │     │
│    └────────────────────────────────────────────────────┘     │
│                                                                │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│    │ Recovery │ │ Research │ │ Crafting │ │ Training │       │
│    │   🏥     │ │   📚     │ │   🔨     │ │   ⚔️     │       │
│    │          │ │          │ │          │ │          │       │
│    │ Heal     │ │ Learn    │ │ Make     │ │ Improve  │       │
│    │ stamina  │ │ lore     │ │ items    │ │ skills   │       │
│    └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                                │
│    ┌──────────────────────────────────────────────────────┐   │
│    │ Party Activities:                                    │   │
│    │                                                      │   │
│    │ Kira: Recovery - Full heal ✓                         │   │
│    │ Thane: Research - Blackshard history (50%)          │   │
│    │ Lyra: Training - Attempting to learn new spell      │   │
│    │                                                      │   │
│    └──────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Player Hero Vitals Bar

Replaces top bar for players in live session.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Portrait] │ Kira Shadowbane │ Shadow 3 │ ████████░░ 42/50 │ ⚡ 3/5  │ 60px
│    48x48   │                 │          │ Stamina          │ Insight │
│            │                 │          │                  │ ●●●○○   │
└────────────────────────────────────────────────────────────────────────┘
               Name             Class/Lvl   Stamina bar        Heroic
```

```tsx
function PlayerVitalsBar({ hero }: { hero: Hero }) {
  const stats = useHeroStats(hero);
  
  return (
    <div className="h-[60px] px-4 border-b border-border bg-card flex items-center gap-4">
      {/* Portrait */}
      <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
        {hero.portraitUrl ? (
          <img src={hero.portraitUrl} className="w-full h-full object-cover" />
        ) : (
          <User className="w-full h-full p-2 text-muted-foreground" />
        )}
      </div>
      
      {/* Name & Class */}
      <div className="flex flex-col">
        <span className="font-semibold">{hero.name}</span>
        <span className="text-sm text-muted-foreground">
          {hero.heroClass} {hero.level}
        </span>
      </div>
      
      {/* Stamina */}
      <div className="flex-1 max-w-[200px]">
        <StaminaBar 
          current={stats.currentStamina} 
          max={stats.maxStamina}
          size="md"
        />
      </div>
      
      {/* Heroic Resource */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <div className="flex gap-0.5">
          {Array.from({ length: stats.maxHeroicResource }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full",
                i < stats.currentHeroicResource ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Conditions */}
      {stats.conditions.length > 0 && (
        <div className="flex gap-1">
          {stats.conditions.map(c => (
            <ConditionBadge key={c.id} condition={c} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Dialogs & Modals

### Standard Dialog

```tsx
// Use shadcn Dialog for all modals
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Brief description of what this dialog does.
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid gap-4 py-4">
      {/* Form content */}
    </div>
    
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Confirmation Dialog

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Scene?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "Battle 1". This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive">Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Sheet (Side Panel for Large Forms)

```tsx
// Use Sheet for scene editors in Campaign Builder
<Sheet>
  <SheetTrigger asChild>
    <Button>Edit Scene</Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-[600px] sm:max-w-none">
    <SheetHeader>
      <SheetTitle>Edit Battle Scene</SheetTitle>
    </SheetHeader>
    
    <ScrollArea className="h-[calc(100vh-140px)] pr-4">
      {/* Scene editor form */}
    </ScrollArea>
    
    <SheetFooter className="pt-4 border-t">
      <Button variant="outline">Cancel</Button>
      <Button>Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

---

## Animation & Transitions

Keep animations subtle and purposeful.

### Page Transitions

```tsx
// Use framer-motion sparingly
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.15 }}
>
  {children}
</motion.div>
```

### Panel Slide

```tsx
// CSS for sidebar panel expansion
.panel-enter {
  @apply animate-in slide-in-from-left-2 duration-150;
}

.panel-exit {
  @apply animate-out slide-out-to-left-2 duration-100;
}
```

### Token Movement

```tsx
// Smooth token position updates
.token {
  transition: transform 150ms ease-out;
}
```

### Status Changes

```tsx
// Flash on stamina change
.stamina-changed {
  animation: pulse-glow 300ms ease-out;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.5); }
  100% { box-shadow: 0 0 0 8px hsl(var(--primary) / 0); }
}
```

---

## Responsive Considerations

Anvil is desktop-first, but should gracefully handle smaller screens.

### Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `sm` | < 768px | Mobile: collapse sidebars, stack film strip |
| `md` | 768-1024px | Tablet: narrower panels |
| `lg` | 1024-1280px | Desktop: full layout |
| `xl` | 1280px+ | Large desktop: wider panels |

### Mobile Adaptations

```tsx
// On small screens, use Sheet instead of inline panels
const isMobile = useMediaQuery('(max-width: 768px)');

{isMobile ? (
  <Sheet>
    <SheetTrigger>
      <RailButton icon={<Swords />} tooltip="Combat" />
    </SheetTrigger>
    <SheetContent side="left">
      <CombatPanel />
    </SheetContent>
  </Sheet>
) : (
  activePanel === 'combat' && <CombatPanel />
)}
```

---

## Accessibility

### Keyboard Navigation

- All interactive elements reachable via Tab
- Rail buttons have arrow key navigation within group
- Escape closes panels, dialogs, menus
- Enter/Space activates buttons

### Focus Management

```tsx
// Focus trap in dialogs (handled by Radix)
// Focus visible outlines
.focus-visible:focus {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}
```

### ARIA Labels

```tsx
// All icon-only buttons need labels
<Button variant="ghost" size="icon" aria-label="Close panel">
  <X className="h-4 w-4" />
</Button>

// Status announcements
<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>
```

### Color Contrast

All text meets WCAG AA:
- Regular text: 4.5:1 minimum
- Large text: 3:1 minimum
- Interactive elements: clear focus states

---

## Summary

This design system provides:

1. **Unified Layout** — Same structure for Campaign Builder and Live Session
2. **Icon Rail Pattern** — Slim sidebars with expandable panels
3. **Scene Mode Colors** — Visual differentiation at a glance
4. **shadcn Consistency** — Leveraging proven components
5. **Clear Hierarchy** — Stage always takes priority
6. **Minimal Chrome** — Content over decoration

Key files to create:
- `apps/vtt/src/components/layout/AppShell.tsx`
- `apps/vtt/src/components/layout/IconRail.tsx`
- `apps/vtt/src/components/layout/FilmStrip.tsx`
- `apps/vtt/src/components/common/StaminaBar.tsx`
- `apps/vtt/src/components/common/EntityCard.tsx`
- `apps/vtt/src/components/common/SceneTypeIcon.tsx`

---

*Document Version: 1.0*
*Design System: shadcn/ui + Tailwind CSS*
*Primary Typeface: Inter*
