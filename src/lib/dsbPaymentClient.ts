/**
 * Client-side mirror for DSB payment UI. Unset or not "true" keeps guides free-only in the browser.
 * Server routes use `DSB_PAYMENT_ENABLED` via `isDsbPaymentEnabled()` in `dsbPaymentEnv.ts`.
 */
export const DSB_PAYMENT_ENABLED = process.env.NEXT_PUBLIC_DSB_PAYMENT_ENABLED === "true";
