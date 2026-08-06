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
};

export type PublicJobsResult = { jobs: PublicJob[]; totalOpen: number; ok: boolean };

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

/** Where a visitor goes to read the whole advert and apply. Always the ATS. */
export function jobUrl(job: PublicJob): string | null {
  return job.public_slug ? `${atsBaseUrl()}/jobs/public/${encodeURIComponent(job.public_slug)}` : null;
}

/** The picture the ATS resolved: the employer's photograph, or the card it draws. */
export function jobImage(job: PublicJob): string {
  const external = (job.external_image_url ?? "").trim();
  if (/^https:\/\/(cdn\.recman\.io|jobs\.arbeidmatch\.no)\//i.test(external) && /\.(png|jpe?g|webp)$/i.test(external)) {
    return external;
  }
  return `${atsBaseUrl()}/api/public/job-card/${encodeURIComponent(job.id)}?lang=en`;
}

export async function fetchPublicJobs(): Promise<PublicJobsResult> {
  try {
    const res = await fetch(`${atsBaseUrl()}/api/public/jobs`, { cache: "no-store" });
    if (!res.ok) return { jobs: [], totalOpen: 0, ok: false };
    const body = (await res.json()) as { data?: PublicJob[]; meta?: { total_open_positions?: number } };
    const jobs = (body.data ?? []).filter((j) => Boolean(j.public_slug));
    return { jobs, totalOpen: body.meta?.total_open_positions ?? jobs.length, ok: true };
  } catch {
    return { jobs: [], totalOpen: 0, ok: false };
  }
}
