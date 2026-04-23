import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildInternalEmailHtml, mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError as notifySlackError, notifyNewPartnerRequest } from "@/lib/slack/notify";
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

const schema = z.object({
  email: z.string().email(),
  companyName: z.string().trim().min(2).max(160),
  orgNumber: z.string().trim().max(40).optional().default(""),
  contactName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  website: z.string().trim().max(160).optional().default(""),
  placementsPerMonth: z.enum(["1-5", "6-20", "21-50", "50+"]),
  sectors: z.array(z.string().trim().min(1).max(60)).min(1).max(12),
  message: z.string().trim().max(1500).optional().default(""),
  gdprConsent: z.literal(true),
});

function getDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() || "";
}

async function sendSlackPartnerRequest(payload: { blocks: Array<Record<string, unknown>> }) {
  const webhook = process.env.SLACK_WEBHOOK_EMPLOYERS;
  if (!webhook) return;
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const domain = getDomain(email);
    if (!domain || freeEmailDomains.has(domain)) {
      return NextResponse.json({ success: false, reason: "personal_email" }, { status: 200 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing" }, { status: 500 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("partner_requests")
      .insert({
      email,
        company_name: parsed.data.companyName,
        org_number: parsed.data.orgNumber,
        phone: parsed.data.phone,
        full_name: parsed.data.contactName,
        gdpr_consent: parsed.data.gdprConsent,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError) {
      throw insertError;
    }
    const requestId = inserted.id;

    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = buildInternalEmailHtml({
        title: "New Recruitment Partner Application",
        rows: [
          { label: "Request ID", value: requestId },
          { label: "Company", value: parsed.data.companyName },
          { label: "Contact", value: parsed.data.contactName },
          { label: "Email", value: email },
          { label: "Phone", value: parsed.data.phone },
          { label: "Website", value: parsed.data.website || "-" },
          { label: "Org Number", value: parsed.data.orgNumber || "-" },
          { label: "Placements / month", value: parsed.data.placementsPerMonth },
          { label: "Sectors", value: parsed.data.sectors.join(", ") },
          { label: "Message", value: parsed.data.message || "-" },
        ],
      });
      await safeSendEmail("post@arbeidmatch.no", `Partner application: ${parsed.data.companyName}`, html, {
        ...mailHeaders(),
        text:
          `New recruitment partner application\n` +
          `Request ID: ${requestId}\n` +
          `Company: ${parsed.data.companyName}\n` +
          `Contact: ${parsed.data.contactName}\n` +
          `Email: ${email}\n` +
          `Phone: ${parsed.data.phone}\n` +
          `Website: ${parsed.data.website || "-"}\n` +
          `Org Number: ${parsed.data.orgNumber || "-"}\n` +
          `Placements/month: ${parsed.data.placementsPerMonth}\n` +
          `Sectors: ${parsed.data.sectors.join(", ")}\n` +
          `Message: ${parsed.data.message || "-"}`,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
        transporter,
      });
    }

    await notifyNewPartnerRequest(parsed.data.companyName, email, parsed.data.sectors);
    await sendSlackPartnerRequest({
      blocks: [
        { type: "header", text: { type: "plain_text", text: "New Recruitment Partner Application" } },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Company:*\n${parsed.data.companyName}` },
            { type: "mrkdwn", text: `*Contact:*\n${parsed.data.contactName}` },
            { type: "mrkdwn", text: `*Email:*\n${email}` },
            { type: "mrkdwn", text: `*Phone:*\n${parsed.data.phone}` },
            { type: "mrkdwn", text: `*Placements/month:*\n${parsed.data.placementsPerMonth}` },
            { type: "mrkdwn", text: `*Sectors:*\n${parsed.data.sectors.join(", ")}` },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Website:* ${parsed.data.website || "-"}\n*Org number:* ${parsed.data.orgNumber || "-"}\n*Message:* ${
              parsed.data.message || "-"
            }`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Approve" },
              style: "primary",
              action_id: "approve_partner",
              value: requestId,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Reject" },
              style: "danger",
              action_id: "reject_partner",
              value: requestId,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST205"
    ) {
      return NextResponse.json(
        { success: false, reason: "table_missing", error: "Partner requests table is not configured." },
        { status: 503 },
      );
    }
    await notifyError({ route: "/api/partner-request/start", error });
    await notifySlackError(
      error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error),
      "/api/partner-request/start",
      "critical",
    );
    return NextResponse.json({ success: false, error: "Could not start partner request." }, { status: 500 });
  }
}
