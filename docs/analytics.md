# GA4 Analytics Setup (FEREASTRA F4)

This document describes the GA4 events implemented for the `/request` flow.

## 1. Add GA4 base snippet

Add your GA4 tag in the app layout (or your analytics bootstrap location) so `window.gtag` is available on the client.

Required ID format: `G-XXXXXXXXXX`.

## 2. Request flow events

The event mapper lives in `src/lib/analytics/requestEvents.ts`.

Implemented events:

- `request_start` with `{ category }`
- `request_step_complete` with `{ step, category }`
- `request_submit` with `{ category, candidates_count }`
- `rare_profile_view` with `{ category, count }`
- `partner_access_request` (no params)

## 3. Integration points

Tracking is integrated in `src/app/request/page.tsx`:

- Search started -> `trackRequestStart(category)`
- Search result completed -> `trackRequestStepComplete(1, category)`
- Rare profile result shown -> `trackRareProfileView(category, count)`
- "I have partner access" click -> `trackPartnerAccessRequest()`
- Partner verification success -> `trackRequestSubmit(category, candidates_count)`

## 4. Verify events in GA4 DebugView

1. Open the site in a browser with GA enabled.
2. Go through `/request` flow steps.
3. In GA4, open **Admin -> DebugView**.
4. Confirm all events appear with expected parameters.

## 5. Notes

- Tracking calls are guarded with `if (typeof window !== "undefined" && window.gtag)`.
- If events do not appear, verify GA script load order and measurement ID.
