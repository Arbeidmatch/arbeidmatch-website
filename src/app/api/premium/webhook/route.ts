import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import type { PremiumPlan, PremiumStatus } from "@/lib/premium/subscribers";
import {
  fetchSubscriberBySubscriptionId,
  updateSubscriberByEmail,
  updateSubscriberBySubscriptionId,
} from "@/lib/premium/subscribers";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

function mapStripeStatus(status: Stripe.Subscription.Status): PremiumStatus {
  if (status === "active" || status === "trialing") return status;
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "canceled";
}

async function resolveEmailFromSubscription(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<string | null> {
  const meta = sub.metadata?.premium_email?.trim().toLowerCase();
  if (meta) return meta;
  const cid = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!cid) return null;
  const c = await stripe.customers.retrieve(cid);
  if (c.deleted || !("email" in c) || !c.email) return null;
  return c.email.trim().toLowerCase();
}

async function applySubscriptionState(stripe: Stripe, sub: Stripe.Subscription) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;

  const email = await resolveEmailFromSubscription(stripe, sub);
  const plan: PremiumPlan = sub.metadata?.premium_plan === "annual" ? "annual" : "monthly";
  const status = mapStripeStatus(sub.status);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  const existing = await fetchSubscriberBySubscriptionId(supabase, sub.id);
  if (existing?.email) {
    await updateSubscriberBySubscriptionId(sub.id, {
      stripe_customer_id: customerId,
      plan,
      status,
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
    });
    return;
  }

  if (email) {
    await updateSubscriberByEmail(email, {
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      plan,
      status,
      subscribed_at: status === "active" ? new Date().toISOString() : undefined,
      canceled_at: status === "canceled" ? new Date().toISOString() : null,
    });
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[premium/webhook] verify", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscriptionState(stripe, sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateSubscriberBySubscriptionId(sub.id, {
          status: "canceled",
          canceled_at: new Date().toISOString(),
        });
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const subRaw = (inv as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null })
          .subscription;
        const subId = typeof subRaw === "string" ? subRaw : subRaw?.id;
        if (subId) {
          await updateSubscriberBySubscriptionId(subId, { status: "past_due" });
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("[premium/webhook] handler", e);
    return NextResponse.json({ received: true, error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
