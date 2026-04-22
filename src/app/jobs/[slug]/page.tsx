import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailView from "@/components/jobs/JobDetailView";
import { getJobBySlug, getPublicJobs, getRelatedJobs } from "@/lib/jobs/repository";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
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

  const job = await getJobBySlug(slug);
  if (!job || job.status !== "active") notFound();

  const relatedJobs = await getRelatedJobs(job);

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
      <JobDetailView job={job} relatedJobs={relatedJobs} browseOnly={browseOnly} />
    </>
  );
}
