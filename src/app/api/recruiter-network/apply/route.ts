import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PARTNER_TYPES = new Set(["influencer", "recruiter", "learner"]);
const HAS_COMPANY = new Set(["yes", "want_setup", "not_yet"]);

function parseReach(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawBody)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "recruiter-network-apply", 6, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = sanitizeStringRecord(rawBody) as Record<string, string>;

    const full_name = (body.full_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const country = (body.country || "").trim();
    const region = (body.region || "").trim();
    const partner_type = (body.partner_type || "").trim();
    const social_url = (body.social_url || "").trim();
    const monthly_reach_raw = (body.monthly_reach || "").trim();
    const has_company = (body.has_company || "").trim();
    const motivation = (body.motivation || "").trim().slice(0, 500);
    const gdpr =
      rawBody.gdpr_consent === true ||
      rawBody.gdpr_consent === "true" ||
      body.gdpr_consent === "true" ||
      body.gdpr_consent === "on";

    if (!full_name || !email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Name and a valid email are required." }, { status: 400 });
    }
    if (!country || !region) {
      return NextResponse.json({ success: false, error: "Country and region are required." }, { status: 400 });
    }
    if (!PARTNER_TYPES.has(partner_type)) {
      return NextResponse.json({ success: false, error: "Please select a partner path." }, { status: 400 });
    }
    if (!social_url || !social_url.startsWith("http")) {
      return NextResponse.json({ success: false, error: "A valid profile or social URL is required." }, { status: 400 });
    }
    const monthly_reach = parseReach(monthly_reach_raw);
    if (monthly_reach === null || monthly_reach < 1) {
      return NextResponse.json({ success: false, error: "Monthly reach / visitors is required." }, { status: 400 });
    }
    if (!HAS_COMPANY.has(has_company)) {
      return NextResponse.json({ success: false, error: "Please answer the company question." }, { status: 400 });
    }
    if (!gdpr) {
      return NextResponse.json({ success: false, error: "You must accept the privacy statement to apply." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Application service is not configured." }, { status: 503 });
    }

    const { error: insertError } = await supabase.from("recruiter_applications").insert({
      full_name,
      email,
      country,
      region,
      partner_type,
      social_url,
      monthly_reach,
      has_company,
      motivation: motivation || null,
      gdpr_consent: true,
      status: "pending",
    });

    if (insertError) {
      console.error("recruiter_applications insert", insertError);
      return NextResponse.json({ success: false, error: "Could not save your application. Please try again." }, { status: 500 });
    }

    const typeLabel =
      partner_type === "influencer" ? "Influencer" : partner_type === "recruiter" ? "Recruiter" : "Learner";
    const companyLabel =
      has_company === "yes"
        ? "Yes"
        : has_company === "want_setup"
          ? "No but I want to set one up"
          : "Not yet";

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const applicantHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
          <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
            <div style="font-size:22px;font-weight:800;">Arbeid<span style="color:#B8860B;">Match</span></div>
            <div style="margin-top:8px;height:3px;background:#B8860B;border-radius:999px;max-width:120px;"></div>
          </div>
          <div style="padding:24px;color:#0D1B2A;line-height:1.6;">
            <p style="margin:0 0 12px;">Hi ${escapeHtml(full_name)},</p>
            <p style="margin:0 0 12px;">We received your application and will review it within <strong>48 hours</strong>. We look forward to potentially building together.</p>
            <p style="margin:16px 0 0;color:#555;font-size:14px;">— ArbeidMatch Recruiter Network</p>
          </div>
        </div>
      </div>
    `;

    const adminRows = [
      ["Full name", full_name],
      ["Email", email],
      ["Country", country],
      ["Region / city", region],
      ["Path", typeLabel],
      ["Profile URL", social_url],
      ["Monthly reach", String(monthly_reach)],
      ["ENK / AS", companyLabel],
      ["Motivation", motivation || "—"],
    ]
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px 12px;border:1px solid #E2E5EA;font-weight:600;color:#0D1B2A;">${escapeHtml(k)}</td><td style="padding:8px 12px;border:1px solid #E2E5EA;color:#333;">${escapeHtml(v)}</td></tr>`,
      )
      .join("");

    const adminHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;overflow:hidden;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:20px;font-weight:800;">New Recruiter Network application</div>
            <div style="margin-top:6px;color:#DDE3ED;font-size:14px;">${escapeHtml(typeLabel)} · ${escapeHtml(country)}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin:0;">${adminRows}</table>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: email,
      subject: "Your ArbeidMatch Recruiter Network application",
      html: applicantHtml,
    });

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `New Network Application: ${full_name} — ${typeLabel} — ${country}`,
      html: adminHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("recruiter-network apply", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
