import { JOBS_PORTAL_URL } from "@/lib/featureFlags";

export default function JobsPortalCTA() {
  return (
    <div className="mx-auto mt-10 w-full max-w-[720px] px-6 py-6 text-center md:px-12 md:py-12">
      <div
        className="rounded-[12px] border border-[rgba(13,27,42,0.1)] bg-white px-6 py-10 md:px-12 md:py-12"
        style={{ borderWidth: "1px", borderRadius: "12px" }}
      >
        <h2 className="text-[20px] font-semibold leading-snug text-[#0D1B2A] md:text-2xl" style={{ fontWeight: 600 }}>
          Find work in Norway
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-[1.5] text-[rgba(13,27,42,0.8)]">
          Browse open positions and apply through our jobs portal.
        </p>
        <a
          href={JOBS_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center justify-center rounded-[4px] bg-[#C9A84C] px-7 py-[14px] text-base font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          style={{ padding: "14px 28px", fontWeight: 600, borderRadius: "4px" }}
        >
          Browse jobs and apply
        </a>
        <p className="mx-auto mt-6 max-w-xl text-base leading-[1.5] text-[rgba(13,27,42,0.8)]">
          All applications are processed through our jobs portal. Click above to see current openings.
        </p>
      </div>
    </div>
  );
}
