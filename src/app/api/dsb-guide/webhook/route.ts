import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { getPublicBaseUrl, type DsbGuideSlug } from "@/lib/dsbGuideAccess";
import {
  buildInternalEmailHtml,
  emailDataTable,
  emailParagraph,
  formatEmailTimestampCet,
  mailHeaders,
  premiumCtaButton,
  wrapPremiumEmail,
} from "@/lib/emailPremiumTemplate";

export const dynamic = "force-dynamic";

function guideLabel(slug: string): string {
  if (slug === "eu") return "EU/EEA";
  if (slug === "non-eu") return "Non-EU";
  return slug;
}

function guideProductRow(slug: string | undefined): string {
  if (slug === "eu") return "EU/EEA Electricians";
  if (slug === "non-eu") return "Non-EU Electricians";
  return "DSB Guide";
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[dsb-guide/webhook] signature:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const metadata = session.metadata || {};
  const guideSlug = metadata.guide_slug as string | undefined;
  const customerEmail =
    session.customer_details?.email?.trim().toLowerCase() ||
    (typeof session.customer_email === "string" ? session.customer_email.trim().toLowerCase() : "") ||
    (metadata.email as string | undefined)?.trim().toLowerCase() ||
    "";
  const accessToken = metadata.access_token as string | undefined;

  if (!sessionId) {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("dsb_guide_purchases")
    .select("id, stripe_payment_status, access_token, guide_slug, email")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  const token =
    accessToken ||
    (existing?.access_token as string | undefined) ||
    undefined;
  const slug = (guideSlug || existing?.guide_slug) as DsbGuideSlug | undefined;
  const buyerEmail = customerEmail || (existing?.email as string | undefined)?.trim().toLowerCase() || "";

  if (existing?.stripe_payment_status === "paid") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const updatePayload: { stripe_payment_status: string; email?: string } = { stripe_payment_status: "paid" };
  if (customerEmail) {
    updatePayload.email = customerEmail;
  }

  const { error: updateError } = await supabase
    .from("dsb_guide_purchases")
    .update(updatePayload)
    .eq("stripe_session_id", sessionId);

  if (updateError) {
    console.error("[dsb-guide/webhook] update failed:", updateError.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const baseUrl = getPublicBaseUrl();
  const pathSlug = slug === "non-eu" ? "non-eu" : "eu";
  const accessLink = token ? `${baseUrl}/dsb-guide/${pathSlug}?token=${encodeURIComponent(token)}` : `${baseUrl}/dsb-support`;

  const smtpPass = process.env.SMTP_PASS;
  if (!smtpPass) {
    console.error("[dsb-guide/webhook] SMTP_PASS missing; skipping emails.");
    return NextResponse.json({ received: true, emailed: false });
  }

  const transporter = nodemailer.createTransport({
    host: "send.one.com",
    port: 465,
    secure: true,
    auth: {
      user: "no-replay@arbeidmatch.no",
      pass: smtpPass,
    },
  });

  const label = slug ? guideLabel(slug) : "DSB";

  if (buyerEmail) {
    const { data: purchaseRow } = await supabase
      .from("dsb_guide_purchases")
      .select("token_expires_at")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    const expRaw = purchaseRow?.token_expires_at as string | undefined;
    const expDate = expRaw
      ? new Date(expRaw).toLocaleString("en-GB", {
          timeZone: "Europe/Oslo",
          dateStyle: "long",
          timeStyle: "short",
        })
      : "the date shown in your purchase confirmation";

    const validUntilDisplay = expRaw
      ? new Date(expRaw).toLocaleString("en-GB", {
          timeZone: "Europe/Oslo",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "See confirmation";

    const innerHtml = [
      emailParagraph("Hi,"),
      emailParagraph("Your purchase is confirmed."),
      emailParagraph(`Your <strong>${label}</strong> DSB Authorization Guide is now available.`),
      emailDataTable([
        { label: "Guide", value: guideProductRow(slug) },
        { label: "Access", value: "30 days from today" },
        { label: "Valid until", value: validUntilDisplay },
      ]),
      `<div style="text-align:center;margin:24px 0 0;">${premiumCtaButton(accessLink, "Access Your Guide")}</div>`,
      emailParagraph(
        `This link is personal and expires on <strong>${expDate}</strong>. Please do not share it.`,
      ),
      emailParagraph("Having trouble? Reply to this email and we will help you."),
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: buyerEmail,
      subject: "Your DSB Guide is ready",
      text: `Hi,

Your purchase is confirmed.

Your ${label} DSB Authorization Guide is now available.

Please open the HTML version of this email and tap "Access Your Guide".

This access is personal and expires on ${expDate}. Please do not share it.

Having trouble? Reply to this email for help.`,
      html: wrapPremiumEmail(innerHtml),
    });
  }

  const { data: purchaseForInternal } = await supabase
    .from("dsb_guide_purchases")
    .select("token_expires_at, access_token")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();

  const internalRows = [
    { label: "Guide slug", value: slug || "-" },
    { label: "Buyer email", value: buyerEmail || "-" },
    { label: "Stripe session ID", value: sessionId },
    { label: "Access token", value: (purchaseForInternal?.access_token as string) || token || "-" },
    {
      label: "Token expires at (raw)",
      value: (purchaseForInternal?.token_expires_at as string) || "-",
    },
    { label: "Webhook received (CET)", value: formatEmailTimestampCet() },
  ];

  await transporter.sendMail({
    ...mailHeaders(),
    to: "post@arbeidmatch.no",
    subject: `New DSB Guide purchase: ${buyerEmail || "unknown"}`,
    text: `New DSB guide purchase.\nGuide: ${slug}\nEmail: ${buyerEmail}\nSession: ${sessionId}`,
    html: buildInternalEmailHtml({
      title: `New DSB Guide purchase: ${buyerEmail || "unknown"}`,
      rows: internalRows,
    }),
  });

  return NextResponse.json({ received: true });
}
