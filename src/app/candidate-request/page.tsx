"use client";

import { FormEvent, useEffect, useState } from "react";

const COOLDOWN_MS = 60_000;
const COOLDOWN_KEY = "arbeidmatch-candidate-request-cooldown";

export default function CandidateRequestPage() {
  const [email, setEmail] = useState("");
  const [eligibility, setEligibility] = useState<"yes" | "no" | null>(null);
  const [gdpr, setGdpr] = useState(false);
  const [passport, setPassport] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const until = Number(window.localStorage.getItem(COOLDOWN_KEY) || 0);
      setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    };
    refresh();
    const timer = window.setInterval(refresh, 500);
    return () => window.clearInterval(timer);
  }, []);

  async function submit() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/candidate-join-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, gdpr_consent: gdpr, eu_eea_passport_confirmed: passport }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error || "Please try again.");
    window.localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
    setRemaining(60);
    setConfirmOpen(false);
    setSent(true);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (remaining > 0) return;
    if (!gdpr || !passport) return setError("Please complete both confirmations.");
    setError("");
    setConfirmOpen(true);
  }

  const counter = `You can send another request in ${remaining}s.`;
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#0D1B2A] px-6 py-14 text-white">
      <form onSubmit={onSubmit} className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#C9A84C]">Candidate profile request</p>
        <h1 className="mt-3 text-3xl font-bold">Request to create your profile</h1>
        {eligibility === null ? <section className="mt-6"><h2 className="text-lg font-semibold">Do you hold a valid EU/EEA passport?</h2><p className="mt-2 text-sm text-white/70">We can accept candidate profiles only from EU/EEA passport holders.</p><div className="mt-5 flex gap-3"><button type="button" onClick={() => setEligibility("yes")} className="rounded-lg bg-[#C9A84C] px-5 py-3 font-semibold text-[#0D1B2A]">Yes, I do</button><button type="button" onClick={() => setEligibility("no")} className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white">No, I do not</button></div></section> : null}
        {eligibility === "no" ? <section className="mt-6 rounded-lg border border-white/10 bg-black/10 p-5"><h2 className="text-lg font-semibold">Profile creation is not available</h2><p className="mt-2 text-sm leading-relaxed text-white/70">At this time, ArbeidMatch accepts candidate profiles only from people who hold a valid EU/EEA passport. No profile request or Recman link has been sent.</p><button type="button" onClick={() => setEligibility(null)} className="mt-4 text-sm font-semibold text-[#C9A84C]">Go back</button></section> : null}
        {eligibility === "yes" ? <><p className="mt-3 text-white/70">Confirm your email address and GDPR consent before we send your continuation link.</p>{sent ? <p className="mt-5 rounded-lg border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-3 text-sm text-white/85">Check your email for the Recman profile link. {remaining > 0 ? counter : "You may send another request if you entered the wrong email."}</p> : null}<label className="mt-6 block text-sm font-semibold">Email address<input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-white/20 bg-[#0D1B2A] px-3 py-3 text-white" /></label><label className="mt-5 flex gap-3 text-sm text-white/80"><input type="checkbox" checked={gdpr} onChange={(e) => setGdpr(e.target.checked)} />I consent to ArbeidMatch processing this request and my email in accordance with GDPR.</label><label className="mt-4 flex gap-3 text-sm text-white/80"><input type="checkbox" checked={passport} onChange={(e) => setPassport(e.target.checked)} />I confirm that I hold a valid EU/EEA passport.</label><p className="mt-4 text-xs leading-relaxed text-white/50">When you submit, your email address and these confirmations are sent to ArbeidMatch and recorded as your consent, so we can create your candidate profile and contact you about opportunities. See our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C9A84C] underline underline-offset-2 hover:opacity-80">Privacy Policy</a> for how we process your data.</p>{error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}<button disabled={busy || remaining > 0} className="mt-7 rounded-lg bg-[#C9A84C] px-5 py-3 font-semibold text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-55">{busy ? "Sending..." : remaining > 0 ? counter : sent ? "Send another request" : "Request profile creation"}</button></> : null}
      </form>
      {confirmOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6"><div className="max-w-md rounded-2xl bg-[#0D1B2A] p-6"><h2 className="text-xl font-bold">Final passport confirmation</h2><p className="mt-3 text-white/75">Only candidates with a valid EU/EEA passport can be accepted. If this cannot be confirmed, the profile will not be accepted in our recruitment system.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg border border-white/20 px-4 py-2">Go back</button><button type="button" onClick={submit} disabled={busy} className="rounded-lg bg-[#C9A84C] px-4 py-2 font-semibold text-[#0D1B2A]">I confirm</button></div></div></div> : null}
    </main>
  );
}
