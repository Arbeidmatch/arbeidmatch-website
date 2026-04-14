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

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; color: #0D1B2A;">
        <div style="background:#0D1B2A;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">New Candidate Request</h2>
        </div>
        <div style="border:1px solid #E2E5EA;border-top:0;padding:20px;border-radius:0 0 8px 8px;">
          <h3>Company Info</h3>
          <p><strong>Company:</strong> ${data.company ?? ""}</p>
          <p><strong>Email:</strong> ${data.email ?? ""}</p>
          <p><strong>Initial request:</strong> ${data.job_summary ?? ""}</p>
          <hr />
          <h3>Contact</h3>
          <p><strong>Full name:</strong> ${data.full_name ?? ""}</p>
          <p><strong>Phone:</strong> ${data.phone ?? ""}</p>
          <hr />
          <h3>Details</h3>
          ${Object.entries(data)
            .map(([k, v]) => `<p><strong>${k}:</strong> ${v ?? ""}</p>`)
            .join("")}
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `New Candidate Request — ${data.company ?? "Unknown company"}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
