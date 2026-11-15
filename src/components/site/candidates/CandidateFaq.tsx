"use client";

import Link from "next/link";
import { useId, useState } from "react";

import { Icon } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";
import { CANDIDATE_FAQ } from "@/lib/candidate-faq";

/**
 * The candidates' questions and answers, as in the approved mockup (ORDER 295,
 * stage 3): all eighteen, in four groups, one answer open at a time across the
 * page, and each answer followed by the one link that gets the reader what
 * they need. The answers are the live ones of src/lib/candidate-faq.ts.
 */

export const FAQ_GROUPS: readonly { title: string; questions: readonly string[] }[] = [
  {
    title: "Before you apply",
    questions: [
      "Who can apply?",
      "Which trades do you recruit for?",
      "How much English do I need?",
      "I have experience but a diploma is missing. Can I apply?",
      "Is the position I saw still open?",
      "We are a couple or a team. Can we come together?",
    ],
  },
  { title: "Your application", questions: ["Where do I send my CV?", "I need help writing a CV.", "I applied earlier. What happens now?", "How do I talk to a recruiter?", "Do I pay anything?"] },
  { title: "Pay and contract", questions: ["Who will employ me?", "How much is the pay?", "When can I start?"] },
  { title: "Moving to Norway", questions: ["Where are the jobs?", "Is accommodation included?", "Do you pay for the trip to Norway?", "Do I need a D-number?"] },
];

type FaqLink = { label: string } & ({ href: string } | { sheet: "register" | "message"; set?: string });

/** Where each answer sends the reader. A guide exists only for the D-number; the CV answer names the CV guide. */
export const FAQ_LINKS: Record<string, FaqLink> = {
  "Is the position I saw still open?": { label: "See the open jobs", href: SITE_PATHS.jobs },
  "Which trades do you recruit for?": { label: "See the open jobs", href: SITE_PATHS.jobs },
  "Who will employ me?": { label: "How employment works", href: SITE_PATHS.candidates },
  "How much is the pay?": { label: "See pay in each advert", href: SITE_PATHS.jobs },
  "Is accommodation included?": { label: "See what each job includes", href: SITE_PATHS.jobs },
  "Do you pay for the trip to Norway?": { label: "See what each job includes", href: SITE_PATHS.jobs },
  "Where are the jobs?": { label: "See jobs by place", href: SITE_PATHS.jobs },
  "Who can apply?": { label: "What we ask for", href: SITE_PATHS.candidates },
  "How much English do I need?": { label: "Ask about Norwegian courses", sheet: "message", set: "about=Norwegian courses" },
  "I have experience but a diploma is missing. Can I apply?": { label: "Create your profile", sheet: "register" },
  "Where do I send my CV?": { label: "Create your profile", sheet: "register" },
  "I need help writing a CV.": { label: "Open the CV guide", href: "/cv" },
  "We are a couple or a team. Can we come together?": { label: "Create your profile", sheet: "register" },
  "When can I start?": { label: "See the open jobs", href: SITE_PATHS.jobs },
  "Do I need a D-number?": { label: "Read the tax registration guide", href: "/premium/article/tax-registration-norway-foreign-workers" },
  "I applied earlier. What happens now?": { label: "Ask about my application", sheet: "message", set: "about=My application" },
  "How do I talk to a recruiter?": { label: "Candidate support", href: SITE_PATHS.support },
  "Do I pay anything?": { label: "Candidate support", href: SITE_PATHS.support },
};

function AnswerLink({ link }: { link: FaqLink }) {
  const inner = (
    <>
      {link.label}
      <Icon name="arrow" />
    </>
  );
  if ("href" in link) {
    return (
      <Link className="alink" href={link.href}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className="alink" data-sheet={link.sheet} data-sheet-set={link.set}>
      {inner}
    </button>
  );
}

export function CandidateFaq() {
  const [open, setOpen] = useState<string | null>(FAQ_GROUPS[0]?.questions[0] ?? null);
  const base = useId();
  return (
    <>
      {FAQ_GROUPS.map((g) => (
        <div key={g.title} className="fg">
          <h2 className="h3">{g.title}</h2>
          <div className="acc">
            {g.questions.map((q, i) => {
              const item = CANDIDATE_FAQ.find((f) => f.question === q);
              if (!item) return null;
              const isOpen = open === q;
              const id = `${base}-${g.title.length}-${i}`;
              const link = FAQ_LINKS[q];
              return (
                <div key={q} className={`acc-i${isOpen ? " open" : ""}`}>
                  <button type="button" className="acc-h" aria-expanded={isOpen} aria-controls={id} onClick={() => setOpen(isOpen ? null : q)}>
                    {item.question}
                    <span className="pm">
                      <Icon name="plus" />
                    </span>
                  </button>
                  <div className="acc-b" id={id} role="region">
                    <p>{item.answer}</p>
                    {link ? <AnswerLink link={link} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
