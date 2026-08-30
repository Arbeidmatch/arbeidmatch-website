import { NextRequest } from "next/server";

import { handleJobLink, readSource } from "@/lib/jobLinkRoute";

export const dynamic = "force-dynamic";

/**
 * `arbeidmatch.no/j/482823/comment` - the same link, with the surface it came
 * from in the path instead of a query string.
 *
 * MEASURED 30 August 2026: Meta refuses to scrape any address on this domain
 * carrying a query string, because robots.txt says `Disallow: /*?`, so every
 * advert link went out as a grey box. See src/lib/jobLinkRoute.ts for the whole
 * measurement. A path segment cannot be caught by a parameter rule.
 *
 * An unknown segment is not an error and not a guess: the tap is recorded with
 * the default surface, and the person still reaches the posting.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string; src: string }> }) {
  const { id, src } = await context.params;
  return handleJobLink(request, id, readSource(src));
}
