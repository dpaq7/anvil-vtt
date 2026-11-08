import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ViewportSystem } from '../../../canvas/systems/ViewportSystem.js';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A CSS media query as state. */
export function useMediaQuery(query: string): boolean {
  const [on, setOn] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setOn(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);
  return on;
}

/** The session's small size, the same test the shell uses. */
export const SMALL_SESSION = '(max-width: 1365px), (max-height: 800px)';

/** The number rolling to its new value (0.42 s). Reduced motion sets it at once. */
export function useRollingNumber(value: number): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (from.current === value) return;
    const start = from.current;
    from.current = value;
    if (reduced()) {
      setShown(value);
      return;
    }
    const began = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - began) / 420);
      setShown(Math.round(start + (value - start) * (1 - (1 - t) * (1 - t))));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
}

/** True for a moment after `value` drops: the row flashes hazard yellow. */
export function useHitFlash(value: number): boolean {
  const [hit, setHit] = useState(false);
  const last = useRef(value);
  useEffect(() => {
    const dropped = value < last.current;
    last.current = value;
    if (!dropped) return;
    setHit(true);
    const timer = setTimeout(() => setHit(false), 600);
    return () => clearTimeout(timer);
  }, [value]);
  return hit;
}

interface View {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

/** Follows the viewport. It arrives after Pixi starts, so this waits for it. */
export function useViewportView(viewportRef: RefObject<ViewportSystem | null>): View | null {
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let frame = 0;
    const read = () => {
      frame = 0;
      const viewport = viewportRef.current;
      if (!viewport) return;
      const pan = viewport.getPan();
      const size = viewport.getViewSize();
      setView({ x: pan.x, y: pan.y, zoom: viewport.getZoom(), width: size.width, height: size.height });
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const wait = setInterval(() => {
      const viewport = viewportRef.current;
      if (!viewport) {
        unsubscribe?.();
        unsubscribe = null;
        return;
      }
      if (!unsubscribe) unsubscribe = viewport.subscribe(queue);
      queue(); // Also catches the canvas changing size when a rail folds.
    }, 400);
    return () => {
      clearInterval(wait);
      unsubscribe?.();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [viewportRef]);
  return view;
}

