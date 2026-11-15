import Image from "next/image";

import { Icon, type IconName } from "@/components/site/Icon";

/**
 * For candidates, as in the mockup approved on 15 November 2026 (ORDER 295,
 * stage 3), in English: what we ask for, the Norwegian courses we can
 * recommend on request (the school is not named), the three steps, who
 * employs you, and the two ways to stay close for someone not applying yet.
 * The buttons open the site's sheets over the page.
 */

const ASKS: { icon: IconName; title: string; body: string }[] = [
  { icon: "flag", title: "EU or EEA citizenship", body: "A passport or national ID card. We do not sponsor visas." },
  { icon: "wrench", title: "A trade", body: "A trade certificate, or recent hands-on experience that your profile can show." },
  { icon: "msg", title: "English", body: "Enough to follow instructions and talk with the crew on site. Norwegian is a plus." },
];

const STEPS = [
  { title: "Browse open jobs", body: "Find one that matches your trade and preferred location." },
  { title: "Read the advert", body: "Pay, requirements and working conditions are written in it." },
  { title: "Apply", body: "We review your application with the client and contact you to arrange an interview if you are selected." },
] as const;

export default function ForCandidates() {
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w band-g">
          <div>
            <span className="eb">For candidates</span>
            <h1>Find work in Norway</h1>
            <p className="lede">Jobs with Norwegian employers for tradespeople from the EU and EEA.</p>
          </div>
          <Image
            className="ph"
            src="/images/home/carpenter-watermarked.webp"
            alt="A carpenter at work on a building site"
            width={800}
            height={600}
            sizes="(max-width: 760px) 100vw, 480px"
            priority
          />
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <span className="eb">Who can apply</span>
          <h2 className="h2">Three things we ask for</h2>
          <div className="facts3">
            {ASKS.map((a) => (
              <div key={a.title} className="fact">
                <span className="ri">
                  <Icon name={a.icon} />
                </span>
                <h3 className="h4">{a.title}</h3>
                <p>{a.body}</p>
              </div>
            ))}
          </div>
          <div className="note" style={{ marginTop: 48 }}>
            <span className="eb">Norwegian</span>
            <h3>Want to learn Norwegian?</h3>
            <p>We can recommend courses from a language school we trust and work with. Ask, and we send you the details.</p>
            <button type="button" className="btn ghost" style={{ alignSelf: "flex-start", marginTop: 8 }} data-sheet="message" data-sheet-set="about=Norwegian courses">
              Ask about courses
            </button>
          </div>
        </div>
      </section>

      <section className="sec tight">
        <div className="w proc">
          <div>
            <span className="eb">How it works</span>
            <h2 className="h2">From advert to interview</h2>
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

      <section className="sec tight">
        <div className="w">
          <span className="eb">Who employs you</span>
          <h2 className="h2">Two ways into a Norwegian job</h2>
          <div className="two">
            <div className="card">
              <span className="eb">Direct</span>
              <h3 className="h3">Employed by ArbeidMatch</h3>
              <p>We hire you on a Norwegian contract and place you with our clients. Mostly construction: concrete, formwork, scaffolding, carpentry.</p>
            </div>
            <div className="card sage">
              <span className="eb">Partner network</span>
              <h3 className="h3">Employed by a partner</h3>
              <p>Verified Norwegian recruitment partners in production, electrical, logistics, automotive and offshore.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec tight" id="join-talent">
        <div className="w">
          <span className="eb">Not ready to apply</span>
          <h2 className="h2">Stay close to the next job</h2>
          <div className="two">
            <button type="button" className="card" data-sheet="register">
              <h3 className="h4">Create your profile</h3>
              <p>Save your experience and CV once. Our recruiters see it when a job in your trade opens.</p>
              <span className="more">
                Create profile
                <Icon name="arrow" />
              </span>
            </button>
            <button type="button" className="card" data-sheet="alerts">
              <h3 className="h4">Get job alerts</h3>
              <p>An e-mail when we publish a job in your trade. Free, and no profile needed.</p>
              <span className="more">
                Choose alerts
                <Icon name="arrow" />
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
