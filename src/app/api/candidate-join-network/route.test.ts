import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ send: vi.fn(), notify: vi.fn(), limited: vi.fn() }));
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

const valid = { email: "kari@example.invalid", gdpr_consent: true, eu_eea_citizenship_confirmed: true, eu_eea_passport_confirmed: true };
const request = (body: unknown) =>
  new NextRequest("https://www.arbeidmatch.no/api/candidate-join-network", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const refused = Object.assign(new Error("550 5.1.1 Invalid recipient"), { responseCode: 550, command: "RCPT TO" });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.limited.mockReturnValue(false);
  mocks.send.mockResolvedValue({});
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
