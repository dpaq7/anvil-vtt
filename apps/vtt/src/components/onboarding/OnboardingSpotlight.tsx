export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Four scrim panels leaving a cut-out over the highlighted element, plus a
 * warm accent ring. Falls back to a full scrim while the target measures.
 */
export function OnboardingSpotlight({ rect }: { rect: HighlightRect | undefined }) {
  if (!rect) {
    return <div className="fixed inset-0 z-50 bg-black/70" />;
  }
  return (
    <>
      <div
        aria-hidden="true"
        className="fixed left-0 top-0 z-50 bg-black/70"
        style={{ right: 0, height: rect.top }}
      />
      <div
        aria-hidden="true"
        className="fixed left-0 z-50 bg-black/70"
        style={{ top: rect.top, width: rect.left, height: rect.height }}
      />
      <div
        aria-hidden="true"
        className="fixed right-0 z-50 bg-black/70"
        style={{ top: rect.top, left: rect.left + rect.width, height: rect.height }}
      />
      <div
        aria-hidden="true"
        className="fixed bottom-0 left-0 z-50 bg-black/70"
        style={{ right: 0, top: rect.top + rect.height }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed z-[75] rounded-xl border-[3px] border-anvil-accent bg-anvil-accent/5 shadow-[0_0_0_4px_rgba(239,234,90,0.22),0_0_28px_rgba(239,234,90,0.35)]"
        style={rect}
      />
    </>
  );
}
