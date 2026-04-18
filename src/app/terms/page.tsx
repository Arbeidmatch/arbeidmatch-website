export default function TermsPage() {
  return (
    <section className="bg-[#0a0f14] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <article className="mx-auto max-w-[680px] space-y-8 text-[12px] leading-[1.6] text-[#888]">
          <header className="space-y-3">
            <h1 className="font-display text-[18px] font-semibold text-[#ccc]">Terms of Service</h1>
            <p className="leading-[1.6]">
              <strong className="text-[#aaa]">ArbeidMatch Norge AS</strong>
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
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">1. Acceptance of Terms</h2>
            <p className="mt-3 leading-relaxed">
              By using arbeidmatch.no you agree to these terms. If you do not agree, do not use this
              site.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">2. Services</h2>
            <p className="mt-3 leading-relaxed">ArbeidMatch Norge AS provides:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Recruitment and workforce matching services</li>
              <li>Digital informational guides (DSB Authorization Guides)</li>
              <li>Free informational content and checklists</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">3. Digital Guide Purchases</h2>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#9a9a9a]">3.1 License</h3>
                <p className="mt-2 leading-relaxed">
                  Upon purchase you receive a personal, non-transferable license to access the
                  purchased guide for 30 days. This license is for personal use only.
                </p>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#9a9a9a]">3.2 Prohibited Use</h3>
                <p className="mt-2 leading-relaxed">
                  You may not copy, share, reproduce, resell or distribute any purchased content.
                  Violation may result in legal action under Norwegian copyright law.
                </p>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#9a9a9a]">3.3 Refund Policy</h3>
                <p className="mt-2 leading-relaxed">
                  Digital content is delivered immediately upon payment. Under EU Consumer Rights
                  Directive 2011/83/EU, you waive your right of withdrawal once you access digital
                  content. By completing your purchase you confirm you understand and accept this
                  condition.
                </p>
                <p className="mt-2 leading-relaxed">
                  If you experience technical issues preventing access, contact post@arbeidmatch.no
                  within 48 hours.
                </p>
              </div>

              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#9a9a9a]">3.4 Disclaimer</h3>
                <p className="mt-2 leading-relaxed">
                  Our guides provide general information based on official public sources. We do not
                  guarantee approval of any DSB application. Information may change. Always verify
                  with DSB directly before submitting your application.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">4. Recruitment Services</h2>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#9a9a9a]">4.1 For Candidates</h3>
                <p className="mt-2 leading-relaxed">
                  Registration is free. We match your profile with available positions. We do not
                  charge candidates for placement.
                </p>
              </div>
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.4px] text-[#9a9a9a]">4.2 For Employers</h3>
                <p className="mt-2 leading-relaxed">
                  Services are subject to separate agreements. Contact us for terms applicable to
                  employer services.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">5. Intellectual Property</h2>
            <p className="mt-3 leading-relaxed">
              All content on arbeidmatch.no is owned by ArbeidMatch Norge AS or its licensors. You
              may not reproduce any content without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">6. Limitation of Liability</h2>
            <p className="mt-3 leading-relaxed">ArbeidMatch Norge AS is not liable for:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Outcomes of DSB applications</li>
              <li>Employment decisions made by employers</li>
              <li>Accuracy of information that has changed after publication</li>
              <li>Technical interruptions to the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">7. Governing Law</h2>
            <p className="mt-3 leading-relaxed">
              These terms are governed by Norwegian law. Disputes shall be resolved in Norwegian
              courts.
            </p>
          </section>

          <section>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.5px] text-[#aaa]">8. Contact</h2>
            <p className="mt-3 leading-relaxed">
              ArbeidMatch Norge AS
              <br />
              post@arbeidmatch.no
              <br />
              +47 96 73 47 30
              <br />
              arbeidmatch.no
            </p>
          </section>
        </article>
      </div>
    </section>
  );
}
