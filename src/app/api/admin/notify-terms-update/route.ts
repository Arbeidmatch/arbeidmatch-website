import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const bodySchema = z.object({
  terms_version: z.string().trim().min(1),
  privacy_version: z.string().trim().min(1),
  summary_of_changes: z.string().trim().min(1).max(4000),
  type: z.enum(["terms", "privacy"]),
});

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 5 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.includes("@") ? email : null;
}

function getSiteBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://arbeidmatch.no";
}

export async function POST(request: NextRequest) {
  const expected = process.env.ADMIN_SECRET?.trim();
  const headerSecret = request.headers.get("x-admin-secret")?.trim() || request.nextUrl.searchParams.get("secret")?.trim();
  if (!expected || headerSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload.", details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const input = parsed.data;
    const effectiveVersion = input.type === "terms" ? input.terms_version : input.privacy_version;

    const insertVersion = await supabase.from("terms_versions").insert({
      version: effectiveVersion,
      type: input.type,
      summary_of_changes: input.summary_of_changes,
      effective_date: new Date().toISOString().slice(0, 10),
    });
    if (insertVersion.error) {
      throw insertVersion.error;
    }

    const [candidatesRes, employersRes] = await Promise.all([
      supabase.from("candidates").select("email").eq("terms_refused", false),
      supabase.from("employer_requests").select("email").eq("terms_refused", false),
    ]);

    const emailSet = new Set<string>();
    for (const row of candidatesRes.data ?? []) {
      const email = normalizeEmail((row as { email?: unknown }).email);
      if (email) emailSet.add(email);
    }
    for (const row of employersRes.data ?? []) {
      const email = normalizeEmail((row as { email?: unknown }).email);
      if (email) emailSet.add(email);
    }
    const emails = [...emailSet];

    const transporter = createSmtpTransporter();
    let sent = 0;
    if (transporter && emails.length > 0) {
      const baseUrl = getSiteBaseUrl();
      const policyLabel = input.type === "terms" ? "Terms" : "Privacy Policy";
      const reviewChangesUrl = `${baseUrl}/${input.type === "terms" ? "terms" : "privacy"}`;

      for (let offset = 0; offset < emails.length; offset += BATCH_SIZE) {
        const batch = emails.slice(offset, offset + BATCH_SIZE);
        await Promise.all(
          batch.map(async (email) => {
            const reviewAcceptUrl = `${baseUrl}/terms-update?version=${encodeURIComponent(effectiveVersion)}&type=${encodeURIComponent(input.type)}&email=${encodeURIComponent(email)}`;
            await transporter.sendMail({
              ...mailHeaders(),
              to: email,
              subject: `Important: Our ${policyLabel} have been updated`,
              text:
                `Important update to our ${policyLabel}.\n\n` +
                `Summary of changes:\n${input.summary_of_changes}\n\n` +
                `Review & Accept: ${reviewAcceptUrl}\n` +
                `Review Changes: ${reviewChangesUrl}\n\n` +
                `This email is sent in line with GDPR transparency obligations.`,
              html: buildEmail({
                title: `We've updated our ${policyLabel}`,
                preheader: "Please review and confirm the latest policy version.",
                body: `
                  <p style="margin:0 0 16px 0;font-size:15px;color:rgba(255,255,255,0.82);line-height:1.7;">
                    Summary of changes:
                  </p>
                  <p style="margin:0 0 16px 0;font-size:14px;color:rgba(255,255,255,0.72);line-height:1.7;white-space:pre-line;">
                    ${input.summary_of_changes}
                  </p>
                  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.7;">
                    Please review and confirm the updated policy to keep full account access.
                  </p>
                `,
                ctaText: "Review & Accept",
                ctaUrl: reviewAcceptUrl,
                footerNoteHtml: `<a href="${reviewChangesUrl}" style="color:rgba(255,255,255,0.55);text-decoration:underline;">Review Changes</a>`,
                audience: "b2c",
                unsubscribeEmail: email,
              }),
            });
          }),
        );
        sent += batch.length;
        if (offset + BATCH_SIZE < emails.length) {
          await sleep(BATCH_DELAY_MS);
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted_version: effectiveVersion,
      notified_total: emails.length,
      sent,
      batch_size: BATCH_SIZE,
      batch_delay_ms: BATCH_DELAY_MS,
    });
  } catch (error) {
    await notifyError({ route: "/api/admin/notify-terms-update", error });
    return NextResponse.json({ error: "Failed to notify users about terms update." }, { status: 500 });
  }
}
