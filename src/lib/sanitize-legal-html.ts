/**
 * Server-side sanitizer for HTML from the ATS legal template editor.
 * Strips dangerous elements and attributes while preserving safe formatting.
 * Must only be called in server components or API routes.
 */
export function sanitizeLegalHtml(raw: string): string {
  if (!raw) return "";

  return (
    raw
      // Remove script and style blocks entirely
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      // Remove dangerous block-level elements
      .replace(/<iframe[\s\S]*?(?:\/>|>[\s\S]*?<\/iframe>)/gi, "")
      .replace(/<object[\s\S]*?(?:\/>|>[\s\S]*?<\/object>)/gi, "")
      .replace(/<embed[^>]*\/?>/gi, "")
      .replace(/<form[^>]*>/gi, "")
      .replace(/<\/form>/gi, "")
      .replace(/<input[^>]*\/?>/gi, "")
      .replace(/<button[^>]*>[\s\S]*?<\/button>/gi, "")
      .replace(/<link[^>]*\/?>/gi, "")
      .replace(/<meta[^>]*\/?>/gi, "")
      .replace(/<base[^>]*\/?>/gi, "")
      // Strip on* event handler attributes
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
      // Neutralise javascript: and data: URI schemes
      .replace(/(href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '$1="#"')
      .replace(/(href|src|action)\s*=\s*["']?\s*data:[^"'\s>]*/gi, '$1="#"')
      // Strip CSS expression()
      .replace(/expression\s*\([^)]*\)/gi, "")
      .trim()
  );
}

/**
 * Strips the first <h1>…</h1> block from HTML so the page's own
 * <header> title is not duplicated when the document HTML includes one.
 */
export function stripLeadingH1(html: string): string {
  return html.replace(/^\s*(?:<article[^>]*>\s*)?<h1[^>]*>[\s\S]*?<\/h1>/i, "").trim();
}
