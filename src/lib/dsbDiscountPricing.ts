import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";

export const DSB_DISCOUNT = {
  eu: { regular: 15, discounted: 11, save: 4, percentLabel: "27%" },
  "non-eu": { regular: 39, discounted: 27, save: 12, percentLabel: "31%" },
} as const;

export function guideLabelForDiscount(guideType: DsbDiscountGuideType): string {
  return guideType === "eu" ? "EU/EEA" : "Non-EU";
}

export function supportPathForGuide(guideType: DsbDiscountGuideType): string {
  return guideType === "eu" ? "eu" : "non-eu";
}
