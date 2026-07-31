"use client";

import { useEffect, useState } from "react";
import { CvPreview } from "@/app/cv-gen/_components/CvPreview";
import { CHANNEL_NAME, DRAFT_KEY, emptyDraft, loadDraft, type DraftMessage } from "@/lib/cv/draft";
import type { CvDocument } from "@/lib/cv/schema";

/**
 * Read only preview, opened in its own tab from the mobile bar so the form is never
 * unmounted. Updates arrive over BroadcastChannel, with the storage event as a fallback
 * for browsers where the channel is unavailable.
 */
export function PreviewTab() {
  const [doc, setDoc] = useState<CvDocument>(() => emptyDraft());
  const [live, setLive] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [wiped, setWiped] = useState(false);

  useEffect(() => {
    const stored = loadDraft();
    // localStorage is unreadable until mount, so the first paint shows an empty CV.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setDoc(stored);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<DraftMessage>) => {
        if (event.data.type === "wipe") {
          setWiped(true);
          setDoc(emptyDraft());
          return;
        }
        if (event.data.type === "draft" && event.data.doc) {
          setDoc(event.data.doc);
          setLive(true);
        }
      };
      setLive(true);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== DRAFT_KEY) return;
      if (!event.newValue) {
        setWiped(true);
        setDoc(emptyDraft());
        return;
      }
      try {
        setDoc(JSON.parse(event.newValue) as CvDocument);
        setLive(true);
      } catch {
        setLive(false);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => {
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (wiped) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-[#0D1B2A]">Your data has been deleted</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#55616D]">
          Nothing was saved. You can close this tab.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#E9ECF0]">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E2E5EA] bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: live ? "#1D9E75" : "#B26A00" }}
            aria-hidden="true"
          />
          <span className="text-[13px] font-semibold text-[#55616D]">
            {live ? "Live" : "Reconnecting"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(0.6, value - 0.15))}
            className="rounded border border-[#E2E5EA] px-2.5 py-1 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            aria-label="Zoom out"
          >
            -
          </button>
          <span className="text-[13px] text-[#55616D]">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(1.8, value + 0.15))}
            className="rounded border border-[#E2E5EA] px-2.5 py-1 text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.opener) {
                window.opener.focus();
                window.close();
              } else {
                window.location.href = "/cv-gen";
              }
            }}
            className="rounded bg-[#0D1B2A] px-3 py-1.5 text-[13px] font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
          >
            Back to editor
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl p-4">
        <CvPreview doc={doc} scale={zoom} />
        <p className="mt-3 text-center text-[13px] text-[#55616D]">
          This tab only shows your CV. Keep editing in the other tab and it updates here.
        </p>
      </div>
    </main>
  );
}
