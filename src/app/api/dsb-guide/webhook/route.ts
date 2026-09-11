/**
 * The address Stripe actually calls.
 *
 * Stripe's live webhook endpoint for this site (we_1TNXl1JOA4NI25QcoUmLI9dM,
 * created 18 April 2026 for the DSB guide) points here and sends
 * checkout.session.completed; the DSB product and this route were retired on
 * 2 May 2026, so every event since answered 404. STRIPE_WEBHOOK_SECRET in Vercel
 * dates from that same day and is that endpoint's signing secret.
 *
 * Paid job adverts (11 September 2026) confirm their card payments through
 * checkout.session.completed, so the route is back, handled by the one webhook
 * the site has: it verifies the signature, forwards only paid `kind: job_ad`
 * sessions to the ATS, and leaves everything else as the premium webhook
 * always has. Read on the Stripe account, not assumed: no endpoint points at
 * /api/premium/webhook.
 */
export { POST } from "../../premium/webhook/route";

export const dynamic = "force-dynamic";
