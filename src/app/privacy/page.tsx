import type { Metadata } from "next";

import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/privacy",
  "Privacy Policy | ArbeidMatch",
  "How ArbeidMatch collects, uses and protects your personal data. GDPR compliant.",
);

export default function PrivacyPage() {
  return (
    <section className="bg-[#0a0f14] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <article className="mx-auto max-w-[680px] space-y-8 text-[12px] leading-[1.6] text-[#d1d5db]">
          <header className="space-y-3">
            <h1 className="font-display text-[22px] font-semibold text-[#f9fafb]" style={{ color: "#f9fafb" }}>
              Privacy Policy
            </h1>
            <p className="leading-[1.6] text-[#d1d5db]" style={{ color: "#d1d5db" }}>
              <strong className="text-[#e5e7eb]" style={{ color: "#e5e7eb" }}>
                ArbeidMatch Norge AS
              </strong>
              <br />
              Org. nr. 935 667 089 (MVA)
              <br />
              Sverre Svendsens veg 38, 7056 Ranheim, Norway
              <br />
              post@arbeidmatch.no
              <br />
              Last updated: April 2026
            </p>
          </header>

          <section>
            <h2
              className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]"
              style={{ color: "#f3f4f6" }}
            >
              1. Who We Are
            </h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]" style={{ color: "#d1d5db" }}>
              ArbeidMatch Norge AS is a recruitment and workforce solutions company based in Norway.
              We connect EU/EEA workers with Norwegian businesses in construction, logistics and
              industry.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">2. What Data We Collect and Why</h2>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.1 Candidate Registration</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Name, email, phone, nationality, work experience, CV</li>
                  <li>Purpose: matching candidates with job opportunities</li>
                  <li>
                    Legal basis: consent (GDPR Art. 6(1)(a)) and legitimate interest (Art. 6(1)(f))
                  </li>
                  <li>Retention: 24 months from last activity</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.2 Employer Requests</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Company name, contact person, email, phone, job requirements</li>
                  <li>Purpose: processing candidate requests</li>
                  <li>Legal basis: contract performance (GDPR Art. 6(1)(b))</li>
                  <li>Retention: 36 months</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.3 DSB Guide Purchases</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Name, email, payment confirmation (no card data stored)</li>
                  <li>Purpose: delivering purchased digital content and access management</li>
                  <li>Legal basis: contract performance (GDPR Art. 6(1)(b))</li>
                  <li>Retention: 60 months (legal/accounting requirement)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.4 DSB Checklist Leads</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Name, email, GDPR consent timestamp</li>
                  <li>Purpose: delivering free checklist and follow-up communications</li>
                  <li>Legal basis: consent (GDPR Art. 6(1)(a))</li>
                  <li>Retention: 12 months or until unsubscribe</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.5 DSB Waitlist</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Name, email, country, applicant type, GDPR consent</li>
                  <li>Purpose: notifying interested users when DSB services launch</li>
                  <li>Legal basis: consent (GDPR Art. 6(1)(a))</li>
                  <li>Retention: until service launches or user unsubscribes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.6 Feedback and Contact Forms</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Name, email, message content</li>
                  <li>Purpose: responding to inquiries</li>
                  <li>Legal basis: legitimate interest (GDPR Art. 6(1)(f))</li>
                  <li>Retention: 12 months</li>
                </ul>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#e5e7eb]">2.7 Website Usage</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Essential cookies only (session management, consent storage)</li>
                  <li>No analytics, no advertising cookies, no third-party tracking</li>
                  <li>Legal basis: legitimate interest for essential functionality</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">3. How We Store Your Data</h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">
              All personal data is stored securely using Supabase (hosted in the EU). Payment
              processing is handled by Stripe Inc. and is subject to Stripe&apos;s privacy policy. We
              do not store credit card details.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">4. Who We Share Data With</h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">We do not sell your data. We may share data with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Stripe Inc. (payment processing)</li>
              <li>Supabase Inc. (secure data storage)</li>
              <li>Email service providers for transactional emails only</li>
            </ul>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">All processors are GDPR compliant.</p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">5. Your Rights Under GDPR</h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access your personal data (Art. 15)</li>
              <li>Correct inaccurate data (Art. 16)</li>
              <li>Delete your data (Art. 17)</li>
              <li>Restrict processing (Art. 18)</li>
              <li>Data portability (Art. 20)</li>
              <li>Object to processing (Art. 21)</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">
              To exercise your rights, contact: post@arbeidmatch.no
              <br />
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">6. Complaints</h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">
              If you believe we are processing your data unlawfully, you have the right to lodge a
              complaint with the Norwegian Data Protection Authority (Datatilsynet):
            </p>
            <p className="mt-2 leading-relaxed text-[#d1d5db]">
              datatilsynet.no
              <br />
              post@datatilsynet.no
              <br />
              +47 74 07 07 07
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">7. Digital Content Protection</h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">
              Our paid digital guides are licensed for personal use only. Unauthorized copying,
              sharing, or reproduction is prohibited under Norwegian copyright law and EU Directive
              2001/29/EC.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#f3f4f6]">8. Changes to This Policy</h2>
            <p className="mt-3 leading-relaxed text-[#d1d5db]">
              We may update this policy. Significant changes will be communicated by email to
              registered users. Continued use of the site constitutes acceptance.
            </p>
          </section>
        </article>
      </div>
    </section>
  );
}
