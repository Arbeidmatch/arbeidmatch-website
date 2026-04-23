import { loadStripe } from "@stripe/stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

if (!publishableKey) {
  // Keep this explicit so misconfiguration fails fast in checkout UI.
  // eslint-disable-next-line no-console
  console.warn("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

export const stripeBrowserPromise = publishableKey ? loadStripe(publishableKey) : null;
