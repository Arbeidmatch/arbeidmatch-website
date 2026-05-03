import { JOBS_PORTAL_URL } from "@/lib/featureFlags";

/** Shown under #join-talent when talent network form is disabled: CTA + subtle credibility line only (title/subtitle live in page). */
export default function JobsPortalCTA() {
  return (
    <div className="mx-auto mt-8 w-full max-w-[640px] text-center">
      <a
        href={JOBS_PORTAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center justify-center rounded-[4px] bg-[#C9A84C] px-8 py-[14px] text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
      >
        Browse jobs and apply
      </a>
      <p className="mx-auto mt-4 max-w-xl text-center text-[14px] leading-snug text-[rgba(255,255,255,0.50)]">
        Roles in construction, logistics, welding, electrical, and more.
      </p>
    </div>
  );
}
