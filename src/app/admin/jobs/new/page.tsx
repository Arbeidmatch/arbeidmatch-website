import type { Metadata } from "next";
import JobAdminForm from "@/components/admin/JobAdminForm";

export const metadata: Metadata = {
  title: "Add job",
  robots: { index: false, follow: false },
};

export default function AdminJobsNewPage() {
  return (
    <div className="container-site py-8">
      <h1 className="mb-4 text-2xl font-semibold text-white">Add new job</h1>
      <JobAdminForm
        mode="create"
        initialValues={{
          title: "",
          companyName: "",
          hideCompany: true,
          location: "Oslo",
          category: "Construction",
          trade: "",
          contractType: "",
          workModel: "Recruitment",
          languageRequirement: "English",
          salary: "",
          summary: "",
          description: "",
          responsibilities: "",
          requirements: "",
          benefits: "",
          startDate: "",
          applicationMethod: "internal",
          applicationUrl: "",
          applicationEmail: "",
          status: "draft",
          featured: false,
          expiryDate: "",
        }}
      />
    </div>
  );
}
