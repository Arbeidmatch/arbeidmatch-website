import { NextRequest } from "next/server";

import { getRateLimitResult, hasHoneypotValue, noStoreJson } from "@/lib/apiSecurity";
import { createOrder, getPostingRules } from "@/lib/job-ads/atsClient";
import { norwegianError, SLOW_REVIEW_MESSAGE } from "@/lib/job-ads/errors";
import { normaliseAdvert, validateAdvert, type AdvertDraft } from "@/lib/job-ads/types";

export const dynamic = "force-dynamic";
/** The review runs while the client waits; the ATS gives it up to 90 s. */
export const maxDuration = 120;

/** A person needs longer than this to fill five steps; a script does not. */
const MIN_FILL_MS = 15_000;
const MAX_DRAFT_AGE_MS = 60 * 86_400_000;
const MAX_BODY_BYTES = 48 * 1024;

/** The posting rules in force, shown in full on the form's last step. */
export async function GET() {
  const r = await getPostingRules();
  if (!r.ok) return noStoreJson({ ok: false, error: norwegianError(r.status, r.error) }, { status: r.status });
  return noStoreJson({ ok: true, version: r.data.version, rules: r.data.rules });
}

/** A new advert, with the rules accepted: the ATS saves it and reviews it at once. */
export async function POST(request: NextRequest) {
  const rate = getRateLimitResult(request, "job-ads-create", 6, 30 * 60 * 1000);
  if (rate.limited) {
    return noStoreJson(
      { ok: false, error: norwegianError(429) },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return noStoreJson({ ok: false, error: "Annonsen er for lang. Kort ned teksten og prøv igjen." }, { status: 413 });
  }
  let body: {
    advert?: AdvertDraft;
    rulesVersion?: string;
    rulesAccepted?: boolean;
    startedAt?: number;
    company_website?: string;
    website?: string;
    honeypot?: string;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return noStoreJson({ ok: false, error: norwegianError(400) }, { status: 400 });
  }

  const startedAt = Number(body.startedAt);
  const age = Date.now() - startedAt;
  // A stored draft can be weeks old; a start time from before that is not a person's.
  const tooFast = !Number.isFinite(startedAt) || age < MIN_FILL_MS || age > MAX_DRAFT_AGE_MS;
  if (hasHoneypotValue(body as Record<string, unknown>) || tooFast) {
    return noStoreJson({ ok: false, error: "Vi kunne ikke ta imot annonsen. Prøv igjen om litt." }, { status: 400 });
  }

  if (body.rulesAccepted !== true || !String(body.rulesVersion ?? "").trim()) {
    return noStoreJson({ ok: false, error: "Dere må godta annonsereglene før annonsen kan sendes." }, { status: 400 });
  }
  if (!body.advert || typeof body.advert !== "object") {
    return noStoreJson({ ok: false, error: norwegianError(400) }, { status: 400 });
  }

  const advert = normaliseAdvert(body.advert);
  const problems = validateAdvert(advert);
  if (Object.keys(problems).length > 0) {
    return noStoreJson({ ok: false, error: Object.values(problems)[0], fields: problems }, { status: 400 });
  }

  const r = await createOrder({ advert, rulesVersion: String(body.rulesVersion) });
  if (!r.ok) {
    const error = r.error === "ats_timeout" ? SLOW_REVIEW_MESSAGE : norwegianError(r.status, r.error);
    return noStoreJson({ ok: false, error }, { status: r.status });
  }
  return noStoreJson({ ok: true, order: r.data });
}
