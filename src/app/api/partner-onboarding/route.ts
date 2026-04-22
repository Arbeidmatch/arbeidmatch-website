import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildInternalEmailHtml, mailHeaders } from "@/lib/emailPremiumTemplate";
import { getDocuSignAuthServer, isDocuSignConfigured } from "@/lib/docusign/accessToken";
import { createAndSendPartnerAgreementEnvelope } from "@/lib/docusign/partnerAgreementEnvelope";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const freeEmailDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "msn.com",
]);

const bodySchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  orgNumber: z.string().trim().min(2).max(40),
  contactPerson: z.string().trim().min(2).max(160),
  email: z.string().email(),
  phone: z.string().trim().min(6).max(40),
  partnershipType: z.enum(["recruitment", "staffing", "both"]),
  termsAccepted: z.literal(true),
  gdprConsent: z.literal(true),
  token: z.string().uuid().optional(),
});

function getDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() || "";
}

export async function POST(request: NextRequest) {
  try {
    if (!isDocuSignConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "signing_unavailable",
          message:
            "Electronic signing is not configured. Set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID, DOCUSIGN_RSA_PRIVATE_KEY, and DOCUSIGN_AUTH_SERVER.",
        },
        { status: 503 },
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const domain = getDomain(email);
    if (!domain || freeEmailDomains.has(domain)) {
      return NextResponse.json({ success: false, reason: "personal_email" }, { status: 200 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Server misconfigured" }, { status: 503 });
    }

    if (parsed.data.token) {
      const { data: tokenRow, error: tokenErr } = await supabase
        .from("partner_requests")
        .select("id, email")
        .eq("token", parsed.data.token)
        .maybeSingle();
      if (tokenErr) throw tokenErr;
      if (!tokenRow?.id || String(tokenRow.email || "").toLowerCase() !== email) {
        return NextResponse.json({ success: false, error: "Invalid application link" }, { status: 403 });
      }
    }

    const { data: existing, error: exErr } = await supabase
      .from("partners")
      .select("id, verification_status, active")
      .eq("email", email)
      .maybeSingle();

    if (exErr) throw exErr;

    if (existing?.verification_status === "verified" && existing.active !== false) {
      return NextResponse.json({ success: false, error: "already_partner" }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    const row = {
      company_name: parsed.data.companyName,
      email,
      domain,
      contact_name: parsed.data.contactPerson,
      org_number: parsed.data.orgNumber,
      phone: parsed.data.phone,
      partnership_type: parsed.data.partnershipType,
      active: false,
      verification_status: "awaiting_signature",
      terms_accepted_at: nowIso,
      updated_at: nowIso,
    };

    let partnerId: string;

    if (existing?.id) {
      partnerId = existing.id;
      const { error: upErr } = await supabase.from("partners").update(row).eq("id", partnerId);
      if (upErr) throw upErr;
    } else {
      const { data: ins, error: insErr } = await supabase
        .from("partners")
        .insert({ ...row, created_at: nowIso })
        .select("id")
        .single();
      if (insErr) throw insErr;
      partnerId = ins.id as string;
    }

    if (parsed.data.token) {
      await supabase
        .from("partner_requests")
        .update({ status: "awaiting_signature" })
        .eq("token", parsed.data.token)
        .eq("email", email);
    }

    let envelopeId: string;
    try {
      const env = await createAndSendPartnerAgreementEnvelope({
        partnerId,
        companyName: parsed.data.companyName,
        orgNumber: parsed.data.orgNumber,
        contactName: parsed.data.contactPerson,
        contactEmail: email,
        phone: parsed.data.phone,
        partnershipType: parsed.data.partnershipType,
      });
      envelopeId = env.envelopeId;
    } catch (e) {
      await supabase.from("partners").update({ verification_status: "envelope_failed" }).eq("id", partnerId);
      await notifyError({ route: "/api/partner-onboarding DocuSign", error: e });
      return NextResponse.json({ success: false, error: "Could not create signing envelope" }, { status: 502 });
    }

    const { error: envUpdErr } = await supabase
      .from("partners")
      .update({ docusign_envelope_id: envelopeId, verification_status: "awaiting_signature" })
      .eq("id", partnerId);
    if (envUpdErr) throw envUpdErr;

    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = buildInternalEmailHtml({
        title: "Partner onboarding — envelope sent",
        rows: [
          { label: "Partner ID", value: partnerId },
          { label: "Company", value: parsed.data.companyName },
          { label: "Email", value: email },
          { label: "Envelope", value: envelopeId },
          { label: "Auth server", value: getDocuSignAuthServer() },
        ],
      });
      await transporter.sendMail({
        ...mailHeaders(),
        to: process.env.SUPPORT_EMAIL || "post@arbeidmatch.no",
        subject: `Partner agreement sent: ${parsed.data.companyName}`,
        text: `Partner ${partnerId} — DocuSign envelope ${envelopeId} sent to ${email}`,
        html,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Check your email from DocuSign to review and sign the partnership agreement.",
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST205"
    ) {
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
    }
    await notifyError({ route: "/api/partner-onboarding", error });
    return NextResponse.json({ success: false, error: "Could not complete onboarding" }, { status: 500 });
  }
}
