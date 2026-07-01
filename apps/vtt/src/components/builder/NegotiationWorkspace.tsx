import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@anvil/ui";
import { BuilderRightPane } from "./BuilderRightPane.js";
import { NegotiationSceneEditor } from "./NegotiationSceneEditor.js";
import { NegotiationStage } from "../stages/NegotiationStage.js";
import { SceneAudioPanel } from "../session/SceneAudioPanel.js";
import { SceneBackdrop } from "../stages/SceneBackdrop.js";
import { SceneBackgroundPicker } from "./SceneBackgroundPicker.js";
import type { Scene } from "./SceneWorkspace.js";
import type { NegotiationSceneTemplate, NPCAttitude } from "@anvil/types";
import { NegotiationLogic } from "@anvil/data";
import {
  getSceneBackgroundMapAssetId,
  getSceneBackgroundUrl,
} from "../../lib/scene-backgrounds.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NegotiationWorkspaceProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  scene: Scene;
  campaignId: string;
  focusMode?: boolean;
}

// Map NPCAttitude to stage attitude format
function toLogicAttitude(
  attitude: NPCAttitude,
): "hostile" | "suspicious" | "neutral" | "open" | "friendly" | "trusting" {
  switch (attitude) {
    case "hostile":
      return "hostile";
    case "unfriendly":
      return "suspicious";
    case "neutral":
      return "neutral";
    case "friendly":
      return "open";
    case "helpful":
      return "friendly";
    default:
      return "neutral";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NegotiationWorkspace({
  data,
  onChange,
  scene,
  campaignId,
  focusMode = false,
}: NegotiationWorkspaceProps) {
  // Parse template from data
  const template: NegotiationSceneTemplate | null = useMemo(() => {
    return (data["template"] as NegotiationSceneTemplate) ?? null;
  }, [data]);

  // Build stage props from template
  const stageProps = useMemo(() => {
    if (!template) {
      return {
        npcName: "Unknown NPC",
        npcPortrait: undefined,
        npcAttitude: "neutral",
        interest: 2,
        patience: 4,
        maxPatience: 5,
        phase: "active" as const,
        motivations: [],
        pitfalls: [],
        outcomes: {},
        isDirector: true,
      };
    }

    const attitudeStr = toLogicAttitude(template.startingAttitude);
    const derivedInterest = NegotiationLogic.getStartingInterest(attitudeStr);
    const derivedPatience = NegotiationLogic.getStartingPatience(attitudeStr);

    // Build outcomes map from responses
    const outcomes: Record<number, string> = {};
    if (template.responses) {
      outcomes[0] = template.responses.interest0?.text ?? "";
      outcomes[1] = template.responses.interest1?.text ?? "";
      outcomes[2] = template.responses.interest2?.text ?? "";
      outcomes[3] = template.responses.interest3?.text ?? "";
      outcomes[4] = template.responses.interest4?.text ?? "";
      outcomes[5] = template.responses.interest5?.text ?? "";
    }

    return {
      npcName: template.npc.name || "Unnamed NPC",
      npcPortrait: template.npc.portraitUrl,
      npcAttitude: template.startingAttitude,
      interest: template.startingInterest ?? derivedInterest,
      patience: template.startingPatience ?? derivedPatience,
      maxPatience: 5,
      phase: "active" as const,
      motivations: template.motivations.map((m) => ({
        id: m.id,
        type: m.type,
        description: m.description,
        revealed: false, // Not revealed in preview
      })),
      pitfalls: template.pitfalls.map((p) => ({
        id: p.id,
        type: p.type,
        description: p.description,
        revealed: false, // Not revealed in preview
      })),
      outcomes,
      isDirector: true,
    };
  }, [template]);

  const hasNPC = template?.npc?.name;
  const backgroundUrl = getSceneBackgroundUrl(
    data,
    "negotiation",
    scene.order_index,
  );
  const backgroundMapAssetId = getSceneBackgroundMapAssetId(data);

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Main area: Live preview of NegotiationStage */}
      <div className="min-w-0 flex-1 overflow-auto bg-zinc-950">
        <SceneBackdrop backgroundUrl={backgroundUrl}>
          {hasNPC ? (
            <NegotiationStage {...stageProps} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-zinc-600">
                <p className="text-lg font-medium">Negotiation Scene</p>
                <p className="mt-1 text-sm">
                  Configure an NPC in the sidebar to preview
                </p>
                <p className="mt-3 text-xs text-zinc-500">
                  Tip: Load a pre-built NPC to get started quickly
                </p>
              </div>
            </div>
          )}
        </SceneBackdrop>
      </div>

      {/* Right sidebar: Reuse NegotiationSceneEditor */}
      <BuilderRightPane focusMode={focusMode} defaultWidth={420} minWidth={340}>
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
              <NegotiationSceneEditor data={data} onChange={onChange} />
            </div>
          </TabsContent>

          <TabsContent value="background" className="mt-0">
            <SceneBackgroundPicker
              campaignId={campaignId}
              sceneType="negotiation"
              selectedUrl={backgroundUrl}
              selectedMapAssetId={backgroundMapAssetId}
              onSelect={(selection) =>
                onChange({
                  ...data,
                  backgroundUrl: selection.url,
                  backgroundMapAssetId: selection.mapAssetId ?? null,
                  backgroundName: selection.name,
                })
              }
              onClear={() =>
                onChange({
                  ...data,
                  backgroundUrl: null,
                  backgroundMapAssetId: null,
                  backgroundName: null,
                })
              }
            />
          </TabsContent>
        </Tabs>
      </BuilderRightPane>
    </div>
  );
}
