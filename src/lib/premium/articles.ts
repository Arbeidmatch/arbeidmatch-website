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

const DISCLAIMER = `This article provides a general overview based on publicly available information from official Norwegian sources as of April 2026. Regulations and rates may change. Always verify current requirements directly with the relevant Norwegian authority before making decisions. ArbeidMatch does not provide legal advice.`;

const A1 = `If you work in Norway, the Norwegian Working Environment Act (Arbeidsmiljøloven) applies to your employment relationship. This framework sets baseline rules for health, safety, and fairness at work, regardless of where you come from.

You have the right to a written employment contract. The employer must provide it within one month of your start date. The contract should describe your role, pay, working hours, and other core terms so you can document what was agreed.

Minimum wages in Norway are not always set as one national number for every job. For several industries, minimum pay is established through general application of collective agreements (often described in English as the General Application Act framework, Allmenngjøringsloven). Rates depend on the sector and are updated over time. Always check the current tables published by the Norwegian Labour Inspection Authority (Arbeidstilsynet) rather than relying on informal figures.

Holiday pay is a statutory entitlement. Under the Holiday Act (Ferieloven), the minimum holiday pay accrual is 10.2 percent of gross salary. If you are over 60, the minimum accrual rate is higher (12 percent). Your payslip and annual statement should show how holiday pay is calculated for your situation.

Sick leave has a structured payment path. Under the National Insurance Act (Folketrygdloven), you may qualify for sickness benefits when you cannot work due to illness. In typical employment, the employer pays for the first 16 calendar days, and NAV handles payment from day 17 when conditions are met. Keep medical documentation and follow your employer reporting rules.

You should receive a written payslip for each pay period. This is essential for verifying tax withholding, overtime, supplements, and holiday accrual. If pay is unclear, ask your employer in writing and keep copies.

You also have rights related to a safe workplace, including training and participation in health and safety work where required. If something is unsafe, you should report it through the channels your employer provides and, if needed, contact Arbeidstilsynet for guidance.

For authoritative wording of statutes, use Lovdata. For practical guidance on rights at work, start with Arbeidstilsynet.

${DISCLAIMER}`;

const A2 = `Getting your tax affairs right from day one prevents surprises on payday and at year end. This guide explains the basics of registration with the Norwegian Tax Administration (Skatteetaten), identification numbers, and what a tax card does.

Many foreign workers first receive a D number (temporary identification number) or a Norwegian national identity number (fødselsnummer), depending on how long you will stay and what you register for. Which number you receive depends on your situation and the outcome of identity checks. Follow the instructions you receive from the tax office and the police registration service.

You normally register through a tax office service centre or the digital flows Skatteetaten provides. Bring your passport, your address in Norway, and your employment details. If you are unsure which form applies, use Skatteetaten’s checklists for foreign workers.

A tax card tells your employer how much tax to withhold. If you do not have a valid tax card on file, the employer may be required to withhold tax at a high default rate until a card is issued. Apply for a tax card as early as possible.

Foreign employees may be entitled to a standard deduction for additional expenses connected with working away from your home country, within the limits the tax rules set. Whether you qualify depends on your residence position and other factors. Read Skatteetaten’s pages on standard deduction for foreign workers and verify each tax year.

Each spring you must file a tax return for the previous income year. Even if your employer withheld tax correctly, you should confirm amounts, deductions, and any cross border elements. If you worked in more than one country during the year, declare all relevant income according to the instructions.

Norway has double taxation treaties with many countries. A treaty does not automatically exempt you from filing in Norway, but it can affect how income is allocated between countries. If your situation is complex, use Skatteetaten’s guidance or consult a qualified tax adviser.

Official sources: Skatteetaten.no for tax registration and cards, and Politiet.no for EU or EEA registration appointments where required.

${DISCLAIMER}`;

const A3 = `A good contract protects both you and your employer. Norwegian law expects clarity in writing, and there are mandatory topics that must appear in your employment contract.

Under the Working Environment Act, section 14-6, a written contract must include information such as the identity of the parties, the workplace or whether work is mobile, your job title or a clear description of the work, your start date, whether the employment is temporary and if so its expected duration, probation rules if used, information on working hours, pay, holiday pay, holiday arrangements, notice periods, and any collective agreements that apply.

If something important is missing, ask for an updated written document. Verbal promises are hard to prove if a dispute arises.

Temporary employment is allowed only within the limits the law sets for when temporary contracts are permitted, including rules on repeated temporary engagements. If you are unsure whether your temporary contract is lawful, read Arbeidstilsynet’s guidance and the statute text on Lovdata.

If you are hired by a staffing agency and posted to a client, you still have a written contract with the agency. Pay attention to who pays you, who directs your daily work, and how safety responsibilities are divided between agency and client.

Warning signs include no written contract after you start, cash salary without payslips, refusal to confirm holiday pay rules, or pressure not to report working hours. These issues increase your personal risk and may also signal non compliance with basic duties.

If you believe your employer violates the law, you can contact Arbeidstilsynet for advice on inspection and reporting routes. Keep evidence such as schedules, messages, and pay documents.

Official sources: Arbeidstilsynet.no for practical explanations, and Lovdata for the text of Arbeidsmiljøloven.

${DISCLAIMER}`;

