import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet, mailHeaders } from "@/lib/emailPremiumTemplate";
import { feedbackNoticeLetter, feedbackReceiptLetter } from "@/lib/emails/letters";
import { unsubscribeUrlFor } from "@/lib/emailSubscription";
import { notifyError } from "@/lib/errorNotifier";

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
        user: "no-reply@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const weeklyOnlySources = new Set(["candidate-eligibility-check"]);
    if (!weeklyOnlySources.has(sourceRaw)) {
      const notice = feedbackNoticeLetter({
        score,
        source: sourceRaw,
        purpose: purposeRaw,
        pageUrl: pageUrlRaw,
        submittedAt,
        email: emailRaw,
        note: noteRaw,
      });
      await transporter.sendMail({
        ...mailHeaders(),
        to: "post@arbeidmatch.no",
        subject: notice.subject,
        html: notice.html,
      });
    }

    if (emailRaw.includes("@")) {
      const receipt = feedbackReceiptLetter({
        score,
        source: sourceRaw,
        to: emailRaw,
        unsubscribeUrl: await unsubscribeUrlFor(emailRaw, "confirmation-feedback"),
      });
      await transporter.sendMail({
        ...mailHeaders(),
        to: emailRaw,
        subject: receipt.subject,
        html: receipt.html,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/confirmation-feedback", error });
    console.error("confirmation-feedback error", error);
    return NextResponse.json({ success: false, error: "Could not send feedback." }, { status: 500 });
  }
}
