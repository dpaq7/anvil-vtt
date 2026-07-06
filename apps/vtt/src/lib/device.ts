/**
 * Device-tier detection for the live-play surfaces.
 *
 * Phones (narrow touch viewports) never get the full gameplay surface — they
 * are routed to the phone companion (`PhoneSessionPage`) or the mobile app
 * shell (`/app/mobile`). Tablets (≥768px, even with coarse pointers) and
 * desktops keep the full canvas experience.
 */
export const PHONE_COMPANION_MEDIA_QUERY =
  '(max-width: 767px) and (pointer: coarse)';

export function isPhoneCompanionViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(PHONE_COMPANION_MEDIA_QUERY).matches;
}
