"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AvailabilityClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const disabled = useMemo(() => !token, [token]);

  async function selectMonths(months: number) {
    if (!token) return;
    setBusy(months);
    setMessage("");
    try {
      const res = await fetch("/api/candidates/availability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, months }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setMessage(json.error ?? "Could not update your availability.");
        return;
      }
      setMessage("Thanks. Your availability has been updated.");
    } catch {
      setMessage("Could not update your availability.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1B2A] px-6 py-12 text-white">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#C9A84C]/25 bg-white/[0.04] p-8">
        <h1 className="text-2xl font-bold text-white">Update your availability</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          If you are not available right now, choose when you want your profile to become visible again.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((months) => (
            <button
              key={months}
              type="button"
              disabled={disabled || busy !== null}
              onClick={() => void selectMonths(months)}
              className="rounded-xl bg-[#C9A84C] px-4 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === months ? "Saving..." : `${months} month${months > 1 ? "s" : ""}`}
            </button>
          ))}
        </div>
        {message ? <p className="mt-5 text-sm text-white/85">{message}</p> : null}
        {!token ? <p className="mt-4 text-sm text-red-300">Missing token. Please open the link from your email.</p> : null}
      </div>
    </main>
  );
}
