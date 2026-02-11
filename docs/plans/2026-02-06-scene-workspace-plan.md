# Scene Workspace — Full Interactive Editors in Campaign Builder

## Problem

When a director selects a scene in the Campaign Builder, they see an empty card grid ("No items yet") or a basic text-field editor sheet. There are no interactive tools — no canvas, no asset sidebar, no live preview. The director should be able to fully prepare scenes in the builder so they appear ready in the live session.

## Approach

Replace the card grid + SceneEditorSheet pattern with a **Scene Workspace** that renders full interactive editors inline. When a scene is selected, the CampaignBuilder main area transforms into a scene-specific workspace with:
- **Center stage**: Interactive scene editor (canvas for battle, structured UI for others)
- **Right sidebar**: Asset panel scoped to scene type + scene editor fields
- **Auto-save**: Debounced save of `scenes.data` JSON blob via `PUT /api/scenes/:id`

No new DB tables needed — all state persists in the existing `scenes.data` JSON column.

## Architecture

### Scene Data Schema (inside `scenes.data` JSON blob)

**Battle:**
```json
{
  "mapUrl": "string?",
  "gridCols": 30,
  "gridRows": 20,
  "gridType": "square",
  "tokens": [{ "id": "string", "monsterName": "string", "x": 5, "y": 3, "size": 1, "color": "0xef4444" }],
  "terrain": [{ "id": "string", "terrainId": "string", "x": 2, "y": 4, "w": 3, "h": 2 }],
  "drawings": [{ "id": "string", "type": "freehand|line|rect|circle", "points": [...], "color": "#ff0000", "width": 2 }],
  "fogRegions": [{ "id": "string", "type": "rect", "x": 0, "y": 0, "w": 10, "h": 10, "revealed": false }],
  "difficulty": "standard",
  "notes": "string"
}
```

**Story:**
```json
{
  "readAloud": "string",
  "notes": "string",
  "assetUrl": "string?"
}
```

**Montage:**
```json
{
  "goal": "string",
  "difficulty": "standard",
  "successesNeeded": 5,
  "failureLimit": 3,
  "challenges": [{ "id": "string", "name": "string", "skill": "string", "characteristic": "string" }],
  "successOutcome": "string",
  "failureOutcome": "string",
  "notes": "string"
}
```

**Negotiation:**
```json
{
  "template": { ...NegotiationSceneTemplate }
}
```
(Already correct — NegotiationSceneEditor saves this shape.)

**Respite:**
```json
{
  "location": "string",
  "duration": "string",
  "availableActivities": ["recover", "craft", "research", ...],
  "projects": [{ "id": "string", "name": "string", "goalPoints": 10 }],
  "notes": "string"
}
```

### Data Flow: Builder → Live Session

```
CampaignBuilder                         DirectorView
     │                                       │
     │  PUT /api/scenes/:id { data }         │
     ▼                                       │
  scenes.data (D1)  ◄──────────────────  GET /api/sessions/:id/scenes
     │                                       │
     │  { mapUrl, tokens, terrain, ... }     │
     ▼                                       ▼
  SceneWorkspace                         BattleStage / StoryStage / etc.
  (interactive editor)                   (hydrates from same data)
```

## Implementation Plan

### Phase 1: Scene Workspace Shell (CampaignBuilder refactor)

**1.1 — SceneWorkspace component** `apps/vtt/src/components/builder/SceneWorkspace.tsx`
- Receives `scene`, `campaignId`, `onSave` props
- Dispatches to scene-type-specific workspace based on `scene.type`
- Handles debounced auto-save (1s debounce on data change → `PUT /api/scenes/:id`)
- Layout: flex row with main editor area + right sidebar

**1.2 — Update CampaignBuilder** `apps/vtt/src/pages/CampaignBuilder.tsx`
- When `selectedType === 'scene'`: render SceneWorkspace instead of CardGrid
- Pass the selected scene object and campaignId
- Keep tree sidebar and toolbar as-is
- Remove SceneEditorSheet (workspace replaces it)

