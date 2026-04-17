import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type FeedbackRow = {
  source: string | null;
  purpose: string | null;
  page_url: string | null;
  score: number | null;
  note: string | null;
  created_at: string | null;
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toNumber(value: number | null): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function buildPdfReport(rows: FeedbackRow[], byPage: Array<{ page: string; avg: number; count: number }>, distribution: number[]) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawText("Candidate Feedback Weekly Report", { x: 40, y: 560, size: 18, font: bold, color: rgb(0.05, 0.11, 0.16) });
  page.drawText(`Generated: ${new Date().toLocaleString("en-GB")}`, { x: 40, y: 540, size: 10, font, color: rgb(0.25, 0.3, 0.36) });
  page.drawText(`Total anonymous feedback: ${rows.length}`, { x: 40, y: 520, size: 11, font: bold, color: rgb(0.05, 0.11, 0.16) });

  const avgScore = average(rows.map((entry) => toNumber(entry.score)));
  page.drawText(`Average score: ${avgScore.toFixed(2)} / 10`, { x: 280, y: 520, size: 11, font: bold, color: rgb(0.05, 0.11, 0.16) });

  page.drawText("Score distribution", { x: 40, y: 490, size: 12, font: bold, color: rgb(0.05, 0.11, 0.16) });
  const maxBucket = Math.max(...distribution, 1);
  for (let i = 1; i <= 10; i += 1) {
    const count = distribution[i] ?? 0;
    const barWidth = (count / maxBucket) * 230;
    const y = 470 - i * 16;
    page.drawText(String(i), { x: 40, y, size: 10, font, color: rgb(0.25, 0.3, 0.36) });
    page.drawRectangle({ x: 55, y: y + 2, width: barWidth, height: 9, color: rgb(0.79, 0.66, 0.3) });
    page.drawText(String(count), { x: 292, y, size: 10, font, color: rgb(0.25, 0.3, 0.36) });
  }

  page.drawText("Average by page", { x: 360, y: 490, size: 12, font: bold, color: rgb(0.05, 0.11, 0.16) });
  byPage.slice(0, 8).forEach((entry, index) => {
    const y = 468 - index * 18;
    page.drawText(`${entry.page}`, { x: 360, y, size: 9, font, color: rgb(0.05, 0.11, 0.16), maxWidth: 300 });
    page.drawText(`${entry.avg.toFixed(2)} / 10 (${entry.count})`, { x: 650, y, size: 9, font: bold, color: rgb(0.25, 0.3, 0.36) });
  });

  const notesPage = pdf.addPage([842, 595]);
  notesPage.drawText("Detailed Notes (latest 20)", { x: 40, y: 560, size: 16, font: bold, color: rgb(0.05, 0.11, 0.16) });
  let cursorY = 538;
  rows
    .filter((entry) => entry.note && entry.note.trim())
    .slice(0, 20)
    .forEach((entry, index) => {
      const line = `${index + 1}. [${toNumber(entry.score)}/10] ${entry.page_url || "-"} - ${(entry.note || "").slice(0, 120)}`;
      notesPage.drawText(line, { x: 40, y: cursorY, size: 9, font, color: rgb(0.1, 0.15, 0.2), maxWidth: 760 });
      cursorY -= 20;
    });

  return Buffer.from(await pdf.save());
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing" }, { status: 500 });
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await supabase
      .from("candidate_feedback_submissions")
      .select("source,purpose,page_url,score,note,created_at")
      .eq("is_anonymous", true)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const rows = (result.data || []) as FeedbackRow[];
    const scores = rows.map((entry) => toNumber(entry.score)).filter((score) => score > 0);
    const avgScore = average(scores);

    const distribution = Array.from({ length: 11 }, () => 0);
    scores.forEach((score) => {
      distribution[Math.round(score)] += 1;
    });

    const byPageMap = new Map<string, { total: number; count: number }>();
    rows.forEach((entry) => {
      const page = entry.page_url || "unknown";
      const current = byPageMap.get(page) || { total: 0, count: 0 };
      current.total += toNumber(entry.score);
      current.count += 1;
      byPageMap.set(page, current);
    });
    const byPage = Array.from(byPageMap.entries())
      .map(([page, value]) => ({
        page,
        avg: value.count ? value.total / value.count : 0,
        count: value.count,
      }))
      .sort((a, b) => b.count - a.count);

    const pdfBuffer = await buildPdfReport(rows, byPage, distribution);

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const pageRows = byPage
      .slice(0, 10)
      .map(
        (entry) =>
          `<tr><td style="padding:6px 8px;border:1px solid #E2E5EA;">${entry.page}</td><td style="padding:6px 8px;border:1px solid #E2E5EA;text-align:center;">${entry.count}</td><td style="padding:6px 8px;border:1px solid #E2E5EA;text-align:center;">${entry.avg.toFixed(2)}</td></tr>`,
      )
      .join("");

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
            <div style="margin-top:8px;color:#DDE3ED;">Weekly anonymous candidate feedback report</div>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            <div style="margin-top:10px;font-size:13px;color:#C7D1DF;">Monday 07:00 weekly summary</div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            <p><strong>Period:</strong> ${startDate.toLocaleString("en-GB")} - ${endDate.toLocaleString("en-GB")}</p>
            <p><strong>Total anonymous feedback:</strong> ${rows.length}</p>
            <p><strong>Average score:</strong> ${avgScore.toFixed(2)} / 10</p>
            <h3 style="margin:14px 0 8px;">Top pages by feedback volume</h3>
            <table style="width:100%;border-collapse:collapse;font-size:13px;">
              <thead>
                <tr>
                  <th style="padding:6px 8px;border:1px solid #E2E5EA;text-align:left;">Page link</th>
                  <th style="padding:6px 8px;border:1px solid #E2E5EA;text-align:center;">Feedback count</th>
                  <th style="padding:6px 8px;border:1px solid #E2E5EA;text-align:center;">Average score</th>
                </tr>
              </thead>
              <tbody>${pageRows || `<tr><td colspan="3" style="padding:8px;border:1px solid #E2E5EA;">No feedback this week.</td></tr>`}</tbody>
            </table>
            <p style="margin-top:14px;">Detailed report with graphics is attached as PDF.</p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
            ArbeidMatch Norge AS · post@arbeidmatch.no
          </div>
        </div>
      </div>
    `;

    const filename = `candidate-feedback-report-${endDate.toISOString().slice(0, 10)}.pdf`;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `Weekly candidate feedback report | Avg ${avgScore.toFixed(2)}/10`,
      html,
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      totalAnonymousFeedback: rows.length,
      averageScore: Number(avgScore.toFixed(2)),
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      pdfFilename: filename,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
