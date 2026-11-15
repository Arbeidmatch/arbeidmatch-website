import { Accordion } from "@/components/site/Accordion";
import { Icon } from "@/components/site/Icon";

/**
 * The Recruiter Network, as in the approved mockup (ORDER 295, stage 6): the
 * three kinds of partner, each card opening the invitation sheet with its
 * type chosen; what a partner gets; the three steps from request to access.
 */

const TRACKS = [
  {
    track: "The Influencer",
    title: "You have the audience.",
    body: "You run an active channel about jobs, migration, work abroad or careers, and communicate professionally in English.",
  },
  {
    track: "The Recruiter",
    title: "You know the game.",
    body: "You have experience in recruitment, HR or staffing and may already have a network in your region.",
  },
  {
    track: "The Learner",
    title: "You want to learn.",
    body: "You are early in your journey but bring strong motivation, professional English and a willingness to commit.",
  },
] as const;

const BENEFITS = [
  { title: "Your own market", body: "Exclusive regional coverage. Clients in your region are yours. We route clients from other regions to you." },
  { title: "Full infrastructure", body: "The ArbeidMatch website and tools, ready from day one. No setup costs. No technical headaches." },
  { title: "Shared database", body: "Access our pool of pre-screened EU/EEA candidates and Norwegian employer clients from day one." },
  { title: "Partnership model", body: "Performance-based partnership. Specific terms discussed upon invitation." },
] as const;

const STEPS = [
  { title: "Request an invitation", body: "Share your name, email and a short motivation." },
  { title: "We review your background", body: "Our team reads every request and follows up when there is a clear match." },
  { title: "Approved recruiters get access", body: "We onboard you to our tools, processes and brand guardrails." },
] as const;

export default function RecruiterNetwork() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">Invite-only program</span>
          <h1>Recruiter Network</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            We work with a curated network of independent recruiters who source EU and EEA candidates for Norwegian projects. Currently invite-only.
          </p>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">Three types of partners</span>
          <h2 className="h2">There is a place for you.</h2>
          <div className="three">
            {TRACKS.map((t) => (
              <button key={t.track} type="button" className="card" data-sheet="invite" data-sheet-set={`track=${t.track}`}>
                <span className="eb">{t.track}</span>
                <h3 className="h4">{t.title}</h3>
                <p>{t.body}</p>
                <span className="more">
                  This is me
                  <Icon name="arrow" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w split">
          <div>
            <span className="eb">What you get</span>
            <h2 className="h2">Everything you need. Nothing you don&apos;t.</h2>
          </div>
          <Accordion numbered={false} items={BENEFITS.map((b) => ({ title: b.title, body: <p>{b.body}</p> }))} />
        </div>
      </section>

      <section className="sec tight">
        <div className="w proc">
          <div>
            <span className="eb">How it works</span>
            <h2 className="h2">From request to access</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <b>{String(i + 1).padStart(2, "0")}</b>
                <h3 className="h4">{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
