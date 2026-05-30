import type { SceneType } from "@anvil/types";

export type BackgroundSceneType = Exclude<SceneType, "battle">;

export interface BuiltInSceneBackground {
  id: string;
  name: string;
  sceneType: BackgroundSceneType;
  url: string;
}

export const BACKGROUND_SCENE_TYPES = [
  "story",
  "montage",
  "negotiation",
  "respite",
] as const satisfies readonly BackgroundSceneType[];

export const BUILT_IN_SCENE_BACKGROUNDS: BuiltInSceneBackground[] = [
  {
    id: "montage-1",
    name: "Montage 1",
    sceneType: "montage",
    url: "/scene-backgrounds/montage-1.png",
  },
  {
    id: "montage-2",
    name: "Montage 2",
    sceneType: "montage",
    url: "/scene-backgrounds/montage-2.png",
  },
  {
    id: "negotiation-1",
    name: "Negotiation 1",
    sceneType: "negotiation",
    url: "/scene-backgrounds/negotiation-1.png",
  },
  {
    id: "negotiation-2",
    name: "Negotiation 2",
    sceneType: "negotiation",
    url: "/scene-backgrounds/negotiation-2.png",
  },
  {
    id: "respite-1",
    name: "Respite 1",
    sceneType: "respite",
    url: "/scene-backgrounds/respite-1.png",
  },
  {
    id: "respite-2",
    name: "Respite 2",
    sceneType: "respite",
    url: "/scene-backgrounds/respite-2.png",
  },
];

export function isBackgroundSceneType(
  sceneType: SceneType | null | undefined,
): sceneType is BackgroundSceneType {
  return (
    sceneType !== undefined && sceneType !== null && sceneType !== "battle"
  );
}

export function getDefaultSceneBackground(
  sceneType: SceneType | null | undefined,
  orderIndex = 0,
): BuiltInSceneBackground | null {
  if (!isBackgroundSceneType(sceneType)) return null;
  const options = BUILT_IN_SCENE_BACKGROUNDS.filter(
    (background) => background.sceneType === sceneType,
  );
  if (options.length === 0) return null;
  return options[Math.abs(orderIndex) % options.length] ?? options[0] ?? null;
}

export function getSceneBackgroundUrl(
  data: Record<string, unknown>,
  sceneType: SceneType | null | undefined,
  orderIndex = 0,
): string | null {
  if (data["backgroundUrl"] === null) return null;

  const backgroundUrl = data["backgroundUrl"];
  if (typeof backgroundUrl === "string" && backgroundUrl.trim())
    return backgroundUrl;

  const legacyAssetUrl = data["assetUrl"];
  if (
    sceneType === "story" &&
    typeof legacyAssetUrl === "string" &&
    legacyAssetUrl.trim()
  ) {
    return legacyAssetUrl;
  }

  return getDefaultSceneBackground(sceneType, orderIndex)?.url ?? null;
}

export function getSceneBackgroundMapAssetId(
  data: Record<string, unknown>,
): string | null {
  const backgroundMapAssetId = data["backgroundMapAssetId"];
  if (typeof backgroundMapAssetId === "string" && backgroundMapAssetId.trim()) {
    return backgroundMapAssetId;
  }

  const legacyMapAssetId = data["mapAssetId"];
  if (typeof legacyMapAssetId === "string" && legacyMapAssetId.trim()) {
    return legacyMapAssetId;
  }

  return null;
}
