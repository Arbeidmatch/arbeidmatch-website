"use client";

import { Share2 } from "lucide-react";
import { useCallback, useState } from "react";

export default function ShareJobButton({ jobUrl, jobTitle }: { jobUrl: string; jobTitle: string }) {
  const [label, setLabel] = useState("Share");

  const onShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: jobTitle, url: jobUrl });
        setLabel("Shared");
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(jobUrl);
      setLabel("Link copied");
    } catch {
      setLabel("Copy blocked");
    }
  }, [jobTitle, jobUrl]);

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      className="btn-outline-premium inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/85"
    >
      <Share2 className="h-4 w-4 text-[#C9A84C]" aria-hidden />
      {label}
    </button>
  );
}
