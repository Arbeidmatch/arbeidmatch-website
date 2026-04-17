"use client";

import { FormEvent, useState } from "react";
import { Building2, Mail, MapPin } from "lucide-react";

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.08 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-md border border-[#E8E8E5] bg-[#F7F7F5] px-4 py-3 text-navy focus:border-[#C9A84C] focus:outline-none focus:ring-0";

export default function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      company: String(formData.get("company") || ""),
      email: String(formData.get("email") || ""),
      need: String(formData.get("need") || ""),
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    };

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed");
      }
      setSubmitted(true);
      form.reset();
    } catch (error) {
      setSubmitted(false);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      return;
    }

    setStatus("idle");
  };

  return (
    <section className="bg-[#0D1B2A] py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <div className="mb-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-navy">
          Looking for a job?{" "}
          <a href="/score" className="font-semibold text-gold">
            Let us guide you in 2 minutes →
          </a>
        </div>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <aside className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">Get in touch</p>
            <h1 className="mt-3 text-[28px] font-bold leading-tight md:text-5xl">
              Let&apos;s find your next <em className="not-italic text-[#C9A84C]">great hire.</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/75 md:text-base">
              Tell us what you need. We&apos;ll respond with qualified EU/EEA candidates matched to your
              role, culture, and timeline.
            </p>

            <div className="mt-8 space-y-5">
              <div className="border-t border-white/10 pt-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Email</p>
                <p className="mt-2 flex items-center gap-2 text-sm md:text-base">
                  <Mail size={16} className="text-[#C9A84C]" />
                  <a className="text-[#C9A84C] hover:underline" href="mailto:post@arbeidmatch.no">
                    post@arbeidmatch.no
                  </a>
                </p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Office</p>
                <p className="mt-2 flex items-start gap-2 text-sm text-white/85 md:text-base">
                  <MapPin size={16} className="mt-0.5 text-[#C9A84C]" />
                  <span>Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</span>
                </p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Registration</p>
                <p className="mt-2 flex items-start gap-2 text-sm text-white/85 md:text-base">
                  <Building2 size={16} className="mt-0.5 text-[#C9A84C]" />
                  <span>Org.nr. 935 667 089 (MVA) / ArbeidMatch Norge AS</span>
                </p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">Why us</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "EU/EEA specialists",
                    "Pre-screened talent",
                    "Norwegian compliance",
                    "Fast turnaround",
                  ].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-[#C9A84C]/45 bg-[#C9A84C]/10 px-3 py-1 text-xs font-medium text-[#C9A84C]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-7 md:p-10">
            <h2 className="text-2xl font-bold text-navy">Send us a message</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Employers and partners only. Job seekers, please complete the work readiness check first.
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-navy">
                  Your name
                  <input required name="name" className={inputClass} />
                </label>
                <label className="text-sm text-navy">
                  Company
                  <input required name="company" className={inputClass} />
                </label>
              </div>
              <label className="text-sm text-navy">
                Work email
                <input required type="email" name="email" className={inputClass} />
              </label>
              <label className="text-sm text-navy">
                I need
                <select name="need" className={inputClass}>
                  <option>Qualified workers</option>
                  <option>Skilled tradespeople</option>
                  <option>Engineers & Technical</option>
                  <option>Healthcare staff</option>
                  <option>Construction workers</option>
                  <option>Support</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="text-sm text-navy">
                Message
                <textarea name="message" rows={5} className={`${inputClass} min-h-[100px]`} />
              </label>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-md bg-[#0D1B2A] py-3 font-medium text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0D1B2A]"
              >
                {status === "submitting" ? "Sending..." : "Send message →"}
              </button>
              <p className="text-xs text-text-secondary">
                By sending, you agree to our Privacy Policy. No spam, ever.
              </p>
              {submitted && (
                <div className="rounded-md border border-gold/40 bg-gold/10 p-4 text-navy">
                  Thank you! We&apos;ll be in touch within 24 hours.
                </div>
              )}
              {status === "error" && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                  {errorMessage}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="mt-14 border-t border-white/[0.07] pt-12">
          <h2 className="text-center text-2xl font-bold text-white md:text-3xl">Join Our Community</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70 md:text-base">
            Follow us for job tips, updates and live sessions
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <a
              href="https://www.facebook.com/arbeidmatch"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-[#1877F2]/40 bg-[#1877F2]/10 p-5 transition hover:border-[#1877F2] hover:bg-[#1877F2]/15"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1877F2] text-white">
                  <IconFacebook className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-white">Facebook</span>
              </div>
              <span className="mt-5 inline-flex w-fit rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white transition group-hover:bg-[#1666d4]">
                Follow
              </span>
            </a>
            <a
              href="https://www.tiktok.com/@arbeidmatch"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-red-500/45 bg-black/60 p-5 transition hover:border-red-500 hover:bg-black/80"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                  <IconTikTok className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-white">TikTok</span>
              </div>
              <span className="mt-5 inline-flex w-fit rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-red-700">
                Join
              </span>
            </a>
            <a
              href="https://www.youtube.com/@arbeidmatch"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-[#FF0000]/45 bg-[#FF0000]/10 p-5 transition hover:border-[#FF0000] hover:bg-[#FF0000]/15"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF0000] text-white">
                  <IconYoutube className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-white">YouTube</span>
              </div>
              <span className="mt-5 inline-flex w-fit rounded-md bg-[#FF0000] px-4 py-2 text-sm font-medium text-white transition group-hover:bg-[#e60000]">
                Subscribe
              </span>
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-white/[0.07] pt-6">
          <div className="grid gap-5 text-center sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-[#C9A84C]">500+</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/55">Candidates placed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#C9A84C]">12</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/55">EU/EEA countries covered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#C9A84C]">48h</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/55">Average first match</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
