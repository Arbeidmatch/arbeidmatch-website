import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ORDER 295, stage 4: Forsprang in the site's design keeps the live explorer
 * and the live invitation request, and the old alerts address leads to it.
 */
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("Forsprang page (stage 4)", () => {
  const page = read("src/app/prosjekter/page.tsx");
  const sheet = read("src/components/site/sheet/AccessSheet.tsx");

  it("renders the live explorer in the site layout, never fixed counts", () => {
    expect(page).toMatch(/<ProjectPortal initial=\{initial\} initialFilters=\{filters\} layout="site" \/>/);
    expect(page).not.toMatch(/1 214|\b261\b|\b694\b/);
  });

  it("says invitation only and beta, and publishes no price or trial", () => {
    const portal = read("src/components/prosjekter/ProjectPortal.tsx");
    expect(portal).toContain("Kun med invitasjon");
    expect(page + sheet).not.toMatch(/gratis|prøveperiode|\bkr\b|NOK\s*\d/i);
  });

  it("asks for an invitation through the same routes and checks as the live form", () => {
    expect(sheet).toContain("checkAccessRequest(");
    expect(sheet).toContain('fetch("/api/prosjekter/access"');
    expect(sheet).toContain('fetch("/api/prosjekter/access/verify"');
    expect(sheet).toContain('fetch("/api/prosjekter/access/resend"');
    expect(sheet).toContain("formRenderedAt: String(renderedAt.current), website: honey");
    expect(sheet).toMatch(/href="\/terms\?lang=no" target="_blank"/);
  });

  it("opens the sheet from the old #tilgang links", () => {
    expect(read("src/components/prosjekter/PortalDialogs.tsx")).toMatch(/OPEN_SHEET_EVENT, \{ detail: \{ id: "access" \} \}/);
  });

  it("redirects /prosjektvarsler, and only the bare address", () => {
    expect(read("next.config.ts")).toContain('{ source: "/prosjektvarsler", destination: "/prosjekter", permanent: true }');
  });
});