### Phase 2: Battle Scene Workspace

**2.1 — BattleToolbar component** `apps/vtt/src/components/builder/BattleToolbar.tsx`
- Floating toolbar over the canvas
- Tools: Select/Move, Draw Freehand, Draw Line, Draw Rectangle, Draw Circle, Eraser, Fog Brush, Grid Toggle
- Active tool state managed locally
- Tool config (color picker, line width) in a secondary popover

**2.2 — DrawingLayer** `apps/vtt/src/canvas/layers/DrawingLayer.ts`
- New PixiJS layer for freehand/shape drawings
- Renders from `drawings[]` array in scene data
- Sits between GridLayer and TokenLayer in render order

**2.3 — TerrainLayer** `apps/vtt/src/canvas/layers/TerrainLayer.ts`
- New PixiJS layer for terrain zone overlays
- Renders colored rectangles with terrain name labels
- Sits between DrawingLayer and TokenLayer

**2.4 — Update InteractionManager** `apps/vtt/src/canvas/systems/InteractionManager.ts`
- Add `activeTool` mode (select, draw, fog, terrain, eraser)
- Select mode: existing behavior (drag tokens)
- Draw mode: capture pointer strokes, emit `onDrawingAdd` callback
- Fog mode: paint/unpaint fog regions
- Terrain mode: drag-to-place terrain rectangles
- Eraser mode: click to remove drawings/terrain

**2.5 — BattleWorkspace component** `apps/vtt/src/components/builder/BattleWorkspace.tsx`
- Renders BattleCanvas (reused) + BattleToolbar overlay
- Right sidebar: AssetPanel (bestiary, terrain, maps tabs) + battle config fields (grid size, difficulty, notes)
- Drag monster from bestiary → places token on canvas
- Drag terrain from terrain tab → places terrain zone on canvas
- Click map → sets background
- All changes update the data blob → auto-save

**2.6 — Update BattleCanvas** `apps/vtt/src/canvas/BattleCanvas.tsx`
- Accept new `activeTool` prop
- Accept new layers: `drawings`, `terrain` arrays from scene data
- Accept callbacks: `onDrawingAdd`, `onDrawingRemove`, `onTerrainAdd`, `onTerrainRemove`, `onTokenAdd`, `onTokenMove`, `onTokenRemove`, `onFogUpdate`
- Support "builder mode" (no WebSocket, local state only)

### Phase 3: Story Scene Workspace

**3.1 — StoryWorkspace component** `apps/vtt/src/components/builder/StoryWorkspace.tsx`
- Main area: Live preview of StoryStage (read-aloud text rendered cinematically)
- Right sidebar: Text editor fields (read-aloud textarea, director notes textarea, asset URL input)
- Changes update in real-time in the preview
- Maps `readAloud`, `notes`, `assetUrl` correctly

### Phase 4: Montage Scene Workspace

**4.1 — MontageWorkspace component** `apps/vtt/src/components/builder/MontageWorkspace.tsx`
- Main area: Live preview of MontageStage (goal, progress bars at 0, challenge cards)
- Right sidebar: Editor fields — goal, difficulty, successes needed, failure limit, success/failure outcome text
- Challenge list: Add/remove structured challenges with name + skill + characteristic (replaces multiline text)
- Right sidebar also has AssetPanel tabs (NPCs, Maps)

### Phase 5: Negotiation Scene Workspace

**5.1 — NegotiationWorkspace component** `apps/vtt/src/components/builder/NegotiationWorkspace.tsx`
- Main area: Live preview of NegotiationStage (NPC card, interest/patience tracks, motivation/pitfall cards)
- Right sidebar: The existing NegotiationSceneEditor fields (already the most complete)
- Wire up `template` data so preview reads from it correctly
- Fix naming: DirectorView needs to read from `template.npc.name` → `npcName`, etc.

