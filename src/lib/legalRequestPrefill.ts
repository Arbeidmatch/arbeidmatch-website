/**
 * What the legal request form opens with when RecOS sends a person here
 * (ORDER 360, 19 November 2026): "Request deletion" in the candidate app opens
 * this form with the kind Deletion and the person's name and e-mail filled in.
 * Only known kinds are taken; anything else in the address is ignored.
 */

const KIND_TO_REQUEST_TYPE: Record<string, string> = {
  deletion: "GDPR Erasure (Art. 17)",
  access: "GDPR Access (Art. 15)",
  // ORDER 424: the policy pages and the legal hub open the form on their own kind.
  complaint: "Complaint",
  transparency: "Transparency Act information request",
  ai: "AI question or human review",
  whistleblowing: "Whistleblowing",
};

export type LegalRequestPrefill = { requestType: string | null; fullName: string; email: string };

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export function legalRequestPrefill(params: { kind?: string | string[]; name?: string | string[]; email?: string | string[] }): LegalRequestPrefill {
  const kind = one(params.kind).trim().toLowerCase();
  const fullName = one(params.name).replace(/\s+/g, " ").trim().slice(0, 120);
  const rawEmail = one(params.email).trim().slice(0, 200);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail) ? rawEmail : "";
  return { requestType: KIND_TO_REQUEST_TYPE[kind] ?? null, fullName, email };
}
