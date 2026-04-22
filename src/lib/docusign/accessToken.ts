import "server-only";

import { importPKCS8, SignJWT } from "jose";

type Cached = { accessToken: string; expiresAtMs: number };
let cached: Cached | null = null;

function required(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

export function isDocuSignConfigured(): boolean {
  return Boolean(
    process.env.DOCUSIGN_INTEGRATION_KEY?.trim() &&
      process.env.DOCUSIGN_USER_ID?.trim() &&
      process.env.DOCUSIGN_ACCOUNT_ID?.trim() &&
      process.env.DOCUSIGN_RSA_PRIVATE_KEY?.trim() &&
      process.env.DOCUSIGN_AUTH_SERVER?.trim(),
  );
}

/** OAuth host, e.g. account-d.docusign.com (demo) or account.docusign.com (production). */
export function getDocuSignAuthServer(): string {
  return required("DOCUSIGN_AUTH_SERVER").replace(/^https?:\/\//, "");
}

export async function getDocuSignAccessToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAtMs > now + 60_000) {
    return cached.accessToken;
  }

  const integrationKey = required("DOCUSIGN_INTEGRATION_KEY");
  const userId = required("DOCUSIGN_USER_ID");
  const authServer = getDocuSignAuthServer();
  const pem = required("DOCUSIGN_RSA_PRIVATE_KEY").replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(pem, "RS256");

  const assertion = await new SignJWT({ scope: "signature impersonation" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(integrationKey)
    .setSubject(userId)
    .setAudience(authServer)
    .setIssuedAt()
    .setExpirationTime("9m")
    .sign(privateKey);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(`https://${authServer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error || `DocuSign token failed (${res.status})`);
  }

  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : 3600;
  cached = {
    accessToken: json.access_token,
    expiresAtMs: now + expiresIn * 1000 - 120_000,
  };
  return cached.accessToken;
}

export async function getDocuSignAccountBaseUri(): Promise<string> {
  const token = await getDocuSignAccessToken();
  const authServer = getDocuSignAuthServer();
  const res = await fetch(`https://${authServer}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json().catch(() => ({}))) as {
    accounts?: Array<{ account_id?: string; is_default?: boolean; base_uri?: string }>;
  };
  const accountId = required("DOCUSIGN_ACCOUNT_ID");
  const acc =
    json.accounts?.find((a) => a.account_id === accountId) ||
    json.accounts?.find((a) => a.is_default) ||
    json.accounts?.[0];
  const base = acc?.base_uri?.replace(/\/$/, "");
  if (!base) {
    throw new Error("DocuSign userinfo missing base_uri");
  }
  return `${base}/restapi/v2.1/accounts/${accountId}`;
}
