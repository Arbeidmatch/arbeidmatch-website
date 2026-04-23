import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getStripeServerClient } from "@/lib/stripe/client";

const bodySchema = z.object({
  amount_nok: z.number().positive(),
  description: z.string().trim().min(1).max(200),
  employer_email: z.string().email(),
  package_type: z.enum(["credits_starter", "credits_growth", "credits_pro", "premium_annual"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;
    const amountOre = Math.round(payload.amount_nok * 100);
    if (!Number.isFinite(amountOre) || amountOre < 50) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const stripe = getStripeServerClient();
    const intent = await stripe.paymentIntents.create({
      amount: amountOre,
      currency: "nok",
      description: payload.description,
      automatic_payment_methods: { enabled: true },
      metadata: {
        employer_email: payload.employer_email.trim().toLowerCase(),
        package_type: payload.package_type,
      },
      receipt_email: payload.employer_email.trim().toLowerCase(),
    });

    if (!intent.client_secret) {
      return NextResponse.json({ error: "Failed to create payment intent." }, { status: 500 });
    }

    return NextResponse.json({
      client_secret: intent.client_secret,
      payment_intent_id: intent.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create payment intent.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
