import "server-only";

import type { CvDocument } from "@/lib/cv/schema";

/**
 * Thin RecMan adapter. Every field mapping lives here, so when the API shape turns out
 * to differ from what is documented, one file changes.
 *
 * Not verified against a live account: RECMAN_API_KEY has never been set in this repo,
 * so nothing below has been exercised. The endpoint paths follow RecMan's documented
 * REST surface and must be confirmed before CV_PUSH_TO_ATS is switched on.
 */

export interface RecmanResult {
  ok: boolean;
  candidateId?: string;
  error?: string;
  skipped?: boolean;
}

function config(): { key: string; base: string } | null {
  const key = process.env.RECMAN_API_KEY?.trim();
  const base = process.env.RECMAN_API_BASE?.trim();
  if (!key || !base) return null;
  return { key, base: base.replace(/\/+$/, "") };
}

export function toRecmanCandidate(doc: CvDocument) {
  const mostRecent = doc.experience[0];
  return {
    firstName: doc.personal.firstName,
    lastName: doc.personal.lastName,
    email: doc.personal.email,
    mobilePhone: doc.personal.phone,
    city: doc.personal.city,
    country: doc.personal.country,
    title: doc.personal.headline,
    description: doc.summary,
    currentEmployer: mostRecent?.company ?? null,
    currentPosition: mostRecent?.jobTitle ?? null,
    skills: doc.skills,
    languages: doc.languages.map((entry) => `${entry.language} (${entry.level})`),
    source: "arbeidmatch-cv-generator",
  };
}

async function call<T>(path: string, key: string, base: string, body: unknown): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`recman_${response.status}`);
  }
  return (await response.json()) as T;
}

export async function upsertRecmanCandidate(doc: CvDocument): Promise<RecmanResult> {
  const cfg = config();
  if (!cfg) return { ok: false, skipped: true, error: "recman_not_configured" };

  try {
    const result = await call<{ id?: string | number }>(
      "/candidate/upsert",
      cfg.key,
      cfg.base,
      toRecmanCandidate(doc),
    );
    const candidateId = result.id === undefined ? undefined : String(result.id);
    return { ok: true, candidateId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "recman_failed" };
  }
}

export async function uploadRecmanFile(
  candidateId: string,
  fileName: string,
  pdf: Uint8Array,
): Promise<RecmanResult> {
  const cfg = config();
  if (!cfg) return { ok: false, skipped: true, error: "recman_not_configured" };

  try {
    await call("/candidate/file/upsert", cfg.key, cfg.base, {
      candidateId,
      fileName,
      contentType: "application/pdf",
      data: Buffer.from(pdf).toString("base64"),
    });
    return { ok: true, candidateId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "recman_upload_failed" };
  }
}
