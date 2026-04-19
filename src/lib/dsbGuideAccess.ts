import { getSupabaseServiceClient } from "@/lib/supabaseService";

export type DsbGuideSlug = "eu" | "non-eu";

export function getPublicBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://arbeidmatch.no";
  return raw.replace(/\/$/, "");
}

export function resolveStripePriceId(slug: DsbGuideSlug, dbPriceId: string): string {
  const fromEnv = slug === "eu" ? process.env.STRIPE_PRICE_ID_DSB_EU : process.env.STRIPE_PRICE_ID_DSB_NON_EU;
  if (fromEnv?.trim().startsWith("price_")) return fromEnv.trim();
  if (dbPriceId?.startsWith("price_") && !dbPriceId.includes("REPLACE")) return dbPriceId;
  return fromEnv?.trim() || dbPriceId;
}

export type GuidePageState =
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "wrong_guide" }
  | { kind: "expired" }
  | { kind: "pending"; email: string }
  | { kind: "ok"; purchaseId: string; email: string; tokenExpiresAt: string };

export async function resolveGuidePageState(
  token: string | undefined,
  expectedSlug: DsbGuideSlug,
): Promise<GuidePageState> {
  if (!token?.trim()) return { kind: "missing" };

  const supabase = getSupabaseServiceClient();
  if (!supabase) return { kind: "invalid" };

  const { data, error } = await supabase
    .from("dsb_guide_purchases")
    .select("id, email, guide_slug, stripe_payment_status, token_expires_at")
    .eq("access_token", token.trim())
    .maybeSingle();

  if (error || !data) return { kind: "invalid" };

  if (data.guide_slug !== expectedSlug) return { kind: "wrong_guide" };

  const expires = new Date(data.token_expires_at as string).getTime();
  if (Number.isNaN(expires) || Date.now() > expires) return { kind: "expired" };

  const status = (data.stripe_payment_status as string) || "pending";
  if (status !== "paid") return { kind: "pending", email: data.email as string };

  return {
    kind: "ok",
    purchaseId: data.id as string,
    email: data.email as string,
    tokenExpiresAt: data.token_expires_at as string,
  };
}

export async function recordGuideAccess(purchaseId: string): Promise<void> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return;

  const { data: row } = await supabase
    .from("dsb_guide_purchases")
    .select("access_count")
    .eq("id", purchaseId)
    .maybeSingle();

  const nextCount = (typeof row?.access_count === "number" ? row.access_count : 0) + 1;

  await supabase
    .from("dsb_guide_purchases")
    .update({
      accessed_at: new Date().toISOString(),
      access_count: nextCount,
    })
    .eq("id", purchaseId);
}

export async function getPurchaseStatusByToken(token: string): Promise<{
  status: string | null;
  guide_slug: string | null;
}> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return { status: null, guide_slug: null };

  const { data } = await supabase
    .from("dsb_guide_purchases")
    .select("stripe_payment_status, guide_slug")
    .eq("access_token", token.trim())
    .maybeSingle();

  if (!data) return { status: null, guide_slug: null };
  return {
    status: (data.stripe_payment_status as string) || null,
    guide_slug: (data.guide_slug as string) || null,
  };
}
