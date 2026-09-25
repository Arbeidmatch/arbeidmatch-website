import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Premium cannot be bought until it has its own consumer terms (the owner,
 * 25 September 2026). With PREMIUM_PURCHASE_ENABLED off the route answers 503
 * and never reaches the payment provider, even when it is fully configured.
 */
const mocks = vi.hoisted(() => ({ stripeCtor: vi.fn(), create: vi.fn() }));
vi.mock("stripe", () => ({
  default: function Stripe(...args: unknown[]) {
    mocks.stripeCtor(...args);
    return { checkout: { sessions: { create: mocks.create } } };
  },
}));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: vi.fn(async () => undefined) }));

import { PREMIUM_PURCHASE_ENABLED } from "@/lib/featureFlags";
import { POST } from "./route";

beforeEach(() => {
  mocks.stripeCtor.mockReset();
  mocks.create.mockReset();
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.STRIPE_MONTHLY_PRICE_ID = "price_monthly";
  process.env.STRIPE_ANNUAL_PRICE_ID = "price_annual";
});

describe("POST /api/premium/create-checkout", () => {
  it("is off by default", () => {
    expect(PREMIUM_PURCHASE_ENABLED).toBe(false);
  });

  it("answers 503 not available, without calling the payment provider", async () => {
    const request = new Request("https://www.arbeidmatch.no/api/premium/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "buyer@example.com", plan: "monthly" }),
    });
    const response = await POST(request as never);
    expect(response.status).toBe(503);
    const data = (await response.json()) as { error?: string; code?: string; checkoutUrl?: string };
    expect(data.code).toBe("premium_not_available");
    expect(data.error).toMatch(/not available yet/i);
    expect(data.checkoutUrl).toBeUndefined();
    expect(mocks.stripeCtor).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
