import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const consentSchema = z.object({
  accepted: z.boolean(),
  acceptedAt: z.string().datetime(),
  preferences: z.object({
    essential: z.literal(true),
    analytics: z.boolean(),
    marketing: z.boolean(),
  }),
});

export async function POST(request: NextRequest) {
  const parsed = consentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid consent payload." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
