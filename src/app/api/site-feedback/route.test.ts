import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ send: vi.fn(), notify: vi.fn(), limited: vi.fn() }));
vi.mock("@/lib/createSmtpTransporter", () => ({
  createSmtpTransporter: () => ({}),
  sendMailWithRetry: mocks.send,
  signedInMailHeaders: () => ({ from: "x", replyTo: "y" }),
}));
vi.mock("@/lib/errorNotifier", () => ({ notifyError: mocks.notify }));
vi.mock("@/lib/requestProtection", async (original) => ({ ...(await original<typeof import("@/lib/requestProtection")>()), isRateLimited: mocks.limited }));
vi.mock("@/lib/emailSubscription", () => ({ unsubscribeUrlFor: async () => "https://example.invalid/unsub" }));
import { POST } from "./route";

const valid = { rating: 8, email: "ola@example.invalid", note: "fine" };
const request = (body: unknown) =>
  new NextRequest("https://www.arbeidmatch.no/api/site-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const refused = Object.assign(new Error("550 5.1.1 Invalid recipient"), { responseCode: 550, command: "RCPT TO" });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.limited.mockReturnValue(false);
  mocks.send.mockResolvedValue({});
});

describe("site-feedback", () => {
  it("answers 200 when only the receipt to the typed address is refused, without an incident", async () => {
    mocks.send.mockResolvedValueOnce({}).mockRejectedValueOnce(refused);
    const response = await POST(request(valid));
    expect(response.status).toBe(200);
    expect(mocks.send.mock.calls[0][1].to).toBe("post@arbeidmatch.no");
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("tells #errors when the receipt fails for a reason that is ours, and still answers 200", async () => {
    mocks.send.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("auth failed"));
    expect((await POST(request(valid))).status).toBe(200);
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("fails when our own notice cannot be sent", async () => {
    mocks.send.mockRejectedValueOnce(new Error("down"));
    expect((await POST(request(valid))).status).toBe(500);
  });

  it("refuses an address that cannot be one", async () => {
    expect((await POST(request({ ...valid, email: "a@b" }))).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
