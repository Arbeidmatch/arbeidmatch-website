export default function JobsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
          <div className="skeleton h-5 w-28 rounded-full" />
          <div className="skeleton mt-4 h-6 w-full rounded-md" />
          <div className="skeleton mt-2 h-5 w-4/5 rounded-md" />
          <div className="skeleton mt-4 h-16 w-full rounded-md" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="skeleton h-12 rounded-md" />
            <div className="skeleton h-12 rounded-md" />
            <div className="skeleton h-12 rounded-md" />
            <div className="skeleton h-12 rounded-md" />
          </div>
          <div className="skeleton mt-4 h-11 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
