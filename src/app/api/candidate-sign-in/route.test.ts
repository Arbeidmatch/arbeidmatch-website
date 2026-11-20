import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/** ORDER 426: the site's server asks RecOS for the code and checks it, with the portal secret, passing only the sign-in's fields. */

const calls: Array<{ url: string; init: RequestInit }> = [];

beforeEach(() => {
  vi.stubEnv("ATS_PORTAL_SECRET", "portal-secret-fixture");
  calls.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ ok: true, handover: "f".repeat(56), redirect: "/candidate/profile" }), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const post = async (body: unknown) => {
  const { POST } = await import("./route");
  const res = await POST(
    new NextRequest("https://www.arbeidmatch.no/api/candidate-sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

describe("api/candidate-sign-in", () => {
  it("refuses anything but the two steps", async () => {
    expect((await post({ action: "other" })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("asks RecOS with the secret and the visitor's address, and returns its answer", async () => {
    const res = await post({ action: "verify", email: "test.candidate@example.invalid", code: "123456", password: "never-sent" });
    expect(res).toMatchObject({ status: 200, body: { handover: "f".repeat(56) } });
    expect(calls[0].url).toMatch(/\/api\/public\/candidate-sign-in$/);
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers["x-arbeidmatch-website-secret"]).toBe("portal-secret-fixture");
    expect(headers["x-arbeidmatch-applicant-ip"]).toBe("203.0.113.9");
    const sent = JSON.parse(String(calls[0].init.body)) as Record<string, unknown>;
    expect(sent).toEqual({ action: "verify", email: "test.candidate@example.invalid", code: "123456" });
  });
});
