import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { priceIdForPlan } from "@/lib/stripe/products";
import { buildEmail } from "@/lib/emailTemplate";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifySlack } from "@/lib/slackNotifier";
import { notifyError } from "@/lib/errorNotifier";

const schema = z.object({
  employer_email: z.string().trim().email(),
  company_name: z.string().trim().max(160).optional().default(""),
  plan: z.enum(["growth", "scale"]),
  billing_cycle: z.enum(["monthly", "annual"]).optional().default("monthly"),
  payment_method_id: z.string().trim().min(3),
});

function getStripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return null;
  return new Stripe(secret);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });

    const stripe = getStripeClient();
    if (!stripe) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

    const email = parsed.data.employer_email.trim().toLowerCase();
    const companyName = parsed.data.company_name.trim() || null;
    const priceId = priceIdForPlan(parsed.data.plan);
    if (!priceId.startsWith("price_")) {
      return NextResponse.json({ error: "Stripe price id is missing." }, { status: 503 });
    }

    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer =
      existingCustomers.data[0] ??
      (await stripe.customers.create({
        email,
        name: companyName ?? undefined,
        payment_method: parsed.data.payment_method_id,
        invoice_settings: { default_payment_method: parsed.data.payment_method_id },
      }));

    if (!existingCustomers.data[0]) {
      await stripe.paymentMethods.attach(parsed.data.payment_method_id, { customer: customer.id }).catch(() => null);
    }
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: parsed.data.payment_method_id },
      name: companyName ?? undefined,
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      default_payment_method: parsed.data.payment_method_id,
      collection_method: "charge_automatically",
      metadata: {
        employer_email: email,
        company_name: companyName ?? "",
        plan: parsed.data.plan,
        billing_cycle: parsed.data.billing_cycle,
      },
      discounts:
        parsed.data.billing_cycle === "annual" && process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID
          ? [{ coupon: process.env.STRIPE_ANNUAL_DISCOUNT_COUPON_ID }]
          : undefined,
      expand: ["latest_invoice"],
    });

    const latestInvoiceId =
      typeof subscription.latest_invoice === "string"
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id;
    if (latestInvoiceId) {
      const invoice = await stripe.invoices.retrieve(latestInvoiceId);
      if (invoice.status === "draft") {
        await stripe.invoices.finalizeInvoice(latestInvoiceId);
      }
    }

    const statusMap: Record<string, "active" | "cancelled" | "past_due" | "trialing"> = {
      active: "active",
      canceled: "cancelled",
      past_due: "past_due",
      trialing: "trialing",
      unpaid: "past_due",
    };
    const normalizedStatus = statusMap[subscription.status] ?? "trialing";

    const currentPeriodStart = subscription.items.data[0]?.current_period_start
      ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
      : null;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
      : null;

    const requestsLimit = parsed.data.plan === "growth" ? 5 : null;

    const upsertRes = await supabase.from("subscriptions").upsert(
      {
        employer_email: email,
        company_name: companyName,
        plan: parsed.data.plan,
        status: normalizedStatus,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        requests_used: 0,
        requests_limit: requestsLimit,
      },
      { onConflict: "stripe_subscription_id" },
    );

    if (upsertRes.error) {
      throw upsertRes.error;
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: `Subscription confirmed – ${parsed.data.plan === "growth" ? "Growth" : "Scale"}`,
        html: buildEmail({
          title: "Subscription confirmed",
          preheader: "Your monthly subscription is now active.",
          body: `
            <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#fff;">
              Your <strong>${parsed.data.plan === "growth" ? "Growth" : "Scale"}</strong> subscription is active.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#fff;">
              Billing period ends on <strong>${currentPeriodEnd ? new Date(currentPeriodEnd).toUTCString() : "N/A"}</strong>.
            </p>
          `,
          ctaText: "Open dashboard",
          ctaUrl: "https://arbeidmatch.no/dashboard/subscription",
          audience: "b2b",
          unsubscribeEmail: email,
        }),
      });
    }

    await notifySlack("employers", {
      title: "New subscription",
      fields: {
        plan: parsed.data.plan,
        email,
        company: companyName ?? "-",
      },
    });

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      customer_id: customer.id,
      status: normalizedStatus,
      current_period_end: currentPeriodEnd,
    });
  } catch (error) {
    await notifyError({ route: "/api/subscriptions/create", error });
    return NextResponse.json({ error: "Could not create subscription." }, { status: 500 });
  }
}
