"use client";

import { useEffect, useState } from "react";

import DsbGuideViewer from "@/components/dsb/DsbGuideViewer";
import type { TocItem } from "@/lib/dsbGuideMarkdown";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";

type PreviewPayload = {
  success: boolean;
  slug?: DsbGuideSlug;
  markdown?: string;
  toc?: TocItem[];
  error?: string;
};

export default function DsbPreviewClient() {
  const [activeGuide, setActiveGuide] = useState<DsbGuideSlug>("eu");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [activeGuide]);

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
