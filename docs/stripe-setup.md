# Stripe setup — DSB guides

This project uses Stripe Checkout for one-time payments for DSB authorization guides.

## 1. Create two products in Stripe Dashboard

1. Open [Stripe Dashboard → Products](https://dashboard.stripe.com/products).
2. **Product A — EU/EEA guide**
   - Name: `DSB Guide EU/EEA` (or similar).
   - Pricing: **One-time**, **19 EUR**.
   - Save and copy the **Price ID** (starts with `price_...`).
3. **Product B — Non-EU guide**
   - Name: `DSB Guide Non-EU`.
   - Pricing: **One-time**, **49 EUR**.
   - Save and copy the **Price ID**.

## 2. Environment variables

Add to `.env.local` (and to your hosting provider, e.g. Vercel):

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Secret key from [API keys](https://dashboard.stripe.com/apikeys) (`sk_live_...` or `sk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from the webhook endpoint (`whsec_...`). |
| `STRIPE_PRICE_ID_DSB_EU` | Price ID for the 19 EUR guide. |
| `STRIPE_PRICE_ID_DSB_NON_EU` | Price ID for the 49 EUR guide. |
| `NEXT_PUBLIC_BASE_URL` | Public site URL, e.g. `https://arbeidmatch.no` (used for success/cancel URLs). |

The checkout route also reads `stripe_price_id` from the `dsb_guides` table; if you set the env price IDs, they override placeholder values from the database.

## 3. Supabase tables

Run `supabase/dsb_guides.sql` in the Supabase SQL editor (or your migration process). Update `dsb_guides.stripe_price_id` for `eu` and `non-eu` if you did not use the seed placeholders.

## 4. Webhook endpoint

1. In Stripe: **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://arbeidmatch.no/api/dsb-guide/webhook`  
   (For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3000/api/dsb-guide/webhook`.)
3. **Events to send:** select `checkout.session.completed`.
4. Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

## 5. Test mode

Use test API keys and test price IDs while developing. Complete a test checkout and confirm:

- `dsb_guide_purchases.stripe_payment_status` becomes `paid` after the webhook fires.
- The buyer receives the confirmation email with the access link.

## Troubleshooting

- **Webhook returns 400:** Check `STRIPE_WEBHOOK_SECRET` and that the raw request body is used (the app verifies the Stripe signature).
- **Checkout fails:** Verify `STRIPE_SECRET_KEY`, price IDs, and that prices are in **EUR** if that is what you configured.
