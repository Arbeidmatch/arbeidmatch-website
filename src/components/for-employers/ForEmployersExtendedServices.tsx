import Link from "next/link";
import { FileCheck, Megaphone, UserSearch, Users, type LucideIcon } from "lucide-react";

type ServiceCard = {
  title: string;
  text: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  badge?: string;
};

const CARDS: ServiceCard[] = [
  {
    title: "Full Recruitment",
    text: "We manage the entire process: sourcing, pre-screening, and candidate presentation. You make the final hiring decision.",
    href: "/request",
    cta: "Request candidates →",
    icon: UserSearch,
  },
  {
    title: "Staffing & Bemanning",
    text: "We become the employer of record. We handle contracts, payroll, and HR administration. You focus on the work.",
    href: "/request",
    cta: "View staffing options →",
    icon: Users,
  },
  {
    title: "Direct Advertising",
    text: "We publish your position across our EU/EEA networks and channels. You receive applications and hire directly.",
    href: "/contact",
    cta: "Ask about advertising →",
    icon: Megaphone,
  },
  {
    title: "You Found the Candidate — We Employ Them",
    text: "Already found the right person? We can act as employer of record and handle the legal employment on your behalf. Available for most sectors. Note: restrictions apply in construction (bygg og anlegg) per Norwegian law from 2023.",
    href: "/contact",
    cta: "Talk to us →",
    icon: FileCheck,
    badge: "Subject to sector eligibility",
  },
];

export default function ForEmployersExtendedServices() {
  return (
    <section className="border-t border-[rgba(201,168,76,0.15)] bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <h2 className="am-h2 text-center font-display font-bold text-white">
          Need candidates but want to hire directly?
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] px-6 py-7 transition-all duration-200 hover:scale-[1.02] hover:border-[#C9A84C]/60"
              >
                <div className="text-gold transition-transform duration-200 group-hover:scale-110">
                  <Icon className="block h-6 w-6 md:h-9 md:w-9" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
                {card.badge ? (
                  <span className="mt-3 inline-flex w-fit rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-2.5 py-1 text-[11px] font-medium text-[#C9A84C]">
                    {card.badge}
                  </span>
                ) : null}
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/70">{card.text}</p>
                <span className="mt-5 inline-flex min-h-[44px] items-center text-sm font-semibold text-gold hover:underline">
                  {card.cta}
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-[13px] italic leading-relaxed text-white/70">
          ArbeidMatch takes responsibility for what is within our control. We are transparent about process, expectations
          and limitations, and we continuously improve.
        </p>
      </div>
    </section>
  );
}
