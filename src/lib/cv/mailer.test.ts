import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { atsEmailEndpoint, sendCvEmail } from "@/lib/cv/mailer";

/**
 * The OTP is worth nothing if the mail never leaves, and the way it failed in production
 * left no trace for the visitor: the code path gave up before any network call, so the
 * only symptom was "Could not send the code" on a form that looked fine.
 *
 * What went wrong was a name. The deployment held the ATS address as NEXT_PUBLIC_ATS_URL
 * while the mailer only read ATS_BASE_URL and ATS_PUBLIC_BASE_URL. These tests pin the
 * resolution itself, so the next rename shows up here instead of on a stranger's phone.
 */

const NAMES = ["ATS_BASE_URL", "ATS_PUBLIC_BASE_URL", "NEXT_PUBLIC_ATS_URL"] as const;

function clearAll() {
  for (const name of NAMES) vi.stubEnv(name, "");
}

describe("the ATS mail endpoint is found under every name the project uses", () => {
  beforeEach(() => {
    clearAll();
    vi.stubEnv("ATS_EMAIL_SECRET", "test-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  for (const name of NAMES) {
    it(`resolves the endpoint from ${name}`, () => {
      vi.stubEnv(name, "https://ats.arbeidmatch.no");
      expect(atsEmailEndpoint()).toBe("https://ats.arbeidmatch.no/api/public/website-email");
    });
  }

  it("does not double the slash when the address ends in one", () => {
    vi.stubEnv("ATS_BASE_URL", "https://ats.arbeidmatch.no///");
    expect(atsEmailEndpoint()).toBe("https://ats.arbeidmatch.no/api/public/website-email");
  });

  it("prefers the explicit server-side name when several are set", () => {
    vi.stubEnv("NEXT_PUBLIC_ATS_URL", "https://public.example");
    vi.stubEnv("ATS_BASE_URL", "https://explicit.example");
    expect(atsEmailEndpoint()).toBe("https://explicit.example/api/public/website-email");
  });

  it("reports no endpoint only when the address is nowhere to be found", () => {
    expect(atsEmailEndpoint()).toBeNull();
  });
});

describe("sendCvEmail refuses to pretend it sent something", () => {
  beforeEach(() => {
    clearAll();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("says mail_not_configured when no address is set, the failure seen in production", async () => {
    vi.stubEnv("ATS_EMAIL_SECRET", "test-secret");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendCvEmail({ to: "person@example.com", subject: "s", html: "<p>h</p>" });

    expect(result).toEqual({ ok: false, error: "mail_not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("says mail_not_configured when the shared secret is missing", async () => {
    vi.stubEnv("ATS_BASE_URL", "https://ats.arbeidmatch.no");
    vi.stubEnv("ATS_EMAIL_SECRET", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await sendCvEmail({ to: "person@example.com", subject: "s", html: "<p>h</p>" });

    expect(result).toEqual({ ok: false, error: "mail_not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to the ATS with the secret in the header when it is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_ATS_URL", "https://ats.arbeidmatch.no");
    vi.stubEnv("ATS_EMAIL_SECRET", "test-secret");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const result = await sendCvEmail({ to: "person@example.com", subject: "s", html: "<p>h</p>" });

    expect(result).toEqual({ ok: true });
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://ats.arbeidmatch.no/api/public/website-email");
    expect((init.headers as Record<string, string>)["x-website-email-secret"]).toBe("test-secret");
  });
});
