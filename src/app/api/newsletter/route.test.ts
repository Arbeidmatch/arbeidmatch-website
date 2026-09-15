import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ upsert: vi.fn(), from: vi.fn(), admin: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdminClient: mocks.admin }));
vi.mock("@/lib/apiSecurity", async (original) => ({ ...await original<typeof import("@/lib/apiSecurity")>(), getRateLimitResult: mocks.limit }));
import { POST } from "./route";

const valid = { email: " News@Test.invalid ", trade: "Carpenter", notifyConsent: true, dataConsent: true };
function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://www.arbeidmatch.no/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.limit.mockReturnValue({ limited: false, retryAfterSeconds: 0 });
  mocks.admin.mockReturnValue({ from: mocks.from });
  mocks.from.mockReturnValue({ upsert: mocks.upsert });
  mocks.upsert.mockResolvedValue({ error: null });
});

describe("newsletter signup uses existing job alerts with explicit consent", () => {
  it.each(["notifyConsent", "dataConsent"])("refuses absent or false %s without storing data", async (field) => {
    for (const value of [false, undefined, "true"]) {
      const response = await POST(request({ ...valid, [field]: value }));
      expect(response.status).toBe(400);
      expect(mocks.upsert).not.toHaveBeenCalled();
    }
  });
  it("does not accept an employer subscription without a completed request", async () => {
    const response = await POST(request({ email: valid.email, audience: "employer", notifyConsent: true, dataConsent: true }));
    expect(response.status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it.each(["", "Every trade", "unknown trade"])("refuses unsupported trade %s", async (trade) => {
    expect((await POST(request({ ...valid, trade }))).status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("normalizes email and restores an explicitly renewed subscription without modifying CV fields", async () => {
    const response = await POST(request(valid));
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.from).toHaveBeenCalledWith("ats_job_alert_subscriptions");
    expect(mocks.upsert).toHaveBeenCalledWith({ email: "news@test.invalid", trade: "Carpenter", notify_consent: true, data_consent: true, source: "website_newsletter", consented_at: expect.any(String), withdrawn_at: null }, { onConflict: "email" });
  });
  it("never reports success on a failed database write or exposes internal errors", async () => {
    mocks.upsert.mockResolvedValue({ error: { message: "private database detail" } });
    const response = await POST(request(valid));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private database detail");
  });
  it("handles missing configuration and timeouts", async () => {
    mocks.admin.mockReturnValueOnce(null);
    expect((await POST(request(valid))).status).toBe(503);
    mocks.upsert.mockRejectedValueOnce(new Error("private timeout"));
    expect((await POST(request(valid))).status).toBe(503);
  });
  it("blocks cross-origin requests and rate-limited submissions", async () => {
    expect((await POST(request(valid, { Origin: "https://other.invalid" }))).status).toBe(403);
    mocks.limit.mockReturnValue({ limited: true, retryAfterSeconds: 20 });
    const response = await POST(request(valid));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("20");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("discards honeypot submissions without creating subscribers", async () => {
    expect((await POST(request({ ...valid, website: "bot.invalid" }))).status).toBe(200);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
