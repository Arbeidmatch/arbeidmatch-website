import "server-only";

/**
 * The open jobs, read from the ATS rather than kept a second time here.
 *
 * The board, the apply flow, the attribution and the consent all live in the
 * ATS and took two evenings to make work. Copying the listing's data model into
 * this repo would mean two places to publish a job and two places for it to go
 * wrong, so this asks the ATS the same question a visitor's browser would.
 *
 * `/api/public/jobs` is public and rate limited, and it already resolves the
 * town through the ATS's own rule - the board's Place field is often our office
 * address rather than the site, and this must never be the surface that
 * reintroduces that.
 */

const ATS_PUBLIC_BASE_URL =
  process.env.ATS_PUBLIC_BASE_URL?.trim() ||
  process.env.ATS_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_ATS_URL?.trim() ||
  "https://ats.arbeidmatch.no";

export function atsBaseUrl(): string {
  return ATS_PUBLIC_BASE_URL.replace(/\/$/, "");
}

export type PublicJob = {
  id: string;
  title: string;
  category: string | null;
  location: string | null;
  country: string | null;
  hourly_rate_offer: number | null;
  salary_fixed: string | null;
  salary_range_min: string | null;
  salary_range_max: string | null;
  salary_mode: string | null;
  accommodation_provided: boolean | null;
  /** The facts that differ between two jobs, which is what a card has room for. */
  rotation: string | null;
  shift_type: string | null;
  required_driver_licenses: string[] | null;
  public_applies: number | null;
  public_views: number | null;
  public_likes: number | null;
  public_slug: string | null;
  public_show_company: boolean | null;
  project?: { name?: string | null; company?: { name?: string } | { name?: string }[] | null } | null;
  external_image_url: string | null;
  published_at: string | null;
  created_at: string | null;

  /**
   * Added by the ATS on 2 September 2026, so the front page does not have to
   * work any of it out a second time. Optional, because this site deploys
   * separately: a build that goes out before the ATS one must not blank the
   * page, it must fall back.
   */
  /** AM-J-2026-4E631. The tail of the slug, which both sides can quote. */
  reference?: string | null;
  /** One of four: construction, automotive, industry, electrical. */
  industry?: Industry | null;
  /** Our own address, and the photograph behind it carries our mark. */
  image_url?: string | null;
  /** False when the posting has no photograph and is wearing the logo. */
  has_own_photo?: boolean | null;
  /** Who is named on the advert, resolved once in the ATS. */
  employer_label?: string | null;
  /** Set on the postings whose trade the law itself certifies. */
  public_requires_dsb?: boolean | null;
  /**
   * Who employs the person: "staffing" is us, "recruitment" is the client.
   * Null and undefined both mean nobody has said, and the card then states
   * nothing rather than guessing at the one sentence that must not be wrong.
   */
  engagement?: "staffing" | "recruitment" | null;
};

export type Industry = "construction" | "automotive" | "industry" | "electrical";

export type IndustryCount = { key: Industry; en: string; no: string; count: number };
export type LocationCount = { name: string; count: number };

export type PublicJobsResult = {
  jobs: PublicJob[];
  totalOpen: number;
  ok: boolean;
  /** The strip under the search. Four, always, and they add up to the board. */
  industries: IndustryCount[];
  /** The towns that actually have postings in them, biggest first. */
  locations: LocationCount[];
};

/** The hourly rate as one line, or null when the posting does not state one. */
export function rateLine(job: PublicJob): string | null {
  if (typeof job.hourly_rate_offer === "number" && Number.isFinite(job.hourly_rate_offer)) {
    return `${job.hourly_rate_offer} NOK/hour`;
  }
  if (job.salary_mode === "range" && job.salary_range_min && job.salary_range_max) {
    return `${job.salary_range_min}-${job.salary_range_max} NOK/hour`;
  }
  if (job.salary_fixed) return `${job.salary_fixed} NOK/hour`;
  return null;
}

