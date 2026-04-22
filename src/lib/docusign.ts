import { SignJWT, importPKCS8 } from "jose";

import { notifyError } from "@/lib/errorNotifier";

function getEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function issueJwtAccessToken() {
  const accountId = getEnv("DOCUSIGN_ACCOUNT_ID");
  const integrationKey = getEnv("DOCUSIGN_INTEGRATION_KEY");
  const userId = getEnv("DOCUSIGN_USER_ID");
  const authServer = getEnv("DOCUSIGN_AUTH_SERVER");
  const rawKey = getEnv("DOCUSIGN_PRIVATE_KEY");
  const privateKey = rawKey.replace(/\\n/g, "\n");

  const privateCryptoKey = await importPKCS8(privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: "signature impersonation" })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(integrationKey)
    .setSubject(userId)
    .setAudience(`https://${authServer}/oauth/token`)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateCryptoKey);

  const tokenResponse = await fetch(`https://${authServer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`DocuSign token request failed with status ${tokenResponse.status}`);
  }
  const tokenJson = (await tokenResponse.json()) as { access_token?: string };
  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    throw new Error("DocuSign token response missing access_token");
  }

  const userInfoResponse = await fetch(`https://${authServer}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userInfoResponse.ok) {
    throw new Error(`DocuSign userinfo failed with status ${userInfoResponse.status}`);
  }
  const userInfo = (await userInfoResponse.json()) as {
    accounts?: Array<{ account_id?: string; base_uri?: string }>;
  };
  const account = userInfo.accounts?.find((item) => item.account_id === accountId) || userInfo.accounts?.[0];
  if (!account?.base_uri || !account.account_id) {
    throw new Error("DocuSign account not found for JWT user");
  }

  return { accessToken, restBaseUri: `${account.base_uri}/restapi`, accountId: account.account_id };
}

function buildAgreementHtml(input: {
  companyName: string;
  orgNumber: string;
  contactName: string;
  contactEmail: string;
  contactTitle: string;
}): string {
  const todayNo = new Date().toLocaleDateString("nb-NO");
  const todayEn = new Date().toLocaleDateString("en-GB");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; color: #111; line-height: 1.5; font-size: 12px; }
      h1 { font-size: 22px; margin: 0 0 8px; }
      h2 { font-size: 15px; margin: 18px 0 8px; }
      h3 { font-size: 13px; margin: 14px 0 6px; }
      .muted { color: #555; }
      .section { margin: 8px 0 12px; }
      .divider { margin: 20px 0; border-top: 1px solid #ddd; }
      .sign-anchor { margin-top: 18px; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>Samarbeidsavtale / Collaboration Agreement</h1>
    <p class="muted"><strong>Issued by:</strong> ArbeidMatch Norge AS, Org.nr 935 667 089 MVA, Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
    <p class="muted"><strong>Client:</strong> ${input.companyName} (Org.nr ${input.orgNumber || "N/A"})</p>
    <p class="muted"><strong>Contact:</strong> ${input.contactName}${input.contactTitle ? `, ${input.contactTitle}` : ""}, ${input.contactEmail}</p>
    <p class="muted"><strong>Date NO:</strong> ${todayNo} | <strong>Date EN:</strong> ${todayEn}</p>

    <div class="section">
      <h2>NORSK VERSJON</h2>
      <p>Denne avtalen regulerer samarbeidet mellom ArbeidMatch Norge AS ("Leverandør") og ${input.companyName} ("Kunde") for kandidatsourcing og screening.</p>
      <h3>Omfang og honorar</h3>
      <p>Sourcing-honorar er NOK 10 000 per kandidat (ekskl. mva.) og forfaller ved signering av arbeids- eller oppdragsavtale mellom kunde og introdusert kandidat.</p>
      <h3>Prosess</h3>
      <p>Leverandøren identifiserer, forscreening og introduserer kandidater basert på kundens behov. Full kandidatprofil utleveres ved eksplisitt forespørsel.</p>
      <h3>Gyldighet og lovvalg</h3>
      <p>Avtalen gjelder fra akseptdato og er underlagt norsk lov. Tvister behandles av Trøndelag tingrett.</p>
    </div>

    <div class="divider"></div>

    <div class="section">
      <h2>ENGLISH VERSION</h2>
      <p>This agreement governs the collaboration between ArbeidMatch Norge AS ("Supplier") and ${input.companyName} ("Client") for candidate sourcing and screening services.</p>
      <h3>Scope and fee</h3>
      <p>The sourcing fee is NOK 10,000 per candidate (VAT excluded), payable upon signing of an employment or engagement agreement between client and introduced candidate.</p>
      <h3>Process</h3>
      <p>The Supplier identifies, pre-screens and introduces candidates based on the Client's stated needs. Full candidate profile is released only upon explicit request.</p>
      <h3>Validity and governing law</h3>
      <p>The agreement is valid from the date of acceptance and governed by Norwegian law. Disputes are handled by Trøndelag District Court.</p>
    </div>

    <div class="divider"></div>
    <p><strong>Signed on behalf of ${input.companyName}:</strong> ${input.contactName}${input.contactTitle ? `, ${input.contactTitle}` : ""}</p>
    <p class="sign-anchor">/sn1/</p>
  </body>
</html>`;
}

export async function createContractEnvelope(input: {
  requestId: string;
  companyName: string;
  orgNumber: string;
  contactName: string;
  contactEmail: string;
  contactTitle: string;
}) {
  try {
    const { accessToken, restBaseUri, accountId } = await issueJwtAccessToken();

    const html = buildAgreementHtml({
      companyName: input.companyName,
      orgNumber: input.orgNumber,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactTitle: input.contactTitle,
    });

    const documentBase64 = Buffer.from(html, "utf8").toString("base64");
    const envelopeDefinition = {
      emailSubject: `ArbeidMatch contract for ${input.companyName}`,
      documents: [
        {
        documentBase64,
        name: `ArbeidMatch Collaboration Agreement - ${input.companyName}.html`,
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
                anchorString: "/sn1/",
                anchorUnits: "pixels",
                anchorXOffset: "0",
                anchorYOffset: "0",
              },
            ],
          },
          },
        ],
      },
      customFields: {
        textCustomFields: [
          {
          name: "request_id",
          value: input.requestId,
          required: "false",
          show: "false",
          },
        ],
      },
      status: "sent",
    };

    const envelopeResponse = await fetch(`${restBaseUri}/v2.1/accounts/${accountId}/envelopes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelopeDefinition),
    });
    if (!envelopeResponse.ok) {
      throw new Error(`DocuSign create envelope failed with status ${envelopeResponse.status}`);
    }
    const responseJson = (await envelopeResponse.json()) as { envelopeId?: string };
    return { envelopeId: responseJson.envelopeId || "" };
  } catch (error) {
    await notifyError({ route: "/lib/docusign createContractEnvelope", error, context: { requestId: input.requestId } });
    throw error;
  }
}

