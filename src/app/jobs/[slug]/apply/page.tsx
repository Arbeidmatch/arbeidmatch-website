import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JobApplicationFormWithGdpr from "@/components/gdpr/JobApplicationFormWithGdpr";
import { getJobBySlug } from "@/lib/jobs/repository";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return { title: "Apply" };

  return {
    title: `Apply, ${job.title}`,
    description: `Apply for ${job.title} in ${job.location}. Fast and direct application process with ArbeidMatch.`,
    alternates: {
      canonical: `https://www.arbeidmatch.no/jobs/${job.slug}/apply`,
    },
  };
}

export default async function JobApplyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const browseRaw = sp.browse;
  const browseValue = Array.isArray(browseRaw) ? browseRaw[0] : browseRaw;
  const browseOnly = browseValue === "1" || browseValue === "true";

  const job = await getJobBySlug(slug);
  if (!job || job.status !== "active") notFound();

  if (browseOnly) {
    return (
      <div className="container-site py-10">
        <div className="rounded-[18px] border border-[#C9A84C]/25 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Read-only browsing</p>
          <h1 className="mt-3 text-2xl font-bold text-white">Applications are disabled in browse mode</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/75">
            Complete your candidate profile to unlock applications and improve your compatibility with open roles.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/jobs/${job.slug}?browse=1`}
              className="btn-outline-premium inline-flex min-h-[44px] items-center rounded-md border border-[#C9A84C]/35 px-5 py-2 text-sm font-semibold text-[#C9A84C]"
            >
              Back to job details
            </Link>
            <Link
              href="/for-candidates"
              className="btn-outline-premium inline-flex min-h-[44px] items-center rounded-md border border-white/20 px-5 py-2 text-sm font-semibold text-white/85"
            >
              Candidate overview
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-xs text-white/55">
            To finish your profile, open the secure link from your reminder email, or write to{" "}
            <a href="mailto:post@arbeidmatch.no" className="font-semibold text-[#C9A84C] hover:underline">
              post@arbeidmatch.no
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  if (job.applicationMethod === "external_url" && job.applicationUrl) {
    return (
      <div className="container-site py-8">
        <div className="rounded-[18px] border border-white/15 bg-white/[0.03] p-6">
          <h1 className="text-2xl font-semibold text-white">{job.title}</h1>
          <p className="mt-2 text-white/75">This job uses an external application flow.</p>
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold-premium mt-4 inline-flex min-h-[44px] items-center rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Continue to external application
          </a>
        </div>
      </div>
    );
  }

  if (job.applicationMethod === "email") {
    return (
      <div className="container-site py-8">
        <div className="rounded-[18px] border border-white/15 bg-white/[0.03] p-6">
          <h1 className="text-2xl font-semibold text-white">{job.title}</h1>
          <p className="mt-2 text-white/75">This role is handled via email application.</p>
          <a
            href={`mailto:${job.applicationEmail || "post@arbeidmatch.no"}`}
            className="btn-gold-premium mt-4 inline-flex min-h-[44px] items-center rounded-md bg-[#C9A84C] px-5 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Apply by email
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-site pb-16 pt-6 md:pt-8">
      <Link href={`/jobs/${job.slug}`} className="link-text-premium inline-flex text-sm font-medium text-[#C9A84C]">
        Back to job details
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h1 className="am-h3 font-bold text-white">Apply for {job.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/75">
            Complete the form in a few simple steps. We only ask for information relevant to recruitment.
          </p>
          <div className="mt-5">
            <JobApplicationFormWithGdpr job={job} />
          </div>
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:h-fit">
          <div className="rounded-[18px] border border-white/15 bg-white/[0.03] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Job summary</h2>
            <dl className="mt-3 space-y-2 text-sm text-white/75">
              <div>
                <dt className="text-white/45">Location</dt>
                <dd>{job.location}, Norway</dd>
              </div>
              <div>
                <dt className="text-white/45">Contract</dt>
                <dd>{job.contractType}</dd>
              </div>
              <div>
                <dt className="text-white/45">Work type</dt>
                <dd>{job.workModel}</dd>
              </div>
              <div>
                <dt className="text-white/45">Salary</dt>
                <dd>{job.salary ?? "Based on experience"}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-[18px] border border-white/15 bg-white/[0.03] p-5 text-sm text-white/70">
            <p className="font-semibold text-white">Need support with your application?</p>
            <p className="mt-2">
              Contact us at{" "}
              <a href="mailto:post@arbeidmatch.no" className="link-text-premium text-[#C9A84C]">
                post@arbeidmatch.no
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
