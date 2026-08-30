import { describe, expect, it } from "vitest";

import {
  FALLBACK_PREVIEW,
  isLinkPreviewCrawler,
  previewFromHtml,
  previewHtml,
} from "./linkPreview";

/**
 * The five kilobytes the board actually returns, cut to the tags that matter.
 * Copied from https://jobs.arbeidmatch.no/job/482823 on 30 August 2026.
 */
const BOARD_HTML = `<html><head>
<meta name="description" content="Candidate Recman Page - Precast Concrete Factory Worker">
<meta property="og:type" content="website" />
<meta property="og:url" content="https://jobs.arbeidmatch.no/job/482823" />
<meta property="og:title" content="Precast Concrete Factory Workers &amp; Helpers - Norway, Stavanger" />
<meta property="og:description" content="We are hiring experienced workers. Salary: 280 NOK/hour" />
<meta property="og:image" content="https://cdn.recman.io/drive/logo/1178/1200/cafec.jpeg"/>
</head><body></body></html>`;

describe("who is asking", () => {
  it("knows the crawlers that draw a card", () => {
    expect(isLinkPreviewCrawler("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
    expect(isLinkPreviewCrawler("WhatsApp/2.23")).toBe(true);
    expect(isLinkPreviewCrawler("LinkedInBot/1.0")).toBe(true);
    expect(isLinkPreviewCrawler("meta-externalagent/1.1")).toBe(true);
  });

  it("leaves people and search engines on the redirect", () => {
    // A person, and the two that must never be given an interstitial: a search
    // engine is told the truth, which is that this address is a redirect.
    expect(isLinkPreviewCrawler("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1")).toBe(false);
    expect(isLinkPreviewCrawler("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(false);
    expect(isLinkPreviewCrawler(null)).toBe(false);
    expect(isLinkPreviewCrawler("")).toBe(false);
  });
});

describe("the card, read off the posting", () => {
  it("takes the posting's own title, description and photo", () => {
    const preview = previewFromHtml(BOARD_HTML);
    expect(preview.title).toBe("Precast Concrete Factory Workers & Helpers - Norway, Stavanger");
    expect(preview.description).toContain("280 NOK/hour");
    expect(preview.image).toBe("https://cdn.recman.io/drive/logo/1178/1200/cafec.jpeg");
  });

  it("is always complete, because a card with no photo is the fault being fixed", () => {
    for (const html of ["", "<html><head></head></html>", null, "<meta property=\"og:title\" content=\"\">"]) {
      const preview = previewFromHtml(html);
      expect(preview.title).toBeTruthy();
      expect(preview.description).toBeTruthy();
      expect(preview.image).toBe(FALLBACK_PREVIEW.image);
    }
  });

  it("accepts the twitter tags when a posting carries only those", () => {
    const preview = previewFromHtml('<meta name="twitter:title" content="Sudor - Bergen"><meta name="twitter:image" content="https://x/y.jpg">');
    expect(preview.title).toBe("Sudor - Bergen");
    expect(preview.image).toBe("https://x/y.jpg");
  });
});

describe("the page a crawler receives", () => {
  const html = previewHtml(previewFromHtml(BOARD_HTML), "https://arbeidmatch.no/j/482823?src=comment", "https://jobs.arbeidmatch.no/job/482823");

  it("carries the photo, which is the whole point of it", () => {
    expect(html).toContain('property="og:image" content="https://cdn.recman.io/drive/logo/1178/1200/cafec.jpeg"');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it("keeps the engagement on our own address", () => {
    // Facebook attributes shares and comments to og:url. Pointing it at the
    // board would hand the reactions on our adverts to somebody else's domain.
    expect(html).toContain('property="og:url" content="https://arbeidmatch.no/j/482823?src=comment"');
  });

  it("sends anything that renders it on to the posting", () => {
    expect(html).toContain('http-equiv="refresh" content="0;url=https://jobs.arbeidmatch.no/job/482823"');
    expect(html).toContain('href="https://jobs.arbeidmatch.no/job/482823"');
  });

  it("escapes what came off a page we do not control", () => {
    const nasty = previewHtml(
      { title: '"><script>alert(1)</script>', description: "a & b", image: "https://x/y.jpg" },
      "https://arbeidmatch.no/j/1",
      "https://jobs.arbeidmatch.no/job/1",
    );
    expect(nasty).not.toContain("<script>");
    expect(nasty).toContain("&amp;");
  });
});
