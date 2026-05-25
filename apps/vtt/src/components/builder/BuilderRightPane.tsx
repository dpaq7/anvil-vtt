import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

const DEFAULT_WIDTH = 384;
const DEFAULT_MIN_WIDTH = 320;
const DEFAULT_MAX_WIDTH_RATIO = 0.5;
const PANE_HANDLE_CLASS =
  "absolute top-1/2 z-40 flex h-14 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/95 text-zinc-400 shadow-lg transition hover:border-zinc-500 hover:text-zinc-100";

interface BuilderRightPaneProps {
  children: ReactNode;
  focusMode?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidthRatio?: number;
  contentClassName?: string;
}

function maxViewportWidth(ratio: number): number {
  return typeof window === "undefined"
    ? 760
    : Math.floor(window.innerWidth * ratio);
}

function clampPaneWidth(
  width: number,
  minWidth: number,
  maxWidthRatio: number,
): number {
  return Math.min(
    maxViewportWidth(maxWidthRatio),
    Math.max(minWidth, Math.round(width)),
  );
}

export function BuilderRightPane({
  children,
  focusMode = false,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidthRatio = DEFAULT_MAX_WIDTH_RATIO,
  contentClassName = "min-h-0 flex-1 overflow-y-auto p-4",
}: BuilderRightPaneProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(() =>
    clampPaneWidth(defaultWidth, minWidth, maxWidthRatio),
  );

  useEffect(() => {
    const handleResize = () =>
      setWidth((current) => clampPaneWidth(current, minWidth, maxWidthRatio));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [maxWidthRatio, minWidth]);

  const handleResizeStart = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setWidth(
          clampPaneWidth(
            startWidth - (moveEvent.clientX - startX),
            minWidth,
            maxWidthRatio,
          ),
        );
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [maxWidthRatio, minWidth, width],
  );

  if (focusMode) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        title="Expand editor pane"
        aria-label="Expand editor pane"
        onClick={() => setCollapsed(false)}
        className={`${PANE_HANDLE_CLASS} right-0 -translate-x-1/2`}
      >
        <PanelRightOpen className="size-3.5" />
      </button>
    );
  }

  return (
    <div
      className="relative flex min-h-0 shrink-0 flex-col overflow-visible border-l border-zinc-800 bg-zinc-900/80"
      style={{ width, maxWidth: `${maxWidthRatio * 100}vw` }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor pane"
        title="Resize editor pane"
        onMouseDown={handleResizeStart}
        className="group absolute inset-y-0 left-0 z-10 flex w-2 cursor-ew-resize items-center justify-center hover:bg-zinc-800/70"
      >
        <div className="h-12 w-px bg-zinc-700 opacity-0 transition group-hover:opacity-100" />
      </div>
      <button
        type="button"
        title="Collapse editor pane"
        aria-label="Collapse editor pane"
        onClick={() => setCollapsed(true)}
        className={`${PANE_HANDLE_CLASS} left-0 -translate-x-1/2`}
      >
        <PanelRightClose className="size-3.5" />
      </button>

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
