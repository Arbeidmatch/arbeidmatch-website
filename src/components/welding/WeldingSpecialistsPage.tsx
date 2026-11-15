import Link from "next/link";

import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

import { WELDING_CERT_ITEMS } from "./weldingCertItems";

/**
 * Welding specialists on the site template (ORDER 295, stage 6b), with its own
 * copy: the promise in the dark band, three facts, the certificates we check,
 * the three steps, the industries, staffing or direct hire, what Norwegian
 * yards ask for with pay and rotation, and the closing action.
 */

const INDUSTRIES = [
  "Oil and Gas",
  "Offshore Structures",
  "Shipbuilding and Naval",
  "Industrial Manufacturing",
  "Pressure Vessels and Pipelines",
  "Construction and Infrastructure",
] as const;

const FACTS = [
  {
    title: "Primary certification",
    body: "ISO 9606-1 is the primary standard required for welding positions at Norwegian shipyards and offshore facilities.",
  },
  {
    title: "Candidate sourcing",
    body: "We source certified welders from EU and EEA countries and ask candidates to provide current certification documents as part of screening.",
  },
  {
    title: "Timeline",
    body: "Our goal is to present qualified candidate profiles within approximately two weeks of receiving a request, depending on role and availability.",
  },
] as const;

const STEPS = [
  {
    t: "Tell us your project requirements",
    b: "Submit your request with details on certification standard required, welding process, material type, and project location. We assess your needs within 24 hours.",
  },
  {
    t: "We source and review",
    b: "Our recruiters identify candidates from our EU/EEA network. We ask for current ISO and EN certificates and check basic validity and expiry as part of screening. Only pre-screened candidates are presented.",
  },
  {
    t: "Candidate arrives prepared",
    b: "The selected welder arrives with documentation you have reviewed. We assist with employment contracts, payroll compliance with Norwegian law, and pre-arrival logistics support.",
  },
] as const;

const AUTHORIZATIONS: readonly { icon: IconName; title: string; body: string; link?: { href: string; label: string } }[] = [
  {
    icon: "badge",
    title: "ISO 9606-1 Welder Qualification",
    body: "The primary international standard for fusion welding qualification tests. Covers welding of steels and is widely recognized at Norwegian shipyards and offshore facilities. Certificates must be valid and are typically renewed every 2 years with 6-month testing intervals.",
    link: { href: "https://www.iso.org/standard/54936.html", label: "ISO 9606-1" },
  },
  {
    icon: "flag",
    title: "NORSOK and DNV Standards",
    body: "Norwegian shipyards and offshore operators frequently require compliance with NORSOK M-101 (structural steel fabrication) and DNV rules for ships and offshore structures. These apply in addition to ISO 9606 welder qualification.",
    link: { href: "https://www.standard.no", label: "Standard Norge" },
  },
  {
    icon: "file",
    title: "EN ISO 15614 Procedure Qualification",
    body: "Welding Procedure Specifications (WPS) and Procedure Qualification Records (PQR) per EN ISO 15614-1 are required for structural and pressure vessel work. The employer typically provides the applicable WPS for each project.",
  },
  {
    icon: "search",
    title: "NDT Operator Certification",
    body: "For inspection and quality control roles, NDT certification per EN ISO 9712 or ASNT is required. Level II and Level III are commonly requested for weld inspection at Norwegian shipyards and offshore facilities.",
    link: { href: "https://www.iso.org/standard/75361.html", label: "EN ISO 9712" },
  },
];

const MIN_WAGE_URL =
  "https://www.arbeidstilsynet.no/en/pay-and-engagement-of-employees/pay-and-minimum-rates-of-pay/minimum-wage/";

