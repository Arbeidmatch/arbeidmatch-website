import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { emailParagraph, mailHeaders, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type ConnectEvent = {
  data?: {
    envelopeSummary?: {
      status?: string;
      customFields?: {
        textCustomFields?: Array<{ name?: string; value?: string }>;
      };
    };
  };
};

type EnvelopeSummary = NonNullable<ConnectEvent["data"]>["envelopeSummary"];

function mapEnvelopeStatus(status: string): string | null {
  if (status === "completed") return "contract_signed";
  if (status === "declined") return "contract_declined";
  if (status === "voided") return "contract_voided";
  return null;
}

function customField(envelope: EnvelopeSummary | undefined, name: string): string {
  const fields = envelope?.customFields?.textCustomFields ?? [];
  return fields.find((field) => field.name === name)?.value?.trim() || "";
}

async function sendPartnerSignedEmail(to: string, companyName: string): Promise<void> {
  const transporter = createSmtpTransporter();
  if (!transporter) return;
  const safeCompany = escapeHtml(companyName);
  const body =
    emailParagraph(
      `Thank you. Your partnership agreement with ArbeidMatch for <strong>${safeCompany}</strong> is fully signed.`,
    ) +
    emailParagraph(
      "Your organisation is now marked as a verified partner in our systems. You can continue using your company email for partner verification and platform access where applicable.",
    );
  await transporter.sendMail({
    ...mailHeaders(),
    to,
    subject: "Partnership agreement signed, ArbeidMatch",
    text: `Thank you. Your partnership agreement with ArbeidMatch for ${companyName} is fully signed. Your organisation is now verified as a partner.`,
    html: wrapPremiumEmail(body),
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ConnectEvent;
    const envelope = payload.data?.envelopeSummary;
    const status = envelope?.status?.trim().toLowerCase() || "";
    const mappedStatus = mapEnvelopeStatus(status);
    if (!mappedStatus) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const partnerIdRaw = customField(envelope, "partner_id");
    const requestId = customField(envelope, "request_id");

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (partnerIdRaw) {
      const idParsed = z.string().uuid().safeParse(partnerIdRaw);
      if (!idParsed.success) {
        return NextResponse.json({ ok: true, ignored: true });
      }
      const partnerId = idParsed.data;
      const nowIso = new Date().toISOString();

      if (mappedStatus === "contract_signed") {
        const { data: row, error: readErr } = await supabase
          .from("partners")
          .select("email, company_name")
          .eq("id", partnerId)
          .maybeSingle();
        if (readErr) throw readErr;

        const { error } = await supabase
          .from("partners")
          .update({
            verification_status: "verified",
            active: true,
            signed_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", partnerId);
        if (error) throw error;

        const email = typeof row?.email === "string" ? row.email.trim() : "";
        const companyName = typeof row?.company_name === "string" ? row.company_name : "your company";
        if (email) {
          try {
            await sendPartnerSignedEmail(email, companyName);
          } catch (mailErr) {
            await notifyError({ route: "/api/docusign/webhook partner mail", error: mailErr });
          }
        }
        void logAuditEvent("partner_signed", "partner", partnerId, "system", {
          envelopeStatus: status,
          companyName,
        });
        return NextResponse.json({ ok: true });
      }

      const partnerVerification =
        mappedStatus === "contract_declined" ? "declined" : mappedStatus === "contract_voided" ? "voided" : null;
      if (partnerVerification) {
        const { error } = await supabase
          .from("partners")
          .update({
            verification_status: partnerVerification,
            active: false,
            updated_at: nowIso,
          })
          .eq("id", partnerId);
        if (error) throw error;
        void logAuditEvent("partner_declined", "partner", partnerId, "system", {
          envelopeStatus: status,
          verificationStatus: partnerVerification,
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (!requestId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const { error } = await supabase.from("partner_requests").update({ status: mappedStatus }).eq("id", requestId);
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    await notifyError({ route: "/api/docusign/webhook", error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
