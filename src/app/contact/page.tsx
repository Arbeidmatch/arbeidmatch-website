"use client";

import { FormEvent, useState } from "react";
import { Building2, Clock3, Mail, MapPin, Phone } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <div className="mb-8 rounded-r-md border-l-4 border-gold bg-gold/10 p-4 text-navy">
          Looking for a job?{" "}
          <a href="https://jobs.arbeidmatch.no" className="font-semibold text-gold">
            Visit jobs.arbeidmatch.no →
          </a>
        </div>
        <h1 className="text-4xl font-bold text-navy">Contact Us</h1>
        <p className="mt-3 text-text-secondary">
          This page is for Norwegian employers. For job seekers, visit jobs.arbeidmatch.no
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <aside className="rounded-xl bg-navy p-10 text-white">
            <div className="space-y-5">
              <p className="flex items-center gap-3"><Mail className="text-gold" size={18} /> post@arbeidmatch.no</p>
              <p className="flex items-center gap-3"><Phone className="text-gold" size={18} /> 967 34 730</p>
              <p className="flex items-start gap-3"><MapPin className="mt-1 text-gold" size={18} /> <span>Sverre Svendsens veg 38<br />7056 Ranheim, Trondheim<br />Norway</span></p>
              <p className="flex items-center gap-3"><Clock3 className="text-gold" size={18} /> Response within 24 hours on working days</p>
              <p className="flex items-center gap-3"><Building2 className="text-gold" size={18} /> Org.nr. 935 667 089 (MVA)</p>
            </div>
            <hr className="my-6 border-white/20" />
            <p className="text-white/80">Or book a free 20-min call:</p>
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-gold"
            >
              Schedule a call →
            </a>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-8">
            <div className="space-y-5">
              <label>Name* <input required name="name" className={inputClass} /></label>
              <label>Company* <input required name="company" className={inputClass} /></label>
              <label>Email* <input required type="email" name="email" className={inputClass} /></label>
              <label>Phone (optional) <input name="phone" className={inputClass} /></label>
              <label>I need:
                <select name="need" className={inputClass}>
                  <option>Qualified workers</option>
                  <option>Partnership</option>
                  <option>Other</option>
                </select>
              </label>
              <label>Message
                <textarea name="message" rows={5} className={inputClass} />
              </label>
              <button type="submit" className="w-full rounded-md bg-gold py-3 font-medium text-white hover:bg-gold-hover">
                Send message
              </button>
              {submitted && (
                <div className="rounded-md border border-gold/40 bg-gold/10 p-4 text-navy">
                  Thank you! We&apos;ll be in touch within 24 hours.
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-navy">Find us / Finn oss</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(13,27,42,0.08)]">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=10.4800,63.4150,10.5200,63.4350&layer=mapnik&marker=63.4251,10.5002"
              width="100%"
              height="400"
              style={{ border: "none", borderRadius: "12px" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ArbeidMatch office location"
            />
          </div>
          <p className="mt-4 text-base text-navy">
            Sverre Svendsens veg 38, 7056 Ranheim, Norway
          </p>
        </div>
      </div>
    </section>
  );
}
