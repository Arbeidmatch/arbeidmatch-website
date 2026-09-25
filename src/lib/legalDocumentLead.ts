/**
 * One title and one date on a legal page (the owner, 25 September 2026).
 *
 * The page prints its own <h1> (the document's name) and a "Last updated" line.
 * Documents served by the ATS often open with the same title again, and the
 * older Markdown texts also carry their own "Last updated: ..." line, so /privacy
 * showed "Privacy Policy" and "Last updated: 4 May 2026" twice. These helpers
 * drop a leading heading that repeats the page title and a leading
 * "Last updated" line, and hand back the date from that line so the page can
 * show it when the API gave none.
 *
 * A heading counts as the same title when, compared case-insensitively and
 * without punctuation, one contains the other: "Terms of Service" inside
 * "Platform Terms of Service", "DATA PROCESSING AGREEMENT" inside
 * "Data Processing Agreement - Recruiter Partner". Any other heading stays.
 */

export type LegalDocumentLead = {
  body: string;
  /** The date text of a dropped "Last updated: ..." line, or null. */
  lastUpdatedFromContent: string | null;
};

function normalizeTitle(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function isSameLegalTitle(heading: string, pageTitle: string): boolean {
  const a = normalizeTitle(heading);
  const b = normalizeTitle(pageTitle);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

const LAST_UPDATED = /^last updated\s*:?\s*(.+)$/i;

function lastUpdatedText(fragment: string): string | null {
  const text = fragment
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/[*_]/g, "")
    .trim();
  const m = text.match(LAST_UPDATED);
  return m ? m[1].trim() || null : null;
}

/**
 * HTML: skips opening wrapper tags (article, header, section, div) and empty
 * paragraphs at the start, then drops an <h1> repeating the title and a
 * paragraph that is only "Last updated: ...". Wrapper tags are kept, so the
 * markup stays balanced; leading whitespace and empty paragraphs are dropped.
 */
export function dedupeLegalHtmlLead(html: string, pageTitle: string): LegalDocumentLead {
  const skippable = /^(?:\s+|<(?:article|header|section|div)\b[^>]*>|<p[^>]*>\s*(?:<br\s*\/?>\s*)*<\/p>)/i;
  let prefix = "";
  let rest = html;
  const skip = () => {
    let m: RegExpMatchArray | null;
    while ((m = rest.match(skippable))) {
      // Wrapper tags are kept; whitespace and empty paragraphs before the
      // first real content carry nothing and are dropped.
      const piece = m[0].trim();
      if (piece.startsWith("<") && !/^<p[\s>]/i.test(piece)) prefix += m[0];
      rest = rest.slice(m[0].length);
    }
  };

  skip();
  const h1 = rest.match(/^<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1 && isSameLegalTitle(h1[1], pageTitle)) {
    rest = rest.slice(h1[0].length);
    skip();
  }

  let lastUpdatedFromContent: string | null = null;
  const para = rest.match(/^<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (para) {
    const date = lastUpdatedText(para[1]);
    if (date) {
      lastUpdatedFromContent = date;
      rest = rest.slice(para[0].length);
    }
  }

  return { body: (prefix + rest).trim(), lastUpdatedFromContent };
}

/** Markdown: the same for a leading "# Title" and a "Last updated: ..." line. */
export function dedupeLegalMarkdownLead(markdown: string, pageTitle: string): LegalDocumentLead {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  const skipBlank = () => {
    while (i < lines.length && lines[i].trim() === "") i++;
  };

  skipBlank();
  const heading = lines[i]?.trim().match(/^#\s+(.+)$/);
  if (heading && isSameLegalTitle(heading[1], pageTitle)) {
    i++;
    skipBlank();
  }

  let lastUpdatedFromContent: string | null = null;
  const date = i < lines.length ? lastUpdatedText(lines[i]) : null;
  if (date) {
    lastUpdatedFromContent = date;
    i++;
    skipBlank();
  }

  return { body: lines.slice(i).join("\n").trim(), lastUpdatedFromContent };
}
