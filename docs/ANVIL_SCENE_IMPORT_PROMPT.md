# Anvil Scene Import AI Prompt

Use this prompt when converting provided Draw Steel adventure or module content into an Anvil scene import file. The output is a JSON document that uses Anvil's lightweight `anvil.scene-import` format. Save the result with a `.anv` extension for module imports, or `.json` if you want a plain JSON file. This is not the full account backup format, which uses `anvil.account-backup`.

The matching schema lives at [`anvil-scene-import.schema.json`](./anvil-scene-import.schema.json).

## Model Prompt

```text
You are converting provided Draw Steel adventure/module content into an Anvil scene import document.

Output one JSON object only. Do not wrap it in Markdown. Do not include comments. The JSON must validate against the provided JSON Schema.

Top-level requirements:
- Set "format" to "anvil.scene-import".
- Set "version" to 1.
- Create a concise campaign name and description from the provided source.
- Organize the material as campaign -> modules -> sessions -> scenes.
- Preserve the adventure order from the source.
- Use only these scene types: "story", "battle", "montage", "negotiation", "respite".
- Use stable lowercase kebab-case ids for modules, sessions, scenes, challenges, tokens, terrain, fog, and drawings.
- Prefer concise paraphrase for long descriptive text. Use exact read-aloud text only when the source explicitly marks it as read-aloud/boxed text and the user has provided that content for conversion.
- Do not invent rules text, stat blocks, monster abilities, or lore that is not present in the source. If a useful detail is uncertain, add a short note in the relevant "notes" field.
- Omit empty optional arrays when they add no value, except where the schema requires an array.

Scene guidance:
- Use "story" for exposition, discoveries, GM notes, rooms without tactical play, transitions, clues, or boxed/read-aloud text.
- Use "battle" for tactical encounters, maps, combat setup, enemies, hazards, objective tracking, and starting positions.
- Use "montage" for extended tests, chases, infiltrations, investigations, travel, or skill-driven sequences with multiple obstacles.
- Use "negotiation" for social conflict, bargains, interrogations, audiences, or scenes with NPC motives and pitfalls.
- Use "respite" for downtime, recovery, projects, travel rests, and between-adventure activities.

Story data:
- Put boxed/read-aloud text in "readAloud".
- Put GM-facing detail, clues, secrets, consequences, and setup in "notes".

Battle data:
- Set "gridCols", "gridRows", and "gridCellSize". If the source has no grid size, choose a practical estimate and mention the estimate in "notes".
- Include "mapUrl" only when a usable asset URL exists.
- Include "heroStart" when the source gives or implies a starting area.
- Include "tokens" for monsters and NPCs. Do not include hero tokens.
- For monster tokens, set "monsterName" to the exact Draw Steel monster name when known. Add level, roles, stamina, freeStrike, squadId, and squadSize only when supplied or clearly inferable from the encounter listing.
- Use grid coordinates for token "x" and "y". If exact placement is not provided, place tokens in a reasonable formation and note that placement was inferred.
- Add terrain, fog, drawings, hazards, objectives, victory conditions, reinforcements, and round events in "terrain", "fog", "drawings", "hazards", "objectives", "victory", "reinforcements", and "notes" as appropriate.

Montage data:
- Set "goal", "roundLimit", "heroCount", "successesNeeded", and "failureLimit" when present.
- Convert each obstacle/test into a challenge with "name", "description", "suggestedCharacteristics", and "suggestedSkills".
- Put outcome text in "totalSuccess", "partialSuccess", and "totalFailure" when present.

Negotiation data:
- Put the main NPC in "template.npc".
- Set starting attitude, interest, patience, and maxPatience when present.
- Convert motives, fears, goals, leverage, and objections into "motivations" or "pitfalls".
- Put response text for interest bands in "template.responses" when present.

Respite data:
- Put the place or situation in "location".
- Convert downtime options into "activities".
- Convert long-running work into "projects".

Return the finished import document as the only output.
```
## Minimal Shape

```json
{
  "format": "anvil.scene-import",
  "version": 1,
  "campaign": {
    "name": "Module Title",
    "description": "Short module summary."
  },
  "modules": [
    {
      "id": "module-title",
      "name": "Module Title",
      "description": "Short module summary.",
      "orderIndex": 0,
      "sessions": [
        {
          "id": "session-1",
          "name": "Session 1",
          "description": "What this session covers.",
          "orderIndex": 0,
          "scenes": [
            {
              "id": "opening-scene",
              "title": "Opening Scene",
              "type": "story",
              "orderIndex": 0,
              "data": {
                "readAloud": "",
                "notes": "GM-facing summary."
              }
            }
          ]
        }
      ]
    }
  ],
  "sessions": []
}
```
