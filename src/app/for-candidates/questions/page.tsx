import type { Metadata } from "next";
import Link from "next/link";

import { CandidateFaq } from "@/components/site/candidates/CandidateFaq";
import { SITE_PATHS } from "@/components/site/siteNav";
import { CANDIDATE_FAQ } from "@/lib/candidate-faq";

const TITLE = "Questions and answers for candidates | ArbeidMatch";
const DESCRIPTION = "What candidates ask us most about working in Norway: who can apply, CVs and applications, pay and contract, and moving to Norway.";
const URL = "https://www.arbeidmatch.no/for-candidates/questions";

export const metadata: Metadata = {
  alternates: { canonical: "/for-candidates/questions", languages: { en: URL, "x-default": URL } },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/for-candidates/questions", locale: "en_US", siteName: "ArbeidMatch", type: "website" },
};

/** Questions and answers for candidates, from the approved mockup (ORDER 295, stage 3). */
export default function CandidateQuestionsPage() {
  return (
    <div className="ams page" lang="en">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: CANDIDATE_FAQ.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }),
        }}
      />
      <section className="dark band">
        <div className="w">
          <span className="eb">For candidates</span>
          <h1>Questions and answers</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            What candidates ask us most, in four groups.
          </p>
        </div>
      </section>
      <section className="sec">
        <div className="w">
          <CandidateFaq />
        </div>
      </section>
      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <div>
            <h2 className="h3">Did not find your answer?</h2>
            <p>Write to us and a person replies.</p>
          </div>
          <Link className="btn ghost" href={SITE_PATHS.support}>
            Candidate support
          </Link>
        </div>
      </section>
    </div>
  );
}
