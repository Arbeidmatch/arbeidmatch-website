import JobsListSkeleton from "@/components/jobs/JobsListSkeleton";

export default function JobsLoading() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="container-site section-y-tight pb-4">
        <div className="max-w-3xl">
          <div className="skeleton h-4 w-40 rounded-full" />
          <div className="skeleton mt-4 h-12 w-full max-w-[520px] rounded-md" />
          <div className="skeleton mt-3 h-6 w-full max-w-[600px] rounded-md" />
        </div>
      </section>
      <section className="container-site pb-20">
        <JobsListSkeleton />
      </section>
    </div>
  );
}
