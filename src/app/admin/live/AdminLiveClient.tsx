"use client";

import { useState } from "react";

export default function AdminLiveClient() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [message, setMessage] = useState("");

  const submit = async (live: boolean) => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/tiktok-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, live }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.error ?? "Request failed.");
        return;
      }
      setStatus("ok");
      setMessage(live ? "TikTok live is ON." : "TikTok live is OFF.");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-navy">
      <h1 className="text-2xl font-bold">TikTok live</h1>
      <p className="mt-2 text-sm text-text-secondary">Toggle the public banner on the home page.</p>

      <div className="mt-8 space-y-4">
        <label className="block text-sm text-navy">
          Password
          <input
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() => void submit(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Go Live
          </button>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={() => void submit(false)}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-surface disabled:opacity-50"
          >
            End Live
          </button>
        </div>
      </div>

      {status === "ok" && (
        <p className="mt-4 text-sm text-green-700" role="status">
          {message}
        </p>
      )}
      {status === "error" && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
