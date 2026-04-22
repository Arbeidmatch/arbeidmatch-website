import type { Metadata } from "next";
import JobsBoardClient from "@/components/jobs/JobsBoardClient";
import { getPublicJobs } from "@/lib/jobs/repository";
import { getFilterOptions } from "@/lib/jobs/utils";

export const metadata: Metadata = {
  title: "Open Jobs in Norway",
  description:
    "Explore verified opportunities across construction, electrical, logistics, marine and industry in Norway. Apply in minutes with a streamlined process.",
  openGraph: {
    title: "Open Jobs in Norway | ArbeidMatch",
    description:
      "Find relevant opportunities and apply quickly through ArbeidMatch, your Norway-focused recruitment partner.",
    type: "website",
  },
  alternates: {
    canonical: "/jobs",
  },
};

export default async function JobsPage() {
  const jobs = await getPublicJobs();
  const filterOptions = getFilterOptions(jobs);

  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="container-site section-y-tight pb-4">
        <div className="max-w-3xl">
          <p className="am-eyebrow font-semibold uppercase tracking-[0.12em] text-[#C9A84C]">ArbeidMatch Job Board</p>
          <h1 className="am-h2 mt-3 font-bold text-white">Open Jobs in Norway</h1>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            Explore verified opportunities across Norway and apply through a clear, professional process built for speed and trust.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
            <span className="rounded-full border border-white/15 px-3 py-1">Verified opportunities</span>
            <span className="rounded-full border border-white/15 px-3 py-1">Norway-focused recruitment</span>
            <span className="rounded-full border border-white/15 px-3 py-1">Professional screening process</span>
          </div>
        </div>
      </section>

      <JobsBoardClient jobs={jobs} filterOptions={filterOptions} />

      <section className="container-site pb-20">
        <div className="rounded-[18px] border border-white/15 bg-white/[0.03] p-5 md:p-6">
          <h2 className="text-xl font-semibold text-white">How the application process works</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#0A0F18]/60 p-4">
              <p className="text-sm font-semibold text-white">1. Choose a job</p>
              <p className="mt-1 text-sm text-white/70">Filter by city, trade, and contract type to find your best fit.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0A0F18]/60 p-4">
              <p className="text-sm font-semibold text-white">2. Apply quickly</p>
              <p className="mt-1 text-sm text-white/70">Complete a short form and upload your CV in a few steps.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0A0F18]/60 p-4">
              <p className="text-sm font-semibold text-white">3. Get screened</p>
              <p className="mt-1 text-sm text-white/70">Our team reviews your profile and contacts relevant candidates directly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
