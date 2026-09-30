import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { isProfileToken } from "@/lib/min-side/profile";
import { atsBase, vouchingHeaders } from "@/lib/prosjekter/ats";
import { logApiError } from "@/lib/secureLogger";

export const dynamic = "force-dynamic";

const NOT_FOUND = "Fakturaen ble ikke funnet.";
const UNAVAILABLE = "Fakturaen kunne ikke hentes akkurat nå. Prøv igjen om litt.";

/**
 * One of a client's own invoices as a PDF, from Min side. The ATS decides
 * whether this person may read the firm's invoices and whether the invoice is
 * the firm's; this only passes the file on, from this site's own address, so
 * the page key never leaves for another host.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await ctx.params;
  if (!isProfileToken(token) || !/^\d{1,15}$/.test(id)) return noStoreJson({ error: NOT_FOUND }, { status: 404 });
  const rate = getRateLimitResult(request, "min-side-invoice", 40, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ error: "For mange forespørsler. Prøv igjen litt senere." }, { status: 429 });

  try {
    const res = await fetch(`${atsBase()}/api/public/client-profile/${token}/invoice/${id}`, {
      method: "GET",
      headers: { Accept: "application/pdf", ...vouchingHeaders(request.headers) },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok || !String(res.headers.get("content-type") ?? "").includes("application/pdf")) {
      return noStoreJson({ error: res.status === 404 ? NOT_FOUND : UNAVAILABLE }, { status: res.status === 404 ? 404 : 503 });
    }
    return new Response(await res.arrayBuffer(), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": res.headers.get("content-disposition") ?? `inline; filename="Faktura-${id}.pdf"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    logApiError("min-side/invoice", error, {});
    return noStoreJson({ error: UNAVAILABLE }, { status: 503 });
  }
}
