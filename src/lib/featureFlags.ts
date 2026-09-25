/** Homepage audience welcome slide-up routes visitors to the right journey. */
export const WELCOME_MODAL_ENABLED = true;

/** Candidate intake is verified by email before the candidate continues to Recman. */
export const TALENT_NETWORK_FORM_ENABLED = true;

/** BETA: recruiter network is invite-only; public signup POST /apply is off. */
export const RECRUITER_PUBLIC_SIGNUP_ENABLED = false;

export const JOBS_PORTAL_URL = "/jobs";

/**
 * Buying Premium (the paid subscription checkout). Off until Premium has its own
 * consumer terms (withdrawal right, price, renewal and cancellation), the owner,
 * 25 September 2026. While off, /api/premium/create-checkout answers 503 without
 * calling the payment provider and the paywall shows "Coming soon" instead of a
 * buy button. Access that already exists (trials, subscribers) is unchanged.
 */
export const PREMIUM_PURCHASE_ENABLED = false;

/** What the checkout route answers while PREMIUM_PURCHASE_ENABLED is off. */
export const PREMIUM_NOT_AVAILABLE_MESSAGE = "Premium subscriptions are not available yet. Coming soon.";
