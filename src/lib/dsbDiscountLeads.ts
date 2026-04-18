import type { SupabaseClient } from "@supabase/supabase-js";

import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";

export type DiscountLeadRow = {
  id: string;
  email: string;
  guide_type: DsbDiscountGuideType;
  coupon_code: string;
  expires_at: string;
  used: boolean;
  reminder_sent: boolean;
  created_at: string;
};

export async function findActiveUnusedLead(
  supabase: SupabaseClient,
  email: string,
  guideType: DsbDiscountGuideType,
): Promise<DiscountLeadRow | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("discount_leads")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .eq("guide_type", guideType)
    .eq("used", false)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[discount_leads] findActiveUnusedLead:", error.message);
    return null;
  }
  return (data as DiscountLeadRow) || null;
}

export async function validateCouponForCheckout(
  supabase: SupabaseClient,
  email: string,
  guideType: DsbDiscountGuideType,
  couponCode: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("discount_leads")
    .select("id")
    .eq("coupon_code", couponCode.trim())
    .eq("email", email.trim().toLowerCase())
    .eq("guide_type", guideType)
    .eq("used", false)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    console.error("[discount_leads] validateCouponForCheckout:", error.message);
    return false;
  }
  return Boolean(data);
}

export async function markDiscountLeadUsed(supabase: SupabaseClient, couponCode: string): Promise<void> {
  const { error } = await supabase.from("discount_leads").update({ used: true }).eq("coupon_code", couponCode.trim());
  if (error) {
    console.error("[discount_leads] markUsed:", error.message);
  }
}
