export const DSB_DISCOUNT_LS_COUPON = "am_dsb_discount_coupon";
export const DSB_DISCOUNT_LS_GUIDE = "am_dsb_discount_guide";

export function inferGuideTypeFromCouponCode(code: string): "eu" | "non-eu" | null {
  const c = code.trim().toUpperCase();
  if (c.startsWith("AM-EU")) return "eu";
  if (c.startsWith("AM-NEU")) return "non-eu";
  return null;
}
