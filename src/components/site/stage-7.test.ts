import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ORDER 295, stage 7: the site-wide pass. The header's action waits in a bar at
 * the foot of the window where the header hides it, the welding certificates
 * fold into accordions on a phone, and the components no page used any more
 * are gone.
 */
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("the phone bar for the header action", () => {
  it("renders the page's action a second time in the fab, not on a client's portal pages", () => {
    const header = read("src/components/site/SiteHeader.tsx");
    expect(header).toContain('<div className="fab show">');
    expect(header).toMatch(/\{action && !portal \? \(\s*<div className="fab show">\s*<ActionButton action=\{action\} \/>/);
    expect(header).toContain('<ActionButton action={action} style={{ height: 42 }} />');
  });

  it("fixes the bar to the window where the header's action is hidden, and keeps the footer and cookie bar clear of it", () => {
    const css = read("src/app/site.css");
    const block = css.slice(css.indexOf("@media (max-width:1023px){\n  .ams .s-nav"));
    const end = block.indexOf("\n}\n");
    const tablet = block.slice(0, end);
    expect(tablet).toContain(".ams .s-h .btn");
    expect(tablet).toMatch(/\.ams \.fab\.show\{display:block;position:fixed;/);
    expect(tablet).toContain("body:has(.ams .fab.show) .ams .s-f{padding-bottom:84px}");
    expect(tablet).toContain("body:has(.ams .fab.show) .ams .ck{bottom:92px}");
  });
});

describe("welding on a phone", () => {
  it("folds both certificate grids into accordions below 760px", () => {
    const page = read("src/components/welding/WeldingSpecialistsPage.tsx");
    expect(page.match(/className="phone-only"/g)).toHaveLength(2);
    expect(page).toContain('className="four wide-only"');
    expect(page).toContain('className="two wide-only"');
    expect(page.match(/<Accordion numbered=\{false\}/g)).toHaveLength(2);
    const css = read("src/app/site.css");
    expect(css).toContain(".ams .phone-only{display:none}");
    expect(css).toMatch(/@media \(max-width:760px\)\{\s*\.ams \.wide-only\{display:none\}\s*\.ams \.phone-only\{display:block\}/);
  });
});

describe("the audit's repairs", () => {
  it("gives the small phone targets 44px and the legal links their readable ink", () => {
    const css = read("src/app/site.css");
    expect(css).toContain(".ams .ldoc a[style]{color:var(--goldink)!important}");
    expect(css).toContain(".ams .plink-row .plink,.ams .s-f .flink,.ams .s-f .beta a{display:inline-flex;align-items:center;min-height:44px}");
    expect(read("src/components/welding/WeldingSpecialistsPage.tsx").match(/className="plink-row"/g)).toHaveLength(2);
    expect(read("src/components/prosjekter/portal.module.css")).toMatch(/\.chip,\s*\.select,\s*\.tool \{\s*min-height: 44px;/);
  });

  it("makes the old blog article readable on its light page", () => {
    expect(read("src/app/blog/ansette-utenlandske-arbeidere-lovlig/page.tsx")).toContain('<article className="bg-surface text-navy">');
    expect(read("src/components/seo/SeeAlsoSection.tsx")).not.toMatch(/text-gold shadow-sm/);
    expect(read("src/app/newsletter/page.tsx")).not.toContain('className="pt-1 text-xs font-semibold text-[#92752c]"');
  });
});

describe("orphan components", () => {
  it("are removed", () => {
    for (const f of [
      "src/components/Navbar.tsx",
      "src/components/pages/HomePageClient.tsx",
      "src/components/home/Forsiden.tsx",
      "src/components/recruiter-network/RecruiterNetworkClient.tsx",
      "src/components/welding/WeldingSpecialistsCard.tsx",
      "src/components/premium/PremiumLandingPage.tsx",
      "src/lib/navigationUserType.ts",
    ]) {
      expect(existsSync(join(root, f)), f).toBe(false);
    }
  });
});
