import "server-only";

export type AtsLegalDocumentJson = {
  name: string;
  /** Authoritative HTML from the ATS editor. Preferred over content_md. */
  content_html: string;
  /** Legacy Markdown fallback. Used only when content_html is empty. */
  content_md: string;
  version: number | string;
  updated_at: string;
};

function atsPublicBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_ATS_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export async function fetchAtsLegalDocument(slug: string): Promise<AtsLegalDocumentJson | null> {
  const base = atsPublicBaseUrl();
  if (!base) return null;

  const url = `${base}/api/public/legal/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Partial<AtsLegalDocumentJson>;
    if (typeof data.name !== "string" || !data.name.trim()) return null;

    // At least one of content_html or content_md must be present.
    const hasHtml = typeof data.content_html === "string" && data.content_html.trim().length > 0;
    const hasMd = typeof data.content_md === "string" && data.content_md.trim().length > 0;
    if (!hasHtml && !hasMd) return null;

    // Decode escaped \n sequences that may appear if content_markdown was stored
    // with literal backslash-n instead of real newlines (data integrity guard).
    const rawMd = data.content_md ?? "";
    const content_md = rawMd.includes("\\n") ? rawMd.replace(/\\n/g, "\n") : rawMd;

    return {
      name: data.name.trim(),
      content_html: typeof data.content_html === "string" ? data.content_html.trim() : "",
      content_md,
      version: data.version ?? "",
      updated_at: typeof data.updated_at === "string" ? data.updated_at : "",
    };
  } catch {
    return null;
  }
}
