import Link from "next/link";

import { SITE_PATHS } from "@/components/site/siteNav";

/**
 * About, as in the approved mockup (ORDER 295, stage 6): who we are and what
 * we do side by side, the three ways we work, and a short closing band.
 */

const VALUES = [
  {
    title: "Compliance first",
    body: "Norwegian labor rules and documentation are built into how we work, so employers and candidates can move forward with confidence.",
  },
  { title: "Speed", body: "We streamline screening and matching so roles are filled without unnecessary delay." },
  { title: "Transparency", body: "Clear expectations, honest communication, and no surprises in the hiring process." },
] as const;

export default function About() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">About</span>
          <h1>About ArbeidMatch</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            We connect qualified EU/EEA workers with Norwegian employers in blue-collar industries. Fast, compliant, and built on trust.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="two" style={{ marginTop: 0 }}>
            <div className="card">
              <span className="eb">Who we are</span>
              <h2 className="h3">Founded in Trondheim</h2>
              <p>ArbeidMatch Norge AS was founded in Trondheim, Norway. We work with businesses across Norway.</p>
            </div>
            <div className="card sage">
              <span className="eb">What we do</span>
              <h2 className="h3">Recruitment and staffing</h2>
              <p>For construction, logistics, industry, cleaning and hospitality, matching the right people with the right roles.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">Values</span>
          <h2 className="h2">How we work</h2>
          <div className="three">
            {VALUES.map((v) => (
              <div key={v.title} className="card">
                <h3 className="h4">{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <h2 className="h3">Work with us</h2>
          <div className="cta" style={{ margin: 0 }}>
            <Link className="btn gold" href={SITE_PATHS.jobs}>
              Browse jobs
            </Link>
            <Link className="btn ghost" href={SITE_PATHS.firms}>
              For employers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
