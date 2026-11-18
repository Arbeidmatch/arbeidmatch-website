/**
 * CARD PAYMENT IS PAUSED (his decision, 18 November 2026: "stripe il vom pune
 * pe pauza momentan"). The live Stripe key had expired, the card button on the
 * order page led nowhere, and the daily reconcile cron wrote an error to his
 * bell every morning. While this is false: the order page offers invoice only,
 * the payment route refuses a card, and the reconcile cron does nothing (it is
 * also out of vercel.json). To resume: a new live key in Vercel
 * (STRIPE_SECRET_KEY), this set to true, and the cron entry back.
 */
export const CARD_PAYMENTS_ON = false;
