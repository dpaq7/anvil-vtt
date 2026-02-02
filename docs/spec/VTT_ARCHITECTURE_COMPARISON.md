# How Production VTTs Handle Critical Architecture Challenges

## Research Summary

This document analyzes how Foundry VTT, Owlbear Rodeo, Roll20, and PlanarAlly solve the same architectural problems Anvil V2 faces.

---

## 1. Session Initialization / "World Launch" Problem

**The Challenge**: How do you transition from stored campaign data to a live multiplayer session?

### Foundry VTT Approach
- **Eager loading**: On world launch, ALL documents (actors, scenes, items, journals) are loaded into memory
- **Initialization sequence**: `Game.connect()` → `Game.getData()` → `new Game()` → `Game.initialize()`
- **Hook system**: `init` → `i18nInit` → `setup` → `ready` hooks fire sequentially
- **Full state dump**: Every connecting client receives the complete world state
- **No partial hydration**: There's no "lazy loading" of scenes - everything is in memory

**Key insight**: Foundry chose simplicity over optimization. The entire world is loaded upfront, which limits world size (~30MB before performance issues) but eliminates hydration race conditions.

### Owlbear Rodeo 2.0 Approach
- **Room-per-server isolation**: Each game room gets its own isolated server instance
- **Database lookup first**: When client connects, checks if room exists, retrieves connection details
- **Proxy routing**: Client routed to correct server via proxy after lookup
- **No hydration needed**: Server holds room state; clients receive it on connect

**Key insight**: OR2 avoided the hydration problem by making each room a standalone server instance. State lives on that server, period.

### PlanarAlly Approach
- **SQLite persistence**: Single `planar.sqlite` file holds all state
- **Socket.io namespacing**: Separates game sockets from asset store sockets
- **Python server**: Server loads campaign from SQLite, holds in memory during session
- **Auto-save**: Every 5 minutes, state persists back to SQLite

**Key insight**: PA uses a simple model - server loads file at session start, saves periodically. No complex hydration.

### Roll20 Approach
- **Firebase Realtime Database**: All state changes sync through Firebase
- **Database-as-truth**: Firebase IS the session - no separate "live" state
- **WebSocket under the hood**: Firebase uses WebSockets for sync
- **No session "start"**: Campaign is always "live" - it's just whether clients are connected

**Key insight**: Roll20 eliminated the prep→live transition entirely by using Firebase as both storage AND sync layer.

---

## 2. State Persistence & Recovery

**The Challenge**: What happens when the server restarts, connection drops, or session ends unexpectedly?

### Foundry VTT
- **LevelDB persistence**: All document changes persist immediately to LevelDB
- **Sublevels**: Embedded documents (items on actors) can be updated without rewriting parent
- **No session state loss**: Every document CRUD operation persists synchronously
- **Fog exploration**: Stored as compressed texture per user, persisted to server

**Persistence model**: Write-through. Every change immediately persists.

### Owlbear Rodeo 1.0 (Legacy - instructive failure)
- **IndexedDB only**: State stored in browser's IndexedDB
- **No cloud persistence**: Refresh browser = potentially lose state
- **P2P sync issues**: Unreliable peer-to-peer connections

**OR 2.0 fix**: Moved to cloud storage with subscription model

### PlanarAlly
- **5-minute auto-save**: Periodic snapshots to SQLite
- **`temporary` flag**: Socket events can be marked to skip DB persistence
- **Trade-off**: Faster sync for transient updates (dragging), durability for important state

**Key pattern**: "Temporary" events for high-frequency updates that don't need persistence.

### Firebase/Roll20
- **Every write persists**: Firebase syncs all changes to all clients AND persists to DB
- **Offline queue**: Firebase queues offline changes, syncs when reconnected
- **Cost implication**: Every transient event (cursor position) costs DB writes

---

## 3. Reconnection Handling

**The Challenge**: Player's WiFi drops for 2 seconds. What happens?

### Foundry VTT
- **Socket.io reconnection**: Built-in reconnection with exponential backoff
- **NO state reconciliation**: Foundry does NOT sync missed events on reconnect
- **Known issue**: "State of their client got desynchronized from the world's state"
- **User workaround**: Refresh the page to get fresh state dump

**GitHub issue #10562**: Community requested ack/retry for important messages - not implemented.

**Key insight**: Foundry relies on page refresh as the reconciliation mechanism. Simple but disruptive.

