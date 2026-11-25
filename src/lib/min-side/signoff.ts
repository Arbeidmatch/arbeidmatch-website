/**
 * ORDER 508 (25 November 2026): after a trial tried with no signature, the
 * firm's signer. The user names who signs; that person accepts the terms and
 * the price, gives the invoice details and only then signs. The page's half:
 * what the ATS sends, read safely, and the actions passed back to it.
 */
import type { HiringBilling, HiringBillingValues } from "@/lib/min-side/profile";

export type SignerStep = "terms" | "billing" | "sign" | "signing" | "done";

export type SignoffSnapshot = {
  monthly: number;
  period: number;
  priceLines: { label: string; value: string }[];
  priceSummary: string;
  coverage: string;
  domains: string;
  frequency: string;
  terms: string[];
  termsTitle: string;
  hash: string;
};

export type SignoffView =
  | { kind: "card"; free_until: string; ended: boolean; title: string; suggestion: { name: string; role: string; email: string | null } | null }
  | { kind: "user"; status: string; signer_name: string; ended: boolean; waiting: string | null; can_remind: boolean; note: string }
  | { kind: "signer"; step: SignerStep; snapshot: SignoffSnapshot; joint_names: string[]; sign_url: string | null; billing: HiringBilling };

export const SIGNOFF_ACTIONS = ["signoff_name", "signoff_later", "signoff_remind", "signoff_accept", "signoff_billing", "signoff_sign"] as const;
export type SignoffAction = (typeof SIGNOFF_ACTIONS)[number];

export function isSignoffAction(v: unknown): v is SignoffAction {
  return typeof v === "string" && (SIGNOFF_ACTIONS as readonly string[]).includes(v);
}

const str = (v: unknown, max = 400): string => (typeof v === "string" ? v.slice(0, max) : "");
const STEPS: SignerStep[] = ["terms", "billing", "sign", "signing", "done"];

function billingFrom(raw: unknown): HiringBilling | null {
  const b = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!b) return null;
  return {
    name: str(b.name, 200),
    org_number: typeof b.org_number === "string" ? b.org_number : null,
    address: str(b.address, 200),
    postal_code: str(b.postal_code, 12),
    city: str(b.city, 80),
    billing_same_as_address: b.billing_same_as_address !== false,
    billing_address: str(b.billing_address, 200),
    billing_postal_code: str(b.billing_postal_code, 12),
    billing_city: str(b.billing_city, 80),
    delivery: b.delivery === "email" || b.delivery === "ehf" ? b.delivery : null,
    invoice_email: str(b.invoice_email, 200),
    invoice_email_locked: b.invoice_email_locked === true,
  };
}

function snapshotFrom(raw: unknown): SignoffSnapshot | null {
  const s = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!s || typeof s.hash !== "string") return null;
  const lines = Array.isArray(s.priceLines) ? s.priceLines : [];
  return {
    monthly: Number(s.monthly) || 0,
    period: Number(s.period) || 0,
    priceLines: lines
      .map((l) => (l && typeof l === "object" ? { label: str((l as Record<string, unknown>).label, 120), value: str((l as Record<string, unknown>).value, 120) } : null))
      .filter((l): l is { label: string; value: string } => Boolean(l && l.label)),
    priceSummary: str(s.priceSummary, 200),
    coverage: str(s.coverage, 300),
    domains: str(s.domains, 300),
    frequency: str(s.frequency, 60),
    terms: (Array.isArray(s.terms) ? s.terms : []).map((t) => str(t, 2000)).filter(Boolean),
    termsTitle: str(s.termsTitle, 200) || "Vilkår",
    hash: s.hash,
  };
}

/** Pure: the ATS's signoff block, or null when it is missing or not understood. */
export function signoffFrom(raw: unknown): SignoffView | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  if (!r) return null;
  if (r.kind === "card" && typeof r.free_until === "string") {
    const sug = r.suggestion && typeof r.suggestion === "object" ? (r.suggestion as Record<string, unknown>) : null;
    return {
      kind: "card",
      free_until: r.free_until,
      ended: r.ended === true,
      title: str(r.title, 200),
      suggestion: sug && typeof sug.name === "string" ? { name: str(sug.name, 120), role: str(sug.role, 80), email: typeof sug.email === "string" ? sug.email : null } : null,
    };
  }
  if (r.kind === "user") {
    return {
      kind: "user",
      status: str(r.status, 40),
      signer_name: str(r.signer_name, 120),
      ended: r.ended === true,
      waiting: typeof r.waiting === "string" ? r.waiting : null,
      can_remind: r.can_remind === true,
      note: str(r.note, 300),
    };
  }
  if (r.kind === "signer") {
    const step = STEPS.find((s) => s === r.step);
    const snapshot = snapshotFrom(r.snapshot);
    const billing = billingFrom(r.billing);
    if (!step || !snapshot || !billing) return null;
    return {
      kind: "signer",
      step,
      snapshot,
      joint_names: (Array.isArray(r.joint_names) ? r.joint_names : []).map((n) => str(n, 120)).filter(Boolean),
      sign_url: typeof r.sign_url === "string" && /^https:\/\//.test(r.sign_url) ? r.sign_url : null,
      billing,
    };
  }
  return null;
}

/**
 * Pure: the body passed to the ATS for one signoff action, with only its named
 * fields, bounded. Null for anything else.
 */
export function signoffRequest(raw: Record<string, unknown>): Record<string, unknown> | null {
  const action = raw.action;
  if (!isSignoffAction(action)) return null;
  if (action === "signoff_name") {
    if (raw.confirm === true) return { action, confirm: true };
    const name = str(raw.name, 120).trim();
    const email = str(raw.email, 200).trim();
    if (!name || !email) return null;
    return { action, name, email };
  }
  if (action === "signoff_accept") {
    if (raw.accept !== true || typeof raw.hash !== "string" || !/^[a-f0-9]{64}$/.test(raw.hash)) return null;
    return { action, accept: true, hash: raw.hash };
  }
  if (action === "signoff_billing") {
    const b = (raw.billing && typeof raw.billing === "object" ? raw.billing : null) as Record<string, unknown> | null;
    if (!b) return null;
    return {
      action,
      billing: {
        delivery: b.delivery === "email" || b.delivery === "ehf" ? b.delivery : null,
        invoice_email: str(b.invoice_email, 200),
        billing_same_as_address: b.billing_same_as_address === true,
        billing_address: str(b.billing_address, 200),
        billing_postal_code: str(b.billing_postal_code, 12),
        billing_city: str(b.billing_city, 80),
      },
    };
  }
  return { action };
}

/** The billing values sent from the signer's billing step. */
export function signoffBillingBody(v: HiringBillingValues): Record<string, unknown> {
  return {
    delivery: v.delivery,
    invoice_email: v.invoice_email.trim(),
    billing_same_as_address: v.billing_same_as_address,
    billing_address: v.billing_address.trim(),
    billing_postal_code: v.billing_postal_code.trim(),
    billing_city: v.billing_city.trim(),
  };
}
