import { NextRequest } from "next/server";

import { handleJobLink } from "@/lib/jobLinkRoute";

export const dynamic = "force-dynamic";

/**
 * `arbeidmatch.no/j/482823` - the link the public reads under our adverts.
 *
 * WHY IT EXISTS. The bot used to publish `ats.arbeidmatch.no/api/go/apply?p=...`
 * in the comment under every job advert. On 16 August 2026 the owner ruled that
 * the ATS address is not to be visible in public, and the link became the board
 * posting itself - which cost the count: twenty-one of the thirty-six taps we
 * had in a fortnight came from exactly those comments, and a link straight to
 * the board passes through nothing of ours. This page is the answer he asked
 * for: his own domain in front of the public, the tap still counted.
 *
 * The surface a tap came from now rides in the path, `/j/482823/comment`, for
 * the reason written at the top of src/lib/jobLinkRoute.ts. The `?src=` form
 * this route still honours is what is already published under live adverts.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleJobLink(request, id, null);
}
