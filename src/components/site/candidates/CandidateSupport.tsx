import Link from "next/link";

import { Icon, type IconName } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";
import { getSiteNumbers, replySentence } from "@/lib/numbers";

/**
 * Candidate support, as in the approved mockup (ORDER 295, stage 3): on the
 * left the five subjects, each opening the candidate message with its subject
 * chosen; on the right where the answer can be found without writing.
 */

const SUBJECTS: { icon: IconName; title: string; hint: string }[] = [
  { icon: "file", title: "My application", hint: "Status, interview, next step" },
  { icon: "user", title: "My profile or CV", hint: "Sign-in, changes, documents" },
  { icon: "brief", title: "A job I saw", hint: "Pay, place, requirements" },
  { icon: "msg", title: "Norwegian courses", hint: "A language school we trust" },
  { icon: "help", title: "Something else", hint: "Tell us what you need" },
];

function Row({ icon, title, hint }: { icon: IconName; title: string; hint: string }) {
  return (
    <>
      <span className="ri">
        <Icon name={icon} />
      </span>
      <span className="rl">
        <b>{title}</b>
        <small>{hint}</small>
      </span>
      <span data-ic="chev">
        <Icon name="chev" />
      </span>
    </>
  );
}

export default async function CandidateSupport() {
  // ORDER 302: the reply promise is RecOS's; with no value the line ends at its first sentence.
  const reply = replySentence(await getSiteNumbers(), "en");
  return (
    <div className="ams page" lang="en">
      <section className="dark band">
        <div className="w">
          <span className="eb">Candidate support</span>
          <h1>How can we help?</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            Pick the subject and write to us.{reply ? ` ${reply}` : null}
          </p>
        </div>
      </section>
      <section className="sec">
        <div className="w">
          <div className="cols2">
            <div>
              <h2 className="eb">Write to us about</h2>
              <div className="rows wide">
                {SUBJECTS.map((s) => (
                  <button key={s.title} type="button" className="prow" data-sheet="message" data-sheet-set={`about=${s.title}`}>
                    <Row {...s} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="eb">Find it yourself</h2>
              <div className="rows wide">
                <Link className="prow" href={SITE_PATHS.questions}>
                  <Row icon="help" title="Questions and answers" hint="The 18 things candidates ask most" />
                </Link>
                <Link className="prow" href={SITE_PATHS.lifeInNorway}>
                  <Row icon="file" title="Life in Norway" hint="Guides for your first months" />
                </Link>
                <a className="prow" href={SITE_PATHS.candidateLogin}>
                  <Row icon="lock" title="Log in to your profile" hint="A recruiter contacts you from there" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
