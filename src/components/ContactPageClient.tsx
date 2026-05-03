"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Clock, Mail, MapPin, Shield } from "lucide-react";

import ScrollReveal from "@/components/ScrollReveal";
import { trackEvent } from "@/lib/analytics";

const inputClass =
  "w-full rounded-lg border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-[15px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[#C9A84C] focus:outline-none";

export default function ContactPageClient() {
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      need: "Website contact",
      message: String(formData.get("message") || "").trim(),
      website: String(formData.get("website") || ""),
    };

    setStatus("submitting");
    setErrorMessage("");
    setSubmitted(false);

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
    } catch (error) {
      setSubmitted(false);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      return;
    }

    setStatus("idle");
  };

  return (
    <section className="bg-[#0D1B2A] py-14 text-white md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <ScrollReveal variant="fadeUp">
          <header className="max-w-3xl">
            <h1 className="am-h1 font-display font-extrabold tracking-[-0.03em] text-white">Get in touch</h1>
            <p className="mt-4 text-base leading-relaxed text-[rgba(255,255,255,0.65)] md:text-lg">
              Have a question or ready to find workers for your business? We respond within 1 business day.
            </p>
          </header>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          <ScrollReveal variant="fadeUp">
            <div>
              <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[rgba(255,255,255,0.03)] p-6 md:p-8"
              >
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <div className="space-y-4">
                  <label className="block text-[13px] font-medium text-[rgba(255,255,255,0.65)]">
                    Name <span className="text-[#C9A84C]">*</span>
                    <input required name="name" type="text" autoComplete="name" className={`${inputClass} mt-1.5`} placeholder="Your name" />
                  </label>
                  <label className="block text-[13px] font-medium text-[rgba(255,255,255,0.65)]">
                    Company
                    <input name="company" type="text" autoComplete="organization" className={`${inputClass} mt-1.5`} placeholder="Company name (optional)" />
                  </label>
                  <label className="block text-[13px] font-medium text-[rgba(255,255,255,0.65)]">
                    Email <span className="text-[#C9A84C]">*</span>
                    <input required name="email" type="email" autoComplete="email" className={`${inputClass} mt-1.5`} placeholder="you@example.com" />
                  </label>
                  <label className="block text-[13px] font-medium text-[rgba(255,255,255,0.65)]">
                    Message <span className="text-[#C9A84C]">*</span>
                    <textarea
                      required
                      name="message"
                      rows={5}
                      className={`${inputClass} mt-1.5 min-h-[120px] resize-y`}
                      placeholder="How can we help?"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="mt-6 w-full rounded-lg bg-[#C9A84C] py-3.5 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:opacity-60"
                >
                  {status === "submitting" ? "Sending…" : "Send message"}
                </button>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-[rgba(255,255,255,0.45)]">
                  By sending this form you agree to our{" "}
                  <Link href="/privacy" className="text-[#C9A84C] underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>

                {submitted ? (
                  <p className="mt-5 rounded-lg border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.1)] px-4 py-3 text-center text-sm text-[rgba(255,255,255,0.9)]" role="status">
                    Thank you! We&apos;ll be in touch shortly.
                  </p>
                ) : null}
                {status === "error" ? (
                  <p className="mt-5 rounded-lg border border-[rgba(226,75,74,0.45)] bg-[rgba(226,75,74,0.08)] px-4 py-3 text-center text-sm text-[#f0a8a8]" role="alert">
                    {errorMessage}
                  </p>
                ) : null}
              </form>

              <div className="mt-8 flex flex-col gap-3 rounded-xl border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.5)]">
                  <Shield className="h-4 w-4 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                  <span>Org.nr: 935 667 089 MVA</span>
                </p>
                <p className="text-sm text-[rgba(255,255,255,0.5)]">Registered in Norway</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp">
            <aside className="space-y-8 lg:pl-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.45)]">Email</p>
                <a
                  href="mailto:support@arbeidmatch.no"
                  className="mt-2 inline-flex items-center gap-2 text-lg font-medium text-[#C9A84C] transition-colors hover:text-[#d8bc6a]"
                >
                  <Mail className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                  support@arbeidmatch.no
                </a>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
                <p className="flex items-start gap-2 text-[15px] leading-relaxed text-[rgba(255,255,255,0.55)]">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                  <span>
                    <span className="font-medium text-[rgba(255,255,255,0.75)]">Response time:</span> within 1 business day
                  </span>
                </p>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgba(255,255,255,0.45)]">Address</p>
                <p className="mt-2 flex items-start gap-2 text-[15px] leading-relaxed text-[rgba(255,255,255,0.55)]">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                  <span>Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</span>
                </p>
              </div>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-8">
                <p className="text-[15px] text-[rgba(255,255,255,0.55)]">Based in Trondheim, Norway</p>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