### Owlbear Rodeo
- **"Reconnecting" status**: Shows in Scene connection indicator
- **Don't refresh**: Docs warn "Do not refresh while reconnecting - you'll lose unsaved changes"
- **Buffer until reconnect**: Client buffers local changes during disconnect

### PlanarAlly
- **Server-authoritative**: Server holds truth, client syncs on reconnect
- **Socket.io handles transport**: Uses Socket.io's built-in reconnection

### General Pattern
Most VTTs handle short disconnects via Socket.io's built-in reconnection, but do NOT implement sophisticated state reconciliation. Long disconnects (server restart, etc.) typically require page refresh.

**Implication for Anvil**: Simple reconnection with "refresh to sync" as fallback is acceptable. Don't over-engineer reconciliation.

---

## 4. Combat System / Triggered Actions

**The Challenge**: How do you handle interrupts, reactions, opportunity attacks in a turn-based system?

### Foundry VTT Core
- **Initiative tracker only**: Core just tracks turn order and current combatant
- **NO action economy**: No built-in tracking of actions/reactions/bonus actions
- **Manual tracking**: GM and players track action economy mentally or with notes

### Foundry Modules (community solutions)
- **Action Tracker**: Adds buttons to mark actions used (action, bonus, reaction)
- **PF2e Manual Action Tracker**: Tracks actions/reactions, resets on turn start
- **Combat Tracker Extensions**: Adds phases, groups, custom rounds

**Key insight**: Foundry punts on combat complexity. The "state machine" is just: whose turn → next turn. Everything else is manual or module-based.

### How modules handle it
```
Turn Start → Mark actions available
Player clicks action → Module marks it used
Turn End → Module resets for next turn
```
There's no "interrupt queue" or "triggered action resolution". Players/GM manually handle reactions when they occur.

**Implication for Anvil**: Draw Steel's triggered actions could be handled similarly:
- Track action economy (main action, maneuver, triggered action used)
- When trigger occurs (movement near enemy), GM/player manually invokes reaction
- No need for automated interrupt detection - that's GM fiat in TTRPGs anyway

---

## 5. Fog of War / Vision Calculation

**The Challenge**: O(players × entities × walls) visibility calculation is expensive.

### Foundry VTT
- **Quadtree algorithm**: Version 0.7.5 introduced "high-performance quadtree algorithm"
- **Client-side calculation**: Each client computes their own vision
- **Fog texture persistence**: Explored fog stored as compressed texture per user
- **Perfect Vision module**: Community module with additional optimizations

**Performance approach**:
1. Quadtree spatial indexing for walls
2. Vision calculated client-side (offloads from server)
3. Fog exploration saved as image texture (not polygon list)
4. "Order of magnitude improvement" per their release notes

### PlanarAlly
- **Bounding Volume Hierarchy (BVH)**: Ray tracing accelerator for lighting/LoS
- **Client-side vision**: Similar to Foundry - client computes visibility
- **No server-side visibility filtering**: Server sends all data, client filters display

### Key Pattern: Client-Side Vision
Production VTTs calculate vision CLIENT-SIDE, not server-side. The server sends all entity positions; the client determines what's visible.

**Why this matters for Anvil**:
- My spec said "Server sends filtered state: only visible entities/tiles to each client"
- Real VTTs do the opposite: server sends everything, client filters
- This eliminates server-side visibility computation entirely
- Trade-off: Players could theoretically hack client to see hidden entities

**Security implication**: Most VTTs accept this trade-off. If someone hacks their client to see through fog, that's a social problem, not a technical one.

---

## 6. Scene Switching / Asset Loading

**The Challenge**: Director jumps to unexpected scene. Players wait for assets to load.

### Foundry VTT
- **Lazy scene loading**: Only active scene's canvas is fully rendered
- **Compendium indexing**: Assets indexed but not loaded until needed
- **No preloading**: Foundry doesn't automatically preload adjacent scenes
- **User experience**: Scene switches show loading bar while textures load

### Owlbear Rodeo
- **Cloud storage**: Assets in cloud, loaded on demand
- **Room-scoped assets**: Assets belong to room, not globally preloaded
- **Loading indicator**: Shows loading state during scene transitions

### Foundry "Forge" (hosted service)
- **CDN delivery**: Assets served from CDN for faster loading
- **World size warnings**: Recommends keeping worlds under 30MB

