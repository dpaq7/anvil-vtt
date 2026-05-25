import { Tabs, TabsContent, TabsList, TabsTrigger } from "@anvil/ui";
import { StoryStage } from "../stages/StoryStage.js";
import { SceneAudioPanel } from "../session/SceneAudioPanel.js";
import { SceneBackdrop } from "../stages/SceneBackdrop.js";
import { SceneBackgroundPicker } from "./SceneBackgroundPicker.js";
import type { Scene } from "./SceneWorkspace.js";
import {
  getSceneBackgroundMapAssetId,
  getSceneBackgroundUrl,
} from "../../lib/scene-backgrounds.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoryWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
}

interface StorySceneData {
  readAloud: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StoryWorkspace({
  data,
  onChange,
  scene,
  campaignId,
}: StoryWorkspaceProps) {
  // Extract typed data with defaults
  const storyData: StorySceneData = {
    readAloud: (data["readAloud"] as string) ?? "",
    notes: (data["notes"] as string) ?? "",
  };
  const backgroundUrl = getSceneBackgroundUrl(data, "story", scene.order_index);
  const backgroundMapAssetId = getSceneBackgroundMapAssetId(data);

  const updateField = <K extends keyof StorySceneData>(
    field: K,
    value: StorySceneData[K],
  ) => {
    onChange({ ...data, [field]: value });
  };

  const hasPreviewText = Boolean(storyData.readAloud || storyData.notes);

  return (
    <div className="flex h-full">
      {/* Main area: Live preview of StoryStage */}
      <div className="flex-1 overflow-auto bg-zinc-950">
        <SceneBackdrop backgroundUrl={backgroundUrl}>
          {hasPreviewText ? (
            <StoryStage
              readAloudText={storyData.readAloud}
              directorNotes={storyData.notes}
              isDirector={true}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-zinc-600">
                <p className="text-lg font-medium">Story Scene</p>
                <p className="mt-1 text-sm">
                  Add read-aloud text in the sidebar to preview
                </p>
              </div>
            </div>
          )}
        </SceneBackdrop>
      </div>

      {/* Right sidebar: Editor fields */}
      <div className="w-80 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900/80 p-4">
        <Tabs defaultValue="setup" className="flex flex-col gap-4">
          <TabsList className="grid h-8 w-full grid-cols-2">
            <TabsTrigger value="setup" className="px-2 py-1 text-xs">
              Setup
            </TabsTrigger>
            <TabsTrigger value="background" className="px-2 py-1 text-xs">
              Background
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-0">
            <div className="flex flex-col gap-5">
              <SceneAudioPanel
                campaignId={campaignId}
                audioId={(data["audioMusic"] as string) ?? null}
                onAudioChange={(id) =>
                  onChange({ ...data, audioMusic: id ?? undefined })
                }
              />

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-300">
                  Read-Aloud Text
                </span>
                <textarea
                  className="min-h-[160px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  value={storyData.readAloud}
                  onChange={(e) => updateField("readAloud", e.target.value)}
                  placeholder="The text players will see, rendered cinematically..."
                />
                <p className="text-xs text-zinc-500">
                  This text appears large and centered for dramatic effect.
                </p>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-300">
                  Director Notes
                </span>
                <textarea
                  className="min-h-[100px] w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  value={storyData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Private notes only the Director sees..."
                />
                <p className="text-xs text-zinc-500">
                  Hidden from players. Visible in preview above.
                </p>
              </label>
            </div>
          </TabsContent>

          <TabsContent value="background" className="mt-0">
            <SceneBackgroundPicker
              campaignId={campaignId}
              sceneType="story"
              selectedUrl={backgroundUrl}
              selectedMapAssetId={backgroundMapAssetId}
              onSelect={(selection) =>
                onChange({
                  ...data,
                  backgroundUrl: selection.url,
                  backgroundMapAssetId: selection.mapAssetId ?? null,
                  backgroundName: selection.name,
                  assetUrl: selection.url,
                  mapAssetId: selection.mapAssetId ?? "",
                })
              }
              onClear={() =>
                onChange({
                  ...data,
                  backgroundUrl: null,
                  backgroundMapAssetId: null,
                  backgroundName: null,
                  assetUrl: "",
                  mapAssetId: "",
                })
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
