"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { TRADES } from "@/lib/trades";

export default function JobNewsletterForm() {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), trade: form.get("trade"), notifyConsent: form.get("notifyConsent") === "on", dataConsent: form.get("dataConsent") === "on", website: form.get("website") }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error("signup_failed");
      setSaved(true);
    } catch {
      setError("We could not confirm your signup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (saved) return <div role="status" className="mt-8 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/10 p-6"><h3 className="text-lg font-semibold text-white">You are signed up for job alerts.</h3><p className="mt-3 text-sm leading-relaxed text-white/75">We will email you when we publish new jobs in your selected trade. You can unsubscribe using the link in each job alert.</p><Link href="/jobs" className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#C9A84C]">Browse current jobs →</Link></div>;

  return <form onSubmit={submit} className="mt-7 space-y-5" aria-label="Job newsletter signup" aria-busy={busy}>
    <div><label htmlFor={`${id}-email`} className="mb-2 block text-sm font-medium text-white">Your email</label><input id={`${id}-email`} name="email" type="email" autoComplete="email" maxLength={200} required className="min-h-[48px] w-full rounded-lg border border-white/25 bg-white/5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" placeholder="you@example.com" /></div>
    <div><label htmlFor={`${id}-trade`} className="mb-2 block text-sm font-medium text-white">Which trade interests you?</label><select id={`${id}-trade`} name="trade" required defaultValue="" className="min-h-[48px] w-full rounded-lg border border-white/25 bg-[#172838] px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"><option value="" disabled>Choose your trade</option>{TRADES.map((trade) => <option key={trade.name} value={trade.name}>{trade.name}</option>)}</select></div>
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden"><label htmlFor={`${id}-website`}>Leave empty</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" /></div>
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/80"><input name="notifyConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#C9A84C]" /><span>I want emails from ArbeidMatch about new jobs in my selected trade. I can unsubscribe at any time.</span></label>
    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/70"><input name="dataConsent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#C9A84C]" /><span>I agree that ArbeidMatch stores my email and trade to provide these alerts. <Link href="/privacy" className="text-[#C9A84C] underline">Privacy policy</Link>.</span></label>
    {error && <p role="alert" className="text-sm leading-relaxed text-red-200">{error}</p>}
    <button type="submit" disabled={busy} className="inline-flex min-h-[50px] w-full items-center justify-center rounded-lg bg-[#C9A84C] px-6 py-3 font-semibold text-[#0D1B2A] hover:bg-[#b8953f] disabled:cursor-wait disabled:opacity-60">{busy ? "Saving..." : "Email me new jobs"}</button>
    <p className="text-xs leading-relaxed text-white/60">Free job alerts. No profile or CV needed. This signup is not a job application.</p>
  </form>;
}
