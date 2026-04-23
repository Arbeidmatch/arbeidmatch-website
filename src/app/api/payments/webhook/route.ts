import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { notifyError } from "@/lib/errorNotifier";
import { getStripeServerClient } from "@/lib/stripe/client";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const CREDIT_PACKAGE_MAP: Record<string, number> = {
  credits_starter: 10,
  credits_growth: 30,
  credits_pro: 75,
};

function baseUrlFromRequest(request: NextRequest): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return request.nextUrl.origin;
}

async function upsertCreditsForPayment(email: string, packageType: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const normalizedEmail = email.trim().toLowerCase();
  const existingRes = await supabase
    .from("credit_accounts")
    .select("email,credits_balance,premium_active,premium_expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  const existing = existingRes.data as
    | { email: string; credits_balance?: number | null; premium_active?: boolean | null; premium_expires_at?: string | null }
    | null;

  const nextValues: Record<string, unknown> = { email: normalizedEmail };
  if (packageType in CREDIT_PACKAGE_MAP) {
    const add = CREDIT_PACKAGE_MAP[packageType]!;
    nextValues.credits_balance = Math.max(0, Number(existing?.credits_balance ?? 0)) + add;
  }
  if (packageType === "premium_annual") {
    const now = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    nextValues.premium_active = true;
    nextValues.premium_expires_at = new Date(now + oneYearMs).toISOString();
  }

  const upsert = await supabase.from("credit_accounts").upsert(nextValues, { onConflict: "email" });
  if (upsert.error) {
    throw upsert.error;
  }
}

async function createInvoice(request: NextRequest, paymentIntent: Stripe.PaymentIntent) {
  const amountOre = paymentIntent.amount_received || paymentIntent.amount || 0;
  const employerEmail = paymentIntent.metadata?.employer_email?.trim().toLowerCase() || "";
  const packageType = paymentIntent.metadata?.package_type || "unknown";
  if (!employerEmail) return;

  const url = `${baseUrlFromRequest(request)}/api/invoices/create`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      employer_email: employerEmail,
      stripe_payment_intent_id: paymentIntent.id,
      items: [
        {
          description: `Payment for ${packageType}`,
          quantity: 1,
          unit_price: amountOre,
        },
      ],
    }),
  }).catch(() => null);
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    const stripe = getStripeServerClient();
    event = stripe.webhooks.constructEvent(raw, signature, webhookSecret);
  } catch (error) {
    await notifyError({ route: "/api/payments/webhook", error, context: { severity: "warning", stage: "signature_verify" } });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const employerEmail = paymentIntent.metadata?.employer_email?.trim().toLowerCase() || "";
      const packageType = paymentIntent.metadata?.package_type || "";
      const amountNok = (paymentIntent.amount_received || paymentIntent.amount || 0) / 100;

      if (employerEmail && packageType) {
        await upsertCreditsForPayment(employerEmail, packageType);
        await createInvoice(request, paymentIntent);
      }

      await notifyError({
        route: "/api/payments/webhook",
        error: new Error(`Payment received: ${amountNok} NOK from ${employerEmail || "unknown"}`),
        context: { severity: "info", eventType: event.type, payment_intent_id: paymentIntent.id },
      });
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await notifyError({
        route: "/api/payments/webhook",
        error: new Error("Payment failed"),
        context: {
          severity: "warning",
          eventType: event.type,
          employer_email: paymentIntent.metadata?.employer_email || null,
          payment_intent_id: paymentIntent.id,
        },
      });
    }
  } catch (error) {
    await notifyError({ route: "/api/payments/webhook", error, context: { severity: "warning", stage: "event_handler" } });
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
