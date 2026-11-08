export type SceneType =
  | "story"
  | "battle"
  | "montage"
  | "negotiation"
  | "respite";

// Text and icon colours stay on the accent stops, which globals.css keeps
// readable in both themes. Fills and edges use the fixed scene tokens
// (DESIGN.md 2.2): story = purple, negotiation = blue.
export const SCENE_COLORS: Record<SceneType, string> = {
  story: "text-purple-400",
  battle: "text-red-400",
  montage: "text-amber-400",
  negotiation: "text-blue-400",
  respite: "text-emerald-400",
};

export const SCENE_BG_COLORS: Record<SceneType, string> = {
  story: "bg-scene-story/20",
  battle: "bg-scene-battle/20",
  montage: "bg-scene-montage/20",
  negotiation: "bg-scene-negotiation/20",
  respite: "bg-scene-respite/20",
};

export const SCENE_BORDER_COLORS: Record<SceneType, string> = {
  story: "border-scene-story",
  battle: "border-scene-battle",
  montage: "border-scene-montage",
  negotiation: "border-scene-negotiation",
  respite: "border-scene-respite",
};
