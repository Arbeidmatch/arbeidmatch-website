import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  setEmployerJobGallerySlot,
  setEmployerJobMainImage,
} from "@/lib/employer-flow/employerJobsRepository";
import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";

type RouteContext = { params: Promise<{ jobId: string }> };

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const clearBodySchema = z.object({
  secret: z.string().min(1),
  clear: z.enum(["main", "gallery"]),
  gallerySlot: z.coerce.number().int().min(1).max(4).optional(),
});

function assertAdmin(secret: string): boolean {
  const expected = process.env.ADMIN_SECRET?.trim();
  return Boolean(expected && secret === expected);
}

async function removeStorageObjects(jobId: string, predicate: (name: string) => boolean): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const { data: list, error } = await supabase.storage.from("job-images").list(jobId, { limit: 100 });
  if (error || !list?.length) return;
  const paths = list.filter((f) => predicate(f.name)).map((f) => `${jobId}/${f.name}`);
  if (!paths.length) return;
  const rm = await supabase.storage.from("job-images").remove(paths);
  if (rm.error) {
    logApiError("removeStorageObjects", rm.error, { jobId });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return noStoreJson({ error: "Missing job id." }, { status: 400 });
  }

  const expected = process.env.ADMIN_SECRET?.trim();
  if (!expected) {
    return noStoreJson({ error: "Not available." }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return noStoreJson({ error: "Invalid JSON." }, { status: 400 });
    }

    const parsed = clearBodySchema.safeParse(json);
    if (!parsed.success) {
      return noStoreJson({ error: "Invalid payload." }, { status: 400 });
    }

    if (!assertAdmin(parsed.data.secret)) {
      return noStoreJson({ error: "Unauthorized." }, { status: 401 });
    }

    if (parsed.data.clear === "main") {
      await removeStorageObjects(jobId, (name) => name.startsWith("main."));
      const res = await setEmployerJobMainImage(jobId, null);
      if (!res.ok) return noStoreJson({ error: res.reason }, { status: 400 });
      return noStoreJson({ success: true });
    }

    const slot = parsed.data.gallerySlot;
    if (slot == null) {
      return noStoreJson({ error: "gallerySlot required (1–4)." }, { status: 400 });
    }
    await removeStorageObjects(jobId, (name) => new RegExp(`^gallery-${slot}\\.`).test(name));
    const res = await setEmployerJobGallerySlot(jobId, slot as 1 | 2 | 3 | 4, null);
    if (!res.ok) return noStoreJson({ error: res.reason }, { status: 400 });
    return noStoreJson({ success: true });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return noStoreJson({ error: "Invalid form data." }, { status: 400 });
  }

  const secret = String(form.get("secret") ?? "").trim();
  if (!assertAdmin(secret)) {
    return noStoreJson({ error: "Unauthorized." }, { status: 401 });
  }

  const kind = String(form.get("kind") ?? "").trim();
  if (kind !== "main" && kind !== "gallery") {
    return noStoreJson({ error: "Invalid kind." }, { status: 400 });
  }

  const slotRaw = form.get("gallerySlot");
  const slotNum =
    typeof slotRaw === "string" && slotRaw.trim()
      ? Number(slotRaw.trim())
      : typeof slotRaw === "number"
        ? slotRaw
        : NaN;

  if (kind === "gallery" && (!Number.isInteger(slotNum) || slotNum < 1 || slotNum > 4)) {
    return noStoreJson({ error: "gallerySlot must be 1–4." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return noStoreJson({ error: "Missing file." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return noStoreJson({ error: "File too large (max 5 MB)." }, { status: 400 });
  }

  const mime = (file.type || "application/octet-stream").toLowerCase();
  const ext = MIME_TO_EXT.get(mime);
  if (!ext) {
    return noStoreJson({ error: "Unsupported image type." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return noStoreJson({ error: "Server misconfigured." }, { status: 503 });
  }

  const objectPath =
    kind === "main" ? `${jobId}/main.${ext}` : `${jobId}/gallery-${slotNum}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const up = await supabase.storage.from("job-images").upload(objectPath, buffer, {
    contentType: mime,
    upsert: true,
  });

  if (up.error) {
    logApiError("job-images upload", up.error, { jobId, objectPath });
    return noStoreJson({ error: "Upload failed." }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from("job-images").getPublicUrl(objectPath);
  const publicUrl = pub.publicUrl;

  if (kind === "main") {
    const res = await setEmployerJobMainImage(jobId, publicUrl);
    if (!res.ok) return noStoreJson({ error: res.reason }, { status: 400 });
    return noStoreJson({ success: true, url: publicUrl });
  }

  const res = await setEmployerJobGallerySlot(jobId, slotNum as 1 | 2 | 3 | 4, publicUrl);
  if (!res.ok) return noStoreJson({ error: res.reason }, { status: 400 });
  return noStoreJson({ success: true, url: publicUrl });
}
