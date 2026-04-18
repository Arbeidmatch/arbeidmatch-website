import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { buildDsbChecklistEmailHtml } from "@/lib/dsbChecklistEmailContent";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";

export const dynamic = "force-dynamic";

type Body = {
  first_name?: string;
  email?: string;
  gdpr_consent?: string | boolean;
  source?: string;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
      const safeName = escapeHtml(firstName);
      const safeEmail = escapeHtml(email);

      try {
        await transporter.sendMail({
          from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
          to: email,
          subject: "Your DSB Authorization Checklist - ArbeidMatch",
          html: buildDsbChecklistEmailHtml(firstName),
        });
      } catch (e) {
        console.error("[dsb-leads] user email", e);
      }

      try {
        await transporter.sendMail({
          from: '"ArbeidMatch Leads" <no-replay@arbeidmatch.no>',
          to: "post@arbeidmatch.no",
          subject: `New DSB checklist lead - ${firstName}`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;padding:16px;background:#f5f6f8;color:#0d1b2a;">
              <p><strong>New DSB checklist download</strong></p>
              <p>Name: ${safeName}<br/>Email: ${safeEmail}<br/>Source: ${escapeHtml(source)}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("[dsb-leads] notify email", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
