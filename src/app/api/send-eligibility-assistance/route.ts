import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as Record<string, string>;

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const section = (title: string, rows: Array<[string, string | undefined]>) => `
      <div style="border:1px solid #E2E5EA;border-radius:10px;padding:14px 16px;margin-top:14px;">
        <div style="border-left:4px solid #C9A84C;padding-left:10px;font-weight:700;color:#0D1B2A;margin-bottom:10px;">
          ${title}
        </div>
        ${rows
          .filter(([, value]) => value && String(value).trim())
          .map(
            ([label, value]) =>
              `<div style="margin:6px 0;color:#0D1B2A;"><span style="font-weight:600;">${label}:</span> ${value}</div>`,
          )
          .join("")}
      </div>
    `;

    const adminHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
            <div style="margin-top:8px;color:#DDE3ED;">New work eligibility assistance request</div>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            <div style="margin-top:10px;font-size:13px;color:#C7D1DF;">${new Date().toLocaleString("en-GB")}</div>
          </div>
          <div style="padding:20px;">
            ${section("Candidate Details", [
              ["Full name", data.fullName],
              ["Email", data.email],
              ["Phone", data.phone],
              ["Current country", data.currentCountry],
            ])}
            ${section("Assistance Request", [
              ["Wants assistance", data.wantsAssistance],
              ["Target country", data.targetCountry],
              ["Additional details", data.details],
            ])}
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
            ArbeidMatch Norge AS · Org.nr. 935 667 089 · post@arbeidmatch.no
          </div>
        </div>
      </div>
    `;

    const candidateHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
            <h2 style="margin:0;">Thank you for your request, ${data.fullName || "candidate"}!</h2>
            <p style="margin:8px 0 0;color:#E7EDF8;">
              We received your eligibility assistance request and will contact you shortly.
            </p>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            <p><strong>Target country:</strong> ${data.targetCountry || "-"}</p>
            <p><strong>Support requested:</strong> ${data.wantsAssistance || "-"}</p>
            <p style="margin-top:18px;"><strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730</p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">ArbeidMatch Norge AS</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `Work Eligibility Assistance Request | ${data.fullName ?? "Unknown candidate"}`,
      html: adminHtml,
    });

    if (data.email) {
      await transporter.sendMail({
        from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
        to: data.email,
        subject: "We received your eligibility assistance request | ArbeidMatch",
        html: candidateHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