const A4 = `NAV administers many social security benefits in Norway. Most employees become members of the National Insurance scheme (folketrygden) through work here. Membership is fundamental for rights such as sickness benefits and parental benefits, but each benefit has its own qualifying and waiting rules.

Sickness benefits replace lost income when you cannot work due to illness or injury. You must be unable to work at least a minimum period, meet an income threshold, and obtain a medical certificate when required. Applications are usually submitted electronically through NAV with supporting documents from your doctor and employer.

Unemployment benefits require membership, a qualifying income history, and that you are genuinely available for work. EU and EEA coordination rules can matter if you recently moved between countries. NAV’s pages describe minimum income requirements and how to register as a jobseeker.

Family related benefits can include child benefit and parental leave benefits when conditions are met. Some benefits depend on you being a member and on your income history. If your family lives abroad, special coordination rules may apply.

If you have insurance periods in more than one EEA country, coordination rules may allow NAV to consider periods abroad when assessing entitlement. This is technical, and you should read NAV’s coordination pages or speak with NAV before assuming an outcome.

Benefit rules change with law and circular updates. Always confirm your own case with NAV.

Official sources: NAV.no for benefit descriptions and application steps, Lovdata for Folketrygdloven, and NAV’s pages on social security agreements for coordination topics.

${DISCLAIMER}`;

const A5 = `Use this checklist during your first weeks in Norway. It is a practical sequence, not a substitute for authority guidance.

Step 1: EU and EEA registration with the police if you stay longer than three months. You normally book an appointment at a police service centre for foreign nationals, bring a valid passport or national ID, proof of employment, and proof of address. Registration supports your right of residence. See Politiet.no and UDI.no for updated instructions.

Step 2: Obtain a national ID number or D number through the tax office identity process. You need this number for tax, banking, and many employer systems. Follow Skatteetaten’s checklist for ID control.

Step 3: Apply for a tax card as soon as you have your number and employment details. Without a tax card, withholding can be set at a high default rate. You can apply digitally when eligible.

Step 4: Open a Norwegian bank account for salary payment. Most banks require an ID number and proof of address. Compare banks for newcomer packages.

Step 5: Register information in NAV systems when you need benefits or services tied to membership. Keep your contact details updated.

Step 6: Verify your employment contract contains the mandatory elements described in the Working Environment Act. Request a written contract within the first month if you have not received one.

Step 7: Confirm required safety training for your site. Construction and industry roles often require documented HSE training. Your employer must provide what the regulations demand.

If any step is blocked, contact the relevant authority early rather than waiting until payroll deadlines approach.

Official sources: Politiet.no, Skatteetaten.no, NAV.no, Arbeidstilsynet.no.

${DISCLAIMER}`;

export const PREMIUM_ARTICLES: PremiumArticle[] = [
  {
    slug: "workers-rights-norway-eu-eea",
    category: "Workers Rights",
    title: "Your Rights as an EU/EEA Worker in Norway: What the Law Actually Says",
    excerpt:
      "A practical overview of what Norwegian labor law guarantees you as a foreign worker, from minimum wage to holiday pay and sick leave.",
    readingTime: 8,
    lastUpdated: "April 2026",
    officialSources: ["Arbeidstilsynet.no", "Lovdata.no"],
    bodyMarkdown: A1,
  },
  {
    slug: "tax-registration-norway-foreign-workers",
    category: "Tax and Finance",
    title: "Tax Registration in Norway for Foreign Workers: Step by Step",
    excerpt:
      "How to register with the Norwegian Tax Administration, get a D-number or national ID number, and understand your tax obligations from day one.",
    readingTime: 7,
    lastUpdated: "April 2026",
    officialSources: ["Skatteetaten.no", "Politiet.no"],
    bodyMarkdown: A2,
  },
  {
    slug: "employment-contract-norway-what-to-check",
    category: "Employment Contracts",
    title: "Employment Contracts in Norway: What to Check Before You Sign",
    excerpt:
      "The mandatory elements every Norwegian employment contract must contain, and the warning signs that indicate a contract does not meet legal requirements.",
    readingTime: 6,
    lastUpdated: "April 2026",
    officialSources: ["Arbeidstilsynet.no", "Lovdata.no (Arbeidsmiljøloven)"],
    bodyMarkdown: A3,
  },
  {
    slug: "nav-benefits-foreign-workers-norway",
    category: "Workers Rights",
    title: "NAV and Social Benefits for EU/EEA Workers in Norway: What You Are Entitled To",
    excerpt:
      "An overview of NAV benefits that EU/EEA workers may qualify for, including sick pay, unemployment benefits, and family benefits, and the conditions that apply.",
    readingTime: 9,
    lastUpdated: "April 2026",
    officialSources: ["NAV.no", "Lovdata.no (Folketrygdloven)"],
    bodyMarkdown: A4,
  },
  {
    slug: "registering-as-worker-norway-eu-eea-checklist",
    category: "Workers Rights",
    title: "The Complete Registration Checklist for EU/EEA Workers Starting in Norway",
    excerpt:
      "Every step you need to complete before and during your first weeks working in Norway, from registration with police to tax card and bank account.",
    readingTime: 10,
    lastUpdated: "April 2026",
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
