import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { getPublicBaseUrl, type DsbGuideSlug } from "@/lib/dsbGuideAccess";

export const dynamic = "force-dynamic";

function guideLabel(slug: string): string {
  if (slug === "eu") return "EU/EEA";
  if (slug === "non-eu") return "Non-EU";
  return slug;
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
  const email = (metadata.email as string | undefined)?.trim().toLowerCase();
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
  const buyerEmail = email || (existing?.email as string | undefined);

  if (existing?.stripe_payment_status === "paid") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { error: updateError } = await supabase
    .from("dsb_guide_purchases")
    .update({ stripe_payment_status: "paid" })
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
      ? new Date(expRaw).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })
      : "the date shown in your account email";

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: buyerEmail,
      subject: "Your DSB Guide is ready",
      text: `Hi,

Your purchase is confirmed.

Access your DSB ${label} Guide here:
${accessLink}

This link is personal and expires on ${expDate}.
Do not share it with others.

ArbeidMatch Norge AS`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;padding:24px;color:#0D1B2A;">
            <p>Hi,</p>
            <p>Your purchase is confirmed.</p>
            <p><strong>Access your DSB ${label} Guide here:</strong><br />
              <a href="${accessLink}" style="color:#C9A84C;">${accessLink}</a>
            </p>
            <p>This link is personal and expires on <strong>${expDate}</strong>.</p>
            <p>Do not share it with others.</p>
            <p style="margin-top:24px;">ArbeidMatch Norge AS</p>
          </div>
        </div>
      `,
    });
  }

  await transporter.sendMail({
    from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
    to: "post@arbeidmatch.no",
    subject: `New DSB Guide purchase: ${slug || "?"} - ${buyerEmail || "unknown"}`,
    text: `New DSB guide purchase.\nGuide: ${slug}\nEmail: ${buyerEmail}\nSession: ${sessionId}`,
  });

  return NextResponse.json({ received: true });
}
