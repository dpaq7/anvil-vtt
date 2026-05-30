import type { ReactNode } from "react";
import { cn } from "@anvil/ui";

interface SceneBackdropProps {
  backgroundUrl?: string | null;
  children: ReactNode;
  className?: string;
}

export function SceneBackdrop({
  backgroundUrl,
  children,
  className,
}: SceneBackdropProps) {
  return (
    <div
      className={cn("relative h-full overflow-hidden bg-zinc-950", className)}
    >
      {backgroundUrl ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_bottom,rgba(9,9,11,0.69)_0%,rgba(9,9,11,0.68)_34%,rgba(9,9,11,0.62)_66%,rgba(9,9,11,0.43)_100%)]"
          />
        </>
      ) : null}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
