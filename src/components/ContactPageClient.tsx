"use client";

import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, MapPin } from "lucide-react";
import ScrollReveal from "@/components/ScrollReveal";
import { trackEvent } from "@/lib/analytics";

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
  "w-full rounded-lg border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.35)] focus:outline-none";
const inputInlineStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(201,168,76,0.15)",
  color: "white",
  borderRadius: 8,
  padding: "12px 16px",
};

const needSelectClass =
  "w-full rounded-lg border border-[rgba(201,168,76,0.4)] bg-[#eef1f5] px-4 py-3 text-[#0D1B2A] focus:border-[#C9A84C] focus:outline-none transition-[border-color,background-color] duration-200 hover:border-[rgba(201,168,76,0.65)] hover:bg-white relative z-[1000] cursor-pointer";
const needSelectInlineStyle: CSSProperties = {
  backgroundColor: "#eef1f5",
  border: "1px solid rgba(201,168,76,0.4)",
  color: "#0D1B2A",
  borderRadius: 8,
  padding: "12px 16px",
};

const optionStyle: CSSProperties = {
  backgroundColor: "#0f1923",
  color: "#ffffff",
  padding: "10px 12px",
};

export default function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [need, setNeed] = useState("Qualified workers");
  const [needOther, setNeedOther] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      company: String(formData.get("company") || ""),
      email: String(formData.get("email") || ""),
      need: need === "Other" ? needOther.trim() : need,
      message: String(formData.get("message") || ""),
      website: String(formData.get("website") || ""),
    };

    if (need === "Other" && !needOther.trim()) {
      setStatus("error");
      setErrorMessage("Please specify what you need.");
      return;
    }

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
      trackEvent("contact_form_submitted");
      form.reset();
      setNeed("Qualified workers");
      setNeedOther("");
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
        <div className="mb-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-white/70">
          Looking for a job?{" "}
          <a
            href="https://jobs.arbeidmatch.no"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold"
          >
            Browse open jobs →
          </a>
        </div>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 md:divide-x md:divide-[rgba(201,168,76,0.08)]">
          <ScrollReveal variant="fadeUp">
          <aside className="text-white">
            <div className="mb-4 h-[2px] w-10 bg-[#C9A84C]" aria-hidden />
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
                      className="rounded-[20px] border border-[rgba(201,168,76,0.3)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs font-medium text-[rgba(255,255,255,0.7)]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" className="overflow-visible">
          <form
            onSubmit={handleSubmit}
            className="card-premium overflow-visible rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-7 shadow-[var(--shadow-card)] md:ml-8 md:p-10"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: 16,
            }}
          >
            <h2 className="text-2xl font-bold text-white">Send us a message</h2>
            <p className="mt-2 text-sm text-white/70">
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
                <label className="form-label-premium text-[13px] text-white/70">
                  Your name
                  <input
                    required
                    name="name"
                    className={inputClass}
                    placeholder="Your name"
                    style={inputInlineStyle}
                  />
                </label>
                <label className="form-label-premium text-[13px] text-white/70">
                  Company
                  <input
                    required
                    name="company"
                    className={inputClass}
                    placeholder="Company"
                    style={inputInlineStyle}
                  />
                </label>
              </div>
              <label className="form-label-premium text-[13px] text-white/70">
                Work email
                <input
                  required
                  type="email"
                  name="email"
                  className={inputClass}
                  placeholder="name@company.com"
                  style={inputInlineStyle}
                />
              </label>
              <label className="form-label-premium relative z-[1000] overflow-visible text-[13px] text-white/70">
                I need
                <select
                  name="need"
                  className={needSelectClass}
                  value={need}
                  onChange={(event) => {
                    setNeed(event.target.value);
                    if (event.target.value !== "Other") {
                      setNeedOther("");
                    }
                  }}
                  style={needSelectInlineStyle}
                >
                  <option value="Qualified workers" style={optionStyle}>
                    Qualified workers
                  </option>
                  <option value="Skilled tradespeople" style={optionStyle}>
                    Skilled tradespeople
                  </option>
                  <option value="Engineers & Technical" style={optionStyle}>
                    Engineers & Technical
                  </option>
                  <option value="Healthcare staff" style={optionStyle}>
                    Healthcare staff
                  </option>
                  <option value="Construction workers" style={optionStyle}>
                    Construction workers
                  </option>
                  <option value="Support" style={optionStyle}>
                    Support
                  </option>
                  <option value="Other" style={optionStyle}>
                    Other
                  </option>
                </select>
              </label>
              {need === "Other" && (
                <label className="form-label-premium text-[13px] text-white/70">
                  Please specify
                  <input
                    required
                    name="needOther"
                    className={inputClass}
                    value={needOther}
                    onChange={(event) => setNeedOther(event.target.value)}
                    style={inputInlineStyle}
                  />
                </label>
              )}
              <label className="form-label-premium text-[13px] text-white/70">
                Message
                <textarea
                  name="message"
                  rows={5}
                  className={`${inputClass} min-h-[100px]`}
                  placeholder="Tell us about your needs"
                  style={inputInlineStyle}
                />
              </label>
              <button
                type="submit"
                disabled={status === "submitting"}
                className="btn-micro btn-gold-shine w-full rounded-[10px] bg-[#C9A84C] py-[14px] font-bold text-[#0D1B2A] transition-colors hover:bg-[#d8bc6a]"
                style={{
                  background: "#C9A84C",
                  color: "#0D1B2A",
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "14px",
                  width: "100%",
                }}
              >
                {status === "submitting" ? "Sending..." : "Send message →"}
              </button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                By submitting this form you agree to our{" "}
                <Link href="/privacy" className="text-[#C9A84C]">
                  Privacy Policy
                </Link>
                .
              </p>
              {submitted && (
                <div className="rounded-md border border-gold/40 bg-gold/10 p-4 text-white/80">
                  Thank you! We will typically be in touch within 1 to 2 business days.
                </div>
              )}
              {status === "error" && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                  {errorMessage}
                </div>
              )}
            </div>
          </form>
          </ScrollReveal>
        </div>

        <ScrollReveal variant="fadeUp">
        <div className="mt-14 border-t border-[rgba(201,168,76,0.08)] pt-12">
          <h2 className="heading-premium-xl text-center text-2xl text-white md:text-3xl">Join Our Community</h2>
          <div className="mx-auto mt-3 h-[2px] w-8 bg-[#C9A84C]" aria-hidden />
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-white/70 md:text-base">
            Follow us for job tips, updates and live sessions
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <a
              href="https://www.facebook.com/arbeidmatchNO"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-5 transition duration-200 hover:border-[rgba(201,168,76,0.35)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-white">
                  <IconFacebook className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-white">Facebook</span>
              </div>
              <span className="mt-5 inline-flex w-fit rounded-lg border border-[rgba(201,168,76,0.3)] bg-transparent px-5 py-2 text-sm font-medium text-white transition group-hover:border-[#C9A84C]">
                Follow
              </span>
            </a>
            <a
              href="https://www.tiktok.com/@arbeidmatch"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-5 transition duration-200 hover:border-[rgba(201,168,76,0.35)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                  <IconTikTok className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-white">TikTok</span>
              </div>
              <span className="mt-5 inline-flex w-fit rounded-lg border border-[rgba(201,168,76,0.3)] bg-transparent px-5 py-2 text-sm font-medium text-white transition group-hover:border-[#C9A84C]">
                Join
              </span>
            </a>
            <a
              href="https://www.youtube.com/@arbeidmatch"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-5 transition duration-200 hover:border-[rgba(201,168,76,0.35)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] text-white">
                  <IconYoutube className="h-6 w-6" />
                </span>
                <span className="text-lg font-semibold text-white">YouTube</span>
              </div>
              <span className="mt-5 inline-flex w-fit rounded-lg border border-[rgba(201,168,76,0.3)] bg-transparent px-5 py-2 text-sm font-medium text-white transition group-hover:border-[#C9A84C]">
                Subscribe
              </span>
            </a>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
