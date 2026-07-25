import type { PremiumArticleSlug } from "@/lib/premium/articleSlugs";
import { PREMIUM_ARTICLE_SLUGS } from "@/lib/premium/articleSlugs";

export interface PremiumArticle {
  slug: PremiumArticleSlug;
  category: string;
  title: string;
  excerpt: string;
  readingTime: number;
  lastUpdated: string;
  officialSources: string[];
  bodyMarkdown: string;
}

const DISCLAIMER = `ArbeidMatch is a recruitment company, not a legal, tax or benefits adviser. These guides describe what to do and where to go; they do not state what the rules are. Procedures, rates and conditions change, and only the authority named above can tell you what applies to your own case.`;

const A1 = `Most problems foreign workers run into in Norway are not dramatic. They are small things left unchecked: a payslip nobody read, an hourly rate nobody compared, an agreement made verbally. This guide is about what to keep an eye on yourself.

Get your employment agreement in writing and keep your own copy. If you were told something in a conversation that matters to you, such as a rate, a shift pattern or how travel is covered, ask for it in writing too. Verbal promises are difficult to rely on later.

Read your payslip every pay period rather than only when something looks wrong. Check the hours against what you actually worked, check that overtime and any supplements appear, and check that holiday pay accrual is shown. If a line is unclear, ask your employer in writing and keep the reply.

Know which pay rate applies to your job. For several industries there is a minimum rate, and it is updated over time. Look it up yourself at Arbeidstilsynet rather than relying on what you heard on site, and compare it with what you are actually paid.

Keep your own records: schedules, timesheets, messages about shifts, and pay documents. If a question ever comes up about your work, these are what settle it, and they are much harder to reconstruct months later.

If something on site is unsafe, report it through the channel your employer provides and keep a note of when you did. If it is not dealt with, Arbeidstilsynet can advise you on what to do next.

Where to check: Arbeidstilsynet for pay rates, working conditions and safety at work.

${DISCLAIMER}`;

const A2 = `Getting your tax affairs in order early prevents surprises on payday and at year end. This guide is the practical sequence, not an explanation of the tax rules.

You will need an identification number. Depending on your situation you will get either a D number or a Norwegian national identity number, and which one follows from how long you are staying and the outcome of an identity check. Follow the instructions you receive from the tax office and the police, and do not plan around a particular outcome.

Register through Skatteetaten. Bring your passport, your address in Norway and your employment details. If you are unsure which form applies to you, Skatteetaten publishes checklists for foreign workers; use those rather than guessing.

Apply for a tax card as soon as you have your number and your employment details. Without a valid tax card on file, your employer withholds tax at a high default rate, and getting that corrected later takes time you would rather spend on other things.

There are deductions that can apply to workers who have come here from another country. Whether any of them apply to you depends on your situation, and it can change from one year to the next. Check Skatteetaten's pages for your own case each tax year instead of assuming last year's answer still holds.

You file a tax return each spring for the previous year. Even when your employer has withheld correctly, go through the amounts yourself. If you worked in more than one country during the year, follow Skatteetaten's instructions for how to report that.

If your situation involves more than one country, it is worth asking a qualified tax adviser rather than working it out from forum posts.

Where to check: Skatteetaten for registration, tax cards and deductions. Politiet for registration appointments where these are required.

${DISCLAIMER}`;

const A3 = `A contract you have read carefully is worth more than one you signed quickly. Before you sign, go through the document and make sure you can point to each of the following.

Who the parties are. Where the work takes place, or that the work is mobile. What your job is, either as a title or a description. When you start. Whether the employment is temporary, and if so how long it is expected to last. Whether there is a probation period. Your working hours. Your pay, and when it is paid. Holiday and holiday pay arrangements. Notice periods. Whether a collective agreement applies to you.

If one of these is missing or vague, ask for an updated written document before you start. That request is normal and easy to make in advance; it becomes awkward once you are already working.

If you are hired through a staffing agency and sent to a client, pay attention to three things: who pays you, who directs your daily work, and who is responsible for safety on site. These can be different parties, and knowing which is which saves confusion when something needs sorting out.

Treat these as warning signs: no written agreement after you have started, salary in cash without payslips, refusal to put holiday pay arrangements in writing, or pressure not to record your hours accurately. Any of them is a reason to slow down and ask questions before continuing.

Keep evidence as you go: the signed document, schedules, messages and pay documents. If you need advice about your situation, Arbeidstilsynet can tell you what your options are.

Where to check: Arbeidstilsynet for guidance on contracts and working conditions.

${DISCLAIMER}`;

