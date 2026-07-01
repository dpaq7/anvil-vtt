import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@anvil/ui';

interface SceneNameTooltipProps {
  children: (props: {
    ref: (node: HTMLElement | null) => void;
    onBlur: () => void;
    onFocus: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    'aria-describedby': string | undefined;
  }) => ReactNode;
  label: string;
}

interface TooltipPosition {
  left: number;
  top: number;
  translateX: string;
}

export function SceneNameTooltip({ children, label }: SceneNameTooltipProps) {
  const tooltipId = useId();
  const targetRef = useRef<HTMLElement | null>(null);
  const focusedRef = useRef(false);
  const hoveredRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const edgeInset = 16;
    const edgeThreshold = 180;

    if (center < edgeThreshold) {
      setPosition({
        left: Math.max(edgeInset, rect.left),
        top: rect.bottom + 8,
        translateX: '0',
      });
      return;
    }

    if (window.innerWidth - center < edgeThreshold) {
      setPosition({
        left: Math.min(window.innerWidth - edgeInset, rect.right),
        top: rect.bottom + 8,
        translateX: '-100%',
      });
      return;
    }

    setPosition({
      left: center,
      top: rect.bottom + 8,
      translateX: '-50%',
    });
  }, []);

  const syncVisibility = useCallback(() => {
    const nextVisible = focusedRef.current || hoveredRef.current;
    if (nextVisible) updatePosition();
    setVisible(nextVisible);
  }, [updatePosition]);

  const handleEnter = useCallback(() => {
    hoveredRef.current = true;
    syncVisibility();
  }, [syncVisibility]);

  const handleLeave = useCallback(() => {
    hoveredRef.current = false;
    syncVisibility();
  }, [syncVisibility]);

  const handleFocus = useCallback(() => {
    focusedRef.current = true;
    syncVisibility();
  }, [syncVisibility]);

  const handleBlur = useCallback(() => {
    focusedRef.current = false;
    syncVisibility();
  }, [syncVisibility]);

  const setTargetRef = useCallback((node: HTMLElement | null) => {
    targetRef.current = node;
  }, []);

  useEffect(() => {
    if (!visible) return;

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition, visible]);

  return (
    <>
      {children({
        ref: setTargetRef,
        onBlur: handleBlur,
        onFocus: handleFocus,
        onMouseEnter: handleEnter,
        onMouseLeave: handleLeave,
        onPointerEnter: handleEnter,
        onPointerLeave: handleLeave,
        'aria-describedby': visible ? tooltipId : undefined,
      })}
      {visible && position
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className={cn(
                'pointer-events-none fixed z-50 max-w-[min(22rem,calc(100vw-2rem))]',
                'rounded-md border border-zinc-700/80',
                'bg-zinc-950/95 px-3 py-2 text-xs font-medium text-zinc-100',
                'shadow-xl shadow-black/40 backdrop-blur',
              )}
              style={{
                left: position.left,
                top: position.top,
                transform: `translateX(${position.translateX})`,
              }}
            >
              <span className="block whitespace-normal break-words">
                {label}
              </span>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
