import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildInternalEmailHtml, mailHeaders, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().uuid(),
  company: z.object({
    company_name: z.string().trim().min(2).max(160),
    contact_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
  }),
  category: z.string().trim().min(2).max(120),
  access_level: z.enum(["see_available", "connect_hire"]),
});

function buildEmployerConfirmationHtml(accessLevel: "see_available" | "connect_hire"): string {
  const detail =
    accessLevel === "connect_hire"
      ? "Our team will reach out to discuss partnership options."
      : "We'll prepare your candidate preview shortly.";
  return wrapPremiumEmail(`
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#ffffff;">Thank you for your interest in working with ArbeidMatch. We appreciate that you chose us and we'll be in touch within 48 hours.</p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#ffffff;">${detail}</p>
  `);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse((await request.json().catch(() => null)) as unknown);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const tokenRes = await supabase
      .from("request_tokens")
      .select("token,email,expires_at,used,job_summary")
      .eq("token", parsed.data.token)
      .maybeSingle();
    if (tokenRes.error || !tokenRes.data) {
      return NextResponse.json({ success: false, error: "Token not found." }, { status: 404 });
    }
    if (tokenRes.data.used === true) {
      return NextResponse.json({ success: false, error: "Token already used." }, { status: 410 });
    }
    if (new Date(tokenRes.data.expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ success: false, error: "Token expired." }, { status: 410 });
    }
    if ((tokenRes.data.job_summary || "").trim().toLowerCase() !== "employer_trial") {
      return NextResponse.json({ success: false, error: "Invalid trial token." }, { status: 403 });
    }

    const employerEmail = tokenRes.data.email.trim().toLowerCase();
    const payload = parsed.data;
    const accessLevelText = payload.access_level === "connect_hire" ? "Connect & Hire" : "See Who's Available";

    const insertRes = await supabase
      .from("employer_requests")
      .insert({
        token_id: payload.token,
        company: payload.company.company_name,
        email: employerEmail,
        full_name: payload.company.contact_name,
        phone: "N/A",
        job_summary: "Employer trial request",
        hiring_type: "Trial flow",
        category: payload.category,
        position: `${payload.category} candidate overview`,
        qualification: "General",
        city: "Not specified",
        requirements: accessLevelText,
        notes: JSON.stringify({
          source: "employer_trial_flow",
          access_level: payload.access_level,
          access_label: accessLevelText,
        }),
      })
      .select("id")
      .maybeSingle();
    if (insertRes.error) {
      throw insertRes.error;
    }

    await supabase.from("request_tokens").update({ used: true }).eq("token", payload.token);

    const transporter = createSmtpTransporter();
    if (transporter) {
      const employerHtml = buildEmployerConfirmationHtml(payload.access_level);
      await safeSendEmail(employerEmail, "We've received your request - Thank you", employerHtml, {
        ...mailHeaders(),
        text:
          "Thank you for your interest in working with ArbeidMatch. We appreciate that you chose us and we'll be in touch within 48 hours.\n\n" +
          (payload.access_level === "connect_hire"
            ? "Our team will reach out to discuss partnership options."
            : "We'll prepare your candidate preview shortly."),
        transporter,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      });

      const internalHtml = buildInternalEmailHtml({
        title: "Employer Trial Request Received",
        rows: [
          { label: "Company", value: payload.company.company_name },
          { label: "Contact", value: payload.company.contact_name },
          { label: "Email", value: employerEmail },
          { label: "Category", value: payload.category },
          { label: "Access level", value: accessLevelText },
        ],
      });
      await safeSendEmail("post@arbeidmatch.no", `Employer trial request: ${payload.company.company_name}`, internalHtml, {
        ...mailHeaders(),
        text: `Employer trial request received\nCompany: ${payload.company.company_name}\nContact: ${payload.company.contact_name}\nEmail: ${employerEmail}\nCategory: ${payload.category}\nAccess level: ${accessLevelText}`,
        transporter,
      });
    }

    await notifySlack("employers", {
      title: "Employer trial request",
      fields: {
        Company: payload.company.company_name,
        Contact: payload.company.contact_name,
        Email: employerEmail,
        Category: payload.category,
        Access: accessLevelText,
      },
    });

    await logAuditEvent("employer_trial_submitted", "employer_request", insertRes.data?.id ?? null, "employer", {
      company: payload.company.company_name,
      email: employerEmail,
      category: payload.category,
      access_level: payload.access_level,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/employer/trial/submit", error });
    return NextResponse.json({ success: false, error: "Could not submit request." }, { status: 500 });
  }
}

