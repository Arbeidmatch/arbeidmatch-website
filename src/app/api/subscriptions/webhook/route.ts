import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { buildEmail } from "@/lib/emailTemplate";

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

function mapStatus(status: string): "active" | "cancelled" | "past_due" | "trialing" {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "cancelled";
}

async function syncSubscription(sub: Stripe.Subscription) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const currentPeriodStart = sub.items.data[0]?.current_period_start
    ? new Date(sub.items.data[0].current_period_start * 1000).toISOString()
    : null;
  const currentPeriodEnd = sub.items.data[0]?.current_period_end
    ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
    : null;

  const plan = sub.metadata?.plan === "scale" ? "scale" : sub.metadata?.plan === "growth" ? "growth" : "trial";
  const status = mapStatus(sub.status);

  await supabase
    .from("subscriptions")
    .update({
      status,
      plan,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      requests_limit: plan === "growth" ? 5 : plan === "scale" ? null : 1,
    })
    .eq("stripe_subscription_id", sub.id);
}

async function sendEmail(to: string, subject: string, title: string, body: string) {
  const transporter = createSmtpTransporter();
  if (!transporter) return;
  await transporter.sendMail({
    ...mailHeaders(),
    to,
    subject,
    html: buildEmail({
      title,
      preheader: "Subscription billing update.",
      body,
      ctaText: "Open dashboard",
      ctaUrl: "https://arbeidmatch.no/dashboard/subscription",
    }),
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_SUBSCRIPTIONS_WEBHOOK_SECRET?.trim() || process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const stripe = new Stripe(secret);
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (error) {
    await notifyError({ route: "/api/subscriptions/webhook", error });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (supabase && subscriptionId) {
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              requests_used: 0,
              current_period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            })
            .eq("stripe_subscription_id", subscriptionId);
        }
        if (invoice.customer_email) {
          await sendEmail(
            invoice.customer_email,
            "Invoice paid – subscription active",
            "Payment confirmed",
            `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#fff;">Your invoice has been paid successfully.</p>
             <p style="margin:0;font-size:14px;line-height:1.6;color:#fff;">${
               invoice.hosted_invoice_url ? `Invoice: <a href="${invoice.hosted_invoice_url}" style="color:#C9A84C;">open invoice</a>.` : ""
             }</p>`,
          );
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (supabase && subscriptionId) {
          await supabase.from("subscriptions").update({ status: "past_due" }).eq("stripe_subscription_id", subscriptionId);
        }
        await notifySlack("employers", {
          title: "Subscription payment failed",
          fields: {
            email: invoice.customer_email || "-",
            subscription: subscriptionId || "-",
          },
        });
        if (invoice.customer_email) {
          await sendEmail(
            invoice.customer_email,
            "Payment failed – update billing method",
            "Payment failed",
            `<p style="margin:0;font-size:14px;line-height:1.6;color:#fff;">We could not process your subscription payment. Please update your payment method to avoid interruption.</p>`,
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (supabase) {
          await supabase.from("subscriptions").update({ status: "cancelled" }).eq("stripe_subscription_id", sub.id);
        }
        const email = sub.metadata?.employer_email;
        if (email) {
          await sendEmail(
            email,
            "Subscription cancelled",
            "Subscription cancelled",
            `<p style="margin:0;font-size:14px;line-height:1.6;color:#fff;">Your subscription has been cancelled. You can reactivate anytime from your dashboard.</p>`,
          );
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await notifyError({ route: "/api/subscriptions/webhook", error });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
