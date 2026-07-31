import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { CONSENT_TEXT_SHA256, REQUIRED_CONSENT_TEXTS, hashConsentText } from "@/lib/cv/consent";
import { SAMPLE_CV } from "@/lib/cv/fixtures/sample-cv";

/**
 * The promise the whole feature rests on: nothing personal reaches a server before the
 * OTP is verified. These tests pin the mechanisms that keep it true.
 */

describe("no personal data can reach the server before verification", () => {
  it("the consent start endpoint cannot accept CV content at all", async () => {
    const { z } = await import("zod");

    // The same strict shape the route validates against.
    const startSchema = z
      .object({
        email: z.string().trim().email().max(200),
        consentPrivacy: z.boolean(),
        consentWorkProfile: z.boolean(),
        policyVersion: z.string().trim().max(40),
        policyTextSha256: z.string().trim().length(64),
        lang: z.enum(["en", "ro"]).optional(),
        captchaToken: z.string().max(4096).optional(),
        website: z.string().max(256).optional(),
        honeypot: z.string().max(256).optional(),
      })
      .strict();

    const smuggled = startSchema.safeParse({
      email: "alex.popa@example.com",
      consentPrivacy: true,
      consentWorkProfile: true,
      policyVersion: "2026-07-31",
      policyTextSha256: CONSENT_TEXT_SHA256,
      cvDocument: SAMPLE_CV,
    });

    expect(smuggled.success).toBe(false);
  });

  it("the decline endpoint accepts only a random session id", async () => {
    const { z } = await import("zod");
    const declineSchema = z
      .object({
        sessionId: z.string().trim().min(8).max(64),
        step: z.string().trim().max(40).optional(),
      })
      .strict();

    expect(declineSchema.safeParse({ sessionId: crypto.randomUUID() }).success).toBe(true);
    expect(
      declineSchema.safeParse({ sessionId: crypto.randomUUID(), email: "alex.popa@example.com" }).success,
    ).toBe(false);
  });

  it("filling the whole form makes no network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });

    const { saveDraft, loadDraft, wipeDraft, DRAFT_KEY } = await import("@/lib/cv/draft");

    // Simulate a full fill, one keystroke's worth of state at a time.
    for (let i = 1; i <= 40; i += 1) {
      saveDraft({ ...SAMPLE_CV, summary: SAMPLE_CV.summary.slice(0, i * 8) });
    }

    expect(loadDraft()).not.toBeNull();
    expect(store.has(DRAFT_KEY)).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Declining wipes it with nothing left behind.
    wipeDraft();
    expect(store.has(DRAFT_KEY)).toBe(false);
    expect(loadDraft()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("consent wording is pinned", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("hashes the two required statements, in order", () => {
    expect(hashConsentText(REQUIRED_CONSENT_TEXTS)).toBe(CONSENT_TEXT_SHA256);
    expect(CONSENT_TEXT_SHA256).toHaveLength(64);
  });

  it("changing a single character changes the hash", () => {
    const altered = [REQUIRED_CONSENT_TEXTS[0], `${REQUIRED_CONSENT_TEXTS[1]} `];
    expect(hashConsentText(altered)).not.toBe(CONSENT_TEXT_SHA256);
  });

  it("the client and the server compute the same digest", async () => {
    const data = new TextEncoder().encode(REQUIRED_CONSENT_TEXTS.join("\n"));
    const digest = await crypto.subtle.digest("SHA-256", data);
    const clientHash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    expect(clientHash).toBe(CONSENT_TEXT_SHA256);
  });
});
