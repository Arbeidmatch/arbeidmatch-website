import type { Metadata } from "next";
import JobsAdminTable from "@/components/admin/JobsAdminTable";
import type { AdminJobDto } from "@/components/admin/job-admin-types";
import { getAdminJobs } from "@/lib/jobs/repository";

export const metadata: Metadata = {
  title: "Admin jobs",
  robots: { index: false, follow: false },
};

function mapToAdmin(job: Awaited<ReturnType<typeof getAdminJobs>>[number]): AdminJobDto {
  return {
    id: job.id,
    slug: job.slug,
    source: job.source,
    externalId: job.externalId ?? null,
    title: job.title,
    location: job.location,
    category: job.category ?? null,
    trade: job.trade ?? null,
    contractType: job.contractType ?? null,
    workModel: job.workModel ?? null,
    salary: job.salary ?? null,
    summary: job.summary ?? null,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
    applicationMethod: job.applicationMethod,
    applicationEmail: job.applicationEmail ?? null,
    applicationUrl: job.applicationUrl ?? null,
    startDate: job.startDate,
    status: job.status,
    publishedAt: job.publishedAt,
    featured: job.featured,
    expiryDate: job.expiryDate,
    syncStatus: job.syncStatus,
  };
}

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();
  return (
    <div className="container-site py-8">
      <JobsAdminTable initialJobs={jobs.map(mapToAdmin)} />
    </div>
  );
}
