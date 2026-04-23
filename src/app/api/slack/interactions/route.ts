import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { createContractEnvelope } from "@/lib/docusign";
import { buildEmail } from "@/lib/emailTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { buildPartnerContractDraft, buildPartnerOfferDraft } from "@/lib/partnerEmailDrafts";
import { createPartnerOfferDecisionToken, getSiteBaseUrl } from "@/lib/partnerOfferActions";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type SlackPayload = {
  actions?: Array<{ action_id?: string; value?: string }>;
  user?: { id?: string; username?: string; name?: string };
};

function buildResolvedBlocks(input: {
  status: string;
  requestId: string;
  companyName: string;
  contactName: string;
  email: string;
  handledBy: string;
}) {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "Partner Request Resolved" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Status:*\n${input.status}` },
        { type: "mrkdwn", text: `*Request ID:*\n${input.requestId}` },
        { type: "mrkdwn", text: `*Company:*\n${input.companyName}` },
        { type: "mrkdwn", text: `*Contact:*\n${input.contactName}` },
        { type: "mrkdwn", text: `*Email:*\n${input.email}` },
        { type: "mrkdwn", text: `*Handled by:*\n${input.handledBy}` },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Contact Partner" },
          action_id: "contact_partner",
          value: input.requestId,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Send Offer" },
          action_id: "send_partner_offer",
          value: input.requestId,
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Send Contract" },
          action_id: "send_partner_contract",
          value: input.requestId,
        },
      ],
    },
  ];
}

function isValidSlackSignature(request: NextRequest, rawBody: string): boolean {
  const secret = process.env.SLACK_SIGNING_SECRET?.trim();
  const signature = request.headers.get("x-slack-signature") || "";
  const timestamp = request.headers.get("x-slack-request-timestamp") || request.headers.get("x-slack-timestamp") || "";
  if (!secret || !signature.startsWith("v0=") || !timestamp) return false;

  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 60 * 5) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = createHmac("sha256", secret).update(base).digest("hex");
  const expected = `v0=${digest}`;
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(sigBuffer, expectedBuffer);
}

function premiumEmailLayout(title: string, message: string, ctaLabel?: string, ctaHref?: string, note?: string): string {
  const noteBlock = note
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.65);">${note}</p>`
    : "";
  return buildEmail({
    title,
    body: `<p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">${message}</p>${noteBlock}`,
    ctaText: ctaLabel,
    ctaUrl: ctaHref,
    audience: "b2b",
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (!isValidSlackSignature(request, rawBody)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const formData = new URLSearchParams(rawBody);
    const payloadRaw = formData.get("payload");
    if (!payloadRaw) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const payload = JSON.parse(payloadRaw) as SlackPayload;
    const action = payload.actions?.[0];
    const actionId = action?.action_id;
    const requestId = action?.value;
    const handledByUserId = payload.user?.id?.trim() || "";
    const handledByName = payload.user?.username?.trim() || payload.user?.name?.trim() || "Unknown user";
    const handledBy = handledByUserId ? `<@${handledByUserId}>` : handledByName;
    if (!actionId || !requestId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const { data: partnerRequest, error: requestError } = await supabase
      .from("partner_requests")
      .select("id, email, company_name, org_number, full_name")
      .eq("id", requestId)
      .single();
    if (requestError || !partnerRequest) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const transporter = createSmtpTransporter();
    const email = partnerRequest.email;
    const companyName = partnerRequest.company_name || "Partner";
    const contactName = partnerRequest.full_name || "Partner Contact";
    const orgNumber = partnerRequest.org_number || "";
    const contactNameMatch = contactName.match(/^(.+?)\s*\((.+)\)\s*$/);
    const contactPersonName = contactNameMatch?.[1]?.trim() || contactName;
    const contactPersonTitle = contactNameMatch?.[2]?.trim() || "Contact person";

    if (actionId === "approve_partner") {
      const domain = email.split("@")[1]?.toLowerCase().trim() || "";
      const { error: partnerInsertError } = await supabase.from("partners").insert({
        company_name: companyName,
        email,
        domain,
        contact_name: contactPersonName,
        active: true,
        verification_status: "verified",
      });
      if (partnerInsertError) {
        throw partnerInsertError;
      }

      const sessionToken = crypto.randomUUID();
      const requestToken = crypto.randomUUID();
      const requestTokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error: requestTokenError } = await supabase.from("request_tokens").insert({
        token: requestToken,
        full_name: contactName,
        company: companyName,
        org_number: orgNumber,
        email,
        phone: "N/A",
        job_summary: "Partner candidate request",
        gdpr_consent: true,
        expires_at: requestTokenExpiresAt,
        used: false,
      });
      if (requestTokenError) {
        throw requestTokenError;
      }

      const { error: sessionError } = await supabase.from("partner_sessions").insert({
        email,
        session_token: sessionToken,
        request_token: requestToken,
        expires_at: expiresAt,
        used: false,
      });
      if (sessionError) {
        throw sessionError;
      }

      const { error: updateError } = await supabase
        .from("partner_requests")
        .update({ status: "approved" })
        .eq("id", requestId);
      if (updateError) {
        throw updateError;
      }

      if (transporter) {
        const accessUrl = `https://arbeidmatch.no/request/partner/${sessionToken}`;
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "Your ArbeidMatch partner access is ready",
          text: `Your partner account has been approved. Access Platform: ${accessUrl}\n\nThis link is valid for 24 hours.`,
          html: premiumEmailLayout(
            "Welcome to ArbeidMatch.",
            "Your partner account has been approved. Click below to access candidate profiles and submit your first request.",
            "Access Platform",
            accessUrl,
            "This link is valid for 24 hours.",
          ),
        });
      }

      return NextResponse.json({
        text: `Partner approved. Access link sent to ${email}.`,
        replace_original: true,
        blocks: buildResolvedBlocks({
          status: "Approved",
          requestId,
          companyName,
          contactName,
          email,
          handledBy,
        }),
      });
    }

    if (actionId === "contact_partner") {
      const { error: updateError } = await supabase
        .from("partner_requests")
        .update({ status: "contacted" })
        .eq("id", requestId);
      if (updateError) {
        throw updateError;
      }

      if (transporter) {
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "We received your ArbeidMatch partner request",
          text: "Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you within 1 to 2 business days.",
          html: premiumEmailLayout(
            "We will be in touch.",
            "Thank you for your interest in becoming an ArbeidMatch partner. Our team will review your request and contact you within 1 to 2 business days.",
          ),
        });
      }

      return NextResponse.json({
        text: `Contact email sent to ${email}.`,
        replace_original: true,
        blocks: buildResolvedBlocks({
          status: "Contacted",
          requestId,
          companyName,
          contactName,
          email,
          handledBy,
        }),
      });
    }

    if (actionId === "reject_partner") {
      const { error: updateError } = await supabase
        .from("partner_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);
      if (updateError) {
        throw updateError;
      }

      if (transporter) {
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "Your ArbeidMatch partner request",
          text: "After reviewing your request, we are unable to offer partner access at this time. You are welcome to reapply in the future or contact us at post@arbeidmatch.no for more information.",
          html: premiumEmailLayout(
            "Thank you for your interest.",
            "After reviewing your request, we are unable to offer partner access at this time. You are welcome to reapply in the future or contact us at post@arbeidmatch.no for more information.",
          ),
        });
      }

      return NextResponse.json({
        text: `Request rejected. Email sent to ${email}.`,
        replace_original: true,
        blocks: buildResolvedBlocks({
          status: "Rejected",
          requestId,
          companyName,
          contactName,
          email,
          handledBy,
        }),
      });
    }

    if (actionId === "send_partner_offer") {
      if (!transporter) {
        return NextResponse.json({ text: "Mail transporter is not configured." }, { status: 500 });
      }
      const siteBaseUrl = getSiteBaseUrl();
      const acceptToken = createPartnerOfferDecisionToken(requestId, "accept");
      const declineToken = createPartnerOfferDecisionToken(requestId, "decline");
      const acceptUrl = `${siteBaseUrl}/api/partner-offer/respond?decision=accept&token=${encodeURIComponent(acceptToken)}`;
      const declineUrl = `${siteBaseUrl}/api/partner-offer/respond?decision=decline&token=${encodeURIComponent(declineToken)}`;
      const offerDraft = buildPartnerOfferDraft({
        companyName,
        orgNumber,
        contactName: contactPersonName,
        contactTitle: contactPersonTitle,
        contactEmail: email,
        acceptUrl,
        declineUrl,
      });
      const html = buildEmail({
        title: "Service Offer",
        preheader: "Review and respond to your offer from ArbeidMatch.",
        body: offerDraft.html,
        audience: "b2b",
        unsubscribeEmail: email,
      });
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: offerDraft.subject,
        text: offerDraft.text,
        html,
      });
      const { error: offerStatusError } = await supabase
        .from("partner_requests")
        .update({ status: "offer_sent" })
        .eq("id", requestId);
      if (offerStatusError) {
        throw offerStatusError;
      }

      return NextResponse.json({
        text: `Offer sent to ${email}.`,
        replace_original: true,
        blocks: buildResolvedBlocks({
          status: "Offer sent",
          requestId,
          companyName,
          contactName,
          email,
          handledBy,
        }),
      });
    }

    if (actionId === "send_partner_contract") {
      const envelope = await createContractEnvelope({
        requestId,
        companyName,
        orgNumber,
        contactName: contactPersonName,
        contactEmail: email,
        contactTitle: contactPersonTitle,
      });
      const { error: statusError } = await supabase
        .from("partner_requests")
        .update({ status: "contract_sent_for_signature" })
        .eq("id", requestId);
      if (statusError) {
        throw statusError;
      }

      if (transporter) {
        const contractDraft = buildPartnerContractDraft({
          companyName,
          orgNumber,
          contactName: contactPersonName,
          contactEmail: email,
          contactTitle: contactPersonTitle,
        });
        const html = buildEmail({
          title: "Contract sent for signature",
          preheader: "Please check your DocuSign inbox.",
          body: contractDraft.html,
          audience: "b2b",
          unsubscribeEmail: email,
        });
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: contractDraft.subject,
          text: `${contractDraft.text}\n\nDocuSign envelope id: ${envelope.envelopeId}`,
          html,
        });
      }

      return NextResponse.json({
        text: `Contract sent for signature to ${email}.`,
        replace_original: true,
        blocks: buildResolvedBlocks({
          status: "Contract sent",
          requestId,
          companyName,
          contactName,
          email,
          handledBy,
        }),
      });
    }

    return NextResponse.json({ ok: false }, { status: 400 });
  } catch (error) {
    await notifyError({ route: "/api/slack/interactions", error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
