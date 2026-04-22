import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobAdminForm from "@/components/admin/JobAdminForm";
import { getJobById } from "@/lib/jobs/repository";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Edit job",
  robots: { index: false, follow: false },
};

export default async function AdminJobsEditPage({ params }: Props) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  return (
    <div className="container-site py-8">
      <h1 className="mb-4 text-2xl font-semibold text-white">Edit job</h1>
      <JobAdminForm
        mode="edit"
        jobId={job.id}
        source={job.source}
        initialValues={{
          title: job.title,
          companyName: job.companyName ?? "",
          hideCompany: job.hideCompany ?? false,
          location: job.location,
          category: job.category ?? "",
          trade: job.trade ?? "",
          contractType: job.contractType ?? "",
          workModel: job.workModel === "Bemanning" ? "Bemanning" : job.workModel === "Permanent" ? "Permanent" : "Recruitment",
          languageRequirement: job.languageRequirement ?? "",
          salary: job.salary ?? "",
          summary: job.summary ?? "",
          description: job.description,
          responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : (job.responsibilities ?? ""),
          requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : (job.requirements ?? ""),
          benefits: Array.isArray(job.benefits) ? job.benefits.join("\n") : (job.benefits ?? ""),
          startDate: job.startDate ?? "",
          applicationMethod: job.applicationMethod ?? "internal",
          applicationUrl: job.applicationUrl ?? "",
          applicationEmail: job.applicationEmail ?? "",
          status: job.status,
          featured: job.featured ?? false,
          expiryDate: job.expiryDate ?? "",
        }}
      />
    </div>
  );
}
