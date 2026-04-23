"use client";

import Link from "next/link";
type GuideSlug = "eu" | "non-eu";

export default function DsbGuideCheckoutMobilePremium({ variant }: { variant: GuideSlug }) {
  const audienceText = variant === "eu" ? "EU/EEA electricians" : "non-EU electricians";

  return (
    <section className="bg-[#0f1923] px-4 py-16 text-white md:py-20">
      <div className="mx-auto max-w-2xl rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-6 text-center md:p-8">
        <h1 className="text-2xl font-bold text-white md:text-3xl">DSB paid checkout is disabled</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          This route previously contained the paid checkout flow for {audienceText}. The paid flow is now disabled.
          Information remains available for free.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/electricians-norway?section=dsb"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-6 text-sm font-semibold text-[#0f1923]"
          >
            Open free DSB information
          </Link>
          <a
            href="https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.4)] px-6 text-sm font-semibold text-white"
          >
            Go to official DSB.no source
          </a>
        </div>
      </div>
    </section>
  );
}
