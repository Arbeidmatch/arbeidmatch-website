/** Premium easing — Linear / Stripe style */
export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export function getRevealDurationMs(isMobile: boolean): number {
  return isMobile ? 400 : 600;
}

export function getRevealStaggerMs(isMobile: boolean): number {
  return isMobile ? 40 : 80;
}

export function getRevealTranslateY(isMobile: boolean): number {
  return isMobile ? 12 : 24;
}

export function getPageTransitionMs(isMobile: boolean): number {
  return isMobile ? 240 : 350;
}
