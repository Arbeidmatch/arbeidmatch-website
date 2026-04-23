import { createHmac } from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";

export type PartnerTier = "growth_scale" | "alert_subscriber" | "free";

const MAX_ALERT_SLOTS = 5;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function referralSecret(): string {
  return process.env.PARTNER_REFERRAL_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "arbeidmatch-referral-secret";
}

export function makeReferralCode(email: string): string {
  const normalized = normalizeEmail(email);
  const payload = Buffer.from(normalized).toString("base64url");
  const sig = createHmac("sha256", referralSecret()).update(payload).digest("hex").slice(0, 10);
  return `${payload}.${sig}`;
}

export function parseReferralCode(code: string): string | null {
  const [payload, sig] = code.trim().split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", referralSecret()).update(payload).digest("hex").slice(0, 10);
  if (expected !== sig) return null;
  try {
    const email = Buffer.from(payload, "base64url").toString("utf8");
    return normalizeEmail(email);
  } catch {
    return null;
  }
}

export function campaignUpsellMessage(date = new Date()): string {
  const isMarch = date.getMonth() === 2;
  if (isMarch) {
    return "Limited time: 3 alerts free for March.";
  }
  return "Upgrade to Growth for instant alerts and unlimited priority access.";
}

export async function resolvePartnerTier(supabase: SupabaseClient, email: string): Promise<PartnerTier> {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return "free";

  const [subscriptionRes, premiumRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan,status,cancel_at_period_end")
      .eq("employer_email", normalized)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("premium_subscribers")
      .select("status,trial_ends_at")
      .eq("email", normalized)
      .maybeSingle(),
  ]);

  const sub = subscriptionRes.data as { plan?: string | null; status?: string | null } | null;
  if (sub && (sub.status === "active" || sub.status === "trialing") && (sub.plan === "growth" || sub.plan === "scale")) {
    return "growth_scale";
  }

  const premium = premiumRes.data as { status?: string | null; trial_ends_at?: string | null } | null;
  if (premium?.status === "active") return "alert_subscriber";
  if (premium?.status === "trialing" && premium.trial_ends_at && new Date(premium.trial_ends_at).getTime() > Date.now()) {
    return "alert_subscriber";
  }

  return "free";
}

export function delayMsForTier(tier: PartnerTier): number {
  if (tier === "growth_scale") return 0;
  if (tier === "alert_subscriber") return 2 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

export function alertIdFromCategory(category: string): string {
  const normalizedCategory = (category || "general")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general";
  const day = new Date().toISOString().slice(0, 10);
  return `partner-alert-${normalizedCategory}-${day}`;
}

export async function getAlertSlotState(
  supabase: SupabaseClient,
  alertId: string,
  email: string,
): Promise<{ slotsUsed: number; hasOwnSlot: boolean; isFull: boolean }> {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const res = await supabase
    .from("master_audit_log")
    .select("metadata")
    .eq("event_type", "partner_alert_slot_claimed")
    .eq("metadata->>alert_id", alertId)
    .gte("created_at", sinceIso);

  const logs = (res.data ?? []) as Array<{ metadata?: { partner_email?: string } | null }>;
  const unique = new Set<string>();
  for (const log of logs) {
    const partnerEmail = normalizeEmail(log.metadata?.partner_email || "");
    if (partnerEmail) unique.add(partnerEmail);
  }

  const normalizedEmail = normalizeEmail(email);
  const hasOwnSlot = unique.has(normalizedEmail);
  return {
    slotsUsed: unique.size,
    hasOwnSlot,
    isFull: unique.size >= MAX_ALERT_SLOTS && !hasOwnSlot,
  };
}

export { MAX_ALERT_SLOTS };