/**
 * Who employs the reader.
 *
 * CORRECTED 6 August 2026, by the owner: we are the employer on the painter work and
 * on nothing else at the moment; the rest belong to different clients. Eleven of
 * twelve open jobs sit in the ATS catch-all project "General", whose company is ours,
 * so this label printed our name on ten jobs that are somebody else's. Who signs the
 * contract is not a detail to get wrong on a public page.
 *
 * A job filed in a catch-all tells us nothing, so it is read as a client's, which is
 * what it is. Our name appears when a job sits in one of our own projects on purpose,
 * and a client is named only when they agreed to be.
 */
const CATCH_ALL_PROJECTS = new Set(["general", "default", "uncategorised", "uncategorized", "misc", "other"]);

export function jobEmployerLabel(job: PublicJob): string {
  const project = job.project;
  const raw = project?.company;
  const company = Array.isArray(raw) ? raw[0] : raw;
  const name = (company?.name ?? "").trim();
  const filedNowhere = CATCH_ALL_PROJECTS.has((project?.name ?? "").trim().toLowerCase());
  if (name && /arbeidmatch/i.test(name) && !filedNowhere) return name;
  if (name && job.public_show_company === true) return name;
  return "Client of ArbeidMatch";
}

/**
 * What this card can say that the one beside it cannot.
 *
 * HIS COMPLAINT, 6 August 2026, looking at twelve cards in a row: "se repeta si nu
 * vreau sa se repete." He was right, and it was mine: hiding the rate left a constant
 * sentence in its place, printed identically on every card, with "accommodation" said
 * twice on each of them. A line that is the same everywhere carries no information and
 * teaches the eye to skip that part of the card, including on the day it does differ.
 *
 * So the card spends that space on facts that vary. Ordered by what a tradesman
 * actually decides on, capped at three so a row of cards still lines up, and empty when
 * a posting carries none of them - a blank is honest, a filler sentence is not.
 */
/**
 * Values that mean "there is no rotation". He saw a chip that said "No" on the live page,
 * because that is literally what the field holds on several postings.
 */
const ROTATION_MEANS_NOTHING = new Set(["no", "none", "nei", "ingen", "nu", "-", "--", "n/a", "na", "false", "0"]);

export function jobFacts(job: PublicJob, now: Date = new Date()): string[] {
  const facts: string[] = [];
  const rotation = (job.rotation ?? "").trim();
  if (rotation && !ROTATION_MEANS_NOTHING.has(rotation.toLowerCase())) {
    facts.push(rotation.length > 28 ? `${rotation.slice(0, 27)}…` : rotation);
  }
  if (job.accommodation_provided) facts.push("Help with accommodation");
  const shift = (job.shift_type ?? "").trim();
  if (shift && shift.toLowerCase() !== "day") facts.push(shift);
  if (Array.isArray(job.required_driver_licenses) && job.required_driver_licenses.length > 0) {
    facts.push(`Driving licence ${job.required_driver_licenses.slice(0, 2).join(", ")}`);
  }
  const posted = job.published_at ?? job.created_at;
  if (posted) {
    const days = Math.floor((now.getTime() - Date.parse(posted)) / 86_400_000);
    if (Number.isFinite(days) && days >= 0 && days <= 7) facts.push("New this week");
  }
  // Only once it is proof: two applications discourage, and none is the worst thing a
  // card can say out loud.
  if (typeof job.public_applies === "number" && job.public_applies >= 3) {
    facts.push(`${job.public_applies} have applied`);
  }
  return facts.slice(0, 3);
}

