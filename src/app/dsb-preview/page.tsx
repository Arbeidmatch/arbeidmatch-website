"use client";

import { useEffect, useState } from "react";

import DsbGuideViewer from "@/components/dsb/DsbGuideViewer";
import type { TocItem } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

const PREVIEW_PASSWORD = process.env.NEXT_PUBLIC_PREVIEW_PASSWORD || "AM@DSB#Preview!2026$";

type PreviewPayload = {
  success: boolean;
  slug?: DsbGuideSlug;
  markdown?: string;
  toc?: TocItem[];
  error?: string;
};

export default function DsbPreviewPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [activeGuide, setActiveGuide] = useState<DsbGuideSlug>("eu");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!unlocked) return;
    setLoading(true);
    setError("");
    fetch(`/api/dsb-preview?slug=${activeGuide}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json()) as PreviewPayload;
        if (!res.ok || !data.success || !data.markdown || !data.toc) {
          throw new Error(data.error || "Could not load guide preview.");
        }
        setMarkdown(data.markdown);
        setToc(data.toc);
      })
      .catch(() => {
        setError("Could not load guide content.");
      })
      .finally(() => setLoading(false));
  }, [unlocked, activeGuide]);

  const handleUnlock = () => {
    if (input === PREVIEW_PASSWORD) {
      setUnlocked(true);
      setError("");
      return;
    }
    setError("Wrong password");
  };

  if (!unlocked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f1923",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
          padding: 24,
        }}
      >
        <p style={{ color: "#C9A84C", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          INTERNAL PREVIEW
        </p>
        <h1 style={{ color: "white", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>DSB Guide Preview</h1>
        <input
          type="password"
          placeholder="Enter preview password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "12px 20px",
            color: "white",
            fontSize: 15,
            width: "100%",
            maxWidth: 320,
            outline: "none",
          }}
        />
        {error ? <p style={{ color: "#E24B4A", fontSize: 13 }}>{error}</p> : null}
        <button
          onClick={handleUnlock}
          style={{
            background: "#C9A84C",
            color: "#0f1923",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 32px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          Unlock Preview
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#0f1923", minHeight: "100vh", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <button
            onClick={() => setActiveGuide("eu")}
            style={{
              background: activeGuide === "eu" ? "#C9A84C" : "rgba(255,255,255,0.06)",
              color: activeGuide === "eu" ? "#0f1923" : "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            EU/EEA Guide
          </button>
          <button
            onClick={() => setActiveGuide("non-eu")}
            style={{
              background: activeGuide === "non-eu" ? "#C9A84C" : "rgba(255,255,255,0.06)",
              color: activeGuide === "non-eu" ? "#0f1923" : "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Non-EU Guide
          </button>
        </div>

        {loading ? <p style={{ color: "white" }}>Loading guide content...</p> : null}
        {error ? <p style={{ color: "#E24B4A" }}>{error}</p> : null}
        {!loading && !error && markdown ? (
          <DsbGuideViewer
            markdown={markdown}
            toc={toc}
            email="internal-preview@arbeidmatch.no"
            expiresAtIso="2099-12-31T23:59:59.000Z"
            guideSlug={activeGuide}
          />
        ) : null}
      </div>
    </div>
  );
}
