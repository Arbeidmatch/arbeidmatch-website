import "server-only";

export type AtsLegalDocumentJson = {
  name: string;
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
    if (typeof data.content_md !== "string" || !data.content_md.trim()) return null;
    if (typeof data.name !== "string" || !data.name.trim()) return null;

    // Decode escaped \n sequences that may appear if content_markdown was stored
    // with literal backslash-n instead of real newlines (data integrity guard).
    const content_md = data.content_md.includes("\\n")
      ? data.content_md.replace(/\\n/g, "\n")
      : data.content_md;

    return {
      name: data.name.trim(),
      content_md,
      version: data.version ?? "",
      updated_at: typeof data.updated_at === "string" ? data.updated_at : "",
    };
  } catch {
    return null;
  }
}
