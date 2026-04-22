"use client";

import { useState } from "react";

const GOLD = "#C9A84C";
const NAVY = "#0B1424";

export default function JobsComingSoonClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const website = String(fd.get("website") || "");

    try {
      const res = await fetch("/api/jobs-launch-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage("You are on the list. We will email you when jobs go live.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden"
      style={{
        background: `linear-gradient(165deg, ${NAVY} 0%, #0f1f38 42%, #0a1222 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, ${GOLD} 0, transparent 45%), radial-gradient(circle at 80% 80%, ${GOLD} 0, transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[1px] w-[min(90%,720px)] -translate-x-1/2"
        style={{
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-6 py-20 text-center sm:px-8">
        <p
          className="mb-4 text-[11px] font-semibold uppercase tracking-[0.35em]"
          style={{ color: GOLD }}
        >
          ArbeidMatch
        </p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">Jobs Coming Soon</h1>
        <p className="mt-5 text-lg leading-relaxed text-white/75 sm:text-xl">
          We&apos;re preparing exciting opportunities for you
        </p>

        <form onSubmit={onSubmit} className="mt-12 w-full text-left">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <label htmlFor="jobs-notify-email" className="mb-2 block text-sm font-medium text-white/85">
            Get notified when we launch
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              id="jobs-notify-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="you@example.com"
              className="min-h-[48px] flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-white placeholder:text-white/35 outline-none ring-0 transition focus:border-[#C9A84C] focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.2)]"
              disabled={status === "loading"}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="min-h-[48px] shrink-0 rounded-lg px-8 text-sm font-semibold uppercase tracking-wide text-[#0B1424] transition hover:brightness-110 disabled:opacity-60"
              style={{ background: `linear-gradient(180deg, #e4c56a 0%, ${GOLD} 45%, #a88a3a 100%)` }}
            >
              {status === "loading" ? "Sending…" : "Notify Me"}
            </button>
          </div>

          {message ? (
            <p
              className={`mt-4 text-sm ${status === "success" ? "text-emerald-300/90" : "text-red-300/90"}`}
              role="status"
            >
              {message}
            </p>
          ) : null}
        </form>

        <p className="mt-14 text-xs text-white/40">Norwegian blue-collar roles, curated for you.</p>
      </div>
    </div>
  );
}