/**
 * Where an advert opens, which is here and no longer in the ATS.
 *
 * HIS INSTRUCTION, 3 September 2026: "eu nu vreau sa expun ats ul ci websiteul
 * vreau sa fie public." This returned `ats.arbeidmatch.no/jobs/public/<slug>`,
 * so every card on the front page put the ATS address in front of a stranger,
 * and everything we had written about a job lived on a page that is now closed
 * to search and that nobody was meant to reach.
 *
 * `/stilling/` and not `/jobs/`, because `/jobs/[...facet]` already owns that
 * segment for the trade and town pages and Next cannot hold two different
 * dynamic names at one level. Norwegian for the position itself, on a Norwegian
 * site, beside pages already called bemanning-bygg-anlegg.
 */
export function jobUrl(job: PublicJob): string | null {
  return job.public_slug ? `/stilling/${encodeURIComponent(job.public_slug)}` : null;
}

/** One advert, in full, for the page that shows it. */
export type PublicJobDetail = PublicJob & {
  description_html?: string | null;
  employment_type?: string | null;
  start_date_text?: string | null;
  skills_required?: string[] | null;
  required_certificates?: string[] | null;
  required_specialties?: string[] | null;
  engagement_model?: string | null;
  external_url?: string | null;
  public_requires_norwegian?: boolean | null;
  /**
   * What the advert asks of the reader, and whether failing it stops them.
   *
   * Prompt and required only. The expected answer stays in the ATS: printing it
   * beside the question is printing the answer key.
   */
  requirements?: Array<{ prompt: string; required: boolean }> | null;
  project?:
    | { name?: string | null; project_type?: string | null; company?: { name?: string } | { name?: string }[] | null }
    | null;
};

/**
 * One advert by its slug, or null.
 *
 * Null covers both "no such advert" and "the ATS did not answer", and the page
 * treats them the same way, as a 404. A page that renders an error where the job
 * should be is worse than one that says the job is not there, because a person
 * reads the first as us having lost it.
 */
