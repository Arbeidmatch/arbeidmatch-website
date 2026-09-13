import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildPageviewRow, cleanPath, visitorHash, visitorIp, type PageviewInput } from "@/lib/analytics/pageview";

const baseHeaders: PageviewInput["headers"] = {
  origin: "https://www.arbeidmatch.no",
  referer: "https://www.arbeidmatch.no/for-employers",
  host: "www.arbeidmatch.no",
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
  forwardedFor: "203.0.113.7, 10.0.0.1",
  realIp: null,
  country: "no",
  city: "%C3%85lesund",
};

const now = new Date("2026-09-13T10:00:00Z");

describe("visitor hash", () => {
  it("is sha256(ip|ua|day|salt), first 32 hex, as the ATS sink computes it", () => {
    const expected = createHash("sha256").update("1.2.3.4|UA|2026-09-13|salt").digest("hex").slice(0, 32);
    expect(visitorHash("1.2.3.4", "UA", "2026-09-13", "salt")).toBe(expected);
    expect(expected).toHaveLength(32);
  });

  it("takes the first forwarded address, then x-real-ip, then 0.0.0.0", () => {
    expect(visitorIp("203.0.113.7, 10.0.0.1", "9.9.9.9")).toBe("203.0.113.7");
    expect(visitorIp(null, "9.9.9.9")).toBe("9.9.9.9");
    expect(visitorIp("", null)).toBe("0.0.0.0");
  });

  it("never puts the raw IP in the row", () => {
    const row = buildPageviewRow({ headers: baseHeaders, body: { path: "/" }, now, salt: "s" });
    expect(JSON.stringify(row)).not.toContain("203.0.113.7");
    expect(row?.visitor_hash).toBe(visitorHash("203.0.113.7", baseHeaders.userAgent!, "2026-09-13", "s"));
  });
});

describe("path", () => {
  it("accepts only paths starting with / and cuts them at 512", () => {
    expect(cleanPath("/jobs")).toBe("/jobs");
    expect(cleanPath("jobs")).toBeNull();
    expect(cleanPath("")).toBeNull();
    expect(cleanPath(42)).toBeNull();
    expect(cleanPath(`/${"a".repeat(600)}`)).toHaveLength(512);
  });

  it("ignores a beacon without a usable path", () => {
    expect(buildPageviewRow({ headers: baseHeaders, body: { path: "https://evil.example/" }, now, salt: "s" })).toBeNull();
    expect(buildPageviewRow({ headers: baseHeaders, body: null, now, salt: "s" })).toBeNull();
  });
});

describe("bots and assistants", () => {
  it("marks ordinary bots", () => {
    const row = buildPageviewRow({
      headers: { ...baseHeaders, userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" },
      body: { path: "/" },
      now,
      salt: "s",
    });
    expect(row?.is_bot).toBe(true);
    expect(row?.ai_crawler).toBeNull();
  });

  it("names an AI crawler and counts it as a bot", () => {
    const row = buildPageviewRow({
      headers: { ...baseHeaders, userAgent: "Mozilla/5.0 AppleWebKit; compatible; ClaudeBot/1.0" },
      body: { path: "/" },
      now,
      salt: "s",
    });
    expect(row?.ai_crawler).toBe("ClaudeBot");
    expect(row?.is_bot).toBe(true);
  });

  it("recognises a person arriving from an assistant's answer", () => {
    const row = buildPageviewRow({ headers: baseHeaders, body: { path: "/", ref: "https://chatgpt.com/c/1" }, now, salt: "s" });
    expect(row?.is_bot).toBe(false);
    expect(row?.referrer_host).toBe("chatgpt.com");
    expect(row?.ai_assistant).toBe("chatgpt");
  });
});

describe("origin, host and place", () => {
  it("ignores posts from another site", () => {
    const row = buildPageviewRow({
      headers: { ...baseHeaders, origin: "https://evil.example", referer: null, host: "evil.example" },
      body: { path: "/" },
      now,
      salt: "s",
    });
    expect(row).toBeNull();
  });

  it("keeps the host the page reported, the country upper-cased and the town decoded", () => {
    const row = buildPageviewRow({ headers: baseHeaders, body: { path: "/request", host: "www.arbeidmatch.no" }, now, salt: "s" });
    expect(row).toMatchObject({ host: "www.arbeidmatch.no", path: "/request", country: "NO", city: "Ålesund" });
  });
});
