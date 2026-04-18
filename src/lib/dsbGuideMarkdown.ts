import { readFile } from "fs/promises";
import path from "path";

import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

export async function readDsbGuideMarkdown(slug: DsbGuideSlug): Promise<string> {
  const fileName = slug === "eu" ? "dsb-guide-eu.md" : "dsb-guide-non-eu.md";
  const fullPath = path.join(process.cwd(), "docs", fileName);
  return readFile(fullPath, "utf8");
}

export type TocItem = { level: 2 | 3; text: string; id: string };

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractToc(markdown: string): TocItem[] {
  const lines = markdown.split(/\r?\n/);
  const used = new Map<string, number>();
  const items: TocItem[] = [];

  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (!m) continue;
    const level = m[1].length === 2 ? 2 : 3;
    const raw = m[2].trim();
    let base = slugifyHeading(raw) || "section";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    items.push({ level: level as 2 | 3, text: raw, id });
  }

  return items;
}
