import type { CSSProperties } from 'react';
import type { OnboardingPlacement, OnboardingRect } from './steps.js';

const ONBOARDING_CARD_WIDTH = 340;
const ONBOARDING_CARD_ESTIMATED_HEIGHT = 260;
const ONBOARDING_VIEWPORT_INSET = 16;
export const ONBOARDING_TARGET_PADDING = 8;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function orderedPlacements(preferred: OnboardingPlacement | undefined) {
  const fallback: OnboardingPlacement[] = ['right', 'left', 'bottom', 'top'];
  return preferred ? [preferred, ...fallback.filter((placement) => placement !== preferred)] : fallback;
}

export function getCalloutPosition(rect: OnboardingRect | null, placement: OnboardingPlacement | undefined): CSSProperties {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const cardWidth = Math.min(ONBOARDING_CARD_WIDTH, viewportWidth - ONBOARDING_VIEWPORT_INSET * 2);
  const gap = 24;

  if (!rect || viewportWidth < 720) {
    return {
      left: ONBOARDING_VIEWPORT_INSET,
      right: ONBOARDING_VIEWPORT_INSET,
      bottom: ONBOARDING_VIEWPORT_INSET,
      width: 'auto',
    };
  }

  const available = {
    right: viewportWidth - rect.right - gap - ONBOARDING_VIEWPORT_INSET,
    left: rect.left - gap - ONBOARDING_VIEWPORT_INSET,
    bottom: viewportHeight - rect.bottom - gap - ONBOARDING_VIEWPORT_INSET,
    top: rect.top - gap - ONBOARDING_VIEWPORT_INSET,
  };

  const chosen = orderedPlacements(placement).find((candidate) => {
    if (candidate === 'right' || candidate === 'left') return available[candidate] >= cardWidth;
    return available[candidate] >= ONBOARDING_CARD_ESTIMATED_HEIGHT;
  }) ?? 'bottom';

  if (chosen === 'right') {
    return {
      left: rect.right + gap,
      top: clamp(rect.top, ONBOARDING_VIEWPORT_INSET, viewportHeight - ONBOARDING_CARD_ESTIMATED_HEIGHT - ONBOARDING_VIEWPORT_INSET),
      width: cardWidth,
    };
  }

  if (chosen === 'left') {
    return {
      left: rect.left - gap - cardWidth,
      top: clamp(rect.top, ONBOARDING_VIEWPORT_INSET, viewportHeight - ONBOARDING_CARD_ESTIMATED_HEIGHT - ONBOARDING_VIEWPORT_INSET),
      width: cardWidth,
    };
  }

  if (chosen === 'top') {
    return {
      left: clamp(rect.left + rect.width / 2 - cardWidth / 2, ONBOARDING_VIEWPORT_INSET, viewportWidth - cardWidth - ONBOARDING_VIEWPORT_INSET),
      top: rect.top - gap - ONBOARDING_CARD_ESTIMATED_HEIGHT,
      width: cardWidth,
    };
  }

  return {
    left: clamp(rect.left + rect.width / 2 - cardWidth / 2, ONBOARDING_VIEWPORT_INSET, viewportWidth - cardWidth - ONBOARDING_VIEWPORT_INSET),
    top: rect.bottom + gap,
    width: cardWidth,
  };
}