**Key insight**: No VTT does sophisticated preloading. They just show a loading indicator and let assets stream in. The solution is:
1. Optimize asset sizes (compress images)
2. Show loading progress
3. Load map background first, then tokens (progressive rendering)

---

## 7. Drawing Tool Synchronization

**The Challenge**: Two people draw simultaneously. Who wins?

### Foundry VTT
- **Drawing documents**: Drawings are documents with CRUD operations
- **Last-write-wins**: Standard document update semantics
- **No real-time collaborative drawing**: You don't see strokes in progress

### Owlbear Rodeo
- **Real-time stroke sync**: OR 2.0 syncs every interaction in real-time
- **Network interpolation**: "The pointer tool has a nice network interpolation model"
- **No conflict handling**: Legacy code "makes no effort to handle collisions when two users edit the same data"

### PlanarAlly
- **Temporary events**: Dragging/drawing can use `temporary` flag to skip DB
- **Authorization only**: Server checks permission but doesn't persist temporary events
- **Broadcast to others**: Events still sent to other clients for display

**Key insight**: Most VTTs use last-write-wins and don't handle conflicts. They accept that simultaneous edits may cause issues.

---

## 8. Offline Support

**The Challenge**: Can you run a game without internet?

### Foundry VTT
- **Self-hosted**: Can run on local network without internet
- **Offline mode**: Works completely offline if self-hosted
- **No cloud sync**: Data stays on host machine

### PlanarAlly
- **Explicit offline support**: "Can be used in completely offline set-up for when you play D&D in a dark dungeon"
- **Self-hosted Python server**: Runs locally, no external dependencies

### Owlbear Rodeo
- **Online only**: OR 2.0 moved to cloud model
- **No offline mode**: Requires internet connection

### Roll20
- **Online only**: Firebase-backed, requires internet

**Key insight**: Offline support requires self-hosting. Cloud-based VTTs (OR 2.0, Roll20) sacrifice offline for reliability and sync simplicity.

**For Anvil**: Cloudflare-based architecture means online-only. This is a product decision to accept.

---

## Summary: Lessons for Anvil V2

### What Production VTTs Actually Do

| Challenge | Common Solution | Not Done |
|-----------|-----------------|----------|
| Session Init | Load everything upfront | Lazy hydration |
| Persistence | Write-through or periodic save | Complex sync protocols |
| Reconnection | Socket.io + page refresh fallback | State reconciliation |
| Combat | Manual tracking + modules | Automated interrupt detection |
| Vision | Client-side calculation | Server-side filtering |
| Scene Switch | Loading indicator | Sophisticated preloading |
| Drawing Conflicts | Last-write-wins | Conflict resolution |
| Offline | Self-hosted or not at all | Offline-first cloud sync |

### Key Architecture Decisions

1. **Simpler is better**: Foundry's "load everything upfront" avoids hydration complexity
2. **Client-side vision**: Let clients compute visibility, server sends all data
3. **Accept page refresh**: Don't over-engineer reconnection - refresh works
4. **Manual combat tracking**: TTRPGs have GMs who handle edge cases
5. **Last-write-wins**: Good enough for collaborative tools, don't build CRDTs
6. **Online-only is fine**: Modern VTTs are moving to cloud-first models

### Recommended Anvil V2 Adjustments

1. **Go Live = Load All Scene Data**: When session starts, DO loads entire campaign's scene data into memory
2. **Client-side fog rendering**: Server sends all tokens, client applies fog locally
3. **Periodic persistence + write-through for critical state**: Combat state persists immediately, drawing batches periodically
4. **Simple combat tracker**: Turn order + action economy checkboxes, not automated triggers
5. **Accept refresh as recovery**: Don't build complex state reconciliation
6. **Loading indicators > preloading**: Show progress during scene switches

---

## Sources

- Foundry VTT GitHub Issues: #4770, #7006, #10562, #5065, #8581
- Foundry VTT Release Notes: 0.7.5, 11.299
- Owlbear Rodeo Dev Logs 1, 4, 6
- Owlbear Rodeo Legacy GitHub README
- PlanarAlly ARCHITECTURE.md, CHANGELOG.md
- Roll20 Firebase Forum Post (2012)
- Foundry VTT Community Wiki: Hooks, Game, Sockets, Handling Data
- The Forge Blog: LevelDB challenges, V12 Support
