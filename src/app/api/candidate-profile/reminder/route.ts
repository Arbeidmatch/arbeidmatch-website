import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { createSmtpTransporter, PROFILE_TRANSACTIONAL_FROM } from "@/lib/candidates/smtpShared";
import { draftToIncompleteCandidateRow } from "@/lib/candidates/progressRow";
import { getSupabaseAdminClient } from "@/lib/jobs/applyService";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { isRateLimited } from "@/lib/requestProtection";
import { logApiError } from "@/lib/secureLogger";
import { notifyError } from "@/lib/errorNotifier";
import { emailParagraph, premiumCtaButton, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";

const bodySchema = z.object({
  email: z.string().trim().email(),
});

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-profile-reminder", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "SMTP not configured." }, { status: 500 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const emailKey = parsed.data.email.toLowerCase();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const existing = await supabase
      .from("candidates")
      .select("email,first_name,profile_completion_step,last_email_sent,profile_draft")
      .eq("email", emailKey)
      .maybeSingle();

    if (existing.error) {
      logApiError("/api/candidate-profile/reminder lookup", existing.error);
      return NextResponse.json({ error: "Could not send reminder." }, { status: 500 });
    }

    if (existing.data?.profile_completion_step != null && existing.data.profile_completion_step >= 9) {
      return NextResponse.json({ error: "Profile is already complete." }, { status: 400 });
    }

    if (existing.data?.last_email_sent) {
      const last = new Date(existing.data.last_email_sent).getTime();
      if (Number.isFinite(last) && Date.now() - last < REMINDER_COOLDOWN_MS) {
        return NextResponse.json({ error: "A reminder was sent recently. Check your inbox or try again tomorrow." }, { status: 429 });
      }
    }

    const firstName =
      (typeof existing.data?.first_name === "string" && existing.data.first_name.trim()) ||
      (() => {
        const d = existing.data?.profile_draft;
        if (d && typeof d === "object" && "firstName" in d && typeof (d as { firstName?: unknown }).firstName === "string") {
          return (d as { firstName: string }).firstName.trim();
        }
        return "";
      })() ||
      "there";

    if (!existing.data) {
      const stub = draftToIncompleteCandidateRow(emailKey, 0, { email: emailKey, firstName });
      const ins = await supabase.from("candidates").insert({
        ...stub,
        profile_token: token,
        token_expires_at: expiresAt,
        last_email_sent: nowIso,
      });
      if (ins.error) {
        logApiError("/api/candidate-profile/reminder insert", ins.error);
        return NextResponse.json(
          { error: "Could not create profile record.", hint: "Run supabase/candidates_profile_resume.sql if columns are missing." },
          { status: 500 },
        );
      }
    } else {
      const upd = await supabase
        .from("candidates")
        .update({
          profile_token: token,
          token_expires_at: expiresAt,
          last_email_sent: nowIso,
          updated_at: nowIso,
        })
        .eq("email", emailKey);
      if (upd.error) {
        logApiError("/api/candidate-profile/reminder update", upd.error);
        return NextResponse.json({ error: "Could not update profile token." }, { status: 500 });
      }
    }

    const base = getSiteOrigin();
    const link = `${base}/candidates/complete-profile?token=${encodeURIComponent(token)}`;
    const step = existing.data?.profile_completion_step ?? 0;
    const displayStep = Math.min(9, Math.max(0, step));

    const safeFirst = escapeHtml(firstName);
    const inner = [
      emailParagraph(`Hi ${safeFirst},`),
      emailParagraph("You started applying on ArbeidMatch, but your candidate profile is not finished yet."),
      emailParagraph(`<strong>Progress:</strong> you are <strong>${displayStep}</strong> of <strong>9</strong> steps in.`),
      `<p style="margin:24px 0;text-align:center;">${premiumCtaButton(link, "Continue My Profile")}</p>`,
      emailParagraph(`Or copy this link:<br /><span style="word-break:break-all;font-size:13px;color:#555;">${escapeHtml(link)}</span>`),
      emailParagraph("This secure link is valid for 7 days."),
    ].join("");

    await transporter.sendMail({
      from: PROFILE_TRANSACTIONAL_FROM,
      to: emailKey,
      subject: "Complete your ArbeidMatch profile to apply",
      html: wrapPremiumEmail(inner),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-profile/reminder", error });
    logApiError("/api/candidate-profile/reminder", error);
    return NextResponse.json({ error: "Failed to send reminder." }, { status: 500 });
  }
}
