import { describe, expect, it } from "vitest";

import { jobAdCheckoutParams, jobAdPaidFromSession } from "@/lib/job-ads/stripe";
import { emptyAdvert, validateAdvert, type PublicOrderView } from "@/lib/job-ads/types";

const TOKEN = "0123456789abcdef".repeat(4);

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_abc",
    metadata: { kind: "job_ad", order_token: TOKEN },
    payment_status: "paid",
    amount_total: 931250,
    currency: "nok",
    ...overrides,
  } as Parameters<typeof jobAdPaidFromSession>[0];
}

describe("the webhook forwards paid job advert checkouts and nothing else", () => {
  it("forwards a paid job advert session", () => {
    expect(jobAdPaidFromSession(session())).toEqual({
      token: TOKEN,
      paid: { sessionId: "cs_test_abc", amountTotal: 931250, currency: "nok" },
    });
  });

  it("ignores a Premium subscription checkout (no kind)", () => {
    expect(jobAdPaidFromSession(session({ metadata: { premium_email: "x@y.no", premium_plan: "monthly" } }))).toBeNull();
  });

  it("ignores another kind", () => {
    expect(jobAdPaidFromSession(session({ metadata: { kind: "dsb", order_token: TOKEN } }))).toBeNull();
  });

  it("ignores a session that is not paid yet", () => {
    expect(jobAdPaidFromSession(session({ payment_status: "unpaid" }))).toBeNull();
    expect(jobAdPaidFromSession(session({ payment_status: "no_payment_required" }))).toBeNull();
  });

  it("ignores a job advert session without a valid order token", () => {
    expect(jobAdPaidFromSession(session({ metadata: { kind: "job_ad" } }))).toBeNull();
    expect(jobAdPaidFromSession(session({ metadata: { kind: "job_ad", order_token: "../x" } }))).toBeNull();
  });

  it("ignores a session without an amount", () => {
    expect(jobAdPaidFromSession(session({ amount_total: null }))).toBeNull();
  });
});

describe("the checkout charges exactly the frozen total", () => {
  const order = {
    token: TOKEN,
    status: "awaiting_payment",
    advert: { ...emptyAdvert(), title: "Tømrer", contact: { name: "Kari", email: "kari@firma.no" } },
    chosen: {
      package: "synlig",
      addons: [],
      method: "card",
      quote: { tier: 2, package: "synlig", partTime: false, addons: [], lines: [], subtotalNok: 7450, vatNok: 1862.5, totalNok: 9312.5 },
    },
  } as unknown as PublicOrderView;

  it("builds one NOK line for round(total * 100) with the order in the metadata", () => {
    const p = jobAdCheckoutParams({ order, token: TOKEN, baseUrl: "https://www.arbeidmatch.no" })!;
    expect(p.mode).toBe("payment");
    expect(p.line_items).toHaveLength(1);
    const line = p.line_items![0]!;
    expect(line.price_data?.currency).toBe("nok");
    expect(line.price_data?.unit_amount).toBe(931250);
    expect(line.price_data?.product_data?.name).toBe("Stillingsannonse: Tømrer, pakke Synlig");
    expect(line.price_data?.product_data?.description).toBe("inkl. 25 % mva");
    expect(p.metadata).toEqual({ kind: "job_ad", order_token: TOKEN });
    expect(p.payment_intent_data?.metadata).toEqual({ kind: "job_ad", order_token: TOKEN });
    expect(p.customer_email).toBe("kari@firma.no");
    expect(p.success_url).toBe(`https://www.arbeidmatch.no/annonse/${TOKEN}?session_id={CHECKOUT_SESSION_ID}`);
    expect(p.cancel_url).toBe(`https://www.arbeidmatch.no/annonse/${TOKEN}`);
  });

  it("refuses to build a checkout without a frozen quote", () => {
    expect(jobAdCheckoutParams({ order: { ...order, chosen: null }, token: TOKEN, baseUrl: "https://x" })).toBeNull();
  });
});

describe("the form's own checks", () => {
  it("asks for the fields the ATS requires", () => {
    const problems = validateAdvert(emptyAdvert(), new Date("2026-09-11T10:00:00Z"));
    for (const field of ["employer.name", "employer.orgNumber", "contact.name", "contact", "title", "description", "industry", "location.city", "salary.min", "deadline", "advertFor"]) {
      expect(problems[field], field).toBeTruthy();
    }
  });
});
