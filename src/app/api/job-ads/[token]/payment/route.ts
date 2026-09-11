import { NextRequest } from "next/server";
import Stripe from "stripe";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { choosePayment } from "@/lib/job-ads/atsClient";
import { norwegianError } from "@/lib/job-ads/errors";
import { jobAdCheckoutParams } from "@/lib/job-ads/stripe";
import { isAdAddon, isAdPackage, isOrderToken, type AdPackage, type PaymentMethod } from "@/lib/job-ads/types";
import { getPublicBaseUrl } from "@/lib/premium/stripeEnv";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ token: string }> };

/**
 * The client's package, add-ons and way to pay.
 *
 *   { action: "quote", package, addons }
 *     Freezes the price in the ATS as a card choice, which commits nothing: no
 *     invoice, no charge, nothing published. The page shows the returned
 *     order.chosen.quote as the final price before the client confirms.
 *
 *   { action: "pay", package, addons, method, expectedTotalNok, invoiceReference?, invoiceEmail? }
 *     Freezes the same choice again and checks the total is still the one the
 *     client saw. Card: opens a Stripe Checkout Session for exactly that total
 *     and returns { checkoutUrl }. Invoice: the ATS writes the invoice and
 *     publishes the advert.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isOrderToken(token)) return noStoreJson({ ok: false, error: norwegianError(404) }, { status: 404 });
  const rate = getRateLimitResult(request, "job-ads-payment", 30, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ ok: false, error: norwegianError(429) }, { status: 429 });

  let body: {
    action?: string;
    package?: string;
    addons?: unknown;
    method?: string;
    expectedTotalNok?: number;
    invoiceReference?: string;
    invoiceEmail?: string;
  };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ ok: false, error: norwegianError(400) }, { status: 400 });
  }

  if (!isAdPackage(body.package)) return noStoreJson({ ok: false, error: "Velg en pakke." }, { status: 400 });
  const pkg: AdPackage = body.package;
  const addons = Array.isArray(body.addons) ? [...new Set(body.addons.filter(isAdAddon))] : [];

  // The price as a card choice: frozen, nothing committed.
  const frozen = await choosePayment(token, { package: pkg, addons, method: "card" });
  if (!frozen.ok) return noStoreJson({ ok: false, error: norwegianError(frozen.status, frozen.error) }, { status: frozen.status });
  const order = frozen.data;

  if (body.action !== "pay") return noStoreJson({ ok: true, order });

  const method: PaymentMethod | null = body.method === "card" || body.method === "invoice" ? body.method : null;
  if (!method) return noStoreJson({ ok: false, error: "Velg betalingsmåte." }, { status: 400 });
  if (order.status !== "awaiting_payment" || !order.chosen?.quote) {
    return noStoreJson({ ok: true, order });
  }

  const expected = Number(body.expectedTotalNok);
  if (!Number.isFinite(expected) || Math.round(expected) !== Math.round(order.chosen.quote.totalNok)) {
    return noStoreJson(
      { ok: false, error: "Prisen er oppdatert. Se over den nye prisen og bekreft på nytt.", order },
      { status: 409 },
    );
  }

  if (method === "invoice") {
    const reference = String(body.invoiceReference ?? "").trim().slice(0, 100) || null;
    const invoiceEmail = String(body.invoiceEmail ?? "").trim().slice(0, 200) || null;
    if (invoiceEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceEmail)) {
      return noStoreJson({ ok: false, error: "E-postadressen for faktura ser ikke riktig ut." }, { status: 400 });
    }
    const invoiced = await choosePayment(token, { package: pkg, addons, method: "invoice", invoiceReference: reference, invoiceEmail });
    if (!invoiced.ok) {
      return noStoreJson({ ok: false, error: norwegianError(invoiced.status, invoiced.error) }, { status: invoiced.status });
    }
    return noStoreJson({ ok: true, order: invoiced.data });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return noStoreJson(
      { ok: false, error: "Kortbetaling er ikke tilgjengelig akkurat nå. Velg faktura, eller prøv igjen senere.", order },
      { status: 503 },
    );
  }
  const params = jobAdCheckoutParams({ order, token, baseUrl: getPublicBaseUrl() });
  if (!params) return noStoreJson({ ok: false, error: norwegianError(409), order }, { status: 409 });

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create(params);
    if (!session.url) throw new Error("Stripe returned a session without a URL");
    return noStoreJson({ ok: true, order, checkoutUrl: session.url });
  } catch (error) {
    await notifyError({ route: "/api/job-ads/[token]/payment", error });
    return noStoreJson(
      { ok: false, error: "Vi fikk ikke åpnet kortbetalingen. Prøv igjen, eller velg faktura.", order },
      { status: 502 },
    );
  }
}
