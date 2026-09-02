import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots.txt", () => {
  const rules = () => {
    const value = robots().rules;
    return Array.isArray(value) ? value : [value];
  };

  it("no longer refuses every address with a question mark in it", () => {
    // `Disallow: /*?` blocked /jobs?search=tomrer and /jobs?location=Bergen,
    // which are exactly the pages that answer what people type. Measured live
    // on 2 September 2026.
    for (const rule of rules()) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : [];
      expect(disallow).not.toContain("/*?");
    }
  });

  it("still keeps the private paths out of every index", () => {
    const wildcard = rules().find((r) => r.userAgent === "*");
    const disallow = Array.isArray(wildcard?.disallow) ? wildcard.disallow : [];
    for (const path of ["/request", "/admin", "/api/"]) {
      expect(disallow).toContain(path);
    }
  });

  it("lets the assistants' crawlers in, on the record", () => {
    // Many sites block these by accident and go invisible to every assistant at
    // once. This says out loud that we do not.
    const agents = rules().flatMap((r) => (Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]));
    for (const bot of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(agents).toContain(bot);
    }
  });

  it("still points at the sitemap", () => {
    expect(robots().sitemap).toBe("https://www.arbeidmatch.no/sitemap.xml");
  });
});
