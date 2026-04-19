"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PreviewUnlockForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/dsb-preview/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, honeypot: "" }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setError(data.error || "Unlock failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Unlock failed.");
    } finally {
      setLoading(false);
    }
  };

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
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 320 }}>
        <input
          type="password"
          placeholder="Enter preview password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            padding: "12px 20px",
            color: "white",
            fontSize: 15,
            width: "100%",
            outline: "none",
          }}
        />
        <input
          type="text"
          name="company_website"
          autoComplete="off"
          tabIndex={-1}
          aria-hidden
          style={{ position: "absolute", left: "-10000px", opacity: 0 }}
          onChange={() => undefined}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            background: "#C9A84C",
            color: "#0f1923",
            fontWeight: 700,
            fontSize: 14,
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Unlocking..." : "Unlock Preview"}
        </button>
      </form>
      {error ? <p style={{ color: "#E24B4A", fontSize: 13 }}>{error}</p> : null}
    </div>
  );
}
