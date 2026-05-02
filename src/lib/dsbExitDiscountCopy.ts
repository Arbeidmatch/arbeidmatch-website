import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";

export function dsbExitDiscountOfferCopy(guideType: DsbDiscountGuideType) {
  if (guideType === "non-eu") {
    return {
      title: "Get the Non-EU Guide for €29 instead of €39",
      body: "Save €10 on your DSB authorization guide. This offer is only available right now.",
      strike: "€39",
      price: "€29",
      badge: "€10 off",
    };
  }
  return {
    title: "Get the EU Guide for €12 instead of €15",
    body: "Save €3 on your EU guide. This offer is only available right now.",
    strike: "€15",
    price: "€12",
    badge: "€3 off",
  };
}
