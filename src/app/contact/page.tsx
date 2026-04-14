"use client";

import { FormEvent, useState } from "react";
import { Building2, Mail, MapPin } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-[#E8E8E5] bg-[#F7F7F5] px-4 py-3 text-navy focus:border-[#C9A84C] focus:outline-none focus:ring-0";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-[#0D1B2A] py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <div className="mb-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>
        <div className="grid gap-8 md:grid-cols-2 md:gap-10">
          <aside className="text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A84C]">Get in touch</p>
            <h1 className="mt-3 text-[28px] font-bold leading-tight md:text-5xl">
              Let&apos;s find your next <em className="not-italic text-[#C9A84C]">great hire.</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/75 md:text-base">
              Tell us what you need. We&apos;ll respond with qualified EU/EEA candidates — matched to your
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
              Employers and partners only. Job seekers → jobs.arbeidmatch.no
            </p>
            <div className="mt-6 space-y-4">
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
                  <option>Other</option>
                </select>
              </label>
              <label className="text-sm text-navy">
                Message
                <textarea name="message" rows={5} className={`${inputClass} min-h-[100px]`} />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-[#0D1B2A] py-3 font-medium text-white transition-colors hover:bg-[#C9A84C] hover:text-[#0D1B2A]"
              >
                Send message →
              </button>
              <p className="text-xs text-text-secondary">
                By sending, you agree to our Privacy Policy. No spam, ever.
              </p>
              {submitted && (
                <div className="rounded-md border border-gold/40 bg-gold/10 p-4 text-navy">
                  Thank you! We&apos;ll be in touch within 24 hours.
                </div>
              )}
            </div>
          </form>
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
