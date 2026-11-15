import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { inviteSummary, PARTNER_TRACKS } from "./sheet/InviteSheet";
import { pageAction } from "./siteNav";

/**
 * ORDER 295, stage 6: the Recruiter Network asks for an invitation through the
 * live endpoint with every field and check of the live form; About and the
 * 404 page take the site's template, the 404 with its own h1.
 */
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("Recruiter Network invitation sheet", () => {
  const sheet = read("src/components/site/sheet/InviteSheet.tsx");

  it("sends to the live endpoint with the live form's fields", () => {
    expect(sheet).toContain('fetch("/api/recruiter-network/request-invite"');
    for (const key of ["full_name:", "email:", "motivation:", "experience_summary:", "gdpr_consent: true"]) expect(sheet).toContain(key);
  });

  it("keeps the live checks: 30 characters of motivation, the privacy notice linked, the honeypot", () => {
    expect(sheet).toMatch(/motivation\.trim\(\)\.length < 30/);
    expect(sheet).toContain('<PrivacySwitch lang="en"');
    expect(sheet).toMatch(/if \(website\.trim\(\)\) return;/);
  });

  it("sends a chosen partner type with the experience summary, and nothing when both are empty", () => {
    expect(inviteSummary("", "")).toBeUndefined();
    expect(inviteSummary("", " Ten years in HR ")).toBe("Ten years in HR");
    expect(inviteSummary("The Recruiter", "")).toBe("Partner type: The Recruiter");
    expect(inviteSummary("The Learner", "New to it")).toBe("Partner type: The Learner\nNew to it");
    expect(PARTNER_TRACKS).toEqual(["The Influencer", "The Recruiter", "The Learner"]);
  });

  it("is opened by the page's header action and by each partner card with its type chosen", () => {
    expect(pageAction("/recruiter-network")).toEqual({ kind: "sheet", sheet: "invite", label: "Request invitation" });
    expect(read("src/components/site/sheet/SheetHost.tsx")).toContain("invite: InviteSheet");
    const page = read("src/components/site/network/RecruiterNetwork.tsx");
    expect(page).toMatch(/data-sheet="invite" data-sheet-set=\{`track=\$\{t\.track\}`\}/);
  });
});

describe("pages on the site template", () => {
  it("gives every stage 6 page one h1, a canonical and hreflang", () => {
    for (const [component, route] of [
      ["src/components/site/network/RecruiterNetwork.tsx", "src/app/recruiter-network/page.tsx"],
      ["src/components/site/about/About.tsx", "src/app/about/page.tsx"],
    ] as const) {
      expect(read(component).match(/<h1[ >]/g)).toHaveLength(1);
      expect(read(route)).toMatch(/canonical: URL, languages: \{ en: URL, "x-default": URL \}/);
    }
  });

  it("gives the 404 page an h1 on the site template", () => {
    const nf = read("src/app/not-found.tsx");
    expect(nf).toContain('className="ams page"');
    expect(nf).toMatch(/<h1>Page not found<\/h1>/);
  });
});