### Phase 6: Respite Scene Workspace

**6.1 — RespiteWorkspace component** `apps/vtt/src/components/builder/RespiteWorkspace.tsx`
- Main area: Live preview of RespiteStage (location, activity cards, project progress bars)
- Right sidebar: Location, duration, available activities (checkboxes), project list (add/remove with name + goal points)
- Right sidebar also has AssetPanel tabs (NPCs, Maps)
- Fix naming: `locationDescription` → `location`

### Phase 7: DirectorView Hydration (wire up scene data → stages)

**7.1 — Fix DirectorView scene data mapping**
- Battle: Read `gridCols`, `gridRows`, `mapUrl`, `tokens`, `terrain`, `drawings`, `fogRegions` from `sceneData` and pass to BattleStage
- Story: Already works (`readAloud`, `notes`)
- Montage: Parse `challenges` as structured array, pass `successOutcome`/`failureOutcome`
- Negotiation: Read from `template` object, flatten to stage props
- Respite: Fix `locationDescription` → `location`, parse `projects` array

**7.2 — BattleStage hydration**
- Pass `tokens` from scene data as initial entity positions
- Pass `drawings`, `terrain`, `fogRegions` to new canvas layers
- In live session: merge scene data tokens with live session entities

### Phase 8: Polish

**8.1 — Auto-save indicator**: Show "Saving..." / "Saved" badge in workspace header
**8.2 — Undo/redo**: Simple undo stack for canvas operations (battle workspace)
**8.3 — Keyboard shortcuts**: Delete key removes selected token/drawing, Ctrl+Z undo

## File Summary

### New files (~12)
- `apps/vtt/src/components/builder/SceneWorkspace.tsx` — Dispatcher
- `apps/vtt/src/components/builder/BattleWorkspace.tsx` — Battle editor
- `apps/vtt/src/components/builder/BattleToolbar.tsx` — Canvas toolbar
- `apps/vtt/src/components/builder/StoryWorkspace.tsx` — Story editor
- `apps/vtt/src/components/builder/MontageWorkspace.tsx` — Montage editor
- `apps/vtt/src/components/builder/NegotiationWorkspace.tsx` — Negotiation editor
- `apps/vtt/src/components/builder/RespiteWorkspace.tsx` — Respite editor
- `apps/vtt/src/canvas/layers/DrawingLayer.ts` — Freehand/shape drawings
- `apps/vtt/src/canvas/layers/TerrainLayer.ts` — Terrain zone overlays

### Modified files (~8)
- `apps/vtt/src/pages/CampaignBuilder.tsx` — Integrate SceneWorkspace
- `apps/vtt/src/canvas/BattleCanvas.tsx` — Builder mode, new layers, new callbacks
- `apps/vtt/src/canvas/systems/InteractionManager.ts` — Multi-tool support
- `apps/vtt/src/components/stages/BattleStage.tsx` — Hydrate from scene data
- `apps/vtt/src/components/stages/MontageStage.tsx` — Accept structured challenges
- `apps/vtt/src/pages/session/DirectorView.tsx` — Wire scene data to all stages
- `apps/vtt/src/pages/session/PlayerView.tsx` — Same data mapping fixes
- `apps/vtt/src/components/builder/MontageSceneEditor.tsx` — Structured challenges (or replaced)

### Deleted files (~1)
- `apps/vtt/src/components/builder/SceneEditorSheet.tsx` — Replaced by workspace pattern

## Execution Order

Phases 1 → 3 → 4 → 5 → 6 → 2 → 7 → 8

Rationale: Phase 1 (shell) is prerequisite. Phases 3-6 (non-battle) are simpler — just preview + editor sidebar. Phase 2 (battle) is the most complex (canvas tooling). Phase 7 ties everything together. Phase 8 is polish.