export default function WeldingSpecialistsPage() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">Welding Specialists</span>
          <h1>ISO-Certified Welders for Demanding Norwegian Projects</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            ArbeidMatch recruits and pre-screens welders and technical specialists holding valid ISO, EN, NORSOK, and DNV
            certifications. We ask candidates to provide current certification documents and check basic validity as part
            of our screening process.
          </p>
          <div className="cta">
            <Link className="btn gold" href={SITE_PATHS.request} data-rask-foresporsel>
              Request Welding Specialists
            </Link>
            <Link className="btn line" href={SITE_PATHS.jobs}>
              View all open positions
            </Link>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="three" style={{ marginTop: 0 }}>
            {FACTS.map((f) => (
              <div key={f.title} className="card">
                <span className="eb">{f.title}</span>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">Certification coverage</span>
          <h2 className="h2">Every major welding standard, checked in screening.</h2>
          <div className="four">
            {WELDING_CERT_ITEMS.map((c) => (
              <div key={c.title} className="stepc">
                <h3 className="h4">{c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w">
          <span className="eb">Simple process</span>
          <h2 className="h2">From request to certified welder on site</h2>
          <div className="three">
            {STEPS.map((s, i) => (
              <div key={s.t} className="stepc">
                <b>{i + 1}</b>
                <h3 className="h4">{s.t}</h3>
                <p>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">Industries we serve</span>
          <h2 className="h2">Where our welding specialists work</h2>
          <div className="pills">
            {INDUSTRIES.map((label) => (
              <span key={label} className="pill">
                {label}
              </span>
            ))}
          </div>
          <div className="note" style={{ marginTop: 40, maxWidth: 800 }}>
            <h3>Staffing or direct hire</h3>
            <p>
              ArbeidMatch offers both staffing (innleie) and direct hire (fast ansettelse) for welding specialists. Which
              one fits depends on how long you need the capacity and how the work is organised, and we go through that with
              you before we start. We are recruiters rather than legal advisers, so for the rules themselves use
              Arbeidstilsynet or your own adviser.
            </p>
            <p>
              <a className="plink" href="https://www.arbeidstilsynet.no" target="_blank" rel="noopener noreferrer">
                Read Norwegian staffing regulations at Arbeidstilsynet.no
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">Required certifications</span>
          <h2 className="h2">What authorizations do welders need for Norwegian shipyards?</h2>
          <div className="two">
            {AUTHORIZATIONS.map((a) => (
              <div key={a.title} className="card">
                <span className="ri">
                  <Icon name={a.icon} />
                </span>
                <h3 className="h4">{a.title}</h3>
                <p>{a.body}</p>
                {a.link ? (
                  <p>
                    <a className="plink" href={a.link.href} target="_blank" rel="noopener noreferrer">
                      {a.link.label}
                    </a>
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <p className="sub" style={{ maxWidth: 800 }}>
            As part of our screening process, we ask candidates to provide current certification documents and check basic
            validity. Employers should conduct their own independent verification before onboarding any candidate.
          </p>

          <div className="two">
            <div className="card night">
              <h3 className="h4">Salary and working conditions</h3>
              <p className="stat">
                <b>280 to 330 NOK per hour</b>
              </p>
              <p>
                Salary for ISO-certified welders at Norwegian shipyards varies based on certifications held, welding
                processes mastered, years of experience, and references from previous Norwegian employers. Welders with
                multiple valid ISO qualifications and demonstrated experience in demanding environments can expect rates
                toward the upper end of the range.
              </p>
              <p>
                References from previous Norwegian employers and offshore companies are highly valued and can significantly
                influence placement opportunities and salary negotiation.
              </p>
              <p>
                Rotation schedules at Norwegian shipyards are typically 4 weeks on and 2 weeks home, or 6 weeks on and 2
                weeks home. Some projects also include daily allowances.
              </p>
            </div>
            <div className="card">
              <h3 className="h4">Transport and accommodation</h3>
              <p>
                Many employers for shipyard and offshore placements include transport and accommodation as part of the
                package. This varies by employer and project. Always confirm specifics before accepting any offer. Details
                are typically documented in the employment contract.
              </p>
              <p className="fine">
                Salary ranges are general market estimates based on collective agreements and publicly available sources.
                Actual pay depends on qualifications, employer, project type, and individual negotiation. ArbeidMatch is not
                responsible for salary outcomes.{" "}
                <a className="plink" href={MIN_WAGE_URL} target="_blank" rel="noopener noreferrer">
                  Source: Arbeidstilsynet.no
                </a>
              </p>
              <p className="fine">
                Ranges are drawn from Norwegian shipyard and offshore job postings and are an estimate, not an offer. There is
                also a minimum rate that applies to this kind of work; we confirm the rate for your assignment before you
                accept it, and you can check the current figure at the link above.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <div>
            <h2 className="h3">Ready to find your certified welder?</h2>
            <p>Tell us your project requirements. Our goal is to present pre-screened candidates within about two weeks.</p>
          </div>
          <div className="close-acts">
            <Link className="btn gold" href={SITE_PATHS.request} data-rask-foresporsel>
              Request Welding Specialists Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
