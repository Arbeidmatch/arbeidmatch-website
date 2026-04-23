import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const schema = z.object({
  email: z.string().trim().email(),
  action: z.enum(["cancel_at_period_end", "resume"]),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) return NextResponse.json({ error: "Stripe not configured." }, { status: 503 });
  const stripe = new Stripe(secret);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });

  const email = parsed.data.email.trim().toLowerCase();
  const rowRes = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("employer_email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (rowRes.error || !rowRes.data?.stripe_subscription_id) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  const subId = rowRes.data.stripe_subscription_id;
  const cancelAtPeriodEnd = parsed.data.action === "cancel_at_period_end";

  const updated = await stripe.subscriptions.update(subId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: updated.cancel_at_period_end ?? false,
      status: updated.status === "active" ? "active" : updated.status === "trialing" ? "trialing" : "past_due",
    })
    .eq("stripe_subscription_id", subId);

  return NextResponse.json({
    success: true,
    cancel_at_period_end: updated.cancel_at_period_end ?? false,
    status: updated.status,
  });
}
