import Link from "next/link";

import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";

/**
 * Electricians in Norway on the site template (ORDER 295, stage 6b), with its
 * own copy: the three things to have ready, what the work looks like, pay,
 * and the two ways in (open roles, a candidate profile).
 */

const ARBEIDSTILSYNET_MIN =
  "https://www.arbeidstilsynet.no/en/pay-and-engagement-of-employees/pay-and-minimum-rates-of-pay/minimum-wage/";
const REGISTER = "/candidate-register";

const BASICS: readonly { icon: IconName; title: string; body: string; badge: string }[] = [
  {
    icon: "badge",
    title: "Get your qualification recognised",
    body: "Electrical work in Norway is approved by DSB. Start that application early, because it decides when you can begin. DSB publishes the requirements and the current processing times, and we point you to the right page for your situation.",
    badge: "Start this first",
  },
  {
    icon: "file",
    title: "Have your papers ready",
    body: "Trade certificate, proof of training and employer references covering dates and the type of work you did. Documents not in Norwegian, English, Swedish or Danish need a certified translation. Getting this together early is usually what decides how fast everything else moves.",
    badge: "Prepare in advance",
  },
  {
    icon: "wrench",
    title: "Know your own experience",
    body: "Be able to say clearly what you have worked on: installation, service, industry, high voltage, automation, offshore. That is what an employer asks about first, and it is what we match you on. Certificates for specialised work are worth listing separately.",
    badge: "Know what you can do",
  },
];

const PAY_ROWS = [
  { l: "Sector minimum (qualified workers)", v: "See current rate", n: "Set centrally and updated periodically, check the link below" },
  { l: "Typical market rate (certified)", v: "approx. 290 to 330 NOK/hour", n: "Estimate only, varies by employer and project" },
  { l: "Accommodation", v: "Often provided", n: "For away-from-home assignments, employer typically covers costs" },
  { l: "Overtime", v: "Paid on top", n: "The supplement is stated in your contract before you sign" },
] as const;

export default function ElectriciansNorwayPage() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">For Electricians</span>
          <h1>Work as a Qualified Electrician in Norway</h1>
          <p className="lede" style={{ maxWidth: 600 }}>
            Norway has steady demand for qualified electricians. This page covers what the work looks like, what to have
            ready before you apply, and what you can expect to earn.
          </p>
          <div className="cta">
            <Link className="btn gold" href={SITE_PATHS.jobs}>
              Browse electrician roles
            </Link>
            <a className="btn line" href={REGISTER}>
              Register for job alerts
            </a>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">The basics</span>
          <h2 className="h2">Three things every EU/EEA electrician needs for Norway</h2>
          <div className="three">
            {BASICS.map((b) => (
              <div key={b.title} className="card">
                <span className="ri">
                  <Icon name={b.icon} />
                </span>
                <h3 className="h4">{b.title}</h3>
                <p>{b.body}</p>
                <span className="eb" style={{ marginTop: "auto" }}>
                  {b.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">The work</span>
          <h2 className="h2">What the job looks like here</h2>
          <div className="two">
            <div className="card">
              <span className="eb">Where you work</span>
              <h3 className="h4">Sites and sectors</h3>
              <ul className="chk">
                {[
                  "New build and renovation, housing and commercial",
                  "Industry and process plants",
                  "Service and maintenance work",
                  "Specialised work: high voltage, automation, offshore",
                ].map((t) => (
                  <li key={t}>
                    <Icon name="check" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card sage">
              <span className="eb">Day to day</span>
              <h3 className="h4">Conditions on the job</h3>
              <ul className="chk">
                {[
                  "Normally full time, often with a fixed shift rotation",
                  "Away-from-home projects usually include accommodation and travel",
                  "Norwegian or English on site, depending on the employer",
                  "Your own hand tools are often expected, protective equipment is provided",
                ].map((t) => (
                  <li key={t}>
                    <Icon name="check" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w">
          <span className="eb">What to expect</span>
          <h2 className="h2">Salary ranges for electricians in Norway</h2>
          <div className="two">
            <div className="card night">
              <p className="stat">
                <b>260 to 330 NOK per hour</b>
              </p>
              <p>
                There is a minimum hourly rate for the electrical trade in Norway, and it is updated from time to time. We
                tell you the rate that applies to your assignment before you accept it, and you can check the current figure
                yourself at the link below.
              </p>
              <p>
                What you actually earn on top of that depends on your experience, specialised certifications such as high
                voltage, automation or offshore, how long you have worked in Norway, and references from previous Norwegian
                employers.
              </p>
              <p>
                Norwegian employer references are highly valued. A strong recommendation from a previous Norwegian employer
                can significantly improve both your access to better projects and your negotiated rate.
              </p>
              <p>
                Some positions also include daily allowances and travel reimbursements, particularly for projects requiring
                you to stay away from home.
              </p>
            </div>
            <div className="card">
              <div className="rows">
                {PAY_ROWS.map((row) => (
                  <div key={row.l} className="prow">
                    <div className="rl">
                      <small>{row.l}</small>
                      <b>{row.v}</b>
                      <small>{row.n}</small>
                    </div>
                  </div>
                ))}
              </div>
              <p className="fine">
                Salary ranges are general market estimates based on collective agreements and publicly available sources.
                Actual pay depends on qualifications, employer, project type, and individual negotiation. ArbeidMatch is not
                responsible for salary outcomes.{" "}
                <a className="plink" href={ARBEIDSTILSYNET_MIN} target="_blank" rel="noopener noreferrer">
                  Source: Arbeidstilsynet.no
                </a>
              </p>
              <p className="fine">
                Always confirm the rate for your own assignment with the employer and in your contract before you accept it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="two" style={{ marginTop: 0 }}>
            <div className="card">
              <h2 className="h3">Ready to work as an electrician in Norway?</h2>
              <p>
                Browse open roles or register for job alerts. ArbeidMatch connects qualified EU/EEA electricians with
                Norwegian employers.
              </p>
              <div className="cta" style={{ marginTop: 8 }}>
                <Link className="btn gold" href={SITE_PATHS.jobs}>
                  Browse open positions
                </Link>
              </div>
            </div>
            <div className="card sage">
              <h2 className="h3">Already have your DSB? Register now.</h2>
              <p>
                Register your profile and we work to connect you with Norwegian employers actively looking for qualified
                electricians. We check each submission and aim to contact you personally when we have a relevant
                opportunity. We cannot guarantee timelines. Norwegian employer references are a strong advantage and help us
                match you with better projects.
              </p>
              <div className="cta" style={{ marginTop: 8 }}>
                <a className="btn navy" href={REGISTER}>
                  Register your profile
                </a>
              </div>
              <p className="fine">You will be redirected to our job portal to create your candidate profile.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
