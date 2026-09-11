import { NextRequest } from "next/server";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { getOrder, reviseOrder } from "@/lib/job-ads/atsClient";
import { norwegianError } from "@/lib/job-ads/errors";
import { isOrderToken, normaliseAdvert, validateAdvert, type AdvertDraft } from "@/lib/job-ads/types";

export const dynamic = "force-dynamic";
/** A corrected advert is reviewed again while the client waits. */
export const maxDuration = 120;

type Ctx = { params: Promise<{ token: string }> };

const notFound = () => noStoreJson({ ok: false, error: norwegianError(404) }, { status: 404 });

/** The order as its client may see it. The order page polls this while the review runs. */
export async function GET(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isOrderToken(token)) return notFound();
  const rate = getRateLimitResult(request, "job-ads-get", 120, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ ok: false, error: norwegianError(429) }, { status: 429 });

  const r = await getOrder(token);
  if (!r.ok) return noStoreJson({ ok: false, error: norwegianError(r.status, r.error) }, { status: r.status });
  return noStoreJson({ ok: true, order: r.data });
}

/** The client fixed the advert: the ATS saves it and reads it again. */
export async function PUT(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isOrderToken(token)) return notFound();
  const rate = getRateLimitResult(request, "job-ads-revise", 10, 30 * 60 * 1000);
  if (rate.limited) return noStoreJson({ ok: false, error: norwegianError(429) }, { status: 429 });

  let body: { advert?: AdvertDraft };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ ok: false, error: norwegianError(400) }, { status: 400 });
  }
  if (!body.advert || typeof body.advert !== "object") {
    return noStoreJson({ ok: false, error: norwegianError(400) }, { status: 400 });
  }

  const advert = normaliseAdvert(body.advert);
  const problems = validateAdvert(advert);
  if (Object.keys(problems).length > 0) {
    return noStoreJson({ ok: false, error: Object.values(problems)[0], fields: problems }, { status: 400 });
  }

  const r = await reviseOrder(token, advert);
  if (!r.ok) return noStoreJson({ ok: false, error: norwegianError(r.status, r.error) }, { status: r.status });
  return noStoreJson({ ok: true, order: r.data });
}
