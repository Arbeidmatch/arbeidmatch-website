import { escapeHtml } from "@/lib/htmlSanitizer";
import {
  emailParagraph,
  mailHeaders,
  premiumCtaButton,
  wrapPremiumEmail,
} from "@/lib/emailPremiumTemplate";
import { getPublicBaseUrl } from "@/lib/dsbGuideAccess";
import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";
import { DSB_DISCOUNT, guideLabelForDiscount, supportPathForGuide } from "@/lib/dsbDiscountPricing";

function formatExpiryDate(d: Date): string {
  return d.toLocaleString("en-GB", {
    timeZone: "Europe/Oslo",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function priceBoxHtml(opts: {
  guideLabel: string;
  regular: number;
  yourPrice: number;
  save: number;
  code: string;
  expiresLine: string;
}): string {
  const { guideLabel, regular, yourPrice, save, code, expiresLine } = opts;
  return `<div style="margin:20px 0;padding:24px;border-radius:12px;border:1px solid rgba(201,168,76,0.15);background:rgba(201,168,76,0.08);">
    <div style="font-size:14px;font-weight:700;color:#0D1B2A;margin-bottom:16px;line-height:1.5;">DSB Guide ${escapeHtml(guideLabel)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.7;color:#333;">
      <tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);">Regular price</td><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right;">€${regular}</td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);"><strong>Your price</strong></td><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right;"><strong>€${yourPrice}</strong></td></tr>
      <tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);">You save</td><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);text-align:right;">€${save}</td></tr>
    </table>
    <div style="margin-top:18px;text-align:center;">
      <div style="font-size:11px;color:#666;margin-bottom:8px;">Your code</div>
      <div style="display:inline-block;font-family:ui-monospace,Consolas,monospace;font-size:20px;font-weight:800;color:#C9A84C;letter-spacing:0.1em;padding:12px 24px;border-radius:8px;border:1px dashed rgba(201,168,76,0.15);background:rgba(201,168,76,0.1);">${escapeHtml(code)}</div>
    </div>
    <div style="margin-top:16px;font-size:13px;color:#555;text-align:center;">${escapeHtml(expiresLine)}</div>
  </div>`;
}

export function buildDiscountOfferEmailHtml(opts: {
  guideType: DsbDiscountGuideType;
  couponCode: string;
  expiresAt: Date;
}): string {
  const g = DSB_DISCOUNT[opts.guideType];
  const label = guideLabelForDiscount(opts.guideType);
  const base = getPublicBaseUrl();
  const path = supportPathForGuide(opts.guideType);
  const ctaUrl = `${base}/dsb-support/${path}?discount=${encodeURIComponent(opts.couponCode)}`;
  const expiry = formatExpiryDate(opts.expiresAt);
  const inner = [
    emailParagraph("Hi there,"),
    emailParagraph(`Here is your exclusive discount for the <strong>${escapeHtml(label)}</strong> DSB Authorization Guide.`),
    priceBoxHtml({
      guideLabel: label,
      regular: g.regular,
      yourPrice: g.discounted,
      save: g.save,
      code: opts.couponCode,
      expiresLine: `Valid until: ${expiry}`,
    }),
    `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton(ctaUrl, "Use My Discount Now")}</div>`,
    `<p style="margin:16px 0 0;font-size:12px;line-height:1.65;color:#888888;">This offer expires on ${escapeHtml(expiry)}. After that, the regular price applies.</p>`,
  ].join("");
  return wrapPremiumEmail(inner);
}

export function buildDiscountReminderEmailHtml(opts: {
  guideType: DsbDiscountGuideType;
  couponCode: string;
  expiresAt: Date;
}): string {
  const g = DSB_DISCOUNT[opts.guideType];
  const label = guideLabelForDiscount(opts.guideType);
  const base = getPublicBaseUrl();
  const path = supportPathForGuide(opts.guideType);
  const ctaUrl = `${base}/dsb-support/${path}?discount=${encodeURIComponent(opts.couponCode)}`;
  const expiry = formatExpiryDate(opts.expiresAt);
  const inner = [
    emailParagraph("Hi there,"),
    emailParagraph("Just a reminder that your exclusive discount is still available."),
    priceBoxHtml({
      guideLabel: label,
      regular: g.regular,
      yourPrice: g.discounted,
      save: g.save,
      code: opts.couponCode,
      expiresLine: `Offer expires: ${expiry}`,
    }),
    `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton(ctaUrl, "Claim My Discount Before It Expires")}</div>`,
    `<p style="margin:16px 0 0;font-size:12px;line-height:1.65;color:#888888;">Offer expires: ${escapeHtml(expiry)}</p>`,
  ].join("");
  return wrapPremiumEmail(inner);
}

export { mailHeaders };
