import "server-only";

import { getDocuSignAccessToken, getDocuSignAccountBaseUri } from "@/lib/docusign/accessToken";
import { escapeHtml } from "@/lib/htmlSanitizer";

export type PartnerAgreementInput = {
  partnerId: string;
  companyName: string;
  orgNumber: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  partnershipType: "recruitment" | "staffing" | "both";
};

function partnershipLabel(type: PartnerAgreementInput["partnershipType"]): string {
  if (type === "recruitment") return "Recruitment";
  if (type === "staffing") return "Staffing";
  return "Recruitment and staffing";
}

export function buildPartnerAgreementHtml(input: PartnerAgreementInput): string {
  const company = escapeHtml(input.companyName);
  const org = escapeHtml(input.orgNumber);
  const contact = escapeHtml(input.contactName);
  const email = escapeHtml(input.contactEmail);
  const phone = escapeHtml(input.phone);
  const ptype = escapeHtml(partnershipLabel(input.partnershipType));
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><title>Partnership agreement</title></head>
<body style="font-family:Georgia,serif;font-size:14px;line-height:1.6;color:#111;padding:32px;max-width:720px;margin:0 auto;">
  <h1 style="font-size:22px;">ArbeidMatch — Partnership agreement</h1>
  <p>This agreement is entered into between <strong>ArbeidMatch Norge AS</strong> (Org.nr 935 667 089) and the partner below.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #ddd;"><strong>Company</strong></td><td style="padding:8px 0;border-bottom:1px solid #ddd;">${company}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #ddd;"><strong>Organisation number</strong></td><td style="padding:8px 0;border-bottom:1px solid #ddd;">${org}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #ddd;"><strong>Contact person</strong></td><td style="padding:8px 0;border-bottom:1px solid #ddd;">${contact}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #ddd;"><strong>Email</strong></td><td style="padding:8px 0;border-bottom:1px solid #ddd;">${email}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #ddd;"><strong>Phone</strong></td><td style="padding:8px 0;border-bottom:1px solid #ddd;">${phone}</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #ddd;"><strong>Partnership type</strong></td><td style="padding:8px 0;border-bottom:1px solid #ddd;">${ptype}</td></tr>
  </table>
  <p>By signing, the partner confirms that the information above is accurate, agrees to operate in accordance with ArbeidMatch’s commercial terms and code of conduct shared separately, and authorises ArbeidMatch to register this partnership for platform access after signature.</p>
  <p style="margin-top:48px;color:#555;font-size:12px;">Sign below to accept this agreement.</p>
  <div style="margin-top:4px;font-size:1px;line-height:1px;color:#ffffff;background:#ffffff;">/sig1/</div>
</body>
</html>`;
}

export async function createAndSendPartnerAgreementEnvelope(input: PartnerAgreementInput): Promise<{ envelopeId: string }> {
  const token = await getDocuSignAccessToken();
  const base = await getDocuSignAccountBaseUri();
  const html = buildPartnerAgreementHtml(input);
  const documentBase64 = Buffer.from(html, "utf8").toString("base64");

  const envelopeDefinition = {
    emailSubject: `Sign your ArbeidMatch partnership agreement — ${input.companyName}`,
    status: "sent",
    customFields: {
      textCustomFields: [
        {
          name: "partner_id",
          value: input.partnerId,
          required: "true",
          show: "false",
        },
      ],
    },
    documents: [
      {
        documentBase64,
        name: "ArbeidMatch Partnership Agreement",
        fileExtension: "html",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [
        {
          email: input.contactEmail,
          name: input.contactName,
          recipientId: "1",
          routingOrder: "1",
          tabs: {
            signHereTabs: [
              {
                documentId: "1",
                pageNumber: "1",
                recipientId: "1",
                anchorString: "/sig1/",
                anchorUnits: "pixels",
                anchorYOffset: "-8",
                anchorXOffset: "0",
              },
            ],
          },
        },
      ],
    },
  };

  const res = await fetch(`${base}/envelopes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(envelopeDefinition),
  });

  const json = (await res.json().catch(() => ({}))) as { envelopeId?: string; message?: string };
  if (!res.ok || !json.envelopeId) {
    throw new Error(json.message || `DocuSign envelope failed (${res.status})`);
  }
  return { envelopeId: json.envelopeId };
}
