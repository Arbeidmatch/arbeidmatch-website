import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { buildInternalEmailHtml, emailParagraph, formatEmailTimestampCet, mailHeaders, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";

type FeedbackPayload = {
  source?: string;
  purpose?: string;
  pageUrl?: string;
  score?: number;
  note?: string;
  email?: string;
};

function normalizePageUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "https://arbeidmatch.no";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `https://arbeidmatch.no${trimmed}`;
  return `https://arbeidmatch.no/${trimmed}`;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeedbackPayload;
    if (hasHoneypotValue(body as Record<string, unknown>)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "confirmation-feedback", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const score = Number(body.score);
    if (!Number.isFinite(score) || score < 1 || score > 10) {
      return NextResponse.json({ success: false, error: "Score must be between 1 and 10." }, { status: 400 });
    }

    const sourceRaw = (body.source || "unknown").trim();
    const purposeRaw = (body.purpose || "Candidate feedback").trim();
    const pageUrlRaw = normalizePageUrl(body.pageUrl || "");
    const noteRaw = (body.note || "").trim();
    const emailRaw = (body.email || "").trim();

    const source = escapeHtml(sourceRaw);
    const purpose = escapeHtml(purposeRaw);
    const pageUrl = escapeHtml(pageUrlRaw);
    const note = escapeHtml(noteRaw);
    const email = escapeHtml(emailRaw);
    const submittedAt = formatEmailTimestampCet();
    const isAnonymous = !emailRaw;

    const supabase = getSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("candidate_feedback_submissions").insert({
        source: sourceRaw,
        purpose: purposeRaw,
        page_url: pageUrlRaw,
        score,
        note: noteRaw || null,
        email: emailRaw || null,
        is_anonymous: isAnonymous,
      });
      if (error) {
        console.error("candidate_feedback_submissions insert error:", error.message);
      }
    }

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const weeklyOnlySources = new Set(["candidate-eligibility-check"]);
    if (!weeklyOnlySources.has(sourceRaw)) {
      const feedbackRows = [
        { label: "Source", value: sourceRaw },
        { label: "Purpose", value: purposeRaw },
        { label: "Page URL", value: pageUrlRaw },
        { label: "Score", value: `${score}/10` },
        { label: "Submitted (CET)", value: submittedAt },
        { label: "Email", value: emailRaw || "—" },
      ];
      if (noteRaw) {
        feedbackRows.push({ label: "Note", value: noteRaw });
      }
      await transporter.sendMail({
        ...mailHeaders(),
        to: "post@arbeidmatch.no",
        subject: `New feedback: ${score}/10 from ${sourceRaw}`,
        html: buildInternalEmailHtml({
          title: `New feedback: ${score}/10 from ${sourceRaw}`,
          rows: feedbackRows,
        }),
      });
    }

    if (emailRaw.includes("@")) {
      const userInner = [
        emailParagraph("Thank you for sharing your feedback."),
        emailParagraph(`We received your score: <strong>${score}/10</strong>.`),
        emailParagraph(`Source: <strong>${source}</strong>`),
        emailParagraph("Best regards,<br />ArbeidMatch Team"),
      ].join("");
      await transporter.sendMail({
        ...mailHeaders(),
        to: emailRaw,
        subject: "Thank you for your feedback - ArbeidMatch",
        html: wrapPremiumEmail(userInner),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("confirmation-feedback error", error);
    return NextResponse.json({ success: false, error: "Could not send feedback." }, { status: 500 });
  }
}
