import { jobCardImage, jobReference, jobUrl, type PublicJob } from "@/lib/jobs-fetch";

/**
 * One advert, built to a fixed measure.
 *
 * EVERY CARD THE SAME HEIGHT, whether the title needs two lines or not. Two
 * lines of title, one line of place, one row of badges, and the counters on the
 * floor. A row of cards where nothing sits at its own height reads as a board;
 * one where each card is its own height reads as a scrapbook.
 *
 * THE PHOTOGRAPH ALWAYS CARRIES THE MARK, because the address is ours: the ATS
 * fetches the picture from the source board, stamps it and caches it. A posting
 * with no photograph gets the logo, so eight adverts with pictures and one
 * without still read as one company.
 *
 * THE REFERENCE IS ON THE CARD from the first second. It has existed in the
 * slug since the day a posting was published and nobody could see it; both
 * sides of a conversation about a job need something to quote.
 */

/** What every posting on this board requires, and the first thing a tradesman asks. */
const EU_EEA_BADGE = "EU/EEA";

export function ForsidenJobCard({ job, featured = false }: { job: PublicJob; featured?: boolean }) {
  const href = jobUrl(job);
  const reference = jobReference(job);
  const where = (job.location ?? "").trim() || (job.country ?? "").trim() || "Norway";
  const employer = job.employer_label ?? "ArbeidMatch Norge AS";
  const trade = (job.category ?? "").trim();

  // Trade certificate on every posting, because that is the bar: a diploma or
  // documented equivalent experience, never a beginner. The electricians say
  // DSB instead, because for them the certificate is the law's, not ours.
  const certificate = job.public_requires_dsb || job.industry === "electrical" ? "DSB certified" : "Trade certificate";
  const badges = [certificate, EU_EEA_BADGE];

  const card = (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-lg border bg-white transition hover:border-gold/60 ${
        featured ? "border-gold/50 md:flex-row" : "border-border"
      }`}
    >
      <div className={`relative overflow-hidden bg-navy/5 ${featured ? "md:w-[55%]" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={jobCardImage(job)}
          alt={job.title}
          loading="lazy"
          className={`w-full object-cover ${featured ? "h-56 md:h-full md:min-h-[220px]" : "h-[132px]"}`}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {featured ? (
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold">Paid listing</span>
        ) : null}

        <h3
          className={`font-semibold leading-snug text-navy ${
            featured ? "text-2xl" : "line-clamp-2 min-h-[2.56em] text-[15px]"
          }`}
        >
          {job.title}
        </h3>

        {/* The company that pays for the advert. Today every one of them is
            ours, so every one of them says so. */}
        <p className="mt-1.5 truncate text-xs font-semibold text-gold">{employer}</p>

        <p className="mt-1 truncate text-xs text-text-secondary">
          {where}
          {trade ? ` · ${trade}` : ""}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-text-secondary"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* The counters are real. `public_views` has been filling since the
            board went up; `public_likes` is a column nobody has ever written
            to, which is why it is nearly always zero and why it starts
            counting for something the day this page is live. */}
        <div className="mt-auto flex items-center gap-4 border-t border-border pt-3">
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-text-secondary">
            <EyeIcon />
            {job.public_views ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-text-secondary">
            <HeartIcon />
            {job.public_likes ?? 0}
          </span>
          {reference ? (
            <span className="ml-auto truncate text-[9px] tracking-wide text-text-secondary/70">{reference}</span>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (!href) return card;
  return (
    <a href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
      {card}
    </a>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3" aria-hidden="true">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
    </svg>
  );
}
