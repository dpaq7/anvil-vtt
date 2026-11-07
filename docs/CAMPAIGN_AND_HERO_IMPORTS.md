# Anvil Campaign and Hero Imports

## Complete campaign packages (`.cam`)

An Anvil `.cam` file is a standard ZIP archive with `manifest.json` at its root. Version 1 uses:

```json
{
  "format": "anvil.campaign-package",
  "version": 1,
  "document": {
    "format": "anvil.scene-import",
    "version": 1,
    "campaign": { "name": "Example" },
    "sessions": []
  },
  "assets": [
    {
      "ref": "city-map",
      "path": "assets/maps/city.jpg",
      "name": "City Map",
      "type": "map",
      "contentType": "image/jpeg",
      "size": 123456,
      "sha256": "<64 lowercase hex characters>",
      "registrations": [
        { "kind": "map", "name": "City", "gridType": "gridless", "width": 24, "height": 21 }
      ]
    }
  ],
  "content": {
    "terrain": [],
    "npcs": [],
    "bestiary": []
  }
}
```

Any string in the scene-import document may refer to an embedded asset as `anvil-asset://city-map`. During import, Anvil verifies each uncompressed file's declared size and SHA-256 digest, uploads it through the normal account asset pipeline, and replaces the reference with its authenticated asset URL.

Supported asset registrations are `map`, `terrain`, `npc`, `audio`, and `monster-portrait`. Metadata-only terrain and NPC records belong under top-level `content`. Bestiary entries marked `campaign-inline` are retained in campaign settings because Anvil does not currently have a per-campaign custom-bestiary table.

Limits remain the same as normal asset uploads: 50 MB per file, 500 MB expanded package/account storage, and 1,000 assets. ZIP methods “stored” and “deflate” are supported; encryption and unsafe archive paths are rejected.

Directors can start this flow with **Import Campaign** on the desktop Campaigns screen or **Import** on the mobile Director Campaigns screen. After verification and upload, Anvil opens or lists the newly created campaign.

## Forge Steel heroes (`.ds-hero` and `.drawsteel-hero`)

Anvil accepts Forge Steel's native on-disk shape unchanged: a raw JSON `Hero` object, without an Anvil wrapper. Players and Directors can choose either Forge Steel extension from the first screen of the hero creation wizard. The desktop Heroes page also retains a direct upload shortcut.

Anvil maps known identity, ancestry, career, class, subclass, level, characteristics, kit, skills, abilities, resource trackers, and inventory into native hero columns. The complete source object is retained at `hero.data.forgeSteel.hero`, so fields that do not yet have an Anvil equivalent are not lost. A base64 image in `picture` is uploaded as an Anvil portrait asset; an HTTPS picture URL remains an external portrait.

The server endpoint is `POST /api/heroes/import/forge-steel`. It accepts either the raw Forge Steel object or the UI transport envelope `{ "hero": <raw object>, "portraitAssetId": "..." }`.
