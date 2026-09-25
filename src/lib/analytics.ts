/**
 * No-op: GA4 removed (AM-WEB-080). Call sites unchanged; no third-party analytics.
 * The site loads no analytics tag at all; the Next.js third-party scripts package, which would have
 * provided one, was dropped from the dependencies on 25 September 2026. Pageviews
 * are counted first-party and without cookies by TrafficBeacon and /api/track.
 */
export function trackEvent(_eventName: string, _params?: Record<string, string | number | boolean>) {}
