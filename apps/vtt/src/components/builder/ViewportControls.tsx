import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { VIEWPORT_MIN_ZOOM, VIEWPORT_MAX_ZOOM } from '../../canvas/systems/ViewportSystem.js';

export interface ViewportControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToMap: () => void;
  /** When provided, renders a slider for continuous zoom control. */
  onZoomTo?: (zoom: number) => void;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

const SLIDER_MIN = Math.round(VIEWPORT_MIN_ZOOM * 100);
const SLIDER_MAX = Math.round(VIEWPORT_MAX_ZOOM * 100);

export function ViewportControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToMap,
  onZoomTo,
  className,
  orientation = 'vertical',
}: ViewportControlsProps) {
  const isHorizontal = orientation === 'horizontal';
  const defaultClassName = isHorizontal
    ? 'flex items-center gap-0.5'
    : 'absolute bottom-4 right-4 z-10 flex flex-col items-center gap-1 rounded-lg bg-zinc-900/90 p-1.5 shadow-lg backdrop-blur-sm';

  return (
    <div className={className ?? defaultClassName}>
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
      {onZoomTo && (
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={5}
          value={Math.round(zoom * 100)}
          aria-label="Zoom level"
          title={`Zoom: ${Math.round(zoom * 100)}%`}
          onChange={(e) => onZoomTo(Number(e.target.value) / 100)}
          className={
            isHorizontal
              ? 'mx-1 h-1 w-20 accent-zinc-400'
              : 'my-1 h-20 accent-zinc-400 [direction:rtl] [writing-mode:vertical-lr]'
          }
        />
      )}
      <div
        className={
          isHorizontal
            ? 'mx-0.5 h-5 w-px bg-zinc-700'
            : 'my-0.5 h-px w-full bg-zinc-700'
        }
      />
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