export async function fetchPublicJob(
  slug: string,
  revalidateSeconds?: number,
): Promise<PublicJobDetail | null> {
  try {
    const res = await fetch(
      `${atsBaseUrl()}/api/public/jobs/s/${encodeURIComponent(slug)}`,
      revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : { cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: PublicJobDetail };
    return body.data && body.data.public_slug ? body.data : null;
  } catch {
    return null;
  }
}

/** The picture the ATS resolved: the employer's photograph, or the card it draws. */
export function jobImage(job: PublicJob): string {
  const external = (job.external_image_url ?? "").trim();
  if (/^https:\/\/(cdn\.recman\.io|jobs\.arbeidmatch\.no)\//i.test(external) && /\.(png|jpe?g|webp)$/i.test(external)) {
    return external;
  }
  return `${atsBaseUrl()}/api/public/job-card/${encodeURIComponent(job.id)}?lang=en`;
}

/**
 * @param revalidateSeconds Cache the ATS answer for this long instead of asking
 * on every request. The front page passes five minutes: it is the first thing
 * every visitor sees, a board that is five minutes stale is not wrong, and a
 * round trip to the ATS in front of every visit is a round trip in front of
 * every visit. The /jobs page passes nothing and stays live.
 */
export async function fetchPublicJobs(revalidateSeconds?: number): Promise<PublicJobsResult> {
  try {
    const res = await fetch(
      `${atsBaseUrl()}/api/public/jobs`,
      revalidateSeconds ? { next: { revalidate: revalidateSeconds } } : { cache: "no-store" },
    );
    if (!res.ok) return EMPTY_RESULT;
    const body = (await res.json()) as {
      data?: PublicJob[];
      meta?: { total_open_positions?: number; industries?: IndustryCount[]; locations?: LocationCount[] };
    };
    const jobs = (body.data ?? []).filter((j) => Boolean(j.public_slug));
    return {
      jobs,
      totalOpen: body.meta?.total_open_positions ?? jobs.length,
      ok: true,
      // The ATS counts these over the whole board. When it has not shipped the
      // change yet the page works them out from what it has, which is right for
      // an unfiltered front page and wrong for nothing it currently does.
      industries: body.meta?.industries ?? industryCountsFrom(jobs),
      locations: body.meta?.locations ?? locationCountsFrom(jobs),
    };
  } catch {
    return EMPTY_RESULT;
  }
}


const EMPTY_RESULT: PublicJobsResult = { jobs: [], totalOpen: 0, ok: false, industries: [], locations: [] };

/**
 * The four industries, in case the ATS has not sent them.
 *
 * A copy of the rule that lives in the ATS, and it is a copy on purpose: this
 * site deploys separately, so a build that goes out first must still draw four
 * industries rather than an empty strip. The ATS's answer wins whenever it is
 * there.
 */
const INDUSTRY_LABELS: Record<Industry, { en: string; no: string }> = {
  construction: { en: "Building and civil works", no: "Bygg og anlegg" },
  automotive: { en: "Car workshops", no: "Bilverksted" },
  industry: { en: "Industry and manufacturing", no: "Industri og produksjon" },
  electrical: { en: "Electrical installation", no: "Elektro" },
};

const INDUSTRY_ORDER: Industry[] = ["construction", "automotive", "industry", "electrical"];

const FALLBACK_PATTERNS: Array<{ industry: Industry; words: RegExp }> = [
  { industry: "industry", words: /\b(factory|fabrikk|precast|prefab)\b/i },
  { industry: "electrical", words: /\b(electric\w*|elektr\w*|dsb)\b/i },
  { industry: "automotive", words: /\b(mechanic\w*|mekanik\w*|bilmekaniker|verksted|workshop|car|bil)\b/i },
  { industry: "construction", words: /\b(carpenter|t[øo]mrer|bricklayer|murer|concrete|betong|painter|maler|bygg|anlegg|construction)\b/i },
  { industry: "industry", words: /\b(welder|sveiser|industri|manufactur\w*|produksjon|cnc)\b/i },
];

export function industryOf(job: PublicJob): Industry {
  if (job.industry && INDUSTRY_ORDER.includes(job.industry)) return job.industry;
  const title = job.title ?? "";
  for (const entry of FALLBACK_PATTERNS) {
    if (entry.words.test(title)) return entry.industry;
  }
  return "construction";
}

function industryCountsFrom(jobs: PublicJob[]): IndustryCount[] {
  const tally = new Map<Industry, number>(INDUSTRY_ORDER.map((k) => [k, 0]));
  for (const job of jobs) {
    const key = industryOf(job);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return INDUSTRY_ORDER.map((key) => ({ key, ...INDUSTRY_LABELS[key], count: tally.get(key) ?? 0 }));
}

function locationCountsFrom(jobs: PublicJob[]): LocationCount[] {
  const tally = new Map<string, number>();
  for (const job of jobs) {
    const name = (job.location ?? "").trim();
    if (!name) continue;
    tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 12);
}

/**
 * The reference on the card, and the last resort when the ATS has not sent one.
 *
 * It is the tail of the slug either way; reading it here means an older ATS
 * deployment still shows a reference rather than a gap.
 */
export function jobReference(job: PublicJob): string | null {
  if (job.reference) return job.reference;
  const match = /am-j-\d{4}-[0-9a-f]+$/.exec((job.public_slug ?? "").toLowerCase());
  return match ? match[0].toUpperCase() : null;
}

/**
 * The picture, from our host, with our mark burned into it.
 *
 * The ATS answers this address by fetching the photograph from the source
 * board, stamping it and caching it, so the picture that ends up on Facebook
 * carries the mark too. A posting with no photograph gets the logo rather than
 * a hole in the row.
 */
export function jobCardImage(job: PublicJob): string {
  if (job.image_url) return `${atsBaseUrl()}${job.image_url}`;
  if (job.public_slug) return `${atsBaseUrl()}/api/public/job-card-image/${encodeURIComponent(job.public_slug)}`;
  return `${atsBaseUrl()}/api/public/job-card-image/fallback`;
}
