import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const CV_BUCKET = "cv-documents";
export const SIGNED_URL_TTL_SECONDS = 15 * 60;

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

export function storagePath(candidateId: string, documentId: string, fileName: string): string {
  return `${candidateId}/${documentId}/${fileName}`;
}

export async function uploadPdf(
  supabase: SupabaseClient,
  path: string,
  bytes: Uint8Array,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.storage.from(CV_BUCKET).upload(path, Buffer.from(bytes), {
    contentType: "application/pdf",
    upsert: true,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function downloadPdf(
  supabase: SupabaseClient,
  path: string,
): Promise<Uint8Array | null> {
  const { data, error } = await supabase.storage.from(CV_BUCKET).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

/** Signed URLs live 15 minutes. The bucket itself is never public. */
export async function signedUrl(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return error ? null : (data?.signedUrl ?? null);
}

export async function removeObjects(supabase: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabase.storage.from(CV_BUCKET).remove(paths);
}
