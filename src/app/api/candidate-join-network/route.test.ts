import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ send: vi.fn(), notify: vi.fn(), limited: vi.fn(), fetch: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/featureFlags", () => ({ TALENT_NETWORK_FORM_ENABLED: true }));
vi.mock("@/lib/createSmtpTransporter", () => ({
  createSmtpTransporter: () => ({}),
  sendMailWithRetry: mocks.send,
  signedInMailHeaders: () => ({ from: "x", replyTo: "y" }),
}));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: mocks.notify }));
vi.mock("@/lib/requestProtection", async (original) => ({ ...(await original<typeof import("@/lib/requestProtection")>()), isRateLimited: mocks.limited }));
vi.mock("@/lib/emailSubscription", () => ({ unsubscribeUrlFor: async () => "https://example.invalid/unsub" }));
import { POST } from "./route";
import { GATE_CONSENT_TEXT_VERSION } from "@/lib/candidateGate";

const TOKEN = "g1.11111111-2222-4333-8444-555555555555.1795000000.abc";
const valid = {
  email: "kari@example.invalid",
  citizenship: "eu_eea",
  date_of_birth: "1990-05-01",
  consent: true,
  consent_text_version: GATE_CONSENT_TEXT_VERSION,
  source: "job:tile-layer-oslo",
};
const request = (body: unknown, cookie?: string) =>
  new NextRequest("https://www.arbeidmatch.no/api/candidate-join-network", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
const refused = Object.assign(new Error("550 5.1.1 Invalid recipient"), { responseCode: 550, command: "RCPT TO" });
const recosAnswers = (status: number, body: unknown) => mocks.fetch.mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ATS_PORTAL_SECRET", "fixture-secret");
  vi.stubGlobal("fetch", mocks.fetch);
  mocks.limited.mockReturnValue(false);
  mocks.send.mockResolvedValue({});
  recosAnswers(200, { token: TOKEN, expires_at: "2026-11-27T00:00:00Z" });
});

describe("the one entry gate (ORDER 396)", () => {
  it("asks RecOS for a token with the answers and the source, with the portal secret", async () => {
    await POST(request(valid));
    const [url, init] = mocks.fetch.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/public\/candidate-gate$/);
    expect(init.headers["x-arbeidmatch-website-secret"]).toBe("fixture-secret");
    expect(JSON.parse(init.body)).toEqual({
      email: "kari@example.invalid",
      citizenship: "eu_eea",
      date_of_birth: "1990-05-01",
      consent: true,
      consent_text_version: GATE_CONSENT_TEXT_VERSION,
      source: "job:tile-layer-oslo",
    });
  });

  it("puts the token in the letter's link to the RecOS register page", async () => {
    await POST(request(valid));
    const letter = mocks.send.mock.calls.find((c) => c[1].to === "kari@example.invalid")?.[1];
    expect(letter.text).toContain(`https://www.arbeidmatch.no/candidate-login?gate=${encodeURIComponent(TOKEN)}`);
    expect(letter.html).toContain("gate=");
  });

  it("falls back to the general advert the visitor came by", async () => {
    await POST(request({ ...valid, source: undefined }, "am_ga=0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11.facebook"));
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).source).toBe("ga:0b6c1f0e-1d7a-4c55-9a43-7f2a6f9f1e11.facebook");
  });

  it("refuses under 18 before asking anybody, and sends nothing", async () => {
    const response = await POST(request({ ...valid, date_of_birth: `${new Date().getFullYear() - 16}-01-01` }));
    expect(response.status).toBe(403);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("refuses without the consent, and an old page's body", async () => {
    expect((await POST(request({ ...valid, consent: false }))).status).toBe(400);
    expect((await POST(request({ email: "kari@example.invalid", gdpr_consent: true, eu_eea_citizenship_confirmed: true }))).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("passes on RecOS's refusal of the citizenship answer, and sends nothing", async () => {
    recosAnswers(403, { error: "citizenship_not_accepted" });
    const response = await POST(request({ ...valid, citizenship: "work_permit" }));
    expect(response.status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("sends no letter without a token, and tells #errors", async () => {
    recosAnswers(503, { error: "unavailable" });
    expect((await POST(request(valid))).status).toBe(503);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });
});

describe("candidate-join-network keeps the lead", () => {
  it("writes the cv@ notice before the visitor's letter", async () => {
    const response = await POST(request(valid));
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.send.mock.calls.map((c) => c[1].to)).toEqual(["cv@arbeidmatch.no", "kari@example.invalid"]);
  });

  it("keeps the lead and asks the visitor to check the address when it is refused", async () => {
    mocks.send.mockResolvedValueOnce({}).mockRejectedValueOnce(refused);
    const response = await POST(request(valid));
    expect(response.status).toBe(422);
    expect((await response.json()).code).toBe("address_refused");
    expect(mocks.send.mock.calls[0][1].to).toBe("cv@arbeidmatch.no");
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("still sends the visitor's letter when our own notice fails, and tells #errors", async () => {
    mocks.send.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({});
    const response = await POST(request(valid));
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("fails only when neither letter could be sent", async () => {
    mocks.send.mockRejectedValue(new Error("down"));
    expect((await POST(request(valid))).status).toBe(500);
  });

  it("drops a filled honeypot without sending anything", async () => {
    const response = await POST(request({ ...valid, website: "http://spam.invalid" }));
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
