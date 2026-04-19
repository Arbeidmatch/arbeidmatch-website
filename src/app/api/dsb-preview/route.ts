import { NextRequest, NextResponse } from "next/server";

import { extractToc, readDsbGuideMarkdown } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

export const dynamic = "force-dynamic";

function parseSlug(value: string | null): DsbGuideSlug {
  return value === "non-eu" ? "non-eu" : "eu";
}

export async function GET(request: NextRequest) {
  try {
    const slug = parseSlug(request.nextUrl.searchParams.get("slug"));
    const markdown = await readDsbGuideMarkdown(slug);
    const toc = extractToc(markdown);
    return NextResponse.json({ success: true, slug, markdown, toc });
  } catch {
    return NextResponse.json({ success: false, error: "Could not load guide preview." }, { status: 500 });
  }
}
