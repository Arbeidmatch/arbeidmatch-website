import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { escapeHtml, sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { buildEmail, emailBodyParagraph, emailFieldRows } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

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
        user: "no-reply@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const safeName = escapeHtml(full_name);
    const applicantHtml = [
      emailBodyParagraph(`Hi ${safeName},`),
      emailBodyParagraph("Thank you for applying to the ArbeidMatch Recruiter Network."),
      emailFieldRows([
        { label: "Name", value: full_name },
        { label: "Country", value: country },
        { label: "Region", value: region },
        { label: "Partner type", value: typeLabel },
        { label: "Monthly reach", value: String(monthly_reach) },
      ]),
      emailBodyParagraph("Our team will review your application and contact you within 48 hours."),
      emailBodyParagraph("We look forward to potentially building together."),
    ].join("");

    const internalRows = [
      { label: "Full name", value: full_name },
      { label: "Email", value: email },
      { label: "Country", value: country },
      { label: "Region / city", value: region },
      { label: "Partner type", value: typeLabel },
      { label: "Profile URL", value: social_url },
      { label: "Monthly reach", value: String(monthly_reach) },
      { label: "ENK / AS", value: companyLabel },
      { label: "Motivation", value: motivation || "None provided" },
    ];

    const adminBody = emailFieldRows(internalRows);

    if (!(await isUnsubscribed(email))) {
      const unsubToken = await getOrCreateSubscription(email, "recruiter-apply");
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: "We received your application - ArbeidMatch Recruiter Network",
        html: buildEmail({
          title: "We received your application",
          preheader: "ArbeidMatch Recruiter Network",
          body: applicantHtml,
          ctaText: "Visit ArbeidMatch",
          ctaUrl: "https://arbeidmatch.no",
          recipientEmail: email,
          unsubscribeToken: unsubToken,
        }),
      });
    }

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New Recruiter Network application: ${full_name} from ${country}`,
      html: buildEmail({
        title: `New Recruiter Network application: ${full_name} from ${country}`,
        preheader: "Internal recruiter network lead",
        body: adminBody,
      }),
    });

    void notifySlack("recruiters", {
      title: "New Recruiter Application",
      fields: {
        Name: full_name,
        Email: email,
        Experience: motivation || "Not specified",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/recruiter-network/apply", error });
    console.error("recruiter-network apply", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
