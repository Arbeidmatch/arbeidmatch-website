import { NextRequest, NextResponse } from "next/server";

import { extractToc, readDsbGuideMarkdown } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";
import { noStoreJson } from "@/lib/apiSecurity";
import { isPreviewAuthorized } from "@/lib/previewAuth";
import { logApiError } from "@/lib/secureLogger";

export const dynamic = "force-dynamic";

function parseSlug(value: string | null): DsbGuideSlug {
  return value === "non-eu" ? "non-eu" : "eu";
}

export async function GET(request: NextRequest) {
  try {
    const isAuthorized = await isPreviewAuthorized();
    if (!isAuthorized) {
      return noStoreJson({ success: false, error: "Unauthorized preview access." }, { status: 401 });
    }

    const slug = parseSlug(request.nextUrl.searchParams.get("slug"));
    const markdown = await readDsbGuideMarkdown(slug);
    const toc = extractToc(markdown);
    return noStoreJson({ success: true, slug, markdown, toc });
  } catch (error) {
    logApiError("dsb-preview", error);
    return noStoreJson({ success: false, error: "Could not load guide preview." }, { status: 500 });
  }
}
