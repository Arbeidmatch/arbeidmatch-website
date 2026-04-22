import JobsListSkeleton from "@/components/jobs/JobsListSkeleton";

export default function JobDetailsLoading() {
  return (
    <div className="container-site py-10">
      <div className="skeleton h-5 w-44 rounded-full" />
      <div className="skeleton mt-4 h-12 w-full max-w-2xl rounded-md" />
      <div className="skeleton mt-3 h-24 w-full rounded-md" />
      <div className="mt-8">
        <JobsListSkeleton />
      </div>
    </div>
  );
}
