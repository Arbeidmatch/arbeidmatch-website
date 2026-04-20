import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { buildDsbChecklistEmailBodyHtml, DSB_CHECKLIST_EMAIL_SUBJECT } from "@/lib/dsbChecklistEmailContent";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { buildEmail, emailFieldRows } from "@/lib/emailTemplate";

export const dynamic = "force-dynamic";

type Body = {
  first_name?: string;
  email?: string;
  gdpr_consent?: string | boolean;
  source?: string;
};

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(raw)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "dsb-leads", 8, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const gdprRaw = raw["gdpr_consent"];
    const gdpr =
      gdprRaw === true || gdprRaw === "true" || gdprRaw === "on" || gdprRaw === "yes";

    const body = sanitizeStringRecord(raw) as Body;
    const firstName = (body.first_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const source = (body.source || "dsb-checklist").trim().slice(0, 120);

    if (!firstName || !email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please fill in all required fields." }, { status: 400 });
    }
    if (!gdpr) {
      return NextResponse.json({ success: false, error: "Consent is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const { error } = await supabase.from("dsb_leads").insert({
      first_name: firstName,
      email,
      gdpr_consent: true,
      source,
    });

    if (error) {
      console.error("[dsb-leads]", error.message);
      return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: DSB_CHECKLIST_EMAIL_SUBJECT,
          html: buildEmail({
            title: DSB_CHECKLIST_EMAIL_SUBJECT,
            preheader: "Your DSB checklist is ready",
            body: buildDsbChecklistEmailBodyHtml(firstName),
          }),
        });
      } catch (e) {
        console.error("[dsb-leads] user email", e);
      }

      try {
        const internalBody = emailFieldRows([
          { label: "First name", value: firstName },
          { label: "Email", value: email },
          { label: "Source", value: source },
        ]);
        await transporter.sendMail({
          ...mailHeaders(),
          to: "post@arbeidmatch.no",
          subject: `New DSB checklist lead: ${firstName}`,
          html: buildEmail({
            title: `New DSB checklist lead: ${firstName}`,
            preheader: "Internal lead notification",
            body: internalBody,
          }),
        });
      } catch (e) {
        console.error("[dsb-leads] notify email", e);
      }
    }

    const leadType = source.toLowerCase().includes("non-eu") ? "Non-EU" : "EU";
    void notifySlack("dsbLeads", {
      title: "New DSB Lead",
      fields: {
        Name: firstName,
        Email: email,
        Type: leadType,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    await notifyError({ route: "/api/dsb-leads", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
