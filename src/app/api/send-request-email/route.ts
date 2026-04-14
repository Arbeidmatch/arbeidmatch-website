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

    const hasValue = (value?: string) => value !== undefined && value !== null && String(value).trim() !== "";
    const section = (title: string, rows: Array<[string, string | undefined]>) => {
      const filtered = rows.filter(([, value]) => hasValue(value));
      if (!filtered.length) return "";
      return `
        <div style="border:1px solid #E2E5EA;border-radius:10px;padding:14px 16px;margin-top:14px;">
          <div style="border-left:4px solid #C9A84C;padding-left:10px;font-weight:700;color:#0D1B2A;margin-bottom:10px;">
            ${title}
          </div>
          ${filtered
            .map(
              ([label, value]) =>
                `<div style="margin:6px 0;color:#0D1B2A;"><span style="font-weight:600;">${label}:</span> ${value}</div>`,
            )
            .join("")}
        </div>
      `;
    };

    const adminHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:760px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:18px 22px;">
            <div style="font-size:24px;font-weight:800;">Arbeid<span style="color:#C9A84C;">Match</span></div>
            <div style="margin-top:8px;color:#DDE3ED;">New candidate request received via arbeidmatch.no</div>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            <div style="margin-top:10px;font-size:13px;color:#C7D1DF;">${new Date().toLocaleString("en-GB")}</div>
          </div>
          <div style="padding:20px;">
            ${section("Contact Info", [
              ["Company", data.company],
              ["Org.nr.", data.orgNumber],
              ["Email", data.email],
              ["Full name", data.full_name],
              ["Phone", data.phone],
            ])}
            ${section("Engagement Type", [["Type", data.hiringType]])}
            ${section("Position", [["Category", data.category], ["Position", data.position], ["Position (other)", data.positionOther], ["Initial summary", data.job_summary]])}
            ${section("Qualification", [["Qualification", data.qualification], ["Candidates needed", data.numberOfPositions], ["Experience", data.experience], ["Norwegian level", data.norwegianLevel], ["English level", data.englishLevel], ["Certifications", data.certifications], ["Certifications (other)", data.certificationsOther]])}
            ${section("Requirements", [["Driver license", data.driverLicense], ["Driver license (other)", data.driverLicenseOther], ["D-number", data.dNumber], ["D-number (other)", data.dNumberOther], ["Deal breakers", data.requirements]])}
            ${section("Contract & Pay", [["Contract type", data.contractType], ["Påslag %", data.paslagPercent], ["Salary", data.salary], ["Full time %", data.fullTime], ["Hours unit", data.hoursUnit], ["Hours amount", data.hoursAmount], ["Accommodation cost", data.accommodationCost], ["Overtime", data.overtime], ["Max overtime/week", data.maxOvertimeHours], ["Has rotation", data.hasRotation], ["Rotation weeks on", data.rotationWeeksOn], ["Rotation weeks off", data.rotationWeeksOff]])}
            ${section("Working Conditions", [["Travel", data.travel], ["Travel (other)", data.travelOther], ["Accommodation", data.accommodation], ["Accommodation (other)", data.accommodationOther], ["Equipment", data.equipment], ["Equipment (other)", data.equipmentOther], ["Tools", data.tools], ["Tools (other)", data.toolsOther]])}
            ${section("Final Details", [["City", data.city], ["Start date", data.startDate], ["How did you hear about us", data.howDidYouHear], ["Subscribe", data.subscribe], ["Notes", data.notes]])}
            ${section("Lead Source Details", [
              ["How did you hear about us", data.howDidYouHear],
              ["Social media platform", data.socialMediaPlatform],
              ["Social media other", data.socialMediaOther],
              ["How did you hear about us (other)", data.howDidYouHearOther],
              ["Referral company", data.referralCompanyName],
              ["Referral company org.nr", data.referralOrgNumber],
              ["Referral contact email", data.referralEmail],
            ])}
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
            ArbeidMatch Norge AS · Org.nr. 935 667 089 · post@arbeidmatch.no
          </div>
        </div>
      </div>
    `;

    const employerRows = [
      ["Position", data.position],
      ["Number of candidates", data.numberOfPositions],
      ["Location", data.city],
      ["Preferred start", data.startDate === "Other" ? data.startDateOther : data.startDate],
    ].filter(([, value]) => hasValue(value));
    const employerSummaryHtml = employerRows.map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`).join("");

    const employerHtml = `
      <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
        <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
          <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
            <h2 style="margin:0;">Thank you for your request, ${data.company || "team"}!</h2>
            <p style="margin:8px 0 0;color:#E7EDF8;">We have received your candidate request and will get back to you within 24 hours.</p>
            <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
          </div>
          <div style="padding:20px;color:#0D1B2A;">
            ${employerRows.length ? `<h3 style="margin:0 0 8px;">Request summary</h3>${employerSummaryHtml}` : ""}
            <h3 style="margin:18px 0 8px;">What happens next</h3>
            <p>1. We review your request</p>
            <p>2. We match suitable candidates</p>
            <p>3. We contact you within 24h</p>
            <p style="margin-top:18px;"><strong>Contact:</strong> post@arbeidmatch.no · +47 967 34 730</p>
          </div>
          <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">ArbeidMatch Norge AS</div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: "post@arbeidmatch.no",
      subject: `New Candidate Request — ${data.company ?? "Unknown company"}`,
      html: adminHtml,
    });

    if (data.email) {
      await transporter.sendMail({
        from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
        to: data.email,
        subject: `Thank you for your request — ${data.company ?? "ArbeidMatch"}`,
        html: employerHtml,
      });
    }

    if (data.referralEmail) {
      const referralHtml = `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E2E5EA;">
            <div style="background:#0D1B2A;color:#fff;padding:20px 22px;">
              <h2 style="margin:0;">Thank you for recommending ArbeidMatch!</h2>
              <div style="height:3px;background:#C9A84C;margin-top:12px;border-radius:999px;"></div>
            </div>
            <div style="padding:20px;color:#0D1B2A;line-height:1.6;">
              <p>We received a request from <strong>${data.company || "-"}</strong> and they mentioned your recommendation.</p>
              <p>We appreciate your trust. If we can support your hiring needs in the future, we would be happy to help.</p>
              <a
                href="https://arbeidmatch.no/contact"
                style="display:inline-block;margin-top:12px;background:#C9A84C;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;"
              >
                Contact us
              </a>
            </div>
            <div style="background:#0D1B2A;color:#fff;padding:14px 20px;font-size:13px;">
              ArbeidMatch Norge AS · post@arbeidmatch.no
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
        to: data.referralEmail,
        subject: "Thank you for the referral - ArbeidMatch Norge",
        html: referralHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
