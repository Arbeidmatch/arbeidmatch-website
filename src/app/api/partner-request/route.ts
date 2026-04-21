import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildInternalEmailHtml, mailHeaders } from "@/lib/emailPremiumTemplate";
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

const partnerRequestSchema = z.object({
  email: z.string().email(),
  companyName: z.string().trim().min(2).max(160),
  orgNumber: z.string().trim().min(2).max(40),
  phone: z.string().trim().min(6).max(40),
  fullName: z.string().trim().min(2).max(120).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  role: z.string().trim().max(120).optional(),
  gdprConsent: z.literal(true),
  token: z.string().uuid().optional(),
});

type SlackBlocksPayload = {
  blocks: Array<Record<string, unknown>>;
};

function getDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() || "";
}

async function sendSlackPartnerRequest(payload: SlackBlocksPayload) {
  const webhook = process.env.SLACK_WEBHOOK_EMPLOYERS;
  if (!webhook) return;

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function sendInternalPartnerRequestEmail(input: {
  companyName: string;
  email: string;
  orgNumber: string;
  phone: string;
  contact: string;
  requestId: string;
}) {
  const transporter = createSmtpTransporter();
  if (!transporter) return;

  const html = buildInternalEmailHtml({
    title: "New Partner Request",
    rows: [
      { label: "Company", value: input.companyName },
      { label: "Email", value: input.email },
      { label: "Org Number", value: input.orgNumber },
      { label: "Phone", value: input.phone },
      { label: "Contact", value: input.contact },
      { label: "Request ID", value: input.requestId },
    ],
  });

  await transporter.sendMail({
    ...mailHeaders(),
    to: "post@arbeidmatch.no",
    subject: `New Partner Request: ${input.companyName}`,
    text:
      `New partner request received.\n` +
      `Company: ${input.companyName}\n` +
      `Email: ${input.email}\n` +
      `Org Number: ${input.orgNumber}\n` +
      `Phone: ${input.phone}\n` +
      `Contact: ${input.contact}\n` +
      `Request ID: ${input.requestId}`,
    html,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = partnerRequestSchema.safeParse(body);
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

    const resolvedFullName =
      parsed.data.fullName?.trim() ||
      [parsed.data.firstName?.trim(), parsed.data.lastName?.trim()].filter(Boolean).join(" ").trim();
    if (!resolvedFullName) {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const contactLabel = parsed.data.role?.trim() ? `${resolvedFullName} (${parsed.data.role.trim()})` : resolvedFullName;

    let requestId = "";
    if (parsed.data.token) {
      const { data: existing, error: existingError } = await supabase
        .from("partner_requests")
        .select("id")
        .eq("token", parsed.data.token)
        .eq("email", email)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing?.id) {
        requestId = existing.id;
        const { error: updateError } = await supabase
          .from("partner_requests")
          .update({
            company_name: parsed.data.companyName,
            org_number: parsed.data.orgNumber,
            phone: parsed.data.phone,
            full_name: contactLabel,
            gdpr_consent: parsed.data.gdprConsent,
            status: "pending",
          })
          .eq("id", requestId);

        if (updateError) {
          throw updateError;
        }
      }
    }

    if (!requestId) {
      const { data: inserted, error: insertError } = await supabase
        .from("partner_requests")
        .insert({
          email,
          company_name: parsed.data.companyName,
          org_number: parsed.data.orgNumber,
          phone: parsed.data.phone,
          full_name: contactLabel,
          gdpr_consent: parsed.data.gdprConsent,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        throw insertError;
      }
      requestId = inserted.id;
    }

    await sendSlackPartnerRequest({
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: "New Partner Request" },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Company:*\n${parsed.data.companyName}` },
            { type: "mrkdwn", text: `*Email:*\n${email}` },
            { type: "mrkdwn", text: `*Org Number:*\n${parsed.data.orgNumber}` },
            { type: "mrkdwn", text: `*Phone:*\n${parsed.data.phone}` },
            { type: "mrkdwn", text: `*Contact:*\n${contactLabel}` },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Approve and Send Link" },
              style: "primary",
              action_id: "approve_partner",
              value: requestId,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Contact First" },
              action_id: "contact_partner",
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

    await sendInternalPartnerRequestEmail({
      companyName: parsed.data.companyName,
      email,
      orgNumber: parsed.data.orgNumber,
      phone: parsed.data.phone,
      contact: contactLabel,
      requestId,
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
    await notifyError({ route: "/api/partner-request", error });
    return NextResponse.json({ success: false, error: "Could not submit partner request." }, { status: 500 });
  }
}