const A4 = `NAV handles sickness benefits, unemployment benefits and family benefits in Norway. Working here normally connects you to the national insurance system, but each benefit has its own conditions, and NAV is the one that decides whether you meet them. This guide is about getting to the right place with the right papers, not about what you are owed.

Do not assume an outcome before you have asked. Conditions differ from benefit to benefit and can turn on details such as how long you have worked, what you earned, and where you were insured before. NAV's own pages describe what each benefit requires.

If you cannot work because of illness, tell your employer straight away and follow their reporting routine. You will usually need a medical certificate from a doctor, and both your employer and your doctor will be part of the documentation NAV asks for. Applications normally go through NAV digitally.

If you lose your job, register with NAV as a jobseeker early rather than waiting. Registration and application are separate steps, and delaying the first one can affect the second.

If you have worked or been insured in another EEA country, say so when you contact NAV. Periods abroad can be relevant to how your case is assessed, but it is technical, and NAV is the one who evaluates it.

Have these ready before you contact NAV: your identification number, your employment details, and any documentation from your doctor or employer that relates to your situation.

Where to check: NAV for benefit conditions, application steps and cases involving more than one country.

${DISCLAIMER}`;

const A5 = `Use this checklist during your first weeks in Norway. Work through it in order, because several steps depend on the one before.

Step 1: If you are staying longer than three months, book your EU and EEA registration appointment with the police. Bring a valid passport or national ID, proof of employment and proof of address. Check Politiet and UDI for current instructions before you go.

Step 2: Get your identification number through the tax office identity process. You need this number for tax, for a bank account and for most employer systems, so it blocks almost everything else.

Step 3: Apply for a tax card as soon as you have your number and your employment details. Without one, tax is withheld at a high default rate until it is sorted.

Step 4: Open a Norwegian bank account for your salary. Most banks want an identification number and proof of address. It is worth comparing what different banks offer newcomers.

Step 5: If you will need NAV for anything, make sure your contact details there are correct and up to date.

Step 6: Go through your employment agreement against the contract checklist and ask, in writing, for anything you cannot find in it.

Step 7: Ask your employer which safety training your site requires and make sure you have completed it before your first day. Construction and industry sites usually require documented training, and turning up without it can cost you the shift.

If any step gets blocked, contact the relevant authority early. Waiting until a payroll deadline is close makes a small problem into an urgent one.

Where to check: Politiet, Skatteetaten, NAV and Arbeidstilsynet.

${DISCLAIMER}`;

export const PREMIUM_ARTICLES: PremiumArticle[] = [
  {
    slug: "workers-rights-norway-eu-eea",
    category: "Working in Norway",
    title: "Working in Norway: What to Check on Your Own Employment",
    excerpt:
      "The things worth checking yourself: your written agreement, your payslip, the rate that applies to your job, and the records to keep as you go.",
    readingTime: 8,
    lastUpdated: "July 2026",
    officialSources: ["Arbeidstilsynet.no"],
    bodyMarkdown: A1,
  },
  {
    slug: "tax-registration-norway-foreign-workers",
    category: "Tax and Finance",
    title: "Tax Registration in Norway for Foreign Workers: Step by Step",
    excerpt:
      "The practical sequence: identification number, registration with Skatteetaten, tax card, and what to go through yourself each spring.",
    readingTime: 7,
    lastUpdated: "July 2026",
    officialSources: ["Skatteetaten.no", "Politiet.no"],
    bodyMarkdown: A2,
  },
  {
    slug: "employment-contract-norway-what-to-check",
    category: "Employment Contracts",
    title: "Employment Contracts in Norway: What to Check Before You Sign",
    excerpt:
      "A checklist to go through before signing, what to clarify when you are placed through an agency, and the warning signs worth slowing down for.",
    readingTime: 6,
    lastUpdated: "July 2026",
    officialSources: ["Arbeidstilsynet.no"],
    bodyMarkdown: A3,
  },
  {
    slug: "nav-benefits-foreign-workers-norway",
    category: "Working in Norway",
    title: "NAV for EU/EEA Workers: Where to Go and What to Have Ready",
    excerpt:
      "How to reach NAV with the right documents when you cannot work or lose your job, and why it is worth asking rather than assuming an outcome.",
    readingTime: 9,
    lastUpdated: "July 2026",
    officialSources: ["NAV.no"],
    bodyMarkdown: A4,
  },
  {
    slug: "registering-as-worker-norway-eu-eea-checklist",
    category: "Working in Norway",
    title: "The Complete Registration Checklist for EU/EEA Workers Starting in Norway",
    excerpt:
      "Every step to complete during your first weeks in Norway, in the order they depend on each other, from police registration to tax card and bank account.",
    readingTime: 10,
    lastUpdated: "July 2026",
    officialSources: ["Politiet.no", "Skatteetaten.no", "NAV.no", "Arbeidstilsynet.no"],
    bodyMarkdown: A5,
  },
];

export function getPremiumArticleBySlug(slug: string): PremiumArticle | undefined {
  return PREMIUM_ARTICLES.find((a) => a.slug === slug);
}

export function getRelatedArticles(slug: string, limit = 3): PremiumArticle[] {
  return PREMIUM_ARTICLES.filter((a) => a.slug !== slug).slice(0, limit);
}

export function isPremiumSlug(slug: string): slug is PremiumArticleSlug {
  return (PREMIUM_ARTICLE_SLUGS as readonly string[]).includes(slug);
}
