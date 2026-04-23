import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validatePartnerSessionOrToken } from "@/lib/partnerSearch";
import { makeReferralCode } from "@/lib/partnerMonetization";

const schema = z.object({
  session_token: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const auth = await validatePartnerSessionOrToken(parsed.data.session_token);
  if (!auth || !auth.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const code = makeReferralCode(auth.email);
  const origin = request.nextUrl.origin || "https://arbeidmatch.no";
  const inviteUrl = `${origin}/become-a-partner?ref=${encodeURIComponent(code)}`;
  return NextResponse.json({
    success: true,
    referral_code: code,
    invite_url: inviteUrl,
    bonus_message: "Get 1 free alert for 1 month for each confirmed partner referral.",
  });
}
