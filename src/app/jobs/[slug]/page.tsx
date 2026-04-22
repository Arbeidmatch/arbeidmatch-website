import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import JobDetailView from "@/components/jobs/JobDetailView";
import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { getJobBySlug, getRelatedJobs } from "@/lib/jobs/repository";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function surfaceToolsFromSearch(sp: Record<string, string | string[] | undefined>): boolean {
  const raw = sp.admin;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const expected = process.env.ADMIN_SECRET?.trim();
  return Boolean(expected && typeof value === "string" && value === expected);
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const surfaceKeyedTools = surfaceToolsFromSearch(sp);
  const job = await getJobBySlug(slug, { employerBoardAnyStatus: surfaceKeyedTools });
  if (!job) {
    return {
      title: "Job not found",
    };
  }

  return {
    title: `${job.title} in ${job.location}`,
    description: job.summary ?? job.description,
    alternates: {
      canonical: `https://www.arbeidmatch.no/jobs/${job.slug}`,
    },
    openGraph: {
      title: `${job.title} | ArbeidMatch`,
      description: job.summary ?? job.description,
      type: "article",
    },
  };
}

export default async function JobDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const browseRaw = sp.browse;
  const browseValue = Array.isArray(browseRaw) ? browseRaw[0] : browseRaw;
  const browseOnly = browseValue === "1" || browseValue === "true";

  const surfaceKeyedTools = surfaceToolsFromSearch(sp);
  const job = await getJobBySlug(slug, { employerBoardAnyStatus: surfaceKeyedTools });
  if (!job) notFound();

  const employerPeek = surfaceKeyedTools && job.source === "employer_board";
  if (!employerPeek && job.status !== "active") notFound();

  const relatedJobs = await getRelatedJobs(job);
  const shareUrl = `${getSiteOrigin()}/jobs/${job.slug}`;

  const jobPostingStructuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.summary,
    datePosted: job.publishedAt,
    employmentType: job.contractType,
    hiringOrganization: {
      "@type": "Organization",
      name: !job.hideCompany && job.companyName ? job.companyName : "ArbeidMatch Client Partner",
      sameAs: "https://www.arbeidmatch.no",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "NO",
      },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingStructuredData) }} />
      <Suspense fallback={<div className="container-site py-16 text-white/70">Loading…</div>}>
        <JobDetailView
          job={job}
          relatedJobs={relatedJobs}
          browseOnly={browseOnly}
          shareUrl={shareUrl}
          surfaceKeyedTools={surfaceKeyedTools}
        />
      </Suspense>
    </>
  );
}
