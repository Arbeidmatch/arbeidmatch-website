import { describe, expect, it } from "vitest";

import { sanitizeLegalHtml, stripLeadingH1 } from "./sanitize-legal-html";

describe("legal document HTML", () => {
  // The privacy notice arrived as <article><h1>..</h1>..</article>. stripLeadingH1
  // took the opening <article> with the heading and left the closing tag, which
  // closed the page's own <article> early and broke hydration on /privacy.
  it("leaves no stray wrapper tag after the heading is stripped", () => {
    const html = sanitizeLegalHtml(stripLeadingH1("<article><h1>Privacy</h1><p>Text.</p></article>"));
    expect(html).toBe("<p>Text.</p>");
    expect(html).not.toMatch(/<\/?article/i);
  });

  it("drops document wrappers but keeps the content inside them", () => {
    expect(sanitizeLegalHtml('<html><body><main class="x"><h2>A</h2><p>B</p></main></body></html>')).toBe("<h2>A</h2><p>B</p>");
  });

  it("still removes scripts and event handlers", () => {
    expect(sanitizeLegalHtml('<p onclick="x()">a</p><script>alert(1)</script>')).toBe("<p>a</p>");
  });
});
