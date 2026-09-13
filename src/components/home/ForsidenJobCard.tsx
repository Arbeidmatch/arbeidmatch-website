import { jobCardImage, jobUrl, rateLine, type PublicJob } from "@/lib/jobs-fetch";

export function ForsidenJobCard({ job, lang = "en" }: { job: PublicJob; featured?: boolean; lang?: "en" | "no" }) {
  const href = jobUrl(job);
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norway";
  const rate = rateLine(job);
  const no = lang === "no";
  // Use approved trade photography where the source only supplies a logo.
  // Explicit image assets continue to win over these illustrative fallbacks.
  const needsPhoto = (!job.external_image_url || job.external_image_url.includes("/drive/logo/"))
    && (!job.image_url || job.image_url.startsWith("/api/public/job-card-image/"));
  const trade = `${job.title} ${job.category ?? ""}`;
  const photo = needsPhoto && /paint|maler/i.test(trade) ? "/images/home/painter.webp"
    : needsPhoto && /concrete|betong/i.test(trade) ? "/images/home/concrete.webp" : jobCardImage(job);
  const employs = job.engagement === "staffing" ? (no ? "Ansatt hos oss" : "Employed by ArbeidMatch")
    : job.engagement === "recruitment" ? (no ? "Ansatt hos bedriften" : "Employed by the company") : null;
  const card = (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition hover:border-gold hover:shadow-lg">
      <div className="h-36 overflow-hidden bg-navy sm:aspect-[16/9] sm:h-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" loading="lazy" className="h-full w-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">{job.category || (no ? "Ledig stilling" : "Open position")}</p>
        <h3 className="mt-2 text-lg font-bold leading-snug text-navy">{job.title}</h3>
        <p className="mt-3 text-sm text-text-secondary">{where}</p>
        {rate && <p className="mt-2 text-base font-bold text-navy">{no ? rate.replace("NOK/hour", "NOK/time") : rate}</p>}
        {employs && <p className="mt-2 text-sm text-text-secondary">{employs}</p>}
        <div className="mb-5 mt-4 flex flex-wrap gap-2">
          <span className="rounded-md bg-surface px-2 py-1 text-xs text-text-secondary">EU/{no ? "EØS" : "EEA"}</span>
          {(job.public_requires_dsb || job.industry === "electrical") && <span className="rounded-md bg-surface px-2 py-1 text-xs text-text-secondary">{no ? "DSB-godkjenning" : "DSB certified"}</span>}
        </div>
        {href && <span className="mt-auto flex min-h-11 items-center justify-between rounded-lg bg-gold px-4 text-sm font-bold text-navy">{no ? "Se stillingen" : "View job"} <span aria-hidden="true">→</span></span>}
      </div>
    </article>
  );
  return href ? <a href={href} className="block h-full rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">{card}</a> : card;
}
