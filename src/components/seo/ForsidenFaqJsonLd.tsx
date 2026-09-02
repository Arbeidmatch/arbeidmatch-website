/**
 * The questions people actually type, answered as facts.
 *
 * Three audiences, and each one asks a different question of the same company:
 *
 *   1. The person who wants to come. "Can I work in Norway as an EU citizen?"
 *      "What do I need to work as a bricklayer in Norway?" Asked a hundred
 *      times a day, and the answer today is a soup of forum posts.
 *   2. The company that needs people. "How do I hire workers from Eastern
 *      Europe in Norway?" "What does bemanning cost?" Answered today only by
 *      the large agencies.
 *   3. The recruiter who wants to work with somebody. "Who can I work with as a
 *      recruiter in Norway?" Almost nobody answers this, which makes it the
 *      easiest of the three to win.
 *
 * WHAT IS NOT HERE, deliberately. No salary figures. What we know from real
 * reports are one client's rates, and those are that client's to publish, not
 * ours. And no statement about what the law requires: the public pages describe
 * the work we do, they do not state the rules.
 *
 * Every answer is a fact about us that can be checked, because a source is
 * cited for being exact rather than for being enthusiastic.
 */

const FAQ = [
  {
    q: "Can I work in Norway as an EU or EEA citizen?",
    a: "Yes, and that is who we work with. An EU or EEA passport is what lets somebody take work in Norway without a visa, and it is the requirement on every position we advertise. We do not sponsor visas and we do not recruit from outside the EU and EEA, so a passport from elsewhere is not something we can help with, whatever the trade.",
  },
  {
    q: "What do I need to start work in Norway as a tradesman?",
    a: "A passport from the EU or EEA, a trade certificate or documented equivalent experience in your trade, and once you are here a D-number and a tax card. Construction sites also require an HMS card. We work with people who already have the trade behind them; we do not place beginners.",
  },
  {
    q: "Do you take beginners, or people learning a trade?",
    a: "No. Every position asks for a completed trade certificate or documented equivalent experience. That is the bar, and it is the same bar whether the work is carpentry, bricklaying, car mechanics or electrical installation.",
  },
  {
    q: "How do I hire workers from the EU and EEA in Norway?",
    a: "Three ways, and which one fits depends on how much of it you want to carry. A job ad: you write it, it goes on our board, and applications reach you directly. Recruitment: we find and present candidates, and you employ them yourself. Staffing (bemanning): we employ them and hire them in to you, so the employment, the payroll and the papers stay with us.",
  },
  {
    q: "What is the difference between recruitment and bemanning?",
    a: "In recruitment the person ends up on your payroll and the relationship is yours. In bemanning the person stays employed by us and works on your site, so we carry the employment, the wages, the holiday pay and the documentation, and you pay an hourly rate for the time worked.",
  },
  {
    q: "Which trades do you work with?",
    a: "Building and civil works, car workshops, industry and manufacturing, and electrical installation. Within those: carpenters, bricklayers, concrete workers, painters, car mechanics, welders, factory workers, and electricians with DSB registration.",
  },
  {
    q: "Can I work with you as a recruiter?",
    a: "Yes. Recruiters work with us as independent partners with their own workspace: you bring your own clients and your own candidates, and the system, the contracts and the documentation are shared. We agree the split per placement rather than employing you.",
  },
  {
    q: "Where do you have work in Norway?",
    a: "Where the projects are, which today is Trondheim and Trøndelag, Bergen and Vestland, Stavanger and Rogaland, and the area around Oslo. The town is written on each advert, and it is the town the work is in rather than our office address.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://www.arbeidmatch.no/#forsiden-faq",
  mainEntity: FAQ.map((entry) => ({
    "@type": "Question",
    name: entry.q,
    acceptedAnswer: { "@type": "Answer", text: entry.a },
  })),
};

export function ForsidenFaqJsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />;
}

/**
 * The same answers, visible.
 *
 * Structured data an assistant can read and a page a person cannot is a page
 * that lies to one of its two readers. These are the same eight answers, on the
 * page, in the order the questions get asked.
 */
export function ForsidenFaq() {
  return (
    <section className="border-t border-border px-6 py-12">
      <h2 className="text-2xl font-bold text-navy">Questions we are asked</h2>
      <dl className="mt-6 grid gap-6 md:grid-cols-2">
        {FAQ.map((entry) => (
          <div key={entry.q}>
            <dt className="font-semibold text-navy">{entry.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-text-secondary">{entry.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
