"use client";

import { FormEvent, useState } from "react";

const POST_EMAIL = "post@arbeidmatch.no";

export default function TalentNetworkJoinForm() {
  const [email, setEmail] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed.includes("@")) return;
    const subject = encodeURIComponent("Join talent network");
    const body = encodeURIComponent(
      `Email: ${trimmed}\n\nI would like to join the talent network for work in Norway.`,
    );
    window.location.href = `mailto:${POST_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-8 flex w-full max-w-lg flex-col gap-3 sm:max-w-xl sm:flex-row sm:items-stretch sm:justify-center"
    >
      <label className="sr-only" htmlFor="talent-email">
        Email
      </label>
      <input
        id="talent-email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="Your email"
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        className="min-h-[48px] w-full rounded-lg border border-[rgba(201,168,76,0.25)] bg-[rgba(255,255,255,0.05)] px-4 text-[15px] text-white placeholder:text-white/40 focus:border-[#C9A84C] focus:outline-none focus:ring-0 sm:min-w-0 sm:flex-1"
      />
      <button
        type="submit"
        className="btn-gold-premium inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-lg bg-[#C9A84C] px-6 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] sm:w-auto"
      >
        Join our talent network →
      </button>
    </form>
  );
}
