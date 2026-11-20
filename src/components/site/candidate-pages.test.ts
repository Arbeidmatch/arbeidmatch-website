import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CANDIDATE_FAQ } from "@/lib/candidate-faq";

import { FAQ_GROUPS, FAQ_LINKS } from "./candidates/CandidateFaq";
import { SITE_PATHS, activeCandidateTab, hidesFooter, isCandidatePath, pageAction, siteLang } from "./siteNav";

/**
 * ORDER 295, stage 3: the candidate pages and sheets of the approved mockup.
 * The look was checked in the browser at 1440 and 390; what is checked here
 * is that nothing a live form had was lost on the way into a sheet.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("the candidate pages", () => {
  it("have their own addresses, in English, with the tab row and the footer", () => {
    for (const p of ["/for-candidates", "/for-candidates/questions", "/for-candidates/support", "/jobs", "/stilling/murer-oslo"]) {
      expect(siteLang(p), p).toBe("en");
      expect(isCandidatePath(p), p).toBe(true);
      expect(hidesFooter(p), p).toBe(false);
    }
    expect(SITE_PATHS.questions).toBe("/for-candidates/questions");
    expect(SITE_PATHS.support).toBe("/for-candidates/support");
    expect(activeCandidateTab("/for-candidates/questions")).toBe(SITE_PATHS.questions);
    expect(activeCandidateTab("/for-candidates/support")).toBe(SITE_PATHS.support);
    expect(activeCandidateTab("/stilling/x")).toBe(SITE_PATHS.jobs);
    expect(pageAction("/for-candidates/questions")).toMatchObject({ href: "/jobs" });
  });

  it("keep the general support door where the platform terms and the letters point", () => {
    expect(SITE_PATHS.supportAll).toBe("/contact?support=1");
  });

  it("show all eighteen questions, each once, each with its link", () => {
    const grouped = FAQ_GROUPS.flatMap((g) => g.questions);
    expect(grouped).toHaveLength(18);
    expect(new Set(grouped).size).toBe(18);
    for (const item of CANDIDATE_FAQ) {
      expect(grouped, item.question).toContain(item.question);
      expect(FAQ_LINKS[item.question], item.question).toBeTruthy();
    }
  });

  it("send a candidate with a question to the support page, never to Facebook", () => {
    const answer = CANDIDATE_FAQ.find((f) => f.question === "How do I talk to a recruiter?")?.answer ?? "";
    expect(answer).toContain("candidate support page");
    expect(JSON.stringify(CANDIDATE_FAQ)).not.toMatch(/facebook/i);
  });
});

describe("the candidate sheets keep every field, consent and check of the live forms", () => {
  const sheets = read("src/components/site/sheet/CandidateSheets.tsx");

  it("job alerts: e-mail, trade, both consents, the honeypot, the same route", () => {
    const block = sheets.slice(sheets.indexOf("export function AlertsSheet"), sheets.indexOf("export function RegisterSheet"));
    expect(block).toContain('fetch("/api/newsletter"');
    expect(block).toContain("JSON.stringify({ email: email.trim(), trade, notifyConsent, dataConsent, website })");
    expect(block).toContain('href={SITE_PATHS.privacy} target="_blank"');
  });

  // ORDER 396: the one entry gate. Citizenship, date of birth, e-mail and one consent, in that order, on the sheet the page opens.
  it("create profile: citizenship, date of birth, e-mail and one consent, the pause, the same route", () => {
    const block = sheets.slice(sheets.indexOf("export function RegisterSheet"), sheets.indexOf("export function MessageSheet"));
    const page = read("src/app/candidate-register/page.tsx");
    expect(block).toContain('fetch("/api/candidate-join-network"');
    const order = ['label="Citizenship"', 'id="am-register-birth"', 'id="am-register-email"', "GATE_CONSENT_TEXT_LEAD"].map((m) => block.indexOf(m));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(block).toContain("consent_text_version: GATE_CONSENT_TEXT_VERSION");
    expect(block).toContain("source,");
    // The one-minute pause between requests stays, under the same key.
    expect(sheets).toContain('const COOLDOWN_KEY = "arbeidmatch-candidate-request-cooldown"');
    expect(block).toContain('href={SITE_PATHS.privacy} target="_blank"');
    // The page is the sheet: it opens it at once with the source its address names.
    expect(page).toContain('open("register", { source: gateSourceFrom(new URLSearchParams(window.location.search)) })');
  });

  it("candidate message: the support route with its minimums, honeypot and human check, and the privacy notice linked", () => {
    const block = sheets.slice(sheets.indexOf("export function MessageSheet"));
    expect(block).toContain('fetch("/api/support-report"');
    expect(block).toContain("detail.trim().length < 10");
    expect(block).toContain("company_website: trap");
    expect(block).toContain("form_rendered_at: renderedAt.current");
    expect(block).toContain('<PrivacySwitch lang="en"');
  });
});

describe("the job page", () => {
  const page = read("src/app/stilling/[slug]/page.tsx");

  it("applies only with a profile, through the same two doors and query", () => {
    expect(page).toContain("next: `/candidate/apply/${slug}`");
    expect(page).toContain('consent: "1"');
    expect(page).toContain("`${atsBaseUrl()}/candidate/login?${portalQuery}`");
    // A new profile only through the one entry gate (ORDER 396), carrying the advert.
    expect(page).toContain("candidateRegisterHref(`job:${slug}`)");
    expect(page).not.toMatch(/<form/);
  });

  it("shows the advert's photo and no counters", () => {
    expect(page).toContain("src={jobCardImage(job)}");
    expect(page).not.toContain("JobEngagement");
  });
});
