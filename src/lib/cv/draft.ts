"use client";

import { cvDocumentSchema, type CvDocument, type TemplateId } from "@/lib/cv/schema";

export const DRAFT_KEY = "arbeidmatch:cv-draft:v1";
export const CHANNEL_NAME = "arbeidmatch-cv";
export const SESSION_KEY = "arbeidmatch:cv-session:v1";

export interface DraftMessage {
  type: "draft" | "wipe" | "ping";
  doc?: CvDocument;
  step?: number;
}

export function emptyDraft(templateId: TemplateId = "classic-linear"): CvDocument {
  return {
    version: 1,
    templateId,
    locale: "en",
    personal: {
      firstName: "",
      lastName: "",
      headline: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      workPermit: "eu-eea",
      drivingLicence: [],
    },
    summary: "",
    experience: [
      { jobTitle: "", company: "", city: "", country: "", startDate: "", endDate: "Present", bullets: ["", ""] },
    ],
    education: [],
    certifications: [],
    skills: [],
    languages: [{ language: "", level: "Fluent" }],
  };
}

/**
 * Drafts live only in the browser. Nothing is written to the server until an OTP has
 * been verified, so this is the single place form data is persisted.
 */
export function loadDraft(): CvDocument | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    // Partial drafts are expected, so validation is deliberately not enforced here.
    return parsed as CvDocument;
  } catch {
    return null;
  }
}

export function saveDraft(doc: CvDocument): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(doc));
  } catch {
    // A full or blocked storage quota must not break typing.
  }
}

/** Irreversible by design. No hidden backup is kept anywhere. */
export function wipeDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to do; the in memory state is cleared by the caller regardless.
  }
}

export function isCompleteDraft(doc: CvDocument): boolean {
  return cvDocumentSchema.safeParse(doc).success;
}

export function draftIssues(doc: CvDocument): Record<string, string> {
  const result = cvDocumentSchema.safeParse(doc);
  if (result.success) return {};
  const issues: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!issues[path]) issues[path] = issue.message;
  }
  return issues;
}

export function sessionId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** SHA-256 in the browser, matching `hashConsentText` on the server byte for byte. */
export async function hashConsentTextClient(texts: readonly string[]): Promise<string> {
  const data = new TextEncoder().encode(texts.join("\n"));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
