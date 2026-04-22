"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from "react";
import type { JobRecord } from "@/lib/jobs/types";

type JobPostMediaSectionProps = {
  job: JobRecord;
  employerBoardId: string | null;
  adminSecret: string | null;
  /** When true, show upload controls (trusted surface with secret and board id). */
  showUploadTools: boolean;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

function NavyPlaceholder({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0D1B2A] via-[#0f1f32] to-[#0A1624] px-6 text-center ring-1 ring-inset ring-[rgba(201,168,76,0.2)]">
      <div
        className="h-14 w-14 rounded-2xl border-2 border-dashed border-[#C9A84C]/35 bg-[rgba(201,168,76,0.06)]"
        aria-hidden
      />
      <div>
        <p className="text-sm font-semibold tracking-wide text-white/80">ArbeidMatch</p>
        <p className="mt-1 text-xs text-white/45">{subtitle ?? "Job imagery coming soon"}</p>
      </div>
    </div>
  );
}

function GalleryEmptyDeck() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[#0D1B2A] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="aspect-[16/10] max-h-[320px] min-h-[180px]">
        <NavyPlaceholder subtitle="Up to four gallery images can appear here" />
      </div>
    </div>
  );
}

function GallerySlider({ urls }: { urls: string[] }) {
  const [active, setActive] = useState(0);
  const safe = urls.filter(Boolean);
  const n = safe.length;
  const idx = n ? Math.min(active, n - 1) : 0;

  useEffect(() => {
    setActive(0);
  }, [urls.join("|")]);

  const go = (next: number) => {
    if (!n) return;
    setActive((next + n) % n);
  };

  if (!n) return null;

  return (
    <div
      className="mt-0 outline-none"
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Job gallery images"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(idx - 1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(idx + 1);
        }
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[#0D1B2A] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        <div
          className="flex will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {safe.map((src, i) => (
            <div key={`${src}-${i}`} className="relative aspect-[16/10] max-h-[420px] min-h-[200px] w-full shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ))}
        </div>

        {n > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(idx - 1)}
              className="absolute left-2 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(201,168,76,0.45)] bg-[#0D1B2A]/90 text-[#C9A84C] shadow-md backdrop-blur-sm transition hover:bg-[rgba(201,168,76,0.15)]"
            >
              <span className="text-lg leading-none" aria-hidden>
                ‹
              </span>
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(idx + 1)}
              className="absolute right-2 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(201,168,76,0.45)] bg-[#0D1B2A]/90 text-[#C9A84C] shadow-md backdrop-blur-sm transition hover:bg-[rgba(201,168,76,0.15)]"
            >
              <span className="text-lg leading-none" aria-hidden>
                ›
              </span>
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {safe.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === idx ? "true" : undefined}
            onClick={() => setActive(i)}
            className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
              i === idx ? "w-8 bg-[#C9A84C]" : "w-2.5 bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function AdminDropSlot({
  label,
  previewUrl,
  uploading,
  disabled,
  inputRef,
  onFile,
  onPick,
  onClear,
}: {
  label: string;
  previewUrl: string | null;
  uploading: boolean;
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
  onPick: () => void;
  onClear: () => Promise<void>;
}) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/90">{label}</p>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && !uploading && onPick()}
        className={`relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-3 py-4 text-center transition ${
          dragOver
            ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)]"
            : "border-white/20 bg-[#0D1B2A]/50 hover:border-[rgba(201,168,76,0.45)]"
        } ${disabled || uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <span className="relative z-[1] text-xs text-white/70">
          {uploading ? "Uploading…" : "Drop or click to upload"}
        </span>
      </div>
      {previewUrl ? (
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={(e) => {
            e.stopPropagation();
            void onClear();
          }}
          className="text-xs font-medium text-red-300/90 hover:text-red-200 disabled:opacity-40"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

export default function JobPostMediaSection({
  job,
  employerBoardId,
  adminSecret,
  showUploadTools,
}: JobPostMediaSectionProps) {
  const router = useRouter();
  const mainInput = useRef<HTMLInputElement>(null);
  const g1 = useRef<HTMLInputElement>(null);
  const g2 = useRef<HTMLInputElement>(null);
  const g3 = useRef<HTMLInputElement>(null);
  const g4 = useRef<HTMLInputElement>(null);

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const mainUrl = job.imageMain?.trim() || null;
  const slotsRaw = job.imageGallery?.length ? job.imageGallery : [];
  const paddedSlots = [...slotsRaw.map((s) => (typeof s === "string" ? s.trim() : ""))];
  while (paddedSlots.length < 4) paddedSlots.push("");
  const gallerySlots = paddedSlots.slice(0, 4);

  const galleryUrls = gallerySlots.filter(Boolean);
  const slotUrl = (slot: number) => gallerySlots[slot - 1]?.trim() || null;

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const postForm = useCallback(
    async (fd: FormData) => {
      if (!employerBoardId || !adminSecret) return;
      const res = await fetch(`/api/employer/board-job/${employerBoardId}/images`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Upload failed.");
    },
    [adminSecret, employerBoardId],
  );

  const postJsonClear = useCallback(
    async (body: Record<string, unknown>) => {
      if (!employerBoardId || !adminSecret) return;
      const res = await fetch(`/api/employer/board-job/${employerBoardId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, secret: adminSecret }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed.");
    },
    [adminSecret, employerBoardId],
  );

  const uploadMain = async (file: File) => {
    if (!employerBoardId || !adminSecret) return;
    setUploadingMain(true);
    try {
      const fd = new FormData();
      fd.append("secret", adminSecret);
      fd.append("kind", "main");
      fd.append("file", file);
      await postForm(fd);
      refresh();
    } finally {
      setUploadingMain(false);
    }
  };

  const uploadGallery = async (slot: number, file: File) => {
    if (!employerBoardId || !adminSecret) return;
    setUploadingSlot(slot);
    try {
      const fd = new FormData();
      fd.append("secret", adminSecret);
      fd.append("kind", "gallery");
      fd.append("gallerySlot", String(slot));
      fd.append("file", file);
      await postForm(fd);
      refresh();
    } finally {
      setUploadingSlot(null);
    }
  };

  const clearMain = async () => {
    await postJsonClear({ clear: "main" });
    refresh();
  };

  const clearGallery = async (slot: number) => {
    await postJsonClear({ clear: "gallery", gallerySlot: slot });
    refresh();
  };

  const showAdmin = Boolean(showUploadTools && employerBoardId && adminSecret);
  const isBoard = job.source === "employer_board";
  const showGalleryRegion = isBoard || galleryUrls.length > 0;

  const galleryRefs = [g1, g2, g3, g4] as const;

  return (
    <section className="relative left-1/2 z-0 mb-8 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden">
      <div className="relative aspect-[21/9] min-h-[200px] w-full overflow-hidden bg-[#050a10] sm:min-h-[240px]">
        {mainUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mainUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : galleryUrls.length ? (
          <NavyPlaceholder
            subtitle={
              showAdmin ? "Optional hero — gallery images are shown below" : "Gallery images are shown below"
            }
          />
        ) : (
          <NavyPlaceholder subtitle={showAdmin ? "Upload a hero image or fill the gallery below" : undefined} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a10]/90 via-transparent to-[#050a10]/30" />
      </div>

      {showGalleryRegion ? (
        <div className="container-site pt-6">
          {galleryUrls.length > 0 ? (
            <GallerySlider urls={galleryUrls} />
          ) : isBoard ? (
            <GalleryEmptyDeck />
          ) : null}
        </div>
      ) : null}

      {showAdmin ? (
        <div className="container-site mt-6 max-w-4xl space-y-6 rounded-2xl border border-[rgba(201,168,76,0.25)] bg-[#0A0F18]/90 p-5 backdrop-blur-sm">
          <div>
            <h3 className="text-sm font-semibold text-white">Listing images</h3>
            <p className="mt-1 text-xs text-white/50">One hero image and up to four gallery images (JPEG, PNG, WebP, GIF — max 5 MB each).</p>
          </div>
          <AdminDropSlot
            label="Hero (main)"
            previewUrl={mainUrl}
            uploading={uploadingMain}
            disabled={uploadingMain}
            inputRef={mainInput}
            onFile={(f) => void uploadMain(f)}
            onPick={() => mainInput.current?.click()}
            onClear={clearMain}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/90">Gallery (max 4)</p>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {([1, 2, 3, 4] as const).map((slot) => (
                <AdminDropSlot
                  key={slot}
                  label={`Image ${slot}`}
                  previewUrl={slotUrl(slot)}
                  uploading={uploadingSlot === slot}
                  disabled={uploadingSlot !== null}
                  inputRef={galleryRefs[slot - 1]}
                  onFile={(f) => void uploadGallery(slot, f)}
                  onPick={() => galleryRefs[slot - 1].current?.click()}
                  onClear={() => clearGallery(slot)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
