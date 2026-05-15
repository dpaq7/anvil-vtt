import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

export interface ViewportControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToMap: () => void;
  className?: string;
}

export function ViewportControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToMap,
  className,
}: ViewportControlsProps) {
  return (
    <div className={className ?? 'absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 rounded-lg bg-zinc-900/90 p-1.5 shadow-lg backdrop-blur-sm'}>
      <button
        type="button"
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Zoom In (Ctrl+=)"
        onClick={onZoomIn}
      >
        <ZoomIn className="size-4" />
      </button>
      <span className="min-w-[3rem] text-center text-[10px] font-medium text-zinc-400">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Zoom Out (Ctrl+-)"
        onClick={onZoomOut}
      >
        <ZoomOut className="size-4" />
      </button>
      <div className="my-0.5 h-px w-full bg-zinc-700" />
      <button
        type="button"
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        title="Fit to Map (Ctrl+0)"
        onClick={onFitToMap}
      >
        <Maximize className="size-4" />
      </button>
    </div>
  );
}
