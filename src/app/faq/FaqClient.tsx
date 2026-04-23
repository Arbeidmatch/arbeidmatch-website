"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const CANDIDATE_FAQ: FaqItem[] = [
  {
    question: "Am I eligible to work in Norway?",
    answer:
      "If you are an EU/EEA citizen, you are eligible. No work visa is required. You need valid documentation and must be available to work legally in Norway.",
  },
  {
    question: "Do I need to speak Norwegian?",
    answer:
      "For most blue-collar roles, Norwegian is not required. English is sufficient. Some healthcare roles may require Norwegian, and those are explicitly mentioned in the job post.",
  },
  {
    question: "What is a D-number and do I need one?",
    answer:
      "A D-number is a temporary identification number for foreign citizens in Norway. It is required for salary payments and taxes. The employer or ArbeidMatch can help you with the process.",
  },
  {
    question: "Who pays for transport and accommodation?",
    answer:
      "Terms vary by employer and are specified in the job listing. Some employers cover transport and provide accommodation. Always verify details before accepting an offer.",
  },
  {
    question: "When do I receive my first salary?",
    answer:
      "Salary is paid according to the Norwegian contract, usually monthly. The first payment typically comes after your first worked month. Minimum wage levels are regulated by Arbeidstilsynet.",
  },
  {
    question: "How do I create my profile?",
    answer:
      "Go to /candidates and complete your profile step by step. You can upload your CV and the system will pre-fill fields automatically. The more complete your profile is, the better your match chances.",
  },
];

const EMPLOYER_FAQ: FaqItem[] = [
  {
    question: "How quickly can I receive candidates?",
    answer:
      "It depends on the role and your specific requirements. Our standard process includes sourcing, screening, and candidate presentation. We contact you with an update after receiving your request.",
  },
  {
    question: "What is bemanning/staffing?",
    answer:
      "Bemanning means ArbeidMatch acts as employer of record. We handle contracts, payroll, and daily administration on your behalf, while you lead the day-to-day work.",
  },
  {
    question: "Are you authorized by Arbeidstilsynet?",
    answer:
      "Yes. ArbeidMatch Norge AS is authorized by Arbeidstilsynet for staffing activities in applicable domains.",
  },
  {
    question: "What categories of workers can you provide?",
    answer:
      "Construction & Civil, Electrical & Technical, Logistics & Transport, Industry & Production, Cleaning & Facility, Hospitality & Healthcare. All candidates are EU/EEA and English-speaking.",
  },
  {
    question: "What does it cost?",
    answer:
      "Costs vary by collaboration type (partnership, premium, pay-per-use). Contact us for a tailored quote.",
  },
];

function FaqAccordionSection({ title, items, sectionKey }: { title: string; items: FaqItem[]; sectionKey: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="rounded-2xl border border-[#C9A84C]/25 bg-white/[0.03] p-5 md:p-7">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <article key={`${sectionKey}-${index}`} className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1726]/70">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
              >
                <span className="text-sm font-medium text-white md:text-base">{item.question}</span>
                <ChevronDown className={`h-4 w-4 text-[#C9A84C] transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <p className="border-t border-white/10 px-4 pb-4 pt-3 text-sm leading-relaxed text-white/75 md:px-5">{item.answer}</p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function FaqClient() {
  return (
    <main className="min-h-screen bg-[#0D1B2A] px-4 py-10 text-white md:px-8 md:py-14">
      <div className="mx-auto w-full max-w-[1080px] space-y-8">
        <header className="rounded-2xl border border-[#C9A84C]/30 bg-gradient-to-b from-[#0d1b2a] to-[#12243a] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">ArbeidMatch Help Center</p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/70 md:text-base">
            Answers for candidates and employers. If you still need help, contact us and our team will assist you directly.
          </p>
        </header>

        <FaqAccordionSection title="For Candidates" items={CANDIDATE_FAQ} sectionKey="candidate" />
        <FaqAccordionSection title="For Employers" items={EMPLOYER_FAQ} sectionKey="employer" />
      </div>
    </main>
  );
}
