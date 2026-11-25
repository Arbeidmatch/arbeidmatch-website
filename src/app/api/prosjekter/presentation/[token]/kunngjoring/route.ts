import { NextRequest } from "next/server";

import { tenderRedirect } from "@/lib/prosjekter/tender-redirect";
import { POST } from "../route";

export const dynamic = "force-dynamic";

/** "Se kunngjøringen" as a link: the presentation's POST (checks, rate limit, the click counted), answered as a redirect. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  return tenderRedirect(await POST(request, ctx));
}
