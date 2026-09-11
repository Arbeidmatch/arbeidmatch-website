import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { atsJobAdsBase, choosePayment, createOrder, getOrder, getPostingRules, markOrderPaid, reviseOrder } from "@/lib/job-ads/atsClient";
import { emptyAdvert } from "@/lib/job-ads/types";

/**
 * The website only ever talks to the ATS about paid adverts through this
 * client. These pin the three things that fail silently if they drift: where
 * the ATS is found, that the secret travels as the header the ATS checks, and
 * that an ATS refusal comes back as a refusal rather than as an order.
 */

const NAMES = ["ATS_BASE_URL", "ATS_PUBLIC_BASE_URL", "NEXT_PUBLIC_ATS_URL"] as const;
const TOKEN = "a".repeat(64);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const order = { token: TOKEN, status: "in_review" };

describe("job ads ATS client", () => {
  beforeEach(() => {
    for (const name of NAMES) vi.stubEnv(name, "");
    vi.stubEnv("ATS_BASE_URL", "https://ats.example/");
    vi.stubEnv("ATS_EMAIL_SECRET", "s3cret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  for (const name of NAMES) {
    it(`finds the ATS under ${name}`, () => {
      for (const n of NAMES) vi.stubEnv(n, "");
      vi.stubEnv(name, "https://ats.arbeidmatch.no");
      expect(atsJobAdsBase()).toBe("https://ats.arbeidmatch.no/api/public/job-ads");
    });
  }

  it("does not call out when the address or the secret is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("ATS_EMAIL_SECRET", "");
    const r = await getPostingRules();
    expect(r).toEqual({ ok: false, status: 503, error: "ats_not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reads the rules with the secret header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, version: "2026-09-11", rules: [{ id: "salary", title: "Lønn", text: "..." }] }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await getPostingRules();
    expect(r).toEqual({ ok: true, data: { version: "2026-09-11", rules: [{ id: "salary", title: "Lønn", text: "..." }] } });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://ats.example/api/public/job-ads");
    expect(init.method).toBe("GET");
    expect(init.headers["x-website-email-secret"]).toBe("s3cret");
  });

  it("creates an order with the rules accepted and returns the order", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, order }));
    vi.stubGlobal("fetch", fetchMock);
    const advert = emptyAdvert();
    const r = await createOrder({ advert, rulesVersion: "2026-09-11" });
    expect(r).toEqual({ ok: true, data: order });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ advert, rulesVersion: "2026-09-11", rulesAccepted: true });
  });

  it("passes the ATS status and error through on a refusal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ok: false, error: "the posting rules have changed" }, 409)));
    const r = await createOrder({ advert: emptyAdvert(), rulesVersion: "old" });
    expect(r).toEqual({ ok: false, status: 409, error: "the posting rules have changed" });
  });

  it("treats a 200 without ok:true as a failure, never as an order", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ something: "else" })));
    const r = await getOrder(TOKEN);
    expect(r.ok).toBe(false);
  });

  it("reports an unreachable ATS as 503", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const r = await getOrder(TOKEN);
    expect(r).toEqual({ ok: false, status: 503, error: "ats_unreachable" });
  });

  it("never forwards a token that is not the ATS's 64 hex characters", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const bad of ["", "../payment", "A".repeat(64), `${TOKEN}/payment`]) {
      expect((await getOrder(bad)).ok).toBe(false);
      expect((await reviseOrder(bad, emptyAdvert())).ok).toBe(false);
      expect((await markOrderPaid(bad, { sessionId: "cs_x", amountTotal: 1, currency: "nok" })).ok).toBe(false);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the payment choice and the paid confirmation to the order's payment endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true, order }));
    vi.stubGlobal("fetch", fetchMock);
    await choosePayment(TOKEN, { package: "synlig", addons: ["urgent_label"], method: "invoice", invoiceReference: "PO-1" });
    await markOrderPaid(TOKEN, { sessionId: "cs_test_1", amountTotal: 931250, currency: "nok" });
    expect(fetchMock.mock.calls[0]![0]).toBe(`https://ats.example/api/public/job-ads/${TOKEN}/payment`);
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      package: "synlig",
      addons: ["urgent_label"],
      method: "invoice",
      invoiceReference: "PO-1",
    });
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body)).toEqual({
      paid: { sessionId: "cs_test_1", amountTotal: 931250, currency: "nok" },
    });
  });
});
