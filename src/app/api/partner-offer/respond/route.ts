import { NextRequest, NextResponse } from "next/server";

import { createContractEnvelope } from "@/lib/docusign";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { verifyPartnerOfferDecisionToken, type PartnerOfferDecision } from "@/lib/partnerOfferActions";

function htmlResponse(title: string, message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#0D1B2A;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:640px;margin:60px auto;padding:24px;border:1px solid rgba(201,168,76,0.25);border-radius:16px;background:rgba(255,255,255,0.04);">
<h1 style="margin:0 0 12px;color:#C9A84C;">${title}</h1>
<p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.7;">${message}</p>
</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  const token = (request.nextUrl.searchParams.get("token") || "").trim();
  const decision = (request.nextUrl.searchParams.get("decision") || "").trim() as PartnerOfferDecision;

  if (!token || (decision !== "accept" && decision !== "decline")) {
    return htmlResponse("Invalid link", "The action link is invalid or incomplete.");
  }

  const verification = verifyPartnerOfferDecisionToken(token, decision);
  if (!verification.valid || !verification.requestId) {
    const reason = verification.reason === "expired" ? "This action link has expired." : "The action link is invalid.";
    return htmlResponse("Could not process your response", reason);
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return htmlResponse("Configuration missing", "Service is temporarily unavailable. Please contact post@arbeidmatch.no.");
    }

    const requestId = verification.requestId;
    const { data: partnerRequest, error: readError } = await supabase
      .from("partner_requests")
      .select("id, email, company_name, org_number, full_name")
      .eq("id", requestId)
      .single();
    if (readError || !partnerRequest) {
      return htmlResponse("Request not found", "We could not find the related request record.");
    }

    if (decision === "decline") {
      const { error: declineError } = await supabase
        .from("partner_requests")
        .update({ status: "offer_declined" })
        .eq("id", requestId);
      if (declineError) {
        throw declineError;
      }
      return htmlResponse(
        "Offer declined",
        "Your response has been saved. If you want to continue later, contact post@arbeidmatch.no.",
      );
    }

    const contactNameRaw = (partnerRequest.full_name || "Partner Contact").trim();
    const titleMatch = contactNameRaw.match(/^(.+?)\s*\((.+)\)\s*$/);
    const contactName = titleMatch?.[1]?.trim() || contactNameRaw;
    const contactTitle = titleMatch?.[2]?.trim() || "Contact person";

    await createContractEnvelope({
      requestId,
      companyName: partnerRequest.company_name || "Partner",
      orgNumber: partnerRequest.org_number || "",
      contactName,
      contactEmail: partnerRequest.email,
      contactTitle,
    });

    const { error: acceptedError } = await supabase
      .from("partner_requests")
      .update({ status: "contract_sent_for_signature" })
      .eq("id", requestId);
    if (acceptedError) {
      throw acceptedError;
    }

    return htmlResponse(
      "Offer accepted",
      "Thank you. The contract has been sent for electronic signature to your email address. You can review and print it directly from DocuSign.",
    );
  } catch (error) {
    await notifyError({
      route: "/api/partner-offer/respond",
      error,
      context: {
        decision,
      },
    });
    return htmlResponse(
      "Could not process request",
      "Something went wrong while processing your response. Please contact post@arbeidmatch.no.",
    );
  }
}

