import type { CSSProperties, ReactNode } from "react";
import { cn } from "@anvil/ui";
import { useTextScale } from "../../lib/mode-prefs.js";
import "../session/modes/modes.css";

interface SceneBackdropProps {
  backgroundUrl?: string | null;
  children: ReactNode;
  className?: string;
  /** The live mode. Respite hangs its art in a band across the top, over the ticket board. */
  mode?: "story" | "montage" | "negotiation" | "respite";
}

/**
 * The mode screen's ground (DESIGN.md rule 5 and `--map-dim`): the scene's art, dimmed with the
 * theme, under panels that carry every word. Text never sits straight on the art. The reading
 * surfaces inside take the Smaller / Larger text scale from `--md-text`.
 */
export function SceneBackdrop({
  backgroundUrl,
  children,
  className,
  mode,
}: SceneBackdropProps) {
  const { scale } = useTextScale();
  const art = backgroundUrl ? (
    <div
      aria-hidden="true"
      className="md-art"
      style={{ backgroundImage: `url(${backgroundUrl})` }}
    />
  ) : null;
  return (
    <div
      className={cn("md-screen", className)}
      data-mode={mode}
      style={{ "--md-text": scale } as CSSProperties}
    >
      {mode === "respite" ? <div className="md-band-art">{art}</div> : art}
      {children}
    </div>
  );
}
