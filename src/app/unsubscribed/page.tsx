"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribedContent() {
  const params = useSearchParams();
  const success = params.get("success") === "true";
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D1B2A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 24 }}>{success ? "✓" : "✕"}</div>
        <h1 style={{ color: "#ffffff", fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>
          {success ? "You have been unsubscribed." : "Invalid or expired link."}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 32 }}>
          {success
            ? "You will no longer receive marketing emails from ArbeidMatch."
            : "This unsubscribe link is invalid or has already been used."}
        </p>
        <Link href="/" style={{ color: "#C9A84C", fontSize: 14, textDecoration: "none" }}>
          ← Back to ArbeidMatch
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribedPage() {
  return (
    <Suspense>
      <UnsubscribedContent />
    </Suspense>
  );
}
